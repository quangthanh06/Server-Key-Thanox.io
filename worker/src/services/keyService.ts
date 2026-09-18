import { D1Database } from '@cloudflare/workers-types';
import { Key, Session } from '../types';
import { generateKeyValue } from '../lib/crypto';
import { SessionService } from './sessionService';

export class KeyService {
  static async claimKey(db: D1Database, session: Session, keyDurationSec: number): Promise<Key | null> {
    if (session.overall_status !== 'step2_completed') {
      throw new Error('Invalid session state');
    }

    if (SessionService.isExpired(session)) {
      throw new Error('Session expired');
    }

    // Double check if key already exists (idempotent)
    const existingKey = await this.getKeyBySession(db, session.id);
    if (existingKey) {
      return existingKey;
    }

    const keyId = crypto.randomUUID();
    const keyValue = generateKeyValue();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + keyDurationSec * 1000);

    if (!session.proxy_type) throw new Error('Proxy type missing from session');

    const key: Key = {
      id: keyId,
      key_value: keyValue,
      proxy_type: session.proxy_type,
      session_id: session.id,
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      status: 'active'
    };

    // Execute in batch to ensure consistency
    const batch = [
      db.prepare(`
        INSERT INTO keys (id, key_value, proxy_type, session_id, created_at, expires_at, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(key.id, key.key_value, key.proxy_type, key.session_id, key.created_at, key.expires_at, key.status),
      db.prepare(`
        UPDATE sessions SET overall_status = 'key_ready', updated_at = ? WHERE id = ?
      `).bind(now.toISOString(), session.id)
    ];

    await db.batch(batch);

    return key;
  }

  static async getKeyBySession(db: D1Database, sessionId: string): Promise<Key | null> {
    return await db.prepare('SELECT * FROM keys WHERE session_id = ?')
      .bind(sessionId)
      .first<Key>();
  }
}
