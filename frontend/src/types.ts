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

export interface SessionState {
  status: SessionStatus;
  sessionId: string | null;
  proxyType: ProxyType | null;
  key: string | null;
  keyExpiresAt: string | null;
  error: { code: string; message: string } | null;
  stats: SystemStats | null;
  bypassUrl: string | null;
  step2FlowUrl: string | null;
  isLoading: boolean;
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

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
}
