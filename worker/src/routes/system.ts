import { Hono } from 'hono';
import { Env } from '../types';
import { StatsService } from '../services/statsService';
import { success } from '../lib/response';
import { getConfig } from '../lib/config';

import { AdminService } from '../services/adminService';

const router = new Hono<{ Bindings: Env; Variables: { ipHash: string } }>();

router.get('/system/stats', async (c) => {
  const ipHash = c.get('ipHash');
  const config = getConfig(c.env);
  
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

  const announcement = await AdminService.getSetting(c.env.DB, 'announcement');
  const maintenanceMode = await AdminService.isMaintenanceMode(c.env.DB);
  
  return c.json(success({
    ...stats,
    announcement: announcement || null,
    maintenanceMode
  }));
});

router.get('/health', (c) => {
  const config = getConfig(c.env);
  return c.json(success({
    status: 'ok',
    version: config.version,
    timestamp: new Date().toISOString()
  }));
});

export default router;
