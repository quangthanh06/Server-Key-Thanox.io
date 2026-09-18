import { Env } from '../types';

export function getConfig(env: Env) {
  return {
    brandName: env.BRAND_NAME || 'PROXY KEY',
    siteTitle: env.SITE_TITLE || 'GET.KEY // PROXY KEY',
    version: env.VERSION || '1.0.0',
    step1BypassUrl: env.STEP1_BYPASS_URL || 'https://example.com/bypass',
    dailyGlobalLimit: parseInt(env.DAILY_GLOBAL_LIMIT || '3000', 10),
    dailyIpLimit: parseInt(env.DAILY_IP_LIMIT || '2', 10),
    keyDurationSec: parseInt(env.KEY_DURATION || '3600', 10),
    requestsPerMinute: parseInt(env.REQUESTS_PER_MINUTE || '30', 10),
    sessionSecret: env.SESSION_SECRET || 'default-dev-secret-do-not-use-in-prod',
    ipSalt: env.IP_SALT || 'default-dev-salt',
    externalBaseUrl: env.EXTERNAL_BASE_URL || 'https://serveripa.proxyvip.click',
    externalGetkeyEndpoint: env.EXTERNAL_GETKEY_ENDPOINT || '/api/getkey',
    externalStatsEndpoint: env.EXTERNAL_STATS_ENDPOINT || '/api/getkey/stats'
  };
}
