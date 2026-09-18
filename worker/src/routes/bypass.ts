import { Hono } from 'hono';
import { Env, BypassToken } from '../types';
import { SessionService } from '../services/sessionService';
import { AdminService } from '../services/adminService';
import { StatsService } from '../services/statsService';
import { success, error } from '../lib/response';
import { getConfig } from '../lib/config';
import { generateNonce, signPayload, verifyAndDecodePayload, hashToken } from '../lib/crypto';

const router = new Hono<{ Bindings: Env; Variables: { ipHash: string } }>();

router.post('/bypass/start', async (c) => {
  try {
    const { sessionId } = await c.req.json();
    if (!sessionId) {
      return c.json(error('MISSING_SESSION', 'Session ID is required'), 400);
    }
    
    const session = await SessionService.getSession(c.env.DB, sessionId);
    
    if (!session || session.overall_status !== 'type_selected') {
      return c.json(error('INVALID_STATE', 'Invalid session state for bypass'), 400);
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

    const nonce = generateNonce();
    
    const tokenPayload: BypassToken = {
      sessionId,
      nonce,
      issuedAt: Date.now(),
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes validity for the token
      purpose: 'bypass_step1'
    };
    
    const signedToken = await signPayload(tokenPayload, config.sessionSecret);
    const hashedToken = await hashToken(signedToken);
    
    const updated = await SessionService.startStep1(c.env.DB, sessionId, hashedToken, nonce);
    
    if (!updated) {
      return c.json(error('UPDATE_FAILED', 'Failed to start bypass process'), 500);
    }
    
    // Read bypass URL from admin_settings DB first, then fall back to env
    const bypassUrl = await AdminService.getBypassUrl(c.env.DB, config.step1BypassUrl);
    
    // Construct redirect URL
    const callbackUrl = new URL(c.req.url).origin + '/api/bypass/callback';
    const redirectUrl = `${bypassUrl}?token=${encodeURIComponent(signedToken)}&callback=${encodeURIComponent(callbackUrl)}`;
    
    return c.json(success({ 
      redirectUrl,
      expiresAt: tokenPayload.expiresAt
    }));
  } catch (err) {
    return c.json(error('BYPASS_START_FAILED', 'Failed to start bypass'), 500);
  }
});

router.get('/bypass/callback', async (c) => {
  const token = c.req.query('token');
  const sessionId = c.req.query('session') || c.req.query('sessionId'); // Allow both for flexibility
  
  if (!token) {
    return c.json(error('MISSING_TOKEN', 'Token is required'), 400);
  }
  
  const config = getConfig(c.env);
  
  try {
    const payload = await verifyAndDecodePayload<BypassToken>(token, config.sessionSecret);
    
    if (!payload || payload.purpose !== 'bypass_step1') {
      return c.json(error('INVALID_TOKEN', 'Invalid token'), 400);
    }
    
    if (Date.now() > payload.expiresAt) {
      return c.json(error('TOKEN_EXPIRED', 'Token has expired'), 400);
    }
    
    if (sessionId && payload.sessionId !== sessionId) {
      return c.json(error('SESSION_MISMATCH', 'Session ID mismatch'), 400);
    }
    
    const session = await SessionService.getSession(c.env.DB, payload.sessionId);
    
    if (!session || session.step1_status !== 'pending') {
      return c.json(error('INVALID_STATE', 'Invalid session state for bypass callback'), 400);
    }
    
    // Ensure the token hash matches
    const tokenHash = await hashToken(token);
    if (session.step1_token_hash && session.step1_token_hash !== tokenHash) {
      return c.json(error('TOKEN_MISMATCH', 'Token does not match session'), 400);
    }
    
    const updated = await SessionService.completeStep1(c.env.DB, payload.sessionId, payload.nonce);
    
    if (!updated) {
      return c.json(error('UPDATE_FAILED', 'Failed to complete bypass or nonce already used'), 400);
    }
    
    // Redirect back to the frontend app (should be configured via env)
    // For now, return a JSON response that the frontend can handle
    return c.json(success({ success: true, message: 'Step 1 completed successfully' }));
    
  } catch (err) {
    return c.json(error('BYPASS_CALLBACK_FAILED', 'Failed to process callback'), 500);
  }
});

/**
 * POST /api/bypass/complete — confirms Step 1 completion
 */
router.post('/bypass/complete', async (c) => {
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

    if (['step1_completed', 'step2_pending', 'step2_completed', 'key_ready'].includes(session.overall_status)) {
      return c.json(success({ completed: true, alreadyCompleted: true }));
    }

    if (session.overall_status !== 'step1_pending') {
      return c.json(error('INVALID_STATE', 'Session must be in step1_pending to complete'), 400);
    }

    // Anti-cheat: Ensure minimum time (at least 5s) has elapsed to prevent instant skipping
    const lastUpdate = new Date(session.updated_at || session.created_at).getTime();
    if (Date.now() - lastUpdate < 5000) {
      return c.json(error('TOO_FAST', 'Thao tác quá nhanh! Vui lòng hoàn thành vượt link trước khi bấm xác nhận.'), 400);
    }

    const updated = await SessionService.completeStep1(c.env.DB, sessionId, session.step1_nonce || '');
    if (!updated) {
      return c.json(error('UPDATE_FAILED', 'Failed to complete step 1 in database'), 500);
    }

    return c.json(success({ completed: true }));
  } catch (err: any) {
    return c.json(error('BYPASS_COMPLETE_FAILED', err?.message || 'Failed to complete step 1'), 500);
  }
});

export default router;
