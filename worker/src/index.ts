import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env } from './types';
import { securityHeaders } from './middleware/security';
import { rateLimit } from './middleware/rateLimit';
import sessionRoutes from './routes/session';
import bypassRoutes from './routes/bypass';
import step2Routes from './routes/step2';
import keyRoutes from './routes/key';
import systemRoutes from './routes/system';
import adminRoutes from './routes/admin';

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors({ origin: '*', allowMethods: ['GET', 'POST', 'PUT', 'DELETE'], allowHeaders: ['Content-Type', 'Authorization'] }));
app.use('*', securityHeaders());
app.use('/api/*', rateLimit());

app.route('/api', sessionRoutes);
app.route('/api', bypassRoutes);
app.route('/api', step2Routes);
app.route('/api', keyRoutes);
app.route('/api', systemRoutes);
app.route('/api', adminRoutes);

export default app;
