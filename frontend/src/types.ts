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

export interface BypassLink {
  id: string;
  title: string;
  url: string;
  passcode?: string;
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
  guideVideoIpa?: string | null;
  guideVideoVpn?: string | null;
  step1BypassUrl?: string | null;
  step1Passcode?: string | null;
  bypassLinks?: BypassLink[];
  adminZalo?: string | null;
  supportLink?: string | null;
  brandName?: string | null;
  siteTitle?: string | null;
  downloadIpaUrl?: string | null;
  downloadShadowrocketUrl?: string | null;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
}
