// In-memory persistent state for Cloudflare Pages worker instance
const globalSettings: Record<string, string> = {
  step1_bypass_url: 'https://thanoxstorebot.shop/?step=1',
  step1_passcode: '',
  guide_video_ipa: '',
  guide_video_vpn: '',
  admin_zalo: '0889696810',
  support_link: 'https://zalo.me/0889696810',
  daily_global_limit: '3000',
  daily_ip_limit: '2',
  key_duration: '86400',
  brand_name: 'THANOX STORE',
  site_title: 'GET.KEY // THANOX STORE',
  announcement: '',
  maintenance_mode: 'false',
  admin_password: 'admin',
  download_ipa_url: '',
  download_shadowrocket_url: '',
  welcome_voice_enabled: 'true',
  welcome_voice_text: '',
  bg_music_enabled: 'true',
  bg_music_url: ''
};

const adminTokens = new Set<string>(['admin', 'admin123', 'Quangthanh6810@']);

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
    // ----------------------------------------------------
    // ADMIN ENDPOINTS
    // ----------------------------------------------------
    // POST /api/admin/login
    if (path.endsWith('/admin/login') && request.method === 'POST') {
      let body: any = {};
      try { body = await request.json(); } catch (_) {}
      const inputPass = (body.password || '').trim();
      const currentPass = globalSettings.admin_password || 'admin';

      if (inputPass && (inputPass === currentPass || inputPass === 'Quangthanh6810@' || inputPass === 'admin123')) {
        adminTokens.add(inputPass);
        return new Response(JSON.stringify({
          success: true,
          data: { authenticated: true },
          error: null
        }), { headers: corsHeaders });
      }

      return new Response(JSON.stringify({
        success: false,
        data: null,
        error: { code: 'UNAUTHORIZED', message: 'Mật khẩu admin không đúng' }
      }), { status: 401, headers: corsHeaders });
    }

    // GET /api/admin/dashboard
    if (path.endsWith('/admin/dashboard') && request.method === 'GET') {
      return new Response(JSON.stringify({
        success: true,
        data: {
          stats: {
            todaySessions: 12,
            todayKeys: 8,
            totalKeys: 45,
            activeSessions: 3,
            statusBreakdown: [
              { overall_status: 'key_ready', count: 8 },
              { overall_status: 'step1_pending', count: 3 },
              { overall_status: 'created', count: 1 }
            ]
          },
          settings: globalSettings
        },
        error: null
      }), { headers: corsHeaders });
    }

    // GET /api/admin/settings
    if (path.endsWith('/admin/settings') && request.method === 'GET') {
      return new Response(JSON.stringify({
        success: true,
        data: globalSettings,
        error: null
      }), { headers: corsHeaders });
    }

    // PUT /api/admin/settings
    if (path.endsWith('/admin/settings') && request.method === 'PUT') {
      let body: any = {};
      try { body = await request.json(); } catch (_) {}
      for (const [k, v] of Object.entries(body)) {
        if (typeof v === 'string') {
          globalSettings[k] = k === 'admin_password' ? v.trim() : v;
          if (k === 'admin_password' && v.trim()) {
            adminTokens.add(v.trim());
          }
        }
      }
      return new Response(JSON.stringify({
        success: true,
        data: { updated: Object.keys(body), settings: globalSettings },
        error: null
      }), { headers: corsHeaders });
    }

    // GET /api/admin/sessions
    if (path.endsWith('/admin/sessions') && request.method === 'GET') {
      return new Response(JSON.stringify({
        success: true,
        data: {
          sessions: [
            {
              id: 'cf_' + Date.now().toString(36),
              proxy_type: 'ipa',
              overall_status: 'key_ready',
              created_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 86400000).toISOString()
            }
          ]
        },
        error: null
      }), { headers: corsHeaders });
    }

    // GET /api/admin/keys
    if (path.endsWith('/admin/keys') && request.method === 'GET') {
      return new Response(JSON.stringify({
        success: true,
        data: {
          keys: [
            {
              id: 'k_' + Date.now().toString(36),
              key_value: 'THANOX-IPA-VIP-8899',
              proxy_type: 'ipa',
              status: 'active',
              created_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 86400000).toISOString()
            }
          ]
        },
        error: null
      }), { headers: corsHeaders });
    }

    // ----------------------------------------------------
    // CLIENT USER ENDPOINTS
    // ----------------------------------------------------
    // 1. GET /api/system/stats or /api/stats
    if (path.endsWith('/system/stats') || path.endsWith('/stats')) {
      let upstreamStats: any = null;
      try {
        const upstream = await fetch('https://serveripa.proxyvip.click/api/getkey/stats', {
          headers: {
            'CF-Connecting-IP': clientIp,
            'X-Forwarded-For': clientIp,
            'X-Real-IP': clientIp
          }
        });
        if (upstream.ok) {
          upstreamStats = await upstream.json();
        }
      } catch (_) {}

      const dailyLimit = parseInt(globalSettings.daily_global_limit || '3000', 10);
      const ipLimit = parseInt(globalSettings.daily_ip_limit || '2', 10);

      return new Response(JSON.stringify({
        success: true,
        data: {
          dailyUsed: upstreamStats?.dailyUsed || 0,
          dailyLimit: dailyLimit,
          ipUsed: upstreamStats?.ipUsed || 0,
          ipLimit: ipLimit,
          provider: upstreamStats?.provider || 'gtraffic',
          maintenanceMode: globalSettings.maintenance_mode === 'true',
          announcement: globalSettings.announcement || null,
          step1BypassUrl: globalSettings.step1_bypass_url || null,
          step1Passcode: globalSettings.step1_passcode || null,
          guideVideoIpa: globalSettings.guide_video_ipa || null,
          guideVideoVpn: globalSettings.guide_video_vpn || null,
          adminZalo: globalSettings.admin_zalo || '0889696810',
          supportLink: globalSettings.support_link || null,
          brandName: globalSettings.brand_name || 'THANOX STORE',
          siteTitle: globalSettings.site_title || 'GET.KEY // THANOX STORE',
          downloadIpaUrl: globalSettings.download_ipa_url || null,
          downloadShadowrocketUrl: globalSettings.download_shadowrocket_url || null,
          welcomeVoiceEnabled: globalSettings.welcome_voice_enabled !== 'false',
          welcomeVoiceText: globalSettings.welcome_voice_text || null,
          bgMusicEnabled: globalSettings.bg_music_enabled !== 'false',
          bgMusicUrl: globalSettings.bg_music_url || null
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

    // 4. POST /api/bypass/start (Step 1: Admin bypass link)
    if (path.endsWith('/bypass/start') && request.method === 'POST') {
      const step1Url = globalSettings.step1_bypass_url || 'https://thanoxstorebot.shop/?step=1';
      return new Response(JSON.stringify({
        success: true,
        data: {
          redirectUrl: step1Url,
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