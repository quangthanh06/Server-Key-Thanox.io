export async function hashIP(ip: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateSessionId(): string {
  return crypto.randomUUID();
}

export function generateNonce(): string {
  return crypto.randomUUID();
}

export function generateKeyValue(): string {
  const part1 = crypto.randomUUID().slice(0, 4).toUpperCase();
  const part2 = crypto.randomUUID().slice(0, 4).toUpperCase();
  const part3 = crypto.randomUUID().slice(0, 4).toUpperCase();
  return `PROXY-${part1}-${part2}-${part3}`;
}

function arrayBufferToBase64Url(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function signPayload(payload: object, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const payloadString = JSON.stringify(payload);
  const payloadBase64 = arrayBufferToBase64Url(encoder.encode(payloadString));
  
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payloadBase64)
  );
  
  const signatureBase64 = arrayBufferToBase64Url(signatureBuffer);
  return `${payloadBase64}.${signatureBase64}`;
}

export async function verifyAndDecodePayload<T>(token: string, secret: string): Promise<T | null> {
  try {
    const [payloadBase64, signatureBase64] = token.split('.');
    if (!payloadBase64 || !signatureBase64) return null;
    
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    // Convert signature back to Uint8Array
    const signatureStr = atob(signatureBase64.replace(/-/g, '+').replace(/_/g, '/'));
    const signatureBytes = new Uint8Array(signatureStr.length);
    for (let i = 0; i < signatureStr.length; i++) {
      signatureBytes[i] = signatureStr.charCodeAt(i);
    }
    
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      encoder.encode(payloadBase64)
    );
    
    if (!isValid) return null;
    
    const payloadStr = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(payloadStr) as T;
  } catch {
    return null;
  }
}
