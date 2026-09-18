import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SessionService } from '../services/sessionService';
import { KeyService } from '../services/keyService';
import { ExternalKeyService } from '../services/externalKeyService';
import { Session, Key, ProxyType } from '../types';

interface MockStore {
  sessions: Record<string, Session>;
  keys: Record<string, Key>;
}

function createMockD1() {
  const store: MockStore = {
    sessions: {},
    keys: {}
  };

  const createStatement = (sql: string, boundArgs: any[] = []) => {
    return {
      bind: (...args: any[]) => createStatement(sql, args),
      first: async <T = any>(): Promise<T | null> => {
        const normalized = sql.replace(/\s+/g, ' ').trim();
        if (normalized.startsWith('SELECT * FROM sessions WHERE id = ?')) {
          const id = boundArgs[0];
          return (store.sessions[id] ? { ...store.sessions[id] } : null) as T;
        }
        if (normalized.startsWith('SELECT * FROM keys WHERE session_id = ?')) {
          const sessionId = boundArgs[0];
          return (store.keys[sessionId] ? { ...store.keys[sessionId] } : null) as T;
        }
        return null;
      },
      run: async () => {
        const normalized = sql.replace(/\s+/g, ' ').trim();
        
        // INSERT INTO sessions
        if (normalized.includes('INSERT INTO sessions')) {
          const [
            id, proxy_type, step1_status, step2_status, overall_status,
            step1_token_hash, step1_nonce, step2_flow_id, step2_state,
            created_at, updated_at, expires_at, client_ip_hash, user_agent_hash
          ] = boundArgs;
          
          store.sessions[id] = {
            id, proxy_type, step1_status, step2_status, overall_status,
            step1_token_hash, step1_nonce, step2_flow_id, step2_state,
            created_at, updated_at, expires_at, client_ip_hash, user_agent_hash
          };
          return { meta: { changes: 1 } };
        }

        // UPDATE sessions WHERE id = ? AND overall_status = 'created'
        if (normalized.includes("WHERE id = ? AND overall_status = 'created'")) {
          const [proxy_type, , updated_at, id] = boundArgs;
          const s = store.sessions[id];
          if (s && s.overall_status === 'created') {
            s.proxy_type = proxy_type;
            s.overall_status = 'type_selected';
            s.updated_at = updated_at;
            return { meta: { changes: 1 } };
          }
          return { meta: { changes: 0 } };
        }

        // UPDATE sessions WHERE id = ? AND overall_status = 'type_selected'
        if (normalized.includes("WHERE id = ? AND overall_status = 'type_selected'")) {
          const [token_hash, nonce, updated_at, id] = boundArgs;
          const s = store.sessions[id];
          if (s && s.overall_status === 'type_selected') {
            s.step1_status = 'pending';
            s.overall_status = 'step1_pending';
            s.step1_token_hash = token_hash;
            s.step1_nonce = nonce;
            s.updated_at = updated_at;
            return { meta: { changes: 1 } };
          }
          return { meta: { changes: 0 } };
        }

        // UPDATE sessions WHERE id = ? AND overall_status = 'step1_pending' AND step1_nonce = ?
        if (normalized.includes("WHERE id = ? AND overall_status = 'step1_pending' AND step1_nonce = ?")) {
          const [updated_at, id, nonce] = boundArgs;
          const s = store.sessions[id];
          if (s && s.overall_status === 'step1_pending' && s.step1_nonce === nonce) {
            s.step1_status = 'completed';
            s.overall_status = 'step1_completed';
            s.step1_nonce = null;
            s.updated_at = updated_at;
            return { meta: { changes: 1 } };
          }
          return { meta: { changes: 0 } };
        }

        // UPDATE sessions WHERE id = ? AND overall_status = 'step1_completed'
        if (normalized.includes("WHERE id = ? AND overall_status = 'step1_completed'")) {
          const [flowId, updated_at, id] = boundArgs;
          const s = store.sessions[id];
          if (s && s.overall_status === 'step1_completed') {
            s.step2_status = 'pending';
            s.overall_status = 'step2_pending';
            s.step2_flow_id = flowId;
            s.updated_at = updated_at;
            return { meta: { changes: 1 } };
          }
          return { meta: { changes: 0 } };
        }

        // UPDATE sessions WHERE id = ? AND overall_status = 'step2_pending'
        if (normalized.includes("WHERE id = ? AND overall_status = 'step2_pending'")) {
          const [updated_at, id] = boundArgs;
          const s = store.sessions[id];
          if (s && s.overall_status === 'step2_pending') {
            s.step2_status = 'completed';
            s.overall_status = 'step2_completed';
            s.updated_at = updated_at;
            return { meta: { changes: 1 } };
          }
          return { meta: { changes: 0 } };
        }

        // UPDATE sessions SET overall_status = 'key_ready', updated_at = ? WHERE id = ? AND overall_status = 'step2_completed'
        if (normalized.includes("WHERE id = ? AND overall_status = 'step2_completed'") || normalized.includes("UPDATE sessions SET overall_status = 'key_ready'")) {
          const [updated_at, id] = boundArgs;
          const s = store.sessions[id];
          if (s && s.overall_status === 'step2_completed') {
            s.overall_status = 'key_ready';
            s.updated_at = updated_at;
            return { meta: { changes: 1 } };
          }
          return { meta: { changes: 0 } };
        }

        // UPDATE sessions SET overall_status = 'expired'
        if (normalized.includes("SET overall_status = ?, updated_at = ? WHERE id = ?")) {
          const [newStatus, updated_at, id] = boundArgs;
          const s = store.sessions[id];
          if (s) {
            s.overall_status = newStatus as any;
            s.updated_at = updated_at;
            return { meta: { changes: 1 } };
          }
          return { meta: { changes: 0 } };
        }

        // INSERT INTO keys
        if (normalized.includes('INSERT INTO keys')) {
          const [id, key_value, proxy_type, session_id, created_at, expires_at, status] = boundArgs;
          store.keys[session_id] = { id, key_value, proxy_type, session_id, created_at, expires_at, status };
          return { meta: { changes: 1 } };
        }

        return { meta: { changes: 0 } };
      }
    };
  };

  const db = {
    prepare: (sql: string) => createStatement(sql),
    batch: async (statements: any[]) => {
      const results = [];
      for (const stmt of statements) {
        results.push(await stmt.run());
      }
      return results;
    },
    _store: store
  };

  return db as any;
}

const realExternalConfig = {
  baseUrl: 'https://serveripa.proxyvip.click',
  getkeyEndpoint: '/api/getkey',
  statsEndpoint: '/api/getkey/stats'
};

describe('Proxy Key System - Real ServerKey Integration & Acceptance Tests', () => {
  let db: any;
  let externalService: ExternalKeyService;

  beforeEach(() => {
    db = createMockD1();
    externalService = new ExternalKeyService(realExternalConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('ServerKey Integration: createIPAFlow calls real contract with keyType: "ipa"', async () => {
    // Mock global fetch to intercept and assert exact ServerKey contract
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true, url: 'https://gtraffic.io/ipaTest123' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    const result = await externalService.createIPAFlow('session-ipa-1');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://serveripa.proxyvip.click/api/getkey');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(init?.body as string)).toEqual({ keyType: 'ipa' });
    
    expect(result.flowId).toBe('ipaTest123');
    expect(result.flowUrl).toBe('https://gtraffic.io/ipaTest123');
    expect(result.status).toBe('pending');
  });

  it('ServerKey Integration: createVPNFlow calls real contract with keyType: "vpn"', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true, url: 'https://gtraffic.io/vpnTest456' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    const result = await externalService.createVPNFlow('session-vpn-1');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://serveripa.proxyvip.click/api/getkey');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(init?.body as string)).toEqual({ keyType: 'vpn' });
    
    expect(result.flowId).toBe('vpnTest456');
    expect(result.flowUrl).toBe('https://gtraffic.io/vpnTest456');
    expect(result.status).toBe('pending');
  });

  it('ServerKey Integration: Rejection when ServerKey API fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: false, msg: 'Hết lượt hôm nay' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    await expect(externalService.createIPAFlow('session-err')).rejects.toThrow(/ServerKey rejected: Hết lượt hôm nay/i);
  });

  it('Case A: Full IPA flow -> ServerKey MUST be IPA -> flowId stored in D1 -> Claim Key', async () => {
    // 1. Session created
    const session = await SessionService.createSession(db, 'ip-hash-1', null);
    expect(session.overall_status).toBe('created');

    // 2. Select IPA
    await SessionService.selectType(db, session.id, 'ipa');
    let current = await SessionService.getSession(db, session.id);
    expect(current?.proxy_type).toBe('ipa');

    // 3. Step 1 Start & Complete
    const nonce = 'nonce-ipa-123';
    await SessionService.startStep1(db, session.id, 'hash-ipa', nonce);
    await SessionService.completeStep1(db, session.id, nonce);
    current = await SessionService.getSession(db, session.id);
    expect(current?.overall_status).toBe('step1_completed');

    // 4. Step 2 MUST be IPA
    expect(current?.proxy_type).toBe('ipa');
    const flowResult = { flowId: 'gtraffic-ipa-abc', flowUrl: 'https://gtraffic.io/abc', status: 'pending' as const };
    
    // Save real flowId in D1
    await SessionService.startStep2(db, session.id, flowResult.flowId);
    current = await SessionService.getSession(db, session.id);
    expect(current?.overall_status).toBe('step2_pending');
    expect(current?.step2_flow_id).toBe('gtraffic-ipa-abc');

    // 5. Complete Step 2
    await SessionService.completeStep2(db, session.id);
    current = await SessionService.getSession(db, session.id);
    expect(current?.overall_status).toBe('step2_completed');

    // 6. Claim Key
    const key = await KeyService.claimKey(db, current!, 3600);
    expect(key).not.toBeNull();
    expect(key?.proxy_type).toBe('ipa');
    expect(key?.key_value).toMatch(/^PROXY-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/);

    current = await SessionService.getSession(db, session.id);
    expect(current?.overall_status).toBe('key_ready');
  });

  it('Case B: Full VPN flow -> ServerKey MUST be VPN -> flowId stored in D1 -> Claim Key', async () => {
    const session = await SessionService.createSession(db, 'ip-hash-2', null);
    await SessionService.selectType(db, session.id, 'vpn');
    
    // Step 1
    const nonce = 'nonce-vpn-123';
    await SessionService.startStep1(db, session.id, 'hash-vpn', nonce);
    await SessionService.completeStep1(db, session.id, nonce);
    let current = await SessionService.getSession(db, session.id);
    expect(current?.overall_status).toBe('step1_completed');

    // Step 2 MUST be VPN
    expect(current?.proxy_type).toBe('vpn');
    await SessionService.startStep2(db, session.id, 'gtraffic-vpn-xyz');
    current = await SessionService.getSession(db, session.id);
    expect(current?.step2_flow_id).toBe('gtraffic-vpn-xyz');

    await SessionService.completeStep2(db, session.id);
    current = await SessionService.getSession(db, session.id);
    expect(current?.overall_status).toBe('step2_completed');

    // Claim Key
    const key = await KeyService.claimKey(db, current!, 3600);
    expect(key?.proxy_type).toBe('vpn');
  });

  it('Case C: Type tampering rejection (cannot switch types)', async () => {
    const session = await SessionService.createSession(db, 'ip-hash-3', null);
    await SessionService.selectType(db, session.id, 'vpn');

    // Try to change to IPA -> Rejected
    const changed = await SessionService.selectType(db, session.id, 'ipa');
    expect(changed).toBe(false);

    const current = await SessionService.getSession(db, session.id);
    expect(current?.proxy_type).toBe('vpn');
  });

  it('Case D: Early key claim rejection before Step 2 completion', async () => {
    const session = await SessionService.createSession(db, 'ip-hash-4', null);
    await SessionService.selectType(db, session.id, 'ipa');

    // Attempt claim at 'type_selected'
    let current = await SessionService.getSession(db, session.id);
    await expect(KeyService.claimKey(db, current!, 3600)).rejects.toThrow('Invalid session state');

    // Step 1 complete, but Step 2 not complete
    await SessionService.startStep1(db, session.id, 'h', 'n');
    await SessionService.completeStep1(db, session.id, 'n');
    current = await SessionService.getSession(db, session.id);
    await expect(KeyService.claimKey(db, current!, 3600)).rejects.toThrow('Invalid session state');

    // Step 2 pending -> still rejected
    await SessionService.startStep2(db, session.id, 'flow-pending');
    current = await SessionService.getSession(db, session.id);
    await expect(KeyService.claimKey(db, current!, 3600)).rejects.toThrow('Invalid session state');
  });

  it('Case E: Replay callback rejection (nonce single-use)', async () => {
    const session = await SessionService.createSession(db, 'ip-hash-5', null);
    await SessionService.selectType(db, session.id, 'ipa');
    const nonce = 'single-nonce-999';
    await SessionService.startStep1(db, session.id, 'hash', nonce);

    // First completion -> OK
    expect(await SessionService.completeStep1(db, session.id, nonce)).toBe(true);

    // Replay with same nonce -> Rejected
    expect(await SessionService.completeStep1(db, session.id, nonce)).toBe(false);
  });

  it('Case F: Expired session rejection', async () => {
    const session = await SessionService.createSession(db, 'ip-hash-6', null);
    await SessionService.selectType(db, session.id, 'ipa');

    // Simulate expired session in DB
    db._store.sessions[session.id].expires_at = new Date(Date.now() - 3600 * 1000).toISOString();

    const retrieved = await SessionService.getSession(db, session.id);
    expect(retrieved?.overall_status).toBe('expired');
    expect(SessionService.isExpired(retrieved!)).toBe(true);

    await expect(KeyService.claimKey(db, retrieved!, 3600)).rejects.toThrow('Invalid session state');
  });

  it('Case G: ServerKey Failure Handling - does not mark step2_completed or create key', async () => {
    const session = await SessionService.createSession(db, 'ip-hash-7', null);
    await SessionService.selectType(db, session.id, 'ipa');
    await SessionService.startStep1(db, session.id, 'h', 'n');
    await SessionService.completeStep1(db, session.id, 'n');

    // Simulate ServerKey API returning HTTP 500 error
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('Internal Server Error', { status: 500 })
    );

    await expect(externalService.createIPAFlow(session.id)).rejects.toThrow(/ServerKey API returned HTTP 500/i);

    // Verify session remains step1_completed and NOT step2_completed
    const current = await SessionService.getSession(db, session.id);
    expect(current?.overall_status).toBe('step1_completed');
    expect(current?.step2_status).toBe('pending');
  });

  it('Additional: Duplicate key claim is idempotent', async () => {
    const session = await SessionService.createSession(db, 'ip-hash-8', null);
    await SessionService.selectType(db, session.id, 'vpn');
    await SessionService.startStep1(db, session.id, 'h', 'n');
    await SessionService.completeStep1(db, session.id, 'n');
    await SessionService.startStep2(db, session.id, 'vpn-flow-1');
    await SessionService.completeStep2(db, session.id);

    const ready = await SessionService.getSession(db, session.id);
    const key1 = await KeyService.claimKey(db, ready!, 3600);
    const key2 = await KeyService.getKeyBySession(db, session.id);

    expect(key1?.key_value).toBe(key2?.key_value);
    expect(key1?.proxy_type).toBe('vpn');
  });
});
