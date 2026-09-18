import { D1Database } from '@cloudflare/workers-types';
import { SystemStats } from '../types';

export class StatsService {
  /**
   * Calculate Vietnam timezone (UTC+7) date string and countdown to midnight reset
   */
  static getVietnamDate(): { dateString: string; secondsUntilReset: number; resetAt: string; resetFormatted: string } {
    const now = new Date();
    // Vietnam is UTC+7
    const vnMs = now.getTime() + 7 * 3600 * 1000;
    const vnDate = new Date(vnMs);
    const dateString = vnDate.toISOString().split('T')[0];

    // Reset is at 00:00:00 VN tomorrow
    const [y, m, d] = dateString.split('-').map(Number);
    // Date.UTC of midnight VN tomorrow in UTC ms: Date.UTC(y, m - 1, d + 1, 0, 0, 0) - 7*3600*1000
    const nextMidnightUtcMs = Date.UTC(y, m - 1, d + 1, 0, 0, 0) - 7 * 3600 * 1000;
    const secondsUntilReset = Math.max(0, Math.floor((nextMidnightUtcMs - now.getTime()) / 1000));

    const hours = Math.floor(secondsUntilReset / 3600);
    const minutes = Math.floor((secondsUntilReset % 3600) / 60);
    const resetFormatted = hours > 0 
      ? `${hours} giờ ${minutes} phút` 
      : `${minutes} phút ${secondsUntilReset % 60} giây`;

    return {
      dateString,
      secondsUntilReset,
      resetAt: new Date(nextMidnightUtcMs).toISOString(),
      resetFormatted
    };
  }

  static getTodayDateString(): string {
    return this.getVietnamDate().dateString;
  }

  static async getDailyStats(db: D1Database): Promise<number> {
    const today = this.getTodayDateString();
    
    // Sum counts from rate_limits for today
    const result = await db.prepare(`
      SELECT SUM(count) as total FROM rate_limits WHERE date = ?
    `).bind(today).first<{total: number}>();
    
    return result?.total || 0;
  }

  static async getIPStats(db: D1Database, ipHash: string): Promise<number> {
    const today = this.getTodayDateString();
    
    const result = await db.prepare(`
      SELECT count FROM rate_limits WHERE ip_hash = ? AND date = ?
    `).bind(ipHash, today).first<{count: number}>();
    
    return result?.count || 0;
  }

  static async getSystemStats(
    db: D1Database, 
    ipHash: string, 
    dailyGlobalLimit: number, 
    dailyIpLimit: number
  ): Promise<SystemStats> {
    const [dailyUsed, ipUsed] = await Promise.all([
      this.getDailyStats(db),
      this.getIPStats(db, ipHash)
    ]);

    const { secondsUntilReset, resetAt, resetFormatted } = this.getVietnamDate();

    return {
      dailyUsed,
      dailyLimit: dailyGlobalLimit,
      ipUsed,
      ipLimit: dailyIpLimit,
      resetSeconds: secondsUntilReset,
      resetFormatted,
      resetAt
    };
  }

  static async incrementDailyCount(db: D1Database, ipHash: string): Promise<void> {
    const today = this.getTodayDateString();
    
    await db.prepare(`
      INSERT INTO rate_limits (id, ip_hash, date, count) 
      VALUES (?, ?, ?, 1)
      ON CONFLICT(ip_hash, date) DO UPDATE SET count = count + 1
    `).bind(`${ipHash}-${today}`, ipHash, today).run();
  }
}
