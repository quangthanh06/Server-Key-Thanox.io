export interface ExternalFlowResult {
  flowId: string;
  flowUrl: string;
  status: 'pending' | 'completed' | 'failed';
  reused?: boolean;
}

export interface ExternalKeyServiceConfig {
  baseUrl: string;
  getkeyEndpoint: string;
  statsEndpoint?: string;
}

export class ExternalKeyService {
  constructor(private config: ExternalKeyServiceConfig) {}

  /**
   * Extract flow ID from the returned URL (e.g. 'oNer2QX' from 'https://gtraffic.io/oNer2QX')
   */
  private extractFlowId(url: string): string {
    try {
      const parsed = new URL(url);
      const code = parsed.pathname.replace(/^\/+/, '');
      return code || url;
    } catch {
      return url;
    }
  }

  /**
   * Real integration call to ServerKey for IPA
   */
  async createIPAFlow(sessionId: string, clientIp?: string): Promise<ExternalFlowResult> {
    return this.requestServerKeyFlow('ipa', sessionId, clientIp);
  }

  /**
   * Real integration call to ServerKey for VPN
   */
  async createVPNFlow(sessionId: string, clientIp?: string): Promise<ExternalFlowResult> {
    return this.requestServerKeyFlow('vpn', sessionId, clientIp);
  }

  /**
   * Makes the real HTTP POST request to ServerKey /api/getkey
   * Request Contract:
   *   POST https://serveripa.proxyvip.click/api/getkey
   *   Headers: Content-Type: application/json
   *   Body: { "keyType": "ipa" | "vpn" }
   * Response Contract:
   *   200 OK: { "ok": true, "url": "https://gtraffic.io/...", "reused": boolean }
   *   Error: { "ok": false, "msg": "..." } or HTTP 500 { "error": "internal_error" }
   */
  private async requestServerKeyFlow(keyType: 'ipa' | 'vpn', sessionId: string, clientIp?: string): Promise<ExternalFlowResult> {
    const targetUrl = `${this.config.baseUrl}${this.config.getkeyEndpoint}`;

    let res: Response;
    try {
      res = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
          'Origin': this.config.baseUrl,
          'Referer': `${this.config.baseUrl}/getkey`,
          ...(clientIp && clientIp !== '127.0.0.1' ? {
            'X-Forwarded-For': clientIp,
            'X-Real-IP': clientIp,
            'CF-Connecting-IP': clientIp
          } : {})
        },
        body: JSON.stringify({ keyType })
      });
    } catch (networkErr: any) {
      throw new Error(`ServerKey connection failed (${targetUrl}): ${networkErr?.message || networkErr}`);
    }

    if (!res.ok) {
      let errorBody = '';
      try { errorBody = await res.text(); } catch {}
      throw new Error(`ServerKey API returned HTTP ${res.status}: ${errorBody || res.statusText}`);
    }

    let data: any;
    try {
      data = await res.json();
    } catch {
      throw new Error('ServerKey API returned invalid non-JSON payload');
    }

    if (!data || !data.ok || !data.url) {
      const errorMsg = data?.msg || data?.error || 'ServerKey failed to generate flow shortlink';
      throw new Error(`ServerKey rejected: ${errorMsg}`);
    }

    const flowId = this.extractFlowId(data.url);

    return {
      flowId,
      flowUrl: data.url,
      status: 'pending',
      reused: Boolean(data.reused)
    };
  }

  /**
   * Query status of an external flow.
   * NOTE: ServerKey (serveripa.proxyvip.click) does NOT provide an automated polling API 
   * for third-party systems to check whether a user finished the gtraffic.io shortlink.
   * In ServerKey's architecture, gtraffic redirects the browser directly to ServerKey's /claim HTML page.
   * Therefore, this method accurately returns status 'pending' unless confirmed via callback.
   */
  async getFlowStatus(flowId: string): Promise<ExternalFlowResult> {
    return {
      flowId,
      flowUrl: '',
      status: 'pending'
    };
  }

  /**
   * Real stats query to ServerKey /api/getkey/stats
   */
  async getLiveStats(): Promise<{ dailyUsed: number; dailyLimit: number; ipUsed: number; ipLimit: number; provider: string } | null> {
    if (!this.config.statsEndpoint) return null;
    const targetUrl = `${this.config.baseUrl}${this.config.statsEndpoint}`;
    try {
      const res = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }
}
