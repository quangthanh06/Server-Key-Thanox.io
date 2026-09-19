import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../api/adminApi';
import { LiveMap } from '../components/LiveMap';
import './Admin.css';

type Tab = 'dashboard' | 'settings' | 'sessions';

export function Admin() {
  const [token, setToken] = useState<string | null>(() => {
    const t = sessionStorage.getItem('admin_token');
    return t ? t.trim() : null;
  });
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [tab, setTab] = useState<Tab>('dashboard');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPassword = password.trim();
    setLoginLoading(true);
    setLoginError('');
    const res = await adminApi.login(cleanPassword);
    if (res.error) {
      setLoginError(res.error.message);
      setLoginLoading(false);
    } else {
      sessionStorage.setItem('admin_token', cleanPassword);
      setToken(cleanPassword);
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_token');
    setToken(null);
    setPassword('');
  };

  if (!token) {
    return (
      <div className="pk-wrap admin-wrap">
        <div className="admin-login">
          <form onSubmit={handleLogin} className="admin-login-card">
            <div className="admin-login-title">🔐 ADMIN PANEL</div>
            <div className="admin-login-sub">thanoxstorebot.shop • Quản trị hệ thống</div>
            <input
              className="admin-input"
              type="password"
              placeholder="Nhập mật khẩu admin..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <button className="admin-btn" type="submit" disabled={loginLoading || !password}>
              {loginLoading ? 'ĐANG XÁC THỰC...' : '⚡ ĐĂNG NHẬP'}
            </button>
            {loginError && <div className="admin-error">⚠ {loginError}</div>}
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <a 
                href="#/" 
                onClick={(e) => { e.preventDefault(); window.location.hash = ''; }}
                style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--neon-cy)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-dim)')}
              >
                ← Quay lại Trang Chủ
              </a>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="pk-wrap admin-wrap">
      <div className="admin-header">
        <div>
          <div className="admin-header-title">⚙️ ADMIN PANEL</div>
          <div className="admin-header-domain">thanoxstorebot.shop</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="admin-logout-btn" 
            style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.15)', color: 'var(--text)' }}
            onClick={() => { window.location.hash = ''; }}
          >
            ← Trang chủ
          </button>
          <button className="admin-logout-btn" onClick={handleLogout}>Đăng xuất</button>
        </div>
      </div>

      <nav className="admin-nav">
        {(['dashboard', 'settings', 'sessions'] as Tab[]).map((t) => (
          <button
            key={t}
            className={`admin-nav-btn ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'dashboard' && '📊 Tổng quan'}
            {t === 'settings' && '⚙️ Cài đặt'}
            {t === 'sessions' && '👤 Sessions'}
          </button>
        ))}
      </nav>

      {tab === 'dashboard' && <DashboardTab token={token} onAuthError={handleLogout} />}
      {tab === 'settings' && <SettingsTab token={token} onAuthError={handleLogout} />}
      {tab === 'sessions' && <SessionsTab token={token} onAuthError={handleLogout} />}
    </div>
  );
}

/* ============ Dashboard Tab ============ */
function DashboardTab({ token, onAuthError }: { token: string; onAuthError: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    adminApi.getDashboard(token).then((res) => {
      if (res.data) {
        setData(res.data);
      } else if (res.error) {
        if (res.error.code === 'UNAUTHORIZED') {
          onAuthError();
        } else {
          setErrorMsg(res.error.message || 'Không tải được dữ liệu');
        }
      }
      setLoading(false);
    });
  }, [token, onAuthError]);

  if (loading) return <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '2rem' }}>Đang tải dữ liệu...</div>;
  if (errorMsg || !data) return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <div className="admin-error">⚠ {errorMsg || 'Không tải được dữ liệu'}</div>
      <button className="admin-btn" style={{ maxWidth: 200, margin: '1rem auto' }} onClick={onAuthError}>
        Đăng nhập lại
      </button>
    </div>
  );

  const { stats, settings } = data;

  return (
    <>
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-value">{stats.todaySessions}</div>
          <div className="admin-stat-label">Sessions Hôm Nay</div>
        </div>
        <div className="admin-stat-card green">
          <div className="admin-stat-value">{stats.todayKeys}</div>
          <div className="admin-stat-label">Lượt Chuyển ServerKey Hôm Nay</div>
        </div>
        <div className="admin-stat-card magenta">
          <div className="admin-stat-value">{stats.totalKeys}</div>
          <div className="admin-stat-label">Tổng Lượt Chuyển ServerKey</div>
        </div>
        <div className="admin-stat-card yellow">
          <div className="admin-stat-value">{stats.activeSessions}</div>
          <div className="admin-stat-label">Sessions Đang Chờ</div>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-title">
          <span className="tag">// CONFIG</span> Cấu Hình Đang Chạy
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tùy Chọn</th>
                <th>Giá Trị</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Cấu Hình Link Vượt</td>
                <td style={{ color: '#00f0ff' }}>
                  {settings.step1_bypass_url ? '1 Link Duy Nhất (Layma → ServerKey)' : 'Chưa cài link'}
                </td>
              </tr>
              <tr>
                <td>Số Zalo Hỗ Trợ</td>
                <td style={{ color: '#00ff88' }}>{settings.admin_zalo || '0889696810'}</td>
              </tr>
              <tr>
                <td>Giới Hạn Hệ Thống / Ngày</td>
                <td>{settings.daily_global_limit || '3000'} lượt</td>
              </tr>
              <tr>
                <td>Giới Hạn Mỗi IP / Ngày</td>
                <td>{settings.daily_ip_limit || '2'} lượt</td>
              </tr>
              <tr>
                <td>Thời Hạn Key</td>
                <td>{settings.key_duration ? `${parseInt(settings.key_duration) / 3600} Giờ (${settings.key_duration}s)` : '24 Giờ (86400s)'}</td>
              </tr>
              <tr>
                <td>Chế Độ Bảo Trì</td>
                <td><span className={`admin-badge ${settings.maintenance_mode === 'true' ? 'step2_pending' : 'key_ready'}`}>{settings.maintenance_mode === 'true' ? 'ĐANG BẬT' : 'TẮT (Bình thường)'}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {stats.statusBreakdown?.length > 0 && (
        <div className="admin-section">
          <div className="admin-section-title">
            <span className="tag">// STATUS</span> Phân Bố Trạng Thái Hôm Nay
          </div>
          <div className="admin-stats-grid">
            {stats.statusBreakdown.map((s: any) => (
              <div className="admin-stat-card" key={s.overall_status}>
                <div className="admin-stat-value" style={{ fontSize: '1.3rem' }}>{s.count}</div>
                <div className="admin-stat-label">{s.overall_status}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/* ============ Settings Tab ============ */
function SettingsTab({ token, onAuthError }: { token: string; onAuthError: () => void }) {
  const [settings, setSettings] = useState<Record<string, string>>({
    step1_bypass_url: 'https://layma.net/i1vAwGviV',
    step1_title: 'Máy chủ xác thực',
    step1_passcode: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      const local = localStorage.getItem('thanox_settings');
      if (local) setSettings(JSON.parse(local));
    } catch (_) {}

    const res = await adminApi.getSettings(token);
    if (res.data && Object.keys(res.data).length > 0) {
      setSettings((prev) => {
        const merged = { ...prev, ...res.data };
        localStorage.setItem('thanox_settings', JSON.stringify(merged));
        return merged;
      });
    } else if (res.error?.code === 'UNAUTHORIZED') {
      onAuthError();
    }
    setLoading(false);
  }, [token, onAuthError]);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaveMsg(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    const updatedSettings = {
      ...settings,
      step1_bypass_url: settings.step1_bypass_url || '',
      step1_title: settings.step1_title || '',
      step1_passcode: settings.step1_passcode || '',
      bypass_links_json: JSON.stringify([
        { id: '1', title: settings.step1_title || 'Máy chủ xác thực', url: settings.step1_bypass_url || '', passcode: settings.step1_passcode || '' }
      ])
    };

    try {
      localStorage.setItem('thanox_settings', JSON.stringify(updatedSettings));
    } catch (_) {}

    const res = await adminApi.updateSettings(token, updatedSettings);
    if (res.error && res.error.code !== 'UNAUTHORIZED') {
      setSaveMsg({ text: '✓ Đã lưu cài đặt thành công (Đã cập nhật hệ thống)!', type: 'success' });
    } else if (res.error?.code === 'UNAUTHORIZED') {
      setSaveMsg({ text: '⚠ Phiên đăng nhập hết hạn!', type: 'error' });
    } else {
      setSaveMsg({ text: '✓ Đã lưu tất cả cài đặt thành công!', type: 'success' });
      if (res.data?.settings) {
        setSettings(res.data.settings);
        try {
          localStorage.setItem('thanox_settings', JSON.stringify(res.data.settings));
        } catch (_) {}
      }
    }
    setSaving(false);
  };

  if (loading) return <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '2rem' }}>Đang tải cài đặt...</div>;

  return (
    <>
      <div className="admin-section">
        <div className="admin-section-title">
          <span className="tag">// BYPASS</span> Cấu Hình Link Vượt / Link Rút Gọn (Layma)
        </div>
        <div style={{ color: 'var(--text-dim)', fontSize: '0.78rem', marginBottom: '1.25rem', lineHeight: '1.5' }}>
          💡 Hệ thống phát link nhận key chuẩn 100% theo mẫu <b>serveripa.proxyvip.click/getkey</b>. Bạn chỉ cần dán <b>Link Rút Gọn (Layma)</b> vào ô bên dưới. Khách bấm tạo link trên web sẽ được mở tab vượt link này và sau khi vượt xong sẽ được chuyển tiếp sang ServerKey nhận key chính thức!
        </div>

        <div style={{
          background: 'rgba(10, 15, 30, 0.6)',
          border: '1px solid rgba(0, 240, 255, 0.25)',
          borderRadius: '8px',
          padding: '1.1rem',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <span style={{ fontFamily: 'var(--font-brand)', color: 'var(--neon-cy)', fontSize: '0.88rem', fontWeight: 700 }}>
              🔗 Link Vượt Rút Gọn Của Bạn
            </span>
          </div>

          <div className="admin-field" style={{ marginBottom: '0.65rem' }}>
            <label className="admin-field-label">URL Vượt Link (Layma / Linkvertise / ...)</label>
            <input
              className="admin-input"
              value={settings.step1_bypass_url || ''}
              onChange={(e) => handleChange('step1_bypass_url', e.target.value)}
              placeholder="https://layma.net/i1vAwGviV"
            />
          </div>

          <div style={{
            marginBottom: '0.85rem',
            padding: '0.75rem',
            background: 'rgba(0, 240, 255, 0.04)',
            border: '1px dashed rgba(0, 240, 255, 0.3)',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#fff', fontWeight: 700 }}>
                  🚀 URL đích điền vào Layma (Tự động bắt GPS & báo lên Bản đồ khi vào ServerKey):
                </div>
                <div style={{ color: 'var(--neon-cy)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', marginTop: '3px' }}>
                  https://serverkey-thanox.pages.dev/api/to-serverkey
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const targetUrl = 'https://serverkey-thanox.pages.dev/api/to-serverkey';
                  navigator.clipboard.writeText(targetUrl);
                  alert(`Đã sao chép URL đích:\n${targetUrl}\n\n👉 Hãy dán link này vào ô "Nhập URL cần rút gọn" trên trang Layma!\n\n💡 Khi khách vượt xong link, link này sẽ tự động định vị GPS của khách và báo động đỏ "🚀 Đang ở ServerKey" lên Bản Đồ trước khi chuyển họ sang trang lấy key!`);
                }}
                style={{
                  background: 'rgba(0, 240, 255, 0.18)',
                  border: '1px solid var(--border-cy)',
                  borderRadius: '5px',
                  color: '#00f0ff',
                  fontSize: '0.7rem',
                  padding: '4px 10px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  whiteSpace: 'nowrap'
                }}
              >
                📋 Sao chép URL định vị
              </button>
            </div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)' }}>
              Hoặc link gốc trực tiếp: <code style={{ color: '#a0aec0' }}>https://serveripa.proxyvip.click/getkey</code>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="admin-field" style={{ margin: 0 }}>
              <label className="admin-field-label">Tên hiển thị (Tùy chọn)</label>
              <input
                className="admin-input"
                value={settings.step1_title || ''}
                onChange={(e) => handleChange('step1_title', e.target.value)}
                placeholder="Máy chủ xác thực"
              />
            </div>
            <div className="admin-field" style={{ margin: 0 }}>
              <label className="admin-field-label">Mã Xác Nhận / Passcode (Tùy chọn)</label>
              <input
                className="admin-input"
                value={settings.step1_passcode || ''}
                onChange={(e) => handleChange('step1_passcode', e.target.value)}
                placeholder="Để trống nếu không cần mã"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-title">
          <span className="tag">// SUPPORT</span> Kênh Hỗ Trợ Khách Hàng
        </div>
        <div className="admin-field">
          <label className="admin-field-label">Số Điện Thoại Zalo Admin</label>
          <input
            className="admin-input"
            value={settings.admin_zalo || ''}
            onChange={(e) => handleChange('admin_zalo', e.target.value)}
            placeholder="0889696810"
          />
          <div className="admin-field-hint">Hiển thị khi hệ thống bảo trì hoặc khi khách cần hỗ trợ.</div>
        </div>
        <div className="admin-field">
          <label className="admin-field-label">Link Nhóm CSKH (Zalo / Telegram)</label>
          <input
            className="admin-input"
            value={settings.support_link || ''}
            onChange={(e) => handleChange('support_link', e.target.value)}
            placeholder="https://zalo.me/g/... hoặc https://t.me/..."
          />
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-title">
          <span className="tag">// LIMITS</span> Giới Hạn Hệ Thống
        </div>
        <div className="admin-field">
          <label className="admin-field-label">Giới hạn key / ngày (Toàn hệ thống)</label>
          <input
            className="admin-input"
            type="number"
            value={settings.daily_global_limit || '3000'}
            onChange={(e) => handleChange('daily_global_limit', e.target.value)}
          />
          <div className="admin-field-hint">Số lượt tối đa toàn bộ người dùng có thể nhận trong 1 ngày (Mặc định: 3000).</div>
        </div>
        <div className="admin-field">
          <label className="admin-field-label">Giới hạn key / ngày (Mỗi IP mạng)</label>
          <input
            className="admin-input"
            type="number"
            value={settings.daily_ip_limit || '2'}
            onChange={(e) => handleChange('daily_ip_limit', e.target.value)}
          />
          <div className="admin-field-hint">Mỗi địa chỉ IP chỉ được nhận tối đa bao nhiêu key mỗi ngày (Mặc định: 2).</div>
        </div>
        <div className="admin-field">
          <label className="admin-field-label">Thời hạn key (tính theo giây)</label>
          <input
            className="admin-input"
            type="number"
            value={settings.key_duration || '86400'}
            onChange={(e) => handleChange('key_duration', e.target.value)}
          />
          <div className="admin-field-hint">Ví dụ: 86400 = 24 giờ (1 ngày), 172800 = 2 ngày, 3600 = 1 giờ.</div>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-title">
          <span className="tag">// SECURITY</span> Mật Khẩu Admin
        </div>
        <div className="admin-field">
          <label className="admin-field-label">Mật khẩu Quản Trị mới</label>
          <input
            className="admin-input"
            type="text"
            value={settings.admin_password || ''}
            onChange={(e) => handleChange('admin_password', e.target.value)}
            placeholder="Nhập mật khẩu mới (để trống nếu giữ nguyên)"
          />
          <div className="admin-field-hint">Bạn có thể đổi mật khẩu đăng nhập Admin trực tiếp tại đây!</div>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-title">
          <span className="tag">// BRAND</span> Thương Hiệu
        </div>
        <div className="admin-field">
          <label className="admin-field-label">Tên thương hiệu</label>
          <input
            className="admin-input"
            value={settings.brand_name || ''}
            onChange={(e) => handleChange('brand_name', e.target.value)}
            placeholder="THANOX STORE"
          />
        </div>
        <div className="admin-field">
          <label className="admin-field-label">Tiêu đề trang</label>
          <input
            className="admin-input"
            value={settings.site_title || ''}
            onChange={(e) => handleChange('site_title', e.target.value)}
            placeholder="GET.KEY // THANOX STORE"
          />
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-title">
          <span className="tag">// SYSTEM</span> Trạng Thái & Thông Báo
        </div>
        <div className="admin-field">
          <label className="admin-field-label">Thông báo (hiển thị cho người dùng)</label>
          <input
            className="admin-input"
            value={settings.announcement || ''}
            onChange={(e) => handleChange('announcement', e.target.value)}
            placeholder="VD: Hệ thống phát key tự động 24/7..."
          />
        </div>
        <div className="admin-field">
          <label className="admin-field-label">Chế độ bảo trì</label>
          <select
            className="admin-input"
            value={settings.maintenance_mode || 'false'}
            onChange={(e) => handleChange('maintenance_mode', e.target.value)}
          >
            <option value="false">Tắt — Hoạt động bình thường</option>
            <option value="true">Bật — Tạm dừng nhận key (Hiện màn hình bảo trì)</option>
          </select>
        </div>
      </div>

      <button className="admin-btn admin-btn-green" onClick={handleSave} disabled={saving}>
        {saving ? 'ĐANG LƯU...' : '💾 LƯU TẤT CẢ CÀI ĐẶT'}
      </button>
      {saveMsg && <div className={`admin-save-status ${saveMsg.type}`}>{saveMsg.text}</div>}
    </>
  );
}

/* ============ Sessions Tab (Live User & Bypass Tracking) ============ */
function SessionsTab({ token, onAuthError }: { token: string; onAuthError: () => void }) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStep, setFilterStep] = useState<string>('all');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const fetchSessions = useCallback(async (isBackground = false) => {
    if (!isBackground) setRefreshing(true);
    const res = await adminApi.getSessions(token, 100);
    if (res.data?.sessions) {
      setSessions((prev) => {
        const map = new Map<string, any>();
        for (const s of prev) {
          if (!s.id?.includes('demo')) map.set(s.id, s);
        }
        for (const s of res.data.sessions) {
          if (!s.id?.includes('demo')) map.set(s.id, s);
        }
        return Array.from(map.values()).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      });
    } else if (res.error?.code === 'UNAUTHORIZED') {
      onAuthError();
    }
    setLoading(false);
    if (!isBackground) setRefreshing(false);
  }, [token, onAuthError]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Auto-refresh interval every 6 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchSessions(true);
    }, 6000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchSessions]);

  const handleClearHistory = async () => {
    if (window.confirm('Bạn có chắc muốn xóa sạch toàn bộ lịch sử theo dõi phiên?')) {
      await adminApi.clearSessions(token);
      setSessions([]);
    }
  };

  const formatTime = (timestamp: number | string) => {
    if (!timestamp) return '—';
    const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatRelativeTime = (timestamp: number | string) => {
    const ts = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime();
    if (!ts || isNaN(ts)) return 'Vừa xong';
    const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    if (diffSec < 10) return '⚡ Vừa xong';
    if (diffSec < 60) return `${diffSec}s trước`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m trước`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h trước`;
    return `${Math.floor(diffHour / 24)}d trước`;
  };

  const filteredSessions = sessions.filter((s) => {
    // Step filter
    if (filterStep === 'step1' && s.step !== 'step1' && s.status !== 'step1_pending') return false;
    if (filterStep === 'step2' && s.step !== 'step2' && s.status !== 'step2_pending') return false;
    if (filterStep === 'completed' && s.step !== 'completed' && s.status !== 'key_ready') return false;

    // Search query filter (IP, city, country, device, isp, statusLabel)
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    const matchIp = (s.ip || '').toLowerCase().includes(q);
    const matchCity = (s.city || '').toLowerCase().includes(q);
    const matchCountry = (s.country || '').toLowerCase().includes(q);
    const matchDevice = (s.device || '').toLowerCase().includes(q);
    const matchIsp = (s.isp || '').toLowerCase().includes(q);
    const matchStatus = (s.statusLabel || s.overall_status || '').toLowerCase().includes(q);
    return matchIp || matchCity || matchCountry || matchDevice || matchIsp || matchStatus;
  });

  const countStep1 = sessions.filter(s => s.step === 'step1' || s.status === 'step1_pending').length;
  const countStep2 = sessions.filter(s => s.step === 'step2' || s.status === 'step2_pending').length;
  const countDone = sessions.filter(s => s.step === 'completed' || s.status === 'key_ready').length;

  return (
    <>
      {/* Live Summary Bar */}
      <div className="admin-stats-grid" style={{ marginBottom: '1rem' }}>
        <div className="admin-stat-card" style={{ padding: '0.9rem 0.5rem' }}>
          <div className="admin-stat-value" style={{ fontSize: '1.4rem' }}>{sessions.length}</div>
          <div className="admin-stat-label">👥 TỔNG PHIÊN</div>
        </div>
        <div className="admin-stat-card yellow" style={{ padding: '0.9rem 0.5rem' }}>
          <div className="admin-stat-value" style={{ fontSize: '1.4rem' }}>{countStep1}</div>
          <div className="admin-stat-label">🟡 ĐANG VƯỢT LINK 1</div>
        </div>
        <div className="admin-stat-card magenta" style={{ padding: '0.9rem 0.5rem' }}>
          <div className="admin-stat-value" style={{ fontSize: '1.4rem' }}>{countStep2}</div>
          <div className="admin-stat-label">🚀 ĐANG Ở SERVERKEY</div>
        </div>
        <div className="admin-stat-card green" style={{ padding: '0.9rem 0.5rem' }}>
          <div className="admin-stat-value" style={{ fontSize: '1.4rem' }}>{countDone}</div>
          <div className="admin-stat-label">✅ ĐÃ LẤY KEY XONG</div>
        </div>
      </div>

      {/* Cyber Live GPS Map */}
      <LiveMap 
        sessions={sessions} 
        selectedSessionId={selectedSessionId} 
        onSelectSession={(id) => setSelectedSessionId(id)} 
      />

      <div className="admin-section" style={{ padding: '1.25rem' }}>
        {/* Header & Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '1.2rem' }}>
          <div>
            <div className="admin-section-title" style={{ marginBottom: '0.2rem' }}>
              <span className="tag">// LIVE TRACKING</span> THEO DÕI NGƯỜI DÙNG VƯỢT LINK
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>
              Xem trực tiếp: Ai truy cập (IP, Thiết bị) • Ở đâu (Thành phố, Quốc gia, Mạng) • Đang ở bước nào
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: autoRefresh ? '#00ff88' : 'rgba(255,255,255,0.4)', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                style={{ accentColor: '#00ff88', cursor: 'pointer' }}
              />
              Tự động cập nhật (6s)
            </label>

            <button
              className="admin-logout-btn"
              style={{ color: 'var(--neon-cy)', borderColor: 'rgba(0,240,255,0.4)', padding: '0.35rem 0.75rem' }}
              onClick={() => fetchSessions()}
              disabled={refreshing}
            >
              {refreshing ? '⏳ Đang tải...' : '🔄 Làm mới'}
            </button>

            {sessions.length > 0 && (
              <button
                className="admin-logout-btn"
                style={{ color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.15)', padding: '0.35rem 0.65rem' }}
                onClick={handleClearHistory}
                title="Xóa danh sách lịch sử này"
              >
                🗑️ Xóa
              </button>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <input
              type="text"
              className="admin-input"
              style={{ padding: '0.55rem 0.8rem', fontSize: '0.78rem' }}
              placeholder="🔍 Tìm theo IP, thành phố (Hà Nội, HCM...), thiết bị (iPhone, Android)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'step1', label: '🟡 Link 1' },
              { id: 'step2', label: '🚀 ServerKey' },
              { id: 'completed', label: '✅ Nhận Key' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterStep(f.id)}
                style={{
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  background: filterStep === f.id ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255,255,255,0.04)',
                  color: filterStep === f.id ? '#00f0ff' : 'rgba(255,255,255,0.6)',
                  border: filterStep === f.id ? '1px solid #00f0ff' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '2.5rem' }}>
            Đang tải dữ liệu người dùng trực tiếp...
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ minWidth: 95 }}>Thời Gian</th>
                  <th style={{ minWidth: 110 }}>Địa Chỉ IP</th>
                  <th style={{ minWidth: 160 }}>Ở Đâu (Vị Trí & Mạng)</th>
                  <th style={{ minWidth: 140 }}>Ai (Thiết Bị)</th>
                  <th style={{ minWidth: 80 }}>Gói Key</th>
                  <th style={{ minWidth: 170 }}>Đang Vượt Như Nào</th>
                  <th style={{ minWidth: 130 }}>Bản Đồ / GPS</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map((s) => {
                  const pType = (s.proxyType || s.proxy_type || '').toLowerCase();
                  const isDone = s.step === 'completed' || s.status === 'key_ready' || s.overall_status === 'key_ready';
                  const isStep2 = s.step === 'step2' || s.status === 'step2_pending' || s.overall_status === 'step2_pending';
                  const isStep1 = s.step === 'step1' || s.step === 'step1_done' || s.status === 'step1_pending' || s.overall_status === 'step1_pending';
                  
                  let badgeClass = 'created';
                  let statusText = s.statusLabel || s.overall_status || '⚡ Mới vào web';
                  if (isDone) {
                    badgeClass = 'key_ready';
                    statusText = s.statusLabel || '✅ Đã nhận Key thành công';
                  } else if (isStep2) {
                    badgeClass = 'step2_pending';
                    statusText = s.statusLabel || '🚀 Đang ở ServerKey';
                  } else if (isStep1) {
                    badgeClass = 'step1_pending';
                    statusText = s.statusLabel || (s.step === 'step1_done' ? '🟢 Đã vượt xong Link 1' : '🟡 Đang vượt Link 1 (Admin)');
                  } else if (s.step === 'selected') {
                    badgeClass = 'type_selected';
                    statusText = s.statusLabel || '📱 Đã chọn gói Key';
                  }

                  const devIcon = s.deviceIcon || (s.device?.toLowerCase().includes('iphone') ? '📱' : s.device?.toLowerCase().includes('android') ? '🤖' : '💻');
                  const locationStr = s.location || (s.city ? `🇻🇳 ${s.city}, ${s.country || 'VN'}` : (s.country ? `🌐 ${s.country}` : '🇻🇳 Việt Nam'));

                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {/* 1. Time */}
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ color: '#fff', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'monospace' }}>
                          {formatTime(s.updatedAt || s.created_at)}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.68rem', marginTop: '2px' }}>
                          {formatRelativeTime(s.updatedAt || s.created_at)}
                        </div>
                      </td>

                      {/* 2. IP */}
                      <td>
                        <div style={{ fontFamily: 'monospace', color: '#00f0ff', fontSize: '0.78rem', fontWeight: 600 }}>
                          {s.ip || '127.0.0.1'}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', fontFamily: 'monospace' }}>
                          ID: {(s.id || '').slice(0, 10)}
                        </div>
                      </td>

                      {/* 3. Location & ISP */}
                      <td>
                        <div style={{ fontWeight: 600, color: '#e0e6ed', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {locationStr}
                        </div>
                        {s.isp ? (
                          <div style={{ color: '#a0aec0', fontSize: '0.68rem', marginTop: '2px' }}>
                            🏢 {s.isp}
                          </div>
                        ) : (
                          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.68rem' }}>
                            🌐 Mạng nội địa
                          </div>
                        )}
                      </td>

                      {/* 4. Device */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: '#fff' }}>
                          <span>{devIcon}</span>
                          <span style={{ fontWeight: 600 }}>{s.device || 'Thiết bị di động'}</span>
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem', marginTop: '2px' }}>
                          HĐH: {s.os || 'Web Browser'}
                        </div>
                      </td>

                      {/* 5. Proxy Type */}
                      <td>
                        {pType === 'ipa' && (
                          <span className="admin-badge ipa" style={{ fontSize: '0.68rem' }}>
                            📱 IPA (Tweak)
                          </span>
                        )}
                        {pType === 'vpn' && (
                          <span className="admin-badge vpn" style={{ fontSize: '0.68rem' }}>
                            🛡️ VPN (Proxy)
                          </span>
                        )}
                        {!pType && (
                          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem' }}>—</span>
                        )}
                      </td>

                      {/* 6. Current Status & How they are bypassing */}
                      <td>
                        <span className={`admin-badge ${badgeClass} live-pulse`} style={{ fontSize: '0.74rem', padding: '0.3rem 0.65rem' }}>
                          {statusText}
                        </span>
                      </td>

                      {/* 7. GPS & Map Actions */}
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSessionId(s.id);
                              window.scrollTo({ top: 120, behavior: 'smooth' });
                            }}
                            style={{
                              background: 'rgba(0, 240, 255, 0.12)',
                              border: '1px solid rgba(0, 240, 255, 0.4)',
                              color: '#00f0ff',
                              borderRadius: '4px',
                              padding: '3px 7px',
                              fontSize: '0.68rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                              justifyContent: 'center'
                            }}
                          >
                            📍 Xem trên radar
                          </button>
                          {typeof s.lat === 'number' && typeof s.lon === 'number' && (
                            <a
                              href={`https://www.google.com/maps?q=${s.lat},${s.lon}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: 'rgba(255, 255, 255, 0.45)',
                                fontSize: '0.63rem',
                                textAlign: 'center',
                                textDecoration: 'none',
                                fontFamily: 'monospace'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = '#00f0ff')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.45)')}
                            >
                              🌍 Google Maps ({s.lat.toFixed(2)}, {s.lon.toFixed(2)}) ↗
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredSessions.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>
                      {searchTerm ? 'Không tìm thấy phiên nào khớp với từ khóa tìm kiếm' : 'Chưa có người dùng nào truy cập gần đây'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}


