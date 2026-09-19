import { apiRequest } from './client';
import type { ProxyType, SystemStats } from '../types';

export const api = {
  createSession: (sessionId?: string) => apiRequest<{ sessionId: string; stats?: SystemStats }>('/api/session', { method: 'POST', body: sessionId ? JSON.stringify({ sessionId }) : undefined }),
  getSession: (id: string) => apiRequest<any>(`/api/session/${id}`),
  selectType: (sessionId: string, proxyType: ProxyType) => apiRequest<any>('/api/select-type', { method: 'POST', body: JSON.stringify({ sessionId, proxyType }) }),
  startBypass: (sessionId: string, stepIndex = 0, totalSteps = 1, stepTitle?: string) => apiRequest<{ redirectUrl: string; expiresAt: number; stepIndex: number }>('/api/bypass/start', { method: 'POST', body: JSON.stringify({ sessionId, stepIndex, totalSteps, stepTitle }) }),
  completeBypass: (sessionId: string, stepIndex = 0, isFinal = false) => apiRequest<{ completed: boolean }>('/api/bypass/complete', { method: 'POST', body: JSON.stringify({ sessionId, stepIndex, isFinal }) }),
  startStep2: (sessionId: string, keyType?: ProxyType) => apiRequest<{ flowId: string; flowUrl: string; proxyType: ProxyType; reused?: boolean }>('/api/step2/start', { method: 'POST', body: JSON.stringify({ sessionId, keyType }) }),
  getStep2Status: (sessionId: string) => apiRequest<{ status: string; flowId?: string }>(`/api/step2/status?sessionId=${sessionId}`),
  completeStep2: (sessionId: string) => apiRequest<{ status: string }>('/api/step2/complete', { method: 'POST', body: JSON.stringify({ sessionId }) }),
  claimKey: (sessionId: string) => apiRequest<{ key: string; proxyType: ProxyType; expiresAt: string }>('/api/key/claim', { method: 'POST', body: JSON.stringify({ sessionId }) }),
  getStats: () => apiRequest<SystemStats>('/api/system/stats')
};
