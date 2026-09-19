// In-memory persistent state for Cloudflare Pages worker instance
const globalSettings: Record<string, string> = {
  step1_bypass_url: 'https://layma.net/i1vAwGviV',
  step1_title: 'Máy chủ xác thực 2 (Layma 2)',
  step1_passcode: '',
  bypass_links_json: JSON.stringify([
    { id: '1', title: 'Máy chủ xác thực 2 (Layma 2)', url: 'https://layma.net/i1vAwGviV', passcode: '', note: '' }
  ]),
  step_success_msg: '',
  bypass_cooldown_seconds: '60',
  admin_zalo: '0889696810',
  support_link: 'https://zalo.me/0889696810',
  daily_global_limit: '3000',
  daily_ip_limit: '2',
  key_duration: '86400',
  brand_name: 'THANOX STORE',
  site_title: 'GET.KEY // THANOX STORE',
  announcement: '',
  maintenance_mode: 'false',
  admin_password: 'admin'
};

const adminTokens = new Set<string>(['admin', 'admin123', 'Quangthanh6810@']);

export interface LiveSession {
  id: string;
  ip: string;
  city: string;
  country: string;
  region: string;
  isp: string;
  location: string;
  lat: number;
  lon: number;
  device: string;
  os: string;
  deviceIcon: string;
  proxyType: 'ipa' | 'vpn' | null;
  step: 'visited' | 'selected' | 'step1' | 'step1_done' | 'step2' | 'completed';
  statusLabel: string;
  badgeClass: string;
  createdAt: number;
  updatedAt: number;
}

// In-memory sessions tracking map (keeps up to 200 recent sessions)
const activeSessions: Map<string, LiveSession> = new Map();

const VN_CITY_COORDINATES: Record<string, [number, number]> = {
  'ha noi': [21.0285, 105.8542],
  'hanoi': [21.0285, 105.8542],
  'ho chi minh': [10.8231, 106.6297],
  'ho chi minh city': [10.8231, 106.6297],
  'saigon': [10.8231, 106.6297],
  'tp.hcm': [10.8231, 106.6297],
  'da nang': [16.0544, 108.2022],
  'danang': [16.0544, 108.2022],
  'hai phong': [20.8449, 106.6881],
  'haiphong': [20.8449, 106.6881],
  'can tho': [10.0452, 105.7469],
  'cantho': [10.0452, 105.7469],
  'dong nai': [10.9574, 106.8427],
  'bien hoa': [10.9574, 106.8427],
  'binh duong': [10.9804, 106.6519],
  'thu dau mot': [10.9804, 106.6519],
  'nha trang': [12.2388, 109.1967],
  'khanh hoa': [12.2388, 109.1967],
  'hue': [16.4637, 107.5909],
  'thua thien hue': [16.4637, 107.5909],
  'vung tau': [10.3460, 107.0843],
  'ba ria': [10.4962, 107.1683],
  'buon ma thuot': [12.6667, 108.0500],
  'dak lak': [12.6667, 108.0500],
  'quy nhon': [13.7820, 109.2192],
  'binh dinh': [13.7820, 109.2192],
  'long xuyen': [10.3833, 105.4167],
  'an giang': [10.3833, 105.4167],
  'thai nguyen': [21.5928, 105.8442],
  'nam dinh': [20.4333, 106.1833],
  'vinh': [18.6733, 105.6811],
  'nghe an': [18.6733, 105.6811],
  'thanh hoa': [19.8067, 105.7852],
  'ha long': [20.9505, 107.0734],
  'quang ninh': [20.9505, 107.0734],
  'bac ninh': [21.1861, 106.0763],
  'bac giang': [21.2731, 106.1946],
  'vinh phuc': [21.3094, 105.6049],
  'hai duong': [20.9388, 106.3159],
  'da lat': [11.9404, 108.4583],
  'lam dong': [11.9404, 108.4583],
  'phu quoc': [10.2289, 103.9572],
  'rach gia': [10.0125, 105.0809],
  'kien giang': [10.0125, 105.0809],
  'ca mau': [9.1769, 105.1524],
  'tay ninh': [11.3102, 106.0983],
  'binh phuoc': [11.5333, 106.9000],
  'my tho': [10.3600, 106.3600],
  'tien giang': [10.3600, 106.3600],
  'ben tre': [10.2433, 106.3756],
  'vinh long': [10.2537, 105.9722],
  'tra vinh': [9.9347, 106.3455],
  'soc trang': [9.6033, 105.9800],
  'bac lieu': [9.2941, 105.7278],
  'hau giang': [9.7844, 105.4700],
  'dong thap': [10.4578, 105.6322],
  'quang nam': [15.5736, 108.4800],
  'tam ky': [15.5736, 108.4800],
  'hoi an': [15.8801, 108.3380],
  'quang ngai': [15.1205, 108.7922],
  'phu yen': [13.0883, 109.3089],
  'tuy hoa': [13.0883, 109.3089],
  'phan rang': [11.5667, 108.9833],
  'ninh thuan': [11.5667, 108.9833],
  'phan thiet': [10.9289, 108.1022],
  'binh thuan': [10.9289, 108.1022],
  'pleiku': [13.9833, 108.0000],
  'gia lai': [13.9833, 108.0000],
  'kon tum': [14.3500, 108.0000],
  'dak nong': [12.0000, 107.6833],
  'ha tinh': [18.3433, 105.9056],
  'dong hoi': [17.4833, 106.6000],
  'quang binh': [17.4833, 106.6000],
  'dong ha': [16.8167, 107.1000],
  'quang tri': [16.8167, 107.1000],
  'ninh binh': [20.2539, 105.9750],
  'ha nam': [20.5456, 105.9122],
  'hung yen': [20.6464, 106.0511],
  'thai binh': [20.4500, 106.3400],
  'viet tri': [21.3228, 105.4019],
  'phu tho': [21.3228, 105.4019],
  'tuyen quang': [21.8233, 105.2181],
  'yen bai': [21.7167, 104.8667],
  'lao cai': [22.4856, 103.9706],
  'sapa': [22.3364, 103.8438],
  'hoa binh': [20.8172, 105.3375],
  'son la': [21.3283, 103.9147],
  'dien bien': [21.3869, 103.0231],
  'lai chau': [22.3964, 103.4589],
  'ha giang': [22.8233, 104.9836],
  'cao bang': [22.6667, 106.2500],
  'bac kan': [22.1472, 105.8347],
  'lang son': [21.8533, 106.7619]
};

function lookupCoordinatesByText(text: string): [number, number] | null {
  if (!text) return null;
  const clean = text.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, ' ')
    .trim();

  for (const [key, coords] of Object.entries(VN_CITY_COORDINATES)) {
    const cleanKey = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (clean.includes(cleanKey)) {
      return coords;
    }
  }
  return null;
}

function parseUserAgent(ua: string): { device: string; os: string; deviceIcon: string } {
  if (!ua) return { device: 'Không rõ', os: 'Trình duyệt Web', deviceIcon: '💻' };

  if (/iPhone/i.test(ua)) {
    const match = ua.match(/OS (\d+[_\d]*)/i);
    const osVer = match ? `iOS ${match[1].replace(/_/g, '.')}` : 'iOS';
    return { device: 'iPhone', os: osVer, deviceIcon: '📱' };
  }
  if (/iPad/i.test(ua)) {
    const match = ua.match(/OS (\d+[_\d]*)/i);
    const osVer = match ? `iPadOS ${match[1].replace(/_/g, '.')}` : 'iPadOS';
    return { device: 'iPad', os: osVer, deviceIcon: '📱' };
  }
  if (/Android/i.test(ua)) {
    const match = ua.match(/Android\s+([0-9\.]+)/i);
    const osVer = match ? `Android ${match[1]}` : 'Android';
    let brand = 'Android';
    if (/Samsung|SM-/i.test(ua)) brand = 'Samsung';
    else if (/Xiaomi|Redmi|POCO/i.test(ua)) brand = 'Xiaomi';
    else if (/Oppo/i.test(ua)) brand = 'OPPO';
    else if (/Vivo/i.test(ua)) brand = 'Vivo';
    return { device: brand, os: osVer, deviceIcon: '🤖' };
  }
  if (/Windows NT/i.test(ua)) {
    let ver = 'Windows';
    if (/Windows NT 10.0/i.test(ua)) ver = 'Windows 10/11';
    else if (/Windows NT 6.3/i.test(ua)) ver = 'Windows 8.1';
    else if (/Windows NT 6.1/i.test(ua)) ver = 'Windows 7';
    return { device: 'Máy tính PC', os: ver, deviceIcon: '💻' };
  }
  if (/Macintosh|Mac OS X/i.test(ua)) {
    return { device: 'MacBook/Mac', os: 'macOS', deviceIcon: '💻' };
  }
  return { device: 'Thiết bị Web', os: 'Linux/Khác', deviceIcon: '🌐' };
}

async function getGeoInfo(request: Request, clientIp: string): Promise<{
  city: string;
  country: string;
  region: string;
  isp: string;
  flag: string;
  location: string;
  lat: number;
  lon: number;
}> {
  const cf = (request as any).cf || {};
  let city = request.headers.get('cf-ipcity') || cf.city || '';
  let country = request.headers.get('cf-ipcountry') || cf.country || 'VN';
  let region = request.headers.get('cf-region') || cf.region || '';
  let isp = cf.asOrganization || (cf.asn ? `AS${cf.asn}` : '');
  let lat = parseFloat(request.headers.get('cf-iplatitude') || cf.latitude || '0');
  let lon = parseFloat(request.headers.get('cf-iplongitude') || cf.longitude || '0');

  // Fast external IP API lookup fallback if lat/lon missing on public IP
  if ((!lat || !lon || !city) && clientIp && clientIp !== '127.0.0.1' && !clientIp.startsWith('192.168.') && !clientIp.startsWith('10.')) {
    try {
      const geoRes = await fetch(`https://freeipapi.com/api/json/${clientIp}`, {
        headers: { 'User-Agent': 'ServerKey-Geo/1.0' }
      });
      if (geoRes.ok) {
        const geoData: any = await geoRes.json();
        if (geoData.cityName && !city) city = geoData.cityName;
        if (geoData.countryCode && !country) country = geoData.countryCode;
        if (geoData.regionName && !region) region = geoData.regionName;
        if (geoData.latitude && !lat) lat = parseFloat(geoData.latitude);
        if (geoData.longitude && !lon) lon = parseFloat(geoData.longitude);
      }
    } catch (_) {}
  }

  // Fallback to Vietnam dictionary match if lat/lon still missing
  if (!lat || !lon) {
    const match = lookupCoordinatesByText(city) || lookupCoordinatesByText(region);
    if (match) {
      lat = match[0];
      lon = match[1];
    } else {
      lat = 16.0544;
      lon = 108.2022;
    }
  }

  // Add micro-jitter so multiple sessions in the same city don't stack completely
  const jitterLat = (Math.random() - 0.5) * 0.003;
  const jitterLon = (Math.random() - 0.5) * 0.003;
  lat = Number((lat + jitterLat).toFixed(6));
  lon = Number((lon + jitterLon).toFixed(6));

  let flag = '🌐';
  if (country === 'VN') flag = '🇻🇳';
  else if (country === 'US') flag = '🇺🇸';
  else if (country === 'JP') flag = '🇯🇵';
  else if (country === 'SG') flag = '🇸🇬';
  else if (country === 'TH') flag = '🇹🇭';
  else if (country === 'KR') flag = '🇰🇷';
  else if (country === 'CN') flag = '🇨🇳';

  let location = '';
  if (city && country) {
    location = `${flag} ${city}, ${country}`;
  } else if (country) {
    location = `${flag} ${country}`;
  } else {
    location = '🇻🇳 Việt Nam';
  }

  return { city, country, region, isp, flag, location, lat, lon };
}

async function recordSessionEvent(
  sessionId: string | null,
  request: Request,
  clientIp: string,
  updates: {
    proxyType?: 'ipa' | 'vpn';
    step: 'visited' | 'selected' | 'step1' | 'step1_done' | 'step2' | 'completed';
    statusLabel: string;
    badgeClass: string;
  }
): Promise<string> {
  const now = Date.now();
  const uaString = request.headers.get('user-agent') || '';
  const parsedUa = parseUserAgent(uaString);
  const geo = await getGeoInfo(request, clientIp);

  // Find existing session by sessionId or recent IP match
  let key = sessionId;
  if (!key) {
    for (const [id, sess] of activeSessions.entries()) {
      if (sess.ip === clientIp && (now - sess.updatedAt < 30 * 60 * 1000)) {
        key = id;
        break;
      }
    }
  }
  if (!key) {
    key = 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
  }

  let session = activeSessions.get(key);
  if (!session) {
    session = {
      id: key,
      ip: clientIp,
      city: geo.city,
      country: geo.country,
      region: geo.region,
      isp: geo.isp,
      location: geo.location,
      lat: geo.lat,
      lon: geo.lon,
      device: parsedUa.device,
      os: parsedUa.os,
      deviceIcon: parsedUa.deviceIcon,
      proxyType: updates.proxyType || null,
      step: updates.step,
      statusLabel: updates.statusLabel,
      badgeClass: updates.badgeClass,
      createdAt: now,
      updatedAt: now
    };
  } else {
    session.updatedAt = now;
    if (updates.proxyType) session.proxyType = updates.proxyType;
    session.step = updates.step;
    session.statusLabel = updates.statusLabel;
    session.badgeClass = updates.badgeClass;
    if (geo.city && !session.city) session.city = geo.city;
    if (geo.isp && !session.isp) session.isp = geo.isp;
    if (geo.lat && (!session.lat || session.lat === 16.0544)) session.lat = geo.lat;
    if (geo.lon && (!session.lon || session.lon === 108.2022)) session.lon = geo.lon;
  }

  activeSessions.set(key, session);

  // Cap at 200 items
  if (activeSessions.size > 200) {
    const oldestKey = activeSessions.keys().next().value;
    if (oldestKey) activeSessions.delete(oldestKey);
  }

  await saveSessionsToCache();

  return key;
}

async function loadSessionsFromCache() {
  try {
    const cache = (caches as any).default;
    if (!cache) return;
    const req = new Request('https://serverkey-thanox.pages.dev/__active_sessions_store__', { method: 'GET' });
    const cacheRes = await cache.match(req);
    if (cacheRes) {
      const data = await cacheRes.json() as [string, LiveSession][];
      if (Array.isArray(data) && data.length > 0) {
        for (const [id, sess] of data) {
          if (id.includes('demo')) continue; // Skip legacy demo sessions
          if (!activeSessions.has(id) || (sess.updatedAt > (activeSessions.get(id)?.updatedAt || 0))) {
            activeSessions.set(id, sess);
          }
        }
      }
    }
  } catch (_) {}
}

async function saveSessionsToCache() {
  try {
    const cache = (caches as any).default;
    if (!cache) return;
    const entries = Array.from(activeSessions.entries());
    const req = new Request('https://serverkey-thanox.pages.dev/__active_sessions_store__', { method: 'GET' });
    const res = new Response(JSON.stringify(entries), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400'
      }
    });
    await cache.put(req, res);
  } catch (_) {}
}

export async function onRequest(context: { request: Request; env: any }) {
  await loadSessionsFromCache();
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
                   request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
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
      const allSessions = Array.from(activeSessions.values());
      const todaySessions = allSessions.length;
      const activeCount = allSessions.filter(s => s.step !== 'completed').length;
      const todayKeys = allSessions.filter(s => s.step === 'completed').length;

      return new Response(JSON.stringify({
        success: true,
        data: {
          stats: {
            todaySessions: todaySessions,
            todayKeys: todayKeys,
            totalKeys: todayKeys,
            activeSessions: activeCount,
            statusBreakdown: [
              { overall_status: 'key_ready', count: todayKeys },
              { overall_status: 'step2_pending', count: allSessions.filter(s => s.step === 'step2').length },
              { overall_status: 'step1_pending', count: allSessions.filter(s => s.step === 'step1').length },
              { overall_status: 'created', count: allSessions.filter(s => s.step === 'visited' || s.step === 'selected').length }
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
      const sessionList = Array.from(activeSessions.values()).sort((a, b) => b.updatedAt - a.updatedAt);
      return new Response(JSON.stringify({
        success: true,
        data: {
          sessions: sessionList
        },
        error: null
      }), { headers: corsHeaders });
    }

    // DELETE /api/admin/sessions (Clear history)
    if (path.endsWith('/admin/sessions') && request.method === 'DELETE') {
      activeSessions.clear();
      try {
        const cache = (caches as any).default;
        if (cache) await cache.delete('https://serverkey-thanox.pages.dev/__active_sessions_store__');
      } catch (_) {}
      return new Response(JSON.stringify({
        success: true,
        data: { message: 'Đã xóa toàn bộ lịch sử session' },
        error: null
      }), { headers: corsHeaders });
    }

    // GET /api/admin/keys
    if (path.endsWith('/admin/keys') && request.method === 'GET') {
      return new Response(JSON.stringify({
        success: true,
        data: {
          keys: []
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

      let bypassLinks: any[] = [];
      try {
        if (globalSettings.bypass_links_json) {
          bypassLinks = JSON.parse(globalSettings.bypass_links_json);
        }
      } catch (_) {}
      if (!Array.isArray(bypassLinks) || bypassLinks.length === 0) {
        if (globalSettings.step1_bypass_url) {
          bypassLinks = [
            { id: '1', title: 'Máy chủ xác thực 1', url: globalSettings.step1_bypass_url, passcode: globalSettings.step1_passcode || '' }
          ];
        }
      }

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
          stepSuccessMsg: globalSettings.step_success_msg || '🎉 Đã hoàn thành Bước {step}/{total}! Hãy bấm nút bên dưới để tiếp tục vượt bước tiếp theo.',
          bypassCooldownSeconds: parseInt(globalSettings.bypass_cooldown_seconds || '60', 10),
          bypassLinks: bypassLinks,
          adminZalo: globalSettings.admin_zalo || '0889696810',
          supportLink: globalSettings.support_link || null,
          brandName: globalSettings.brand_name || 'THANOX STORE',
          siteTitle: globalSettings.site_title || 'GET.KEY // THANOX STORE'
        },
        error: null
      }), { headers: corsHeaders });
    }

    // 2. POST /api/session
    if (path.endsWith('/session') && request.method === 'POST') {
      let body: any = {};
      try { body = await request.json(); } catch (_) {}
      let sessionId = body.sessionId;

      if (!sessionId) {
        const now = Date.now();
        for (const [id, sess] of activeSessions.entries()) {
          if (sess.ip === clientIp && (now - sess.updatedAt < 15 * 60 * 1000)) {
            sessionId = id;
            break;
          }
        }
      }
      if (!sessionId) {
        sessionId = crypto.randomUUID();
      }

      await recordSessionEvent(sessionId, request, clientIp, {
        step: 'visited',
        statusLabel: '⚡ Mới vào trang web',
        badgeClass: 'created'
      });

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
      let body: any = {};
      try { body = await request.json(); } catch (_) {}
      const sid = body.sessionId;
      const proxyType = body.proxyType === 'vpn' ? 'vpn' : 'ipa';

      await recordSessionEvent(sid, request, clientIp, {
        proxyType,
        step: 'selected',
        statusLabel: proxyType === 'vpn' ? '🛡️ Đã chọn PROXY VPN' : '📱 Đã chọn PROXY IPA',
        badgeClass: 'type_selected'
      });

      return new Response(JSON.stringify({
        success: true,
        data: { success: true },
        error: null
      }), { headers: corsHeaders });
    }

    // 4. POST /api/bypass/start (Multi-step bypass link start)
    if (path.endsWith('/bypass/start') && request.method === 'POST') {
      let body: any = {};
      try { body = await request.json(); } catch (_) {}
      const sid = body.sessionId;
      const stepIndex = typeof body.stepIndex === 'number' ? body.stepIndex : 0;
      const totalSteps = typeof body.totalSteps === 'number' ? body.totalSteps : 1;
      const stepTitle = body.stepTitle || `Link ${stepIndex + 1}`;

      await recordSessionEvent(sid, request, clientIp, {
        step: 'step1',
        statusLabel: totalSteps > 1 ? `🟡 Đang vượt Link ${stepIndex + 1}/${totalSteps}` : `🟡 Đang vượt Link 1`,
        badgeClass: 'step1_pending'
      });

      const step1Url = globalSettings.step1_bypass_url || 'https://layma.net/RwlXK7AH6';
      return new Response(JSON.stringify({
        ok: true,
        url: step1Url,
        success: true,
        data: {
          redirectUrl: step1Url,
          url: step1Url,
          stepIndex,
          expiresAt: Date.now() + 60 * 60 * 1000
        },
        error: null
      }), { headers: corsHeaders });
    }

    // 5. POST /api/bypass/complete (Bypass step completed)
    if (path.endsWith('/bypass/complete') && request.method === 'POST') {
      let body: any = {};
      try { body = await request.json(); } catch (_) {}
      const sid = body.sessionId;
      const stepIndex = typeof body.stepIndex === 'number' ? body.stepIndex : 0;
      const isFinal = Boolean(body.isFinal);

      await recordSessionEvent(sid, request, clientIp, {
        step: isFinal ? 'step1_done' : 'step1',
        statusLabel: isFinal ? '🟢 Đã xong tất cả link vượt' : `🟢 Đã xong Link ${stepIndex + 1}`,
        badgeClass: 'step1_completed'
      });

      return new Response(JSON.stringify({
        success: true,
        data: { completed: true },
        error: null
      }), { headers: corsHeaders });
    }

    // 6. POST /api/getkey (Reference site CTA endpoint — returns the 1 bypass link)
    if (path.endsWith('/getkey') && request.method === 'POST') {
      let body: any = {};
      try { body = await request.json(); } catch (_) {}
      const sid = body.sessionId || crypto.randomUUID();
      const keyType = (body.keyType || body.proxyType) === 'vpn' ? 'vpn' : 'ipa';

      await recordSessionEvent(sid, request, clientIp, {
        proxyType: keyType,
        step: 'step1',
        statusLabel: keyType === 'vpn' ? '🛡️ Đã tạo link PROXY VPN' : '📱 Đã tạo link PROXY IPA',
        badgeClass: 'step1_pending'
      });

      const bypassUrl = globalSettings.step1_bypass_url || 'https://layma.net/RwlXK7AH6';

      return new Response(JSON.stringify({
        ok: true,
        url: bypassUrl,
        success: true,
        data: {
          url: bypassUrl,
          flowUrl: bypassUrl,
          redirectUrl: bypassUrl
        },
        error: null
      }), { headers: corsHeaders });
    }

    // 6b. POST /api/step2/start (Direct ServerKey redirect if needed)
    if (path.endsWith('/step2/start') && request.method === 'POST') {
      let body: any = {};
      try { body = await request.json(); } catch (_) {}
      const sid = body.sessionId;
      const keyType = (body.keyType || body.proxyType) === 'vpn' ? 'vpn' : 'ipa';

      await recordSessionEvent(sid, request, clientIp, {
        proxyType: keyType,
        step: 'step2',
        statusLabel: '🚀 Đang vượt ServerKey (trực tiếp)',
        badgeClass: 'step2_pending'
      });

      return new Response(JSON.stringify({
        success: true,
        data: {
          flowUrl: 'https://serveripa.proxyvip.click/getkey',
          url: 'https://serveripa.proxyvip.click/getkey',
          ok: true,
          message: 'User sẽ được chuyển trực tiếp tới ServerKey page'
        },
        error: null
      }), { headers: corsHeaders });
    }

    // 6c. GET /api/to-serverkey or /serverkey (Layma destination link redirector)
    if ((path.endsWith('/to-serverkey') || path.endsWith('/serverkey')) && request.method === 'GET') {
      const sid = url.searchParams.get('sid') || null;
      await recordSessionEvent(sid, request, clientIp, {
        step: 'step2',
        statusLabel: '🚀 Đang ở ServerKey (Vừa vượt xong Layma)',
        badgeClass: 'step2_pending'
      });
      return Response.redirect('https://serveripa.proxyvip.click/getkey', 302);
    }

    // 7. POST /api/key/claim (User successfully finished and got key)
    if (path.endsWith('/key/claim') && request.method === 'POST') {
      let body: any = {};
      try { body = await request.json(); } catch (_) {}
      const sid = body.sessionId;

      await recordSessionEvent(sid, request, clientIp, {
        step: 'completed',
        statusLabel: '✅ Đã nhận Key thành công',
        badgeClass: 'key_ready'
      });

      return new Response(JSON.stringify({
        success: true,
        data: {
          key: 'THANOX-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
          expiresAt: new Date(Date.now() + 86400000).toISOString()
        },
        error: null
      }), { headers: corsHeaders });
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