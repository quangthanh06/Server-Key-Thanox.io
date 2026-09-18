export type ProxyType = 'ipa' | 'vpn';

export type SessionStatus = 
  | 'created'
  | 'type_selected'
  | 'step1_pending'
  | 'step1_completed'
  | 'step2_pending'
  | 'step2_completed'
  | 'key_ready'
  | 'expired'
  | 'blocked';

export interface Session {
  id: string;
  proxy_type: ProxyType | null;
  step1_status: string;
  step2_status: string;
  overall_status: SessionStatus;
  step1_token_hash: string | null;
  step1_nonce: string | null;
  step2_flow_id: string | null;
  step2_state: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string;
  client_ip_hash: string;
  user_agent_hash: string | null;
}

export interface Key {
  id: string;
  key_value: string;
  proxy_type: ProxyType;
  session_id: string;
  created_at: string;
  expires_at: string;
  status: string;
}

export interface AdminSetting {
  key: string;
  value: string;
  updated_at: string;
}

export interface Env {
  DB: D1Database;
  BRAND_NAME: string;
  SITE_TITLE: string;
  VERSION: string;
  STEP1_BYPASS_URL: string;
  DAILY_GLOBAL_LIMIT: string;
  DAILY_IP_LIMIT: string;
  KEY_DURATION: string;
  REQUESTS_PER_MINUTE: string;
  SESSION_SECRET: string;
  IP_SALT: string;
  ADMIN_PASSWORD: string;
  EXTERNAL_BASE_URL?: string;
  EXTERNAL_GETKEY_ENDPOINT?: string;
  EXTERNAL_STATS_ENDPOINT?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
}

export interface BypassToken {
  sessionId: string;
  nonce: string;
  issuedAt: number;
  expiresAt: number;
  purpose: 'bypass_step1';
}

export interface SystemStats {
  dailyUsed: number;
  dailyLimit: number;
  ipUsed: number;
  ipLimit: number;
  announcement?: string | null;
  maintenanceMode?: boolean;
  resetSeconds?: number;
  resetFormatted?: string;
  resetAt?: string;
}

