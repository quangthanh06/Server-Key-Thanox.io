import { AdminSetting } from '../types';

export class AdminService {
  /**
   * Get a single setting value from D1
   */
  static async getSetting(db: D1Database, key: string): Promise<string | null> {
    try {
      const row = await db.prepare('SELECT value FROM admin_settings WHERE key = ?').bind(key).first<{ value: string }>();
      return row?.value ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Get all settings
   */
  static async getAllSettings(db: D1Database): Promise<Record<string, string>> {
    try {
      const { results } = await db.prepare('SELECT key, value FROM admin_settings').all<AdminSetting>();
      const settings: Record<string, string> = {};
      for (const row of results) {
        settings[row.key] = row.value;
      }
      return settings;
    } catch {
      return {};
    }
  }

  /**
   * Update a single setting
   */
  static async updateSetting(db: D1Database, key: string, value: string): Promise<boolean> {
    const now = new Date().toISOString();
    const result = await db.prepare(
      'INSERT INTO admin_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?'
    ).bind(key, value, now, value, now).run();
    return (result.meta?.changes ?? 0) > 0;
  }

  /**
   * Batch update multiple settings
   */
  static async updateSettings(db: D1Database, settings: Record<string, string>): Promise<boolean> {
    const now = new Date().toISOString();
    const statements = Object.entries(settings).map(([key, value]) =>
      db.prepare(
        'INSERT INTO admin_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?'
      ).bind(key, value, now, value, now)
    );
    if (statements.length === 0) return true;
    await db.batch(statements);
    return true;
  }

  /**
   * Get dynamic bypass URL (from DB first, fallback to env)
   */
  static async getBypassUrl(db: D1Database, envFallback: string): Promise<string> {
    const dbValue = await this.getSetting(db, 'step1_bypass_url');
    return dbValue || envFallback;
  }

  /**
   * Get dynamic daily global limit
   */
  static async getDailyGlobalLimit(db: D1Database, envFallback: number): Promise<number> {
    const dbValue = await this.getSetting(db, 'daily_global_limit');
    return dbValue ? parseInt(dbValue, 10) : envFallback;
  }

  /**
   * Get dynamic daily IP limit
   */
  static async getDailyIpLimit(db: D1Database, envFallback: number): Promise<number> {
    const dbValue = await this.getSetting(db, 'daily_ip_limit');
    return dbValue ? parseInt(dbValue, 10) : envFallback;
  }

  /**
   * Get dynamic key duration (seconds)
   */
  static async getKeyDuration(db: D1Database, envFallback: number): Promise<number> {
    const dbValue = await this.getSetting(db, 'key_duration');
    return dbValue ? parseInt(dbValue, 10) : envFallback;
  }

  /**
   * Check maintenance mode
   */
  static async isMaintenanceMode(db: D1Database): Promise<boolean> {
    const val = await this.getSetting(db, 'maintenance_mode');
    return val === 'true';
  }

  /**
   * Get effective admin password (from DB setting, or env, or default 'admin123')
   */
  static async getAdminPassword(db: D1Database, envPassword?: string): Promise<string> {
    const dbPass = await this.getSetting(db, 'admin_password');
    return dbPass || envPassword || 'admin123';
  }

  /**
   * Get recent sessions with pagination
   */
  static async getRecentSessions(db: D1Database, limit = 50, offset = 0) {
    const { results } = await db.prepare(
      'SELECT id, proxy_type, overall_status, created_at, updated_at, expires_at, client_ip_hash FROM sessions ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).bind(limit, offset).all();
    return results;
  }

  /**
   * Get recent keys with pagination
   */
  static async getRecentKeys(db: D1Database, limit = 50, offset = 0) {
    const { results } = await db.prepare(
      'SELECT id, key_value, proxy_type, session_id, created_at, expires_at, status FROM keys ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).bind(limit, offset).all();
    return results;
  }

  /**
   * Get summary stats for admin dashboard
   */
  static async getDashboardStats(db: D1Database) {
    const today = new Date().toISOString().slice(0, 10);

    const totalSessionsResult = await db.prepare('SELECT COUNT(*) as count FROM sessions').first<{ count: number }>();
    const todaySessionsResult = await db.prepare("SELECT COUNT(*) as count FROM sessions WHERE created_at >= ?").bind(today).first<{ count: number }>();
    const totalKeysResult = await db.prepare('SELECT COUNT(*) as count FROM keys').first<{ count: number }>();
    const todayKeysResult = await db.prepare("SELECT COUNT(*) as count FROM keys WHERE created_at >= ?").bind(today).first<{ count: number }>();
    const activeSessionsResult = await db.prepare("SELECT COUNT(*) as count FROM sessions WHERE overall_status NOT IN ('expired', 'blocked', 'key_ready')").first<{ count: number }>();

    const statusBreakdown = await db.prepare(
      "SELECT overall_status, COUNT(*) as count FROM sessions WHERE created_at >= ? GROUP BY overall_status"
    ).bind(today).all();

    const typeBreakdown = await db.prepare(
      "SELECT proxy_type, COUNT(*) as count FROM keys WHERE created_at >= ? GROUP BY proxy_type"
    ).bind(today).all();

    return {
      totalSessions: totalSessionsResult?.count ?? 0,
      todaySessions: todaySessionsResult?.count ?? 0,
      totalKeys: totalKeysResult?.count ?? 0,
      todayKeys: todayKeysResult?.count ?? 0,
      activeSessions: activeSessionsResult?.count ?? 0,
      statusBreakdown: statusBreakdown.results,
      typeBreakdown: typeBreakdown.results
    };
  }
}
