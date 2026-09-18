import { Hono } from 'hono';
import { Env, ProxyType } from '../types';
import { SessionService } from '../services/sessionService';
import { StatsService } from '../services/statsService';
import { success, error } from '../lib/response';
import { getConfig } from '../lib/config';

import { AdminService } from '../services/adminService';

const router = new Hono<{ Bindings: Env; Variables: { ipHash: string } }>();

router.post('/session', async (c) => {
  const ipHash = c.get('ipHash');
  const uaHash = null; // Could hash user-agent if needed
  const config = getConfig(c.env);
  
  try {
    const [globalLimit, ipLimit] = await Promise.all([
      AdminService.getDailyGlobalLimit(c.env.DB, config.dailyGlobalLimit),
      AdminService.getDailyIpLimit(c.env.DB, config.dailyIpLimit)
    ]);

    const stats = await StatsService.getSystemStats(
      c.env.DB, 
      ipHash, 
      globalLimit, 
      ipLimit
    );

    // Block if IP daily quota is reached
    if (stats.ipUsed >= stats.ipLimit) {
      return c.json(error(
        'IP_LIMIT_EXCEEDED', 
        `Bạn đã đạt giới hạn ${stats.ipUsed}/${stats.ipLimit} lượt nhận key hôm nay. Vui lòng quay lại sau ${stats.resetFormatted}!`
      ), 429);
    }

    // Block if global quota is reached
    if (stats.dailyUsed >= stats.dailyLimit) {
      return c.json(error(
        'GLOBAL_LIMIT_EXCEEDED', 
        `Hệ thống đã đạt giới hạn ${stats.dailyLimit} key hôm nay. Vui lòng quay lại sau ${stats.resetFormatted}!`
      ), 429);
    }

    const session = await SessionService.createSession(c.env.DB, ipHash, uaHash);
    
    return c.json(success({ 
      sessionId: session.id,
      stats
    }));
  } catch (err: any) {
    return c.json(error('SESSION_CREATE_FAILED', err?.message || 'Failed to create session'), 500);
  }
});

router.get('/session/:id', async (c) => {
  const id = c.req.param('id');
  
  try {
    const session = await SessionService.getSession(c.env.DB, id);
    
    if (!session) {
      return c.json(error('NOT_FOUND', 'Session not found'), 404);
    }
    
    // Sanitize output
    const safeSession = {
      id: session.id,
      proxy_type: session.proxy_type,
      overall_status: session.overall_status,
      created_at: session.created_at,
      expires_at: session.expires_at
    };
    
    return c.json(success(safeSession));
  } catch (err) {
    return c.json(error('SESSION_FETCH_FAILED', 'Failed to fetch session'), 500);
  }
});

router.post('/select-type', async (c) => {
  try {
    const body = await c.req.json();
    const { sessionId, proxyType } = body;
    
    if (!sessionId || !proxyType) {
      return c.json(error('MISSING_PARAMS', 'Session ID and proxy type are required'), 400);
    }
    
    if (proxyType !== 'ipa' && proxyType !== 'vpn') {
      return c.json(error('INVALID_TYPE', 'Invalid proxy type'), 400);
    }
    
    const successResult = await SessionService.selectType(c.env.DB, sessionId, proxyType as ProxyType);
    
    if (!successResult) {
      return c.json(error('INVALID_STATE', 'Cannot select type for this session'), 400);
    }
    
    return c.json(success({ success: true }));
  } catch (err) {
    return c.json(error('TYPE_SELECTION_FAILED', 'Failed to select proxy type'), 500);
  }
});

export default router;
