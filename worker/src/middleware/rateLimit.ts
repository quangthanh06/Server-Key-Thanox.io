import { Context, Next } from 'hono';
import { Env } from '../types';
import { hashIP } from '../lib/crypto';
import { getConfig } from '../lib/config';

// Simple in-memory rate limiting for per-minute check
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function rateLimit() {
  return async (c: Context<{ Bindings: Env; Variables: { ipHash: string } }>, next: Next) => {
    // Whitelist admin routes and health check from rate limiting
    const path = c.req.path;
    if (path.startsWith('/api/admin') || path === '/api/health') {
      await next();
      return;
    }

    const config = getConfig(c.env);
    
    // Get IP
    const clientIp = c.req.header('cf-connecting-ip') || 
                     c.req.header('x-forwarded-for') || 
                     '127.0.0.1';
    
    const ipHash = await hashIP(clientIp, config.ipSalt);
    
    // Store ipHash in context for later routes to use
    c.set('ipHash', ipHash);
    
    const now = Date.now();
    const windowMs = 60 * 1000;
    
    let record = requestCounts.get(ipHash);
    if (!record || now > record.resetAt) {
      record = { count: 0, resetAt: now + windowMs };
    }
    
    record.count++;
    requestCounts.set(ipHash, record);
    
    // Clean up old entries occasionally
    if (Math.random() < 0.02) {
      for (const [key, value] of requestCounts.entries()) {
        if (now > value.resetAt) {
          requestCounts.delete(key);
        }
      }
    }
    
    // Generous limit for localhost / development testing
    const isLocal = clientIp === '127.0.0.1' || clientIp === '::1' || clientIp.includes('localhost');
    const effectiveLimit = isLocal ? 600 : Math.max(120, config.requestsPerMinute);
    
    if (record.count > effectiveLimit) {
      return c.json({
        success: false,
        data: null,
        error: { 
          code: 'RATE_LIMIT_EXCEEDED', 
          message: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng chờ 30 giây rồi thử lại!' 
        }
      }, 429);
    }
    
    await next();
  };
}
