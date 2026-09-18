// Cloudflare Pages Functions - Catch-all router for /api/*
export async function onRequest(context: { request: Request; env: any }) {
  const { request } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json; charset=utf-8'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Get real client IP
  const clientIp = request.headers.get('cf-connecting-ip') || 
                   request.headers.get('x-forwarded-for') || 
                   '127.0.0.1';

  try {
    // 1. GET /api/system/stats or /api/stats
    if (path.endsWith('/system/stats') || path.endsWith('/stats')) {
      try {
        const upstream = await fetch('https://serveripa.proxyvip.click/api/getkey/stats', {
          headers: {
            'CF-Connecting-IP': clientIp,
            'X-Forwarded-For': clientIp,
            'X-Real-IP': clientIp
          }
        });
        if (upstream.ok) {
          const stats = await upstream.json() as any;
          return new Response(JSON.stringify({
            success: true,
            data: {
              dailyUsed: stats.dailyUsed || 0,
              dailyLimit: stats.dailyLimit || 3000,
              ipUsed: stats.ipUsed || 0,
              ipLimit: stats.ipLimit || 2,
              provider: stats.provider || 'gtraffic',
              maintenanceMode: false,
              announcement: null
            },
            error: null
          }), { headers: corsHeaders });
        }
      } catch (_) {}

      // Fallback stats
      return new Response(JSON.stringify({
        success: true,
        data: {
          dailyUsed: 0,
          dailyLimit: 3000,
          ipUsed: 0,
          ipLimit: 2,
          maintenanceMode: false,
          announcement: null
        },
        error: null
      }), { headers: corsHeaders });
    }

    // 2. POST /api/session
    if (path.endsWith('/session') && request.method === 'POST') {
      const sessionId = crypto.randomUUID();
      return new Response(JSON.stringify({
        success: true,
        data: {
          sessionId,
          stats: { dailyUsed: 0, dailyLimit: 3000, ipUsed: 0, ipLimit: 2 }
        },
        error: null
      }), { headers: corsHeaders });
    }

    // 3. POST /api/select-type
    if (path.endsWith('/select-type') && request.method === 'POST') {
      return new Response(JSON.stringify({
        success: true,
        data: { success: true },
        error: null
      }), { headers: corsHeaders });
    }

    // 4. POST /api/bypass/start (Step 1: Your own link shortener)
    if (path.endsWith('/bypass/start') && request.method === 'POST') {
      const defaultStep1Url = 'https://thanoxstorebot.shop/?step=1';
      return new Response(JSON.stringify({
        success: true,
        data: {
          redirectUrl: defaultStep1Url,
          expiresAt: Date.now() + 10 * 60 * 1000
        },
        error: null
      }), { headers: corsHeaders });
    }

    // 5. POST /api/step2/start OR /api/getkey (Calls real ServerKey API)
    if ((path.endsWith('/step2/start') || path.endsWith('/getkey')) && request.method === 'POST') {
      let body: any = {};
      try { body = await request.json(); } catch (_) {}
      const keyType = body.keyType === 'vpn' ? 'vpn' : 'ipa';

      const res = await fetch('https://serveripa.proxyvip.click/api/getkey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CF-Connecting-IP': clientIp,
          'X-Forwarded-For': clientIp,
          'X-Real-IP': clientIp
        },
        body: JSON.stringify({ keyType })
      });

      const data = await res.json() as any;
      if (data && data.ok && data.url) {
        return new Response(JSON.stringify({
          success: true,
          data: {
            flowUrl: data.url,
            url: data.url,
            ok: true,
            provider: data.provider || 'gtraffic'
          },
          error: null
        }), { headers: corsHeaders });
      } else {
        return new Response(JSON.stringify({
          success: false,
          data: null,
          error: {
            code: 'SERVERKEY_ERROR',
            message: data?.msg || 'Hệ thống ServerKey đang bảo trì hoặc hết lượt hôm nay.'
          }
        }), { status: 400, headers: corsHeaders });
      }
    }

    // Default fallback for any other route
    return new Response(JSON.stringify({
      success: true,
      data: { status: 'ok' },
      error: null
    }), { headers: corsHeaders });

  } catch (err: any) {
    return new Response(JSON.stringify({
      success: false,
      data: null,
      error: { code: 'SERVER_ERROR', message: err?.message || 'Server error' }
    }), { status: 500, headers: corsHeaders });
  }
}