import { apiRequest } from './client';
import type { ProxyType, SystemStats } from '../types';

export const api = {
  createSession: () => apiRequest<{ sessionId: string }>('/api/session', { method: 'POST' }),
  getSession: (id: string) => apiRequest<any>(`/api/session/${id}`),
  selectType: (sessionId: string, proxyType: ProxyType) => apiRequest<any>('/api/select-type', { method: 'POST', body: JSON.stringify({ sessionId, proxyType }) }),
  startBypass: (sessionId: string) => apiRequest<{ redirectUrl: string; expiresAt: number }>('/api/bypass/start', { method: 'POST', body: JSON.stringify({ sessionId }) }),
  completeBypass: (sessionId: string) => apiRequest<{ completed: boolean }>('/api/bypass/complete', { method: 'POST', body: JSON.stringify({ sessionId }) }),
  startStep2: (sessionId: string, keyType?: ProxyType) => apiRequest<{ flowId: string; flowUrl: string; proxyType: ProxyType; reused?: boolean }>('/api/step2/start', { method: 'POST', body: JSON.stringify({ sessionId, keyType }) }),
  getStep2Status: (sessionId: string) => apiRequest<{ status: string; flowId?: string }>(`/api/step2/status?sessionId=${sessionId}`),
  completeStep2: (sessionId: string) => apiRequest<{ status: string }>('/api/step2/complete', { method: 'POST', body: JSON.stringify({ sessionId }) }),
  claimKey: (sessionId: string) => apiRequest<{ key: string; proxyType: ProxyType; expiresAt: string }>('/api/key/claim', { method: 'POST', body: JSON.stringify({ sessionId }) }),
  getStats: () => apiRequest<SystemStats>('/api/system/stats')
};
