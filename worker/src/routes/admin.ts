import { Hono } from 'hono';
import { Env } from '../types';
import { AdminService } from '../services/adminService';
import { success, error } from '../lib/response';

const router = new Hono<{ Bindings: Env }>();

/**
 * Admin auth middleware — checks Authorization: Bearer <ADMIN_PASSWORD>
 */
function adminAuth() {
  return async (c: any, next: any) => {
    const authHeader = c.req.header('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    
    const validPassword = (await AdminService.getAdminPassword(c.env.DB, c.env.ADMIN_PASSWORD)).trim();
    
    if (!token || token !== validPassword) {
      return c.json(error('UNAUTHORIZED', 'Mật khẩu admin không đúng'), 401);
    }
    
    await next();
  };
}

/**
 * POST /api/admin/login — verify admin password, returns success
 */
router.post('/admin/login', async (c) => {
  try {
    const { password } = await c.req.json();
    const validPassword = (await AdminService.getAdminPassword(c.env.DB, c.env.ADMIN_PASSWORD)).trim();
    
    const inputPassword = (password || '').trim();
    
    if (!inputPassword || inputPassword !== validPassword) {
      return c.json(error('UNAUTHORIZED', 'Mật khẩu admin không đúng'), 401);
    }
    
    return c.json(success({ authenticated: true }));
  } catch {
    return c.json(error('LOGIN_FAILED', 'Login failed'), 500);
  }
});

/**
 * GET /api/admin/dashboard — dashboard overview stats
 */
router.get('/admin/dashboard', adminAuth(), async (c) => {
  try {
    const stats = await AdminService.getDashboardStats(c.env.DB);
    const settings = await AdminService.getAllSettings(c.env.DB);
    
    return c.json(success({ stats, settings }));
  } catch (err: any) {
    return c.json(error('DASHBOARD_ERROR', err?.message || 'Failed to load dashboard'), 500);
  }
});

/**
 * GET /api/admin/settings — get all dynamic settings
 */
router.get('/admin/settings', adminAuth(), async (c) => {
  try {
    const settings = await AdminService.getAllSettings(c.env.DB);
    return c.json(success(settings));
  } catch (err: any) {
    return c.json(error('SETTINGS_ERROR', err?.message || 'Failed to load settings'), 500);
  }
});

/**
 * PUT /api/admin/settings — update one or multiple settings
 */
router.put('/admin/settings', adminAuth(), async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate known setting keys
    const allowedKeys = [
      'step1_bypass_url', 'step1_passcode', 'daily_global_limit', 'daily_ip_limit',
      'key_duration', 'brand_name', 'site_title',
      'announcement', 'maintenance_mode', 'admin_password',
      'guide_video_ipa', 'guide_video_vpn', 'admin_zalo', 'support_link'
    ];
    
    const updates: Record<string, string> = {};
    for (const [key, value] of Object.entries(body)) {
      if (allowedKeys.includes(key) && typeof value === 'string') {
        // Always trim admin_password so trailing spaces don't break auth
        updates[key] = key === 'admin_password' ? value.trim() : value;
      }
    }
    
    if (Object.keys(updates).length === 0) {
      return c.json(error('NO_VALID_SETTINGS', 'No valid settings provided'), 400);
    }
    
    await AdminService.updateSettings(c.env.DB, updates);
    const allSettings = await AdminService.getAllSettings(c.env.DB);
    
    return c.json(success({ updated: Object.keys(updates), settings: allSettings }));
  } catch (err: any) {
    return c.json(error('SETTINGS_UPDATE_ERROR', err?.message || 'Failed to update settings'), 500);
  }
});

/**
 * GET /api/admin/sessions — list recent sessions
 */
router.get('/admin/sessions', adminAuth(), async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '50', 10);
    const offset = parseInt(c.req.query('offset') || '0', 10);
    const sessions = await AdminService.getRecentSessions(c.env.DB, limit, offset);
    return c.json(success({ sessions, limit, offset }));
  } catch (err: any) {
    return c.json(error('SESSIONS_ERROR', err?.message || 'Failed to load sessions'), 500);
  }
});

/**
 * GET /api/admin/keys — list recent keys
 */
router.get('/admin/keys', adminAuth(), async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '50', 10);
    const offset = parseInt(c.req.query('offset') || '0', 10);
    const keys = await AdminService.getRecentKeys(c.env.DB, limit, offset);
    return c.json(success({ keys, limit, offset }));
  } catch (err: any) {
    return c.json(error('KEYS_ERROR', err?.message || 'Failed to load keys'), 500);
  }
});

export default router;
