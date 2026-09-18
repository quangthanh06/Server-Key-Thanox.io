import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../api/adminApi';
import './Admin.css';

type Tab = 'dashboard' | 'settings' | 'sessions' | 'keys';

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
        {(['dashboard', 'settings', 'sessions', 'keys'] as Tab[]).map((t) => (
          <button
            key={t}
            className={`admin-nav-btn ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'dashboard' && '📊 Tổng quan'}
            {t === 'settings' && '⚙️ Cài đặt'}
            {t === 'sessions' && '👤 Sessions'}
            {t === 'keys' && '🔑 Keys'}
          </button>
        ))}
      </nav>

      {tab === 'dashboard' && <DashboardTab token={token} onAuthError={handleLogout} />}
      {tab === 'settings' && <SettingsTab token={token} onAuthError={handleLogout} />}
      {tab === 'sessions' && <SessionsTab token={token} onAuthError={handleLogout} />}
      {tab === 'keys' && <KeysTab token={token} onAuthError={handleLogout} />}
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
          <div className="admin-stat-label">Keys Hôm Nay</div>
        </div>
        <div className="admin-stat-card magenta">
          <div className="admin-stat-value">{stats.totalKeys}</div>
          <div className="admin-stat-label">Tổng Keys Đã Cấp</div>
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
                <td>Link Vượt Bước 1</td>
                <td style={{ color: '#00f0ff', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{settings.step1_bypass_url || '—'}</td>
              </tr>
              <tr>
                <td>Mã Xác Nhận Bước 1</td>
                <td style={{ color: 'var(--neon-yl)', fontFamily: 'monospace' }}>{settings.step1_passcode || '(Không bắt buộc)'}</td>
              </tr>
              <tr>
                <td>Video Hướng Dẫn IPA</td>
                <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{settings.guide_video_ipa || '(Chưa cấu hình)'}</td>
              </tr>
              <tr>
                <td>Video Hướng Dẫn VPN</td>
                <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{settings.guide_video_vpn || '(Chưa cấu hình)'}</td>
              </tr>
              <tr>
                <td>Số Zalo Hỗ Trợ</td>
                <td style={{ color: '#00ff88' }}>{settings.admin_zalo || '0889696810'}</td>
              </tr>
              <tr>
                <td>Link Tải IPA Free Fire</td>
                <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{settings.download_ipa_url || '(Mặc định Telegram)'}</td>
              </tr>
              <tr>
                <td>Giọng Nói Chào Mừng</td>
                <td><span className={`admin-badge ${settings.welcome_voice_enabled === 'false' ? 'expired' : 'key_ready'}`}>{settings.welcome_voice_enabled === 'false' ? 'TẮT' : 'BẬT (Tự đọc)'}</span></td>
              </tr>
              <tr>
                <td>Nhạc Nền Chill</td>
                <td><span className={`admin-badge ${settings.bg_music_enabled === 'false' ? 'expired' : 'key_ready'}`}>{settings.bg_music_enabled === 'false' ? 'TẮT' : 'BẬT'}</span></td>
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
  const [settings, setSettings] = useState<Record<string, string>>({});
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
    try {
      localStorage.setItem('thanox_settings', JSON.stringify(settings));
    } catch (_) {}

    const res = await adminApi.updateSettings(token, settings);
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
          <span className="tag">// VIDEO</span> Video Hướng Dẫn Kích Hoạt Key
        </div>
        <div className="admin-field">
          <label className="admin-field-label">Link Video Hướng Dẫn PROXY IPA (Tweak iOS)</label>
          <input
            className="admin-input"
            value={settings.guide_video_ipa || ''}
            onChange={(e) => handleChange('guide_video_ipa', e.target.value)}
            placeholder="Dán link YouTube (ví dụ: https://www.youtube.com/watch?v=... hoặc shorts) hoặc link MP4"
          />
          <div className="admin-field-hint">Video này sẽ hiển thị trực tiếp trong mục Hướng Dẫn khi khách bấm vào tab IPA.</div>
        </div>
        <div className="admin-field">
          <label className="admin-field-label">Link Video Hướng Dẫn PROXY VPN (Shadowrocket)</label>
          <input
            className="admin-input"
            value={settings.guide_video_vpn || ''}
            onChange={(e) => handleChange('guide_video_vpn', e.target.value)}
            placeholder="Dán link YouTube hoặc link video MP4"
          />
          <div className="admin-field-hint">Video này sẽ hiển thị trực tiếp khi khách bấm vào tab VPN Shadowrocket.</div>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-title">
          <span className="tag">// DOWNLOAD</span> Nút Tải Trực Tiếp IPA & Shadowrocket
        </div>
        <div className="admin-field">
          <label className="admin-field-label">Link Tải File IPA Free Fire Tweak</label>
          <input
            className="admin-input"
            value={settings.download_ipa_url || ''}
            onChange={(e) => handleChange('download_ipa_url', e.target.value)}
            placeholder="Link Mediafire, Google Drive, Telegram tải file IPA Free Fire"
          />
          <div className="admin-field-hint">Khi khách bấm nút "⚡ TẢI BẢN IPA FREE FIRE TWEAK", sẽ mở link này.</div>
        </div>
        <div className="admin-field">
          <label className="admin-field-label">Link Tải Shadowrocket (VPN)</label>
          <input
            className="admin-input"
            value={settings.download_shadowrocket_url || ''}
            onChange={(e) => handleChange('download_shadowrocket_url', e.target.value)}
            placeholder="Link App Store hoặc file IPA Shadowrocket"
          />
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-title">
          <span className="tag">// VOICE & MUSIC</span> Giọng Nói AI Hướng Dẫn & Nhạc Nền
        </div>
        <div className="admin-field">
          <label className="admin-field-label">Bật Giọng Đọc AI Chào Mừng</label>
          <select
            className="admin-input"
            value={settings.welcome_voice_enabled || 'true'}
            onChange={(e) => handleChange('welcome_voice_enabled', e.target.value)}
          >
            <option value="true">Bật — Tự động đọc lời chào tiếng Việt khi khách vào web</option>
            <option value="false">Tắt — Không đọc giọng nói</option>
          </select>
        </div>
        <div className="admin-field">
          <label className="admin-field-label">Lời Thoại Giọng Đọc (Bạn tự ghi chữ, AI sẽ đọc theo)</label>
          <textarea
            className="admin-input"
            rows={3}
            value={settings.welcome_voice_text || ''}
            onChange={(e) => handleChange('welcome_voice_text', e.target.value)}
            placeholder="Chào mừng các con vợ đã đến với THANOX STORE. Khách mới vào app vui lòng làm theo 2 bước bên trên để nhận key proxy xịn sò. Cách cài đặt và video hướng dẫn chi tiết ở ngay bên dưới nhé. Sau đây mời các con vợ cùng thưởng thức âm nhạc!"
            style={{ resize: 'vertical' }}
          />
          <div className="admin-field-hint">Ghi chữ tiếng Việt có dấu để AI phát âm chuẩn và tự nhiên nhất.</div>
        </div>
        <div className="admin-field">
          <label className="admin-field-label">Bật Nhạc Nền Chill (Tự phát sau khi giọng đọc xong)</label>
          <select
            className="admin-input"
            value={settings.bg_music_enabled || 'true'}
            onChange={(e) => handleChange('bg_music_enabled', e.target.value)}
          >
            <option value="true">Bật — Tự phát nhạc nền chill</option>
            <option value="false">Tắt — Không phát nhạc</option>
          </select>
        </div>
        <div className="admin-field">
          <label className="admin-field-label">Link File Nhạc MP3 Nền</label>
          <input
            className="admin-input"
            value={settings.bg_music_url || ''}
            onChange={(e) => handleChange('bg_music_url', e.target.value)}
            placeholder="Dán link file .mp3 trực tiếp (để trống nếu dùng nhạc chill mặc định)"
          />
          <div className="admin-field-hint">Nhạc sẽ tự động vang lên ngay sau câu kết thúc của giọng đọc!</div>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-title">
          <span className="tag">// BYPASS</span> Link Vượt Bước 1 & Chống Vượt Ảo
        </div>
        <div className="admin-field">
          <label className="admin-field-label">URL Vượt Link Bước 1</label>
          <input
            className="admin-input"
            value={settings.step1_bypass_url || ''}
            onChange={(e) => handleChange('step1_bypass_url', e.target.value)}
            placeholder="https://gtraffic.io/... hoặc linkvertise, go-link, v.v."
          />
          <div className="admin-field-hint">Người dùng phải bấm mở link này ở Bước 1 trước khi được chuyển sang ServerKey.</div>
        </div>
        <div className="admin-field">
          <label className="admin-field-label">Mã Xác Nhận Bước 1 (Passcode Chống Skip Link)</label>
          <input
            className="admin-input"
            value={settings.step1_passcode || ''}
            onChange={(e) => handleChange('step1_passcode', e.target.value)}
            placeholder="Ví dụ: THANOXVIP88 (để trống nếu không bắt buộc nhập mã)"
          />
          <div className="admin-field-hint">Nếu bạn đặt mã này, khách bắt buộc phải nhập đúng mã mới được bấm chuyển qua Bước 2 (ServerKey)!</div>
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

/* ============ Sessions Tab ============ */
function SessionsTab({ token, onAuthError }: { token: string; onAuthError: () => void }) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getSessions(token, 100).then((res) => {
      if (res.data?.sessions) {
        setSessions(res.data.sessions);
      } else if (res.error?.code === 'UNAUTHORIZED') {
        onAuthError();
      }
      setLoading(false);
    });
  }, [token, onAuthError]);

  if (loading) return <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '2rem' }}>Đang tải danh sách sessions...</div>;

  return (
    <div className="admin-section">
      <div className="admin-section-title">
        <span className="tag">// SESSIONS</span> Sessions Gần Đây ({sessions.length})
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Loại Proxy</th>
              <th>Trạng Thái</th>
              <th>Tạo Lúc</th>
              <th>Hết Hạn</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id}>
                <td style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>{s.id.slice(0, 8)}...</td>
                <td>{s.proxy_type ? <span className={`admin-badge ${s.proxy_type}`}>{s.proxy_type.toUpperCase()}</span> : '—'}</td>
                <td><span className={`admin-badge ${s.overall_status}`}>{s.overall_status}</span></td>
                <td>{new Date(s.created_at).toLocaleString('vi-VN')}</td>
                <td>{new Date(s.expires_at).toLocaleString('vi-VN')}</td>
              </tr>
            ))}
            {sessions.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>Chưa có session nào</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============ Keys Tab ============ */
function KeysTab({ token, onAuthError }: { token: string; onAuthError: () => void }) {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getKeys(token, 100).then((res) => {
      if (res.data?.keys) {
        setKeys(res.data.keys);
      } else if (res.error?.code === 'UNAUTHORIZED') {
        onAuthError();
      }
      setLoading(false);
    });
  }, [token, onAuthError]);

  if (loading) return <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '2rem' }}>Đang tải danh sách keys...</div>;

  return (
    <div className="admin-section">
      <div className="admin-section-title">
        <span className="tag">// KEYS</span> Keys Đã Cấp ({keys.length})
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Key</th>
              <th>Loại</th>
              <th>Trạng Thái</th>
              <th>Tạo Lúc</th>
              <th>Hết Hạn</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => (
              <tr key={k.id}>
                <td style={{ fontFamily: 'monospace', color: '#00ff88' }}>{k.key_value}</td>
                <td><span className={`admin-badge ${k.proxy_type}`}>{k.proxy_type.toUpperCase()}</span></td>
                <td><span className={`admin-badge ${k.status}`}>{k.status}</span></td>
                <td>{new Date(k.created_at).toLocaleString('vi-VN')}</td>
                <td>{new Date(k.expires_at).toLocaleString('vi-VN')}</td>
              </tr>
            ))}
            {keys.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>Chưa có key nào được cấp</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
