import { describe, it, expect } from 'vitest';
import {
  hashIP,
  hashToken,
  generateSessionId,
  generateNonce,
  generateKeyValue,
  signPayload,
  verifyAndDecodePayload,
} from '../lib/crypto';

const SESSION_SECRET = 'test-secret-key-for-signing-32chars';

describe('Crypto Module Tests', () => {
  it('hashIP produces consistent hashes', async () => {
    const hash1 = await hashIP('192.168.1.1', 'salt');
    const hash2 = await hashIP('192.168.1.1', 'salt');
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 hex
  });

  it('hashIP produces different hashes for different IPs', async () => {
    const hash1 = await hashIP('192.168.1.1', 'salt');
    const hash2 = await hashIP('192.168.1.2', 'salt');
    expect(hash1).not.toBe(hash2);
  });

  it('hashIP produces different hashes for different salts', async () => {
    const hash1 = await hashIP('192.168.1.1', 'salt1');
    const hash2 = await hashIP('192.168.1.1', 'salt2');
    expect(hash1).not.toBe(hash2);
  });

  it('hashToken produces consistent hashes', async () => {
    const hash1 = await hashToken('some-token');
    const hash2 = await hashToken('some-token');
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it('generateSessionId produces valid UUIDs', () => {
    const id = generateSessionId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('generateNonce produces valid UUIDs', () => {
    const nonce = generateNonce();
    expect(nonce).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('generateKeyValue produces PROXY-XXXX-XXXX-XXXX format', () => {
    const key = generateKeyValue();
    expect(key).toMatch(/^PROXY-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/);
  });

  it('signPayload and verifyAndDecodePayload roundtrip works', async () => {
    const payload = { sessionId: 'test-123', purpose: 'test', nonce: 'abc' };
    const token = await signPayload(payload, SESSION_SECRET);
    
    expect(token).toBeDefined();
    expect(token).toContain('.');
    
    const decoded = await verifyAndDecodePayload<typeof payload>(token, SESSION_SECRET);
    expect(decoded).not.toBeNull();
    expect(decoded!.sessionId).toBe('test-123');
    expect(decoded!.purpose).toBe('test');
    expect(decoded!.nonce).toBe('abc');
  });

  it('verifyAndDecodePayload returns null for tampered tokens', async () => {
    const payload = { sessionId: 'test-456', purpose: 'test' };
    const token = await signPayload(payload, SESSION_SECRET);
    
    // Tamper with the payload part
    const parts = token.split('.');
    parts[0] = parts[0] + 'tampered';
    const tamperedToken = parts.join('.');

    const result = await verifyAndDecodePayload(tamperedToken, SESSION_SECRET);
    expect(result).toBeNull();
  });

  it('verifyAndDecodePayload returns null for wrong secret', async () => {
    const payload = { sessionId: 'test-789', purpose: 'test' };
    const token = await signPayload(payload, SESSION_SECRET);
    
    const result = await verifyAndDecodePayload(token, 'wrong_secret_1234567890');
    expect(result).toBeNull();
  });

  it('verifyAndDecodePayload returns null for invalid token format', async () => {
    const result = await verifyAndDecodePayload('not-a-valid-token', SESSION_SECRET);
    expect(result).toBeNull();
  });

  it('verifyAndDecodePayload returns null for empty string', async () => {
    const result = await verifyAndDecodePayload('', SESSION_SECRET);
    expect(result).toBeNull();
  });

  it('StatsService.getVietnamDate computes valid Vietnam date and positive countdown', async () => {
    const { StatsService } = await import('../services/statsService');
    const vn = StatsService.getVietnamDate();
    expect(vn.dateString).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(vn.secondsUntilReset).toBeGreaterThan(0);
    expect(vn.secondsUntilReset).toBeLessThanOrEqual(86400);
    expect(vn.resetFormatted).toContain('phút');
  });
});

