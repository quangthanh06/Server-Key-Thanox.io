const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export async function adminRequest<T>(endpoint: string, token: string, options?: RequestInit): Promise<{ data: T | null; error: { code: string; message: string } | null }> {
  try {
    const cleanToken = (token || '').trim();
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanToken}`,
        ...options?.headers
      },
      ...options
    });
    const json = await res.json();
    if (json.success) return { data: json.data, error: null };
    return { data: null, error: json.error || { code: 'UNKNOWN', message: 'Unknown error' } };
  } catch (err: any) {
    return { data: null, error: { code: 'NETWORK_ERROR', message: err.message || 'Network error' } };
  }
}

export const adminApi = {
  login: (password: string) => 
    adminRequest<{ authenticated: boolean }>('/api/admin/login', '', {
      method: 'POST',
      body: JSON.stringify({ password: (password || '').trim() }),
      headers: {}
    }),
  
  getDashboard: (token: string) => 
    adminRequest<any>('/api/admin/dashboard', token),
  
  getSettings: (token: string) => 
    adminRequest<Record<string, string>>('/api/admin/settings', token),
  
  updateSettings: (token: string, settings: Record<string, string>) => 
    adminRequest<any>('/api/admin/settings', token, {
      method: 'PUT',
      body: JSON.stringify(settings)
    }),
  
  getSessions: (token: string, limit = 50, offset = 0) => 
    adminRequest<any>(`/api/admin/sessions?limit=${limit}&offset=${offset}`, token),
  
  getKeys: (token: string, limit = 50, offset = 0) => 
    adminRequest<any>(`/api/admin/keys?limit=${limit}&offset=${offset}`, token),
  
  clearSessions: (token: string) =>
    adminRequest<any>('/api/admin/sessions', token, { method: 'DELETE' }),
};
