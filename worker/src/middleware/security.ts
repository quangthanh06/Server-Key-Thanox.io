import { Context, Next } from 'hono';

export function securityHeaders() {
  return async (c: Context, next: Next) => {
    await next();
    const headers = c.res.headers;
    
    headers.set('Content-Security-Policy', "default-src 'self'; font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; connect-src 'self'");
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', 'DENY');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('X-XSS-Protection', '0');
    headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  };
}
