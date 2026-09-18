const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<{ data: T | null; error: { code: string; message: string } | null }> {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      ...options
    });
    const json = await res.json();
    if (json.success) return { data: json.data, error: null };
    return { data: null, error: json.error || { code: 'UNKNOWN_ERROR', message: 'An unknown error occurred' } };
  } catch (err: any) {
    return { data: null, error: { code: 'NETWORK_ERROR', message: err.message || 'Network error' } };
  }
}
