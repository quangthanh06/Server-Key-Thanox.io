import { Hono } from 'hono';
import { Env } from '../types';
import { SessionService } from '../services/sessionService';
import { KeyService } from '../services/keyService';
import { StatsService } from '../services/statsService';
import { AdminService } from '../services/adminService';
import { error } from '../lib/response';
import { getConfig } from '../lib/config';

const router = new Hono<{ Bindings: Env; Variables: { ipHash: string } }>();

router.post('/key/claim', async (c) => {
  try {
    const { sessionId } = await c.req.json();
    if (!sessionId) {
      return c.json(error('MISSING_SESSION', 'Session ID is required'), 400);
    }
    
    const session = await SessionService.getSession(c.env.DB, sessionId);
    
    if (!session) {
      return c.json(error('NOT_FOUND', 'Session not found'), 404);
    }
    
    // Check if key already claimed (idempotent)
    if (session.overall_status === 'key_ready') {
      const existingKey = await KeyService.getKeyBySession(c.env.DB, sessionId);
      if (existingKey) {
        return c.json({
          success: true,
          proxyType: existingKey.proxy_type,
          key: existingKey.key_value,
          expiresAt: existingKey.expires_at,
          data: {
            key: existingKey.key_value,
            proxyType: existingKey.proxy_type,
            expiresAt: existingKey.expires_at
          },
          error: null
        });
      }
    }
    
    // STRICT: Reject if Step 2 is not completed
    if (session.overall_status !== 'step2_completed') {
      return c.json(error('STEP2_NOT_COMPLETED', 'Step 2 must be completed before claiming key'), 400);
    }
    
    if (SessionService.isExpired(session)) {
      return c.json(error('SESSION_EXPIRED', 'Session has expired'), 400);
    }
    
    const config = getConfig(c.env);
    const ipHash = c.get('ipHash') || session.client_ip_hash;
    
    const [globalLimit, ipLimit, keyDuration] = await Promise.all([
      AdminService.getDailyGlobalLimit(c.env.DB, config.dailyGlobalLimit),
      AdminService.getDailyIpLimit(c.env.DB, config.dailyIpLimit),
      AdminService.getKeyDuration(c.env.DB, config.keyDurationSec)
    ]);

    // Rate limit check before generating key
    const stats = await StatsService.getSystemStats(
      c.env.DB, 
      ipHash, 
      globalLimit, 
      ipLimit
    );
    
    if (stats.dailyUsed >= stats.dailyLimit) {
      return c.json(error('GLOBAL_LIMIT', `Hệ thống đã đạt giới hạn ${stats.dailyLimit} key hôm nay. Vui lòng quay lại sau ${stats.resetFormatted}!`), 429);
    }
    
    if (stats.ipUsed >= stats.ipLimit) {
      return c.json(error('IP_LIMIT', `Bạn đã đạt giới hạn ${stats.ipUsed}/${stats.ipLimit} lượt nhận key hôm nay. Vui lòng quay lại sau ${stats.resetFormatted}!`), 429);
    }
    
    // Claim key
    const key = await KeyService.claimKey(c.env.DB, session, keyDuration);
    
    if (!key) {
      return c.json(error('KEY_GENERATION_FAILED', 'Failed to generate key'), 500);
    }
    
    // Increment rate limit stats
    await StatsService.incrementDailyCount(c.env.DB, ipHash);
    
    return c.json({
      success: true,
      proxyType: key.proxy_type,
      key: key.key_value,
      expiresAt: key.expires_at,
      data: {
        key: key.key_value,
        proxyType: key.proxy_type,
        expiresAt: key.expires_at
      },
      error: null
    });
  } catch (err: any) {
    return c.json(error('KEY_CLAIM_FAILED', err.message || 'Failed to claim key'), 500);
  }
});

export default router;
