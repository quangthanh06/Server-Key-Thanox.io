import { useState } from 'react';
import './GuideCard.css';

export function GuideCard() {
  const [activeTab, setActiveTab] = useState<'ipa' | 'vpn'>('ipa');

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
              <p>Mở Free Fire, chạm vào biểu tượng Menu Tweak hiển thị trên màn hình $\to$ Dán mã Key vừa sao chép $\to$ Nhấn <b>Kích Hoạt</b> để bắt đầu chơi.</p>
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
              <p>Mở Shadowrocket $\to$ Thêm máy chủ Proxy VIP $\to$ Dán mã Key vào ô <b>Password / Token</b> $\to$ Gạt công tắc BẬT VPN và vào game chiến mượt mà.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
