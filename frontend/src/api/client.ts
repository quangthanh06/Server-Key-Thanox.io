const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<{ data: T | null; error: { code: string; message: string } | null }> {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      ...options
    });
    
    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch (_) {
      json = null;
    }

    if (json && json.success) return { data: json.data, error: null };
    if (json && json.ok && json.url) return { data: json as any, error: null };
    if (json && json.error) return { data: null, error: json.error };

    if (!res.ok) {
      return { 
        data: null, 
        error: { code: `HTTP_${res.status}`, message: json?.msg || `Lỗi máy chủ (${res.status}). Vui lòng thử lại!` } 
      };
    }

    return { data: null, error: { code: 'EMPTY_RESPONSE', message: 'Máy chủ phản hồi trống' } };
  } catch (err: any) {
    return { data: null, error: { code: 'NETWORK_ERROR', message: err.message || 'Lỗi kết nối mạng' } };
  }
}
