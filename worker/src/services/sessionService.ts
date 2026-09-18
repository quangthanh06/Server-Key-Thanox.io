import { D1Database } from '@cloudflare/workers-types';
import { Session, SessionStatus, ProxyType } from '../types';
import { generateSessionId } from '../lib/crypto';

export class SessionService {
  static async createSession(db: D1Database, ipHash: string, uaHash: string | null): Promise<Session> {
    const id = generateSessionId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
    
    const session: Session = {
      id,
      proxy_type: null,
      step1_status: 'pending',
      step2_status: 'pending',
      overall_status: 'created',
      step1_token_hash: null,
      step1_nonce: null,
      step2_flow_id: null,
      step2_state: null,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      client_ip_hash: ipHash,
      user_agent_hash: uaHash
    };

    await db.prepare(`
      INSERT INTO sessions (
        id, proxy_type, step1_status, step2_status, overall_status, 
        step1_token_hash, step1_nonce, step2_flow_id, step2_state, 
        created_at, updated_at, expires_at, client_ip_hash, user_agent_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      session.id, session.proxy_type, session.step1_status, session.step2_status, session.overall_status,
      session.step1_token_hash, session.step1_nonce, session.step2_flow_id, session.step2_state,
      session.created_at, session.updated_at, session.expires_at, session.client_ip_hash, session.user_agent_hash
    ).run();

    return session;
  }

  static async getSession(db: D1Database, id: string): Promise<Session | null> {
    const result = await db.prepare('SELECT * FROM sessions WHERE id = ?').bind(id).first<Session>();
    
    if (!result) return null;
    
    if (this.isExpired(result)) {
      if (result.overall_status !== 'expired') {
        await db.prepare('UPDATE sessions SET overall_status = ?, updated_at = ? WHERE id = ?')
          .bind('expired', new Date().toISOString(), id).run();
        result.overall_status = 'expired';
      }
    }
    
    return result;
  }

  static isExpired(session: Session): boolean {
    return new Date(session.expires_at).getTime() < Date.now();
  }

  static async selectType(db: D1Database, sessionId: string, proxyType: ProxyType): Promise<boolean> {
    const session = await this.getSession(db, sessionId);
    if (!session || session.overall_status !== 'created') return false;

    const result = await db.prepare(`
      UPDATE sessions 
      SET proxy_type = ?, overall_status = ?, updated_at = ? 
      WHERE id = ? AND overall_status = 'created'
    `).bind(proxyType, 'type_selected', new Date().toISOString(), sessionId).run();

    return result.meta.changes > 0;
  }

  static async startStep1(db: D1Database, sessionId: string, tokenHash: string, nonce: string): Promise<boolean> {
    const session = await this.getSession(db, sessionId);
    if (!session || session.overall_status !== 'type_selected') return false;

    const result = await db.prepare(`
      UPDATE sessions 
      SET step1_status = 'pending', overall_status = 'step1_pending', 
          step1_token_hash = ?, step1_nonce = ?, updated_at = ? 
      WHERE id = ? AND overall_status = 'type_selected'
    `).bind(tokenHash, nonce, new Date().toISOString(), sessionId).run();

    return result.meta.changes > 0;
  }

  static async completeStep1(db: D1Database, sessionId: string, nonce: string): Promise<boolean> {
    const session = await this.getSession(db, sessionId);
    if (!session || session.step1_status !== 'pending' || session.overall_status !== 'step1_pending') return false;
    
    // Validate nonce matches
    if (session.step1_nonce !== nonce) return false;

    const result = await db.prepare(`
      UPDATE sessions 
      SET step1_status = 'completed', overall_status = 'step1_completed', 
          step1_nonce = NULL, updated_at = ? 
      WHERE id = ? AND overall_status = 'step1_pending' AND step1_nonce = ?
    `).bind(new Date().toISOString(), sessionId, nonce).run();

    return result.meta.changes > 0;
  }

  static async startStep2(db: D1Database, sessionId: string, flowId: string): Promise<boolean> {
    const session = await this.getSession(db, sessionId);
    if (!session || session.overall_status !== 'step1_completed') return false;

    const result = await db.prepare(`
      UPDATE sessions 
      SET step2_status = 'pending', overall_status = 'step2_pending', 
          step2_flow_id = ?, updated_at = ? 
      WHERE id = ? AND overall_status = 'step1_completed'
    `).bind(flowId, new Date().toISOString(), sessionId).run();

    return result.meta.changes > 0;
  }

  static async completeStep2(db: D1Database, sessionId: string): Promise<boolean> {
    const session = await this.getSession(db, sessionId);
    if (!session || session.overall_status !== 'step2_pending') return false;

    const result = await db.prepare(`
      UPDATE sessions 
      SET step2_status = 'completed', overall_status = 'step2_completed', updated_at = ? 
      WHERE id = ? AND overall_status = 'step2_pending'
    `).bind(new Date().toISOString(), sessionId).run();

    return result.meta.changes > 0;
  }

  static async markKeyReady(db: D1Database, sessionId: string): Promise<boolean> {
    const session = await this.getSession(db, sessionId);
    if (!session || session.overall_status !== 'step2_completed') return false;

    const result = await db.prepare(`
      UPDATE sessions 
      SET overall_status = 'key_ready', updated_at = ? 
      WHERE id = ? AND overall_status = 'step2_completed'
    `).bind(new Date().toISOString(), sessionId).run();

    return result.meta.changes > 0;
  }
}
