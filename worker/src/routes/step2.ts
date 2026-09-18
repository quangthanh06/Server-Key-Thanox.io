import { Hono } from 'hono';
import { Env } from '../types';
import { SessionService } from '../services/sessionService';
import { ExternalKeyService } from '../services/externalKeyService';
import { AdminService } from '../services/adminService';
import { StatsService } from '../services/statsService';
import { success, error } from '../lib/response';
import { getConfig } from '../lib/config';

const router = new Hono<{ Bindings: Env; Variables: { ipHash: string } }>();

/**
 * POST /api/step2/start
 * Reads proxy_type strictly from session in D1 (never client-supplied)
 * Calls real ServerKey API:
 *   - if session.proxy_type === 'ipa' -> calls createIPAFlow() -> { keyType: 'ipa' }
 *   - if session.proxy_type === 'vpn' -> calls createVPNFlow() -> { keyType: 'vpn' }
 * Stores flowId into D1.
 * If ServerKey fails or errors:
 *   - Returns error response
 *   - Does NOT mark step2_completed
 *   - Does NOT generate fake key
 */
router.post('/step2/start', async (c) => {
  try {
    const { sessionId } = await c.req.json();
    if (!sessionId) {
      return c.json(error('MISSING_SESSION', 'Session ID is required'), 400);
    }
    
    const session = await SessionService.getSession(c.env.DB, sessionId);
    
    if (!session || session.overall_status !== 'step1_completed') {
      return c.json(error('INVALID_STATE', 'Invalid session state: Step 1 must be completed before Step 2'), 400);
    }
    
    if (SessionService.isExpired(session)) {
      return c.json(error('SESSION_EXPIRED', 'Session has expired'), 400);
    }

    const config = getConfig(c.env);

    // Strict IP rate limit check
    const ipHash = session.client_ip_hash || c.get('ipHash');
    if (ipHash) {
      const [globalLimit, ipLimit] = await Promise.all([
        AdminService.getDailyGlobalLimit(c.env.DB, config.dailyGlobalLimit),
        AdminService.getDailyIpLimit(c.env.DB, config.dailyIpLimit)
      ]);

      const stats = await StatsService.getSystemStats(c.env.DB, ipHash, globalLimit, ipLimit);
      if (stats.ipUsed >= stats.ipLimit) {
        return c.json(error(
          'IP_LIMIT_EXCEEDED', 
          `Bạn đã đạt giới hạn ${stats.ipUsed}/${stats.ipLimit} lượt nhận key hôm nay. Vui lòng quay lại sau ${stats.resetFormatted}!`
        ), 429);
      }
    }
    
    // STRICT: Backend reads proxy_type from session in database
    const proxyType = session.proxy_type;
    if (!proxyType || (proxyType !== 'ipa' && proxyType !== 'vpn')) {
      return c.json(error('INVALID_PROXY_TYPE', 'Valid proxy type (ipa or vpn) not found in session'), 400);
    }
    
    const externalService = new ExternalKeyService({
      baseUrl: config.externalBaseUrl,
      getkeyEndpoint: config.externalGetkeyEndpoint,
      statsEndpoint: config.externalStatsEndpoint
    });

    const clientIp = c.req.header('cf-connecting-ip') || 
                     c.req.header('x-forwarded-for') || 
                     '127.0.0.1';

    let flowResult;
    try {
      if (proxyType === 'ipa') {
        flowResult = await externalService.createIPAFlow(sessionId, clientIp);
      } else {
        flowResult = await externalService.createVPNFlow(sessionId, clientIp);
      }
    } catch (serverKeyErr: any) {
      // If ServerKey fails: return clear error, do not mark completed, do not issue key
      return c.json(error('SERVERKEY_ERROR', serverKeyErr?.message || 'Failed to initialize flow with ServerKey'), 502);
    }
    
    // Save ServerKey flow ID into D1 database
    const updated = await SessionService.startStep2(c.env.DB, sessionId, flowResult.flowId);
    if (!updated) {
      return c.json(error('UPDATE_FAILED', 'Failed to update session with flow ID in database'), 500);
    }
    
    return c.json(success({ 
      flowId: flowResult.flowId,
      flowUrl: flowResult.flowUrl,
      proxyType: proxyType,
      reused: flowResult.reused
    }));
  } catch (err: any) {
    return c.json(error('STEP2_START_FAILED', err?.message || 'Failed to start step 2'), 500);
  }
});

/**
 * GET /api/step2/status
 * Check the status of Step 2 for a session
 */
router.get('/step2/status', async (c) => {
  const sessionId = c.req.query('sessionId');
  
  if (!sessionId) {
    return c.json(error('MISSING_SESSION', 'Session ID is required'), 400);
  }
  
  try {
    const session = await SessionService.getSession(c.env.DB, sessionId);
    if (!session) {
      return c.json(error('NOT_FOUND', 'Session not found'), 404);
    }
    
    // If already past step 2
    if (['step2_completed', 'key_ready'].includes(session.overall_status)) {
      return c.json(success({ 
        status: 'completed',
        flowId: session.step2_flow_id,
        proxyType: session.proxy_type
      }));
    }
    
    if (session.overall_status !== 'step2_pending') {
      return c.json(error('INVALID_STATE', `Session is in state '${session.overall_status}', not step 2 pending`), 400);
    }
    
    return c.json(success({ 
      status: 'pending',
      flowId: session.step2_flow_id,
      proxyType: session.proxy_type
    }));
  } catch (err: any) {
    return c.json(error('STEP2_STATUS_FAILED', err?.message || 'Failed to check step 2 status'), 500);
  }
});

/**
 * POST /api/step2/complete
 * Mark Step 2 as completed upon callback or user verification
 */
router.post('/step2/complete', async (c) => {
  try {
    const { sessionId } = await c.req.json();
    if (!sessionId) {
      return c.json(error('MISSING_SESSION', 'Session ID is required'), 400);
    }

    const session = await SessionService.getSession(c.env.DB, sessionId);
    if (!session) {
      return c.json(error('NOT_FOUND', 'Session not found'), 404);
    }

    if (SessionService.isExpired(session)) {
      return c.json(error('SESSION_EXPIRED', 'Session has expired'), 400);
    }

    if (session.overall_status === 'step2_completed' || session.overall_status === 'key_ready') {
      return c.json(success({ status: 'completed', alreadyCompleted: true }));
    }

    if (session.overall_status !== 'step2_pending') {
      return c.json(error('INVALID_STATE', 'Session must be in step2_pending to complete'), 400);
    }

    // Anti-cheat: Ensure minimum time (at least 5s) has elapsed
    const lastUpdate = new Date(session.updated_at || session.created_at).getTime();
    if (Date.now() - lastUpdate < 5000) {
      return c.json(error('TOO_FAST', 'Thao tác quá nhanh! Vui lòng hoàn thành vượt link ServerKey trước khi bấm lấy key.'), 400);
    }

    const updated = await SessionService.completeStep2(c.env.DB, sessionId);
    if (!updated) {
      return c.json(error('UPDATE_FAILED', 'Failed to complete step 2 in database'), 500);
    }

    return c.json(success({ status: 'completed' }));
  } catch (err: any) {
    return c.json(error('STEP2_COMPLETE_FAILED', err?.message || 'Failed to complete step 2'), 500);
  }
});

export default router;
