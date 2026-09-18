import { useState, useMemo } from 'react';
import './GuideCard.css';

interface GuideCardProps {
  videoIpaUrl?: string | null;
  videoVpnUrl?: string | null;
}

function parseVideoSource(rawUrl?: string | null): { type: 'youtube' | 'video' | 'link'; url: string } | null {
  if (!rawUrl || !rawUrl.trim()) return null;
  const url = rawUrl.trim();

  // YouTube match: standard, youtu.be, embed, shorts
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      url: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0`
    };
  }

  // Direct MP4 / WebM / OGG video
  if (/\.(mp4|webm|ogg)($|\?)/i.test(url)) {
    return {
      type: 'video',
      url
    };
  }

  return {
    type: 'link',
    url
  };
}

export function GuideCard({ videoIpaUrl, videoVpnUrl }: GuideCardProps) {
  const [activeTab, setActiveTab] = useState<'ipa' | 'vpn'>('ipa');

  // Read local settings fallback
  const localSettings = useMemo(() => {
    try {
      const s = localStorage.getItem('thanox_settings');
      return s ? JSON.parse(s) : {};
    } catch {
      return {};
    }
  }, []);

  const rawUrl = activeTab === 'ipa' 
    ? (videoIpaUrl || localSettings.guide_video_ipa || null)
    : (videoVpnUrl || localSettings.guide_video_vpn || null);

  const videoSource = useMemo(() => parseVideoSource(rawUrl), [rawUrl]);

  return (
    <div className="pk-card pk-guide-card">
      <div className="pk-card-header">
        <span className="pk-card-tag">// HƯỚNG DẪN CHI TIẾT</span>
        <span className="pk-card-title">Cách Kích Hoạt Key</span>
      </div>

      <div className="pk-guide-tabs">
        <button
          className={`pk-guide-tab-btn ${activeTab === 'ipa' ? 'active' : ''}`}
          onClick={() => setActiveTab('ipa')}
          type="button"
        >
          📱 PROXY IPA (Tweak iOS)
        </button>
        <button
          className={`pk-guide-tab-btn ${activeTab === 'vpn' ? 'active' : ''}`}
          onClick={() => setActiveTab('vpn')}
          type="button"
        >
          🛡️ PROXY VPN (Shadowrocket)
        </button>
      </div>

      {/* Video Hướng Dẫn (Nếu Admin đã cấu hình link video) */}
      {videoSource && (
        <div className="pk-guide-video-block">
          <div className="pk-guide-video-header">
            <span className="pk-video-badge">
              <span className="pk-video-dot"></span>
              VIDEO HƯỚNG DẪN {activeTab.toUpperCase()}
            </span>
          </div>

          {videoSource.type === 'youtube' ? (
            <div className="pk-video-responsive">
              <iframe
                src={videoSource.url}
                title={`Video Hướng Dẫn Proxy ${activeTab.toUpperCase()}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          ) : videoSource.type === 'video' ? (
            <div className="pk-video-responsive">
              <video controls playsInline preload="metadata" className="pk-video-player">
                <source src={videoSource.url} type="video/mp4" />
                Trình duyệt không hỗ trợ phát trực tiếp video này.
              </video>
            </div>
          ) : (
            <a 
              href={videoSource.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="pk-video-link-btn"
            >
              <span>🎬 Bấm Để Xem Video Hướng Dẫn {activeTab.toUpperCase()}</span>
              <span>↗</span>
            </a>
          )}
        </div>
      )}

      {activeTab === 'ipa' ? (
        <div className="pk-guide-list">
          <div className="pk-guide-item">
            <div className="pk-guide-num">1</div>
            <div className="pk-guide-content">
              <strong>Cài đặt bản IPA Free Fire:</strong>
              <p>Tải và cài đặt file IPA Free Fire kèm Tweak qua các công cụ ký chứng chỉ uy tín như <b>TrollStore, Scarlet, Esign</b> hoặc Sideloadly.</p>
            </div>
          </div>
          <div className="pk-guide-item">
            <div className="pk-guide-num">2</div>
            <div className="pk-guide-content">
              <strong>Vượt link lấy mã Key:</strong>
              <p>Hoàn thành Bước 1 và Bước 2 trên THANOX STORE để được cấp mã <b>Key Proxy IPA 24 Giờ</b>.</p>
            </div>
          </div>
          <div className="pk-guide-item">
            <div className="pk-guide-num">3</div>
            <div className="pk-guide-content">
              <strong>Dán key kích hoạt trong game:</strong>
              <p>Mở Free Fire, chạm vào biểu tượng Menu Tweak hiển thị trên màn hình → Dán mã Key vừa sao chép → Nhấn <b>Kích Hoạt</b> để bắt đầu chơi.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="pk-guide-list">
          <div className="pk-guide-item">
            <div className="pk-guide-num">1</div>
            <div className="pk-guide-content">
              <strong>Tải ứng dụng Proxy:</strong>
              <p>Cài đặt ứng dụng <b>Shadowrocket</b>, <b>V2Ray</b> hoặc Karing trên App Store hoặc TestFlight.</p>
            </div>
          </div>
          <div className="pk-guide-item">
            <div className="pk-guide-num">2</div>
            <div className="pk-guide-content">
              <strong>Lấy Key Proxy VPN 24 Giờ:</strong>
              <p>Thực hiện vượt 2 bước trên hệ thống để nhận mã Key bản quyền VPN tốc độ cao.</p>
            </div>
          </div>
          <div className="pk-guide-item">
            <div className="pk-guide-num">3</div>
            <div className="pk-guide-content">
              <strong>Cấu hình & Kết nối:</strong>
              <p>Mở Shadowrocket → Thêm máy chủ Proxy VIP → Dán mã Key vào ô <b>Password / Token</b> → Gạt công tắc BẬT VPN và vào game chiến mượt mà.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
