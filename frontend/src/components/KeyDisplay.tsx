import { useState, useEffect } from 'react';
import { ProxyType, SystemStats } from '../types';
import './KeyDisplay.css';

interface KeyDisplayProps {
  keyValue: string;
  expiresAt: string;
  proxyType: ProxyType;
  stats?: SystemStats | null;
  onReset?: () => void;
}

export function KeyDisplay({ keyValue, expiresAt, proxyType, stats, onReset }: KeyDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');

  // Live countdown timer supporting hours
  useEffect(() => {
    const updateCountdown = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Đã hết hạn');
        return;
      }
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      if (hours > 0) {
        setTimeLeft(`${hours}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`);
      } else {
        setTimeLeft(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(keyValue);
      } else {
        const ta = document.createElement('textarea');
        ta.value = keyValue;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert('Không thể sao chép tự động. Vui lòng sao chép thủ công:\n\n' + keyValue);
    }
  };

  const isIpa = proxyType === 'ipa';

  return (
    <div className="pk-card pk-key-card">
      <div className="pk-success-wrap">
        <div className="pk-success-icon">🎉</div>
        <h2 className="pk-success-msg">KÍCH HOẠT THÀNH CÔNG!</h2>
        <p className="pk-success-sub">Mã key của bạn đã sẵn sàng sử dụng (Thời hạn 24 Giờ)</p>
      </div>

      {copied && (
        <div className="pk-copied-msg show">
          ✓ ĐÃ SAO CHÉP MÃ KEY VÀO BỘ NHỚ TẠM
        </div>
      )}

      <div className="pk-key-box" onClick={handleCopy} title="Nhấn để sao chép key">
        <div className="pk-key-text">{keyValue}</div>
        <div className="pk-copy-hint">CHẠM ĐỂ SAO CHÉP KEY</div>
      </div>

      <div className="pk-countdown-wrap">
        <span className="pk-countdown-label">⏱️ THỜI GIAN CÒN LẠI:</span>
        <span className="pk-countdown-time">{timeLeft || '24:00:00'}</span>
      </div>

      <div className="pk-info-grid">
        <div className="pk-info-item">
          <div className="pk-info-label">Loại Proxy</div>
          <div className="pk-info-value" style={{ color: isIpa ? 'var(--neon-cy)' : 'var(--neon-mg)' }}>
            {isIpa ? 'PROXY IPA' : 'PROXY VPN'}
          </div>
        </div>
        <div className="pk-info-item">
          <div className="pk-info-label">Thời Hạn</div>
          <div className="pk-info-value" style={{ color: 'var(--neon-yl)' }}>24 Giờ</div>
        </div>
        <div className="pk-info-item">
          <div className="pk-info-label">Trạng Thái</div>
          <div className="pk-info-value green">Active</div>
        </div>
        <div className="pk-info-item">
          <div className="pk-info-label">Hết Hạn Lúc</div>
          <div className="pk-info-value">
            {new Date(expiresAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} {new Date(expiresAt).toLocaleDateString('vi-VN')}
          </div>
        </div>
      </div>

      {stats && stats.ipLimit > 0 && stats.ipUsed >= stats.ipLimit ? (
        <div style={{
          marginTop: '1.25rem',
          padding: '0.85rem 1rem',
          background: 'rgba(255, 61, 138, 0.1)',
          border: '1px solid rgba(255, 61, 138, 0.45)',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ color: 'var(--neon-pk)', fontWeight: 700, fontSize: '0.82rem' }}>
            ⚠️ BẠN ĐÃ DÙNG HẾT {stats.ipUsed}/{stats.ipLimit} LƯỢT HÔM NAY
          </div>
          <div style={{ margin: '5px 0 0', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            Lượt mới sẽ tự động mở lại sau <b>{stats.resetFormatted || '00:00 ngày mai'}</b>.
          </div>
        </div>
      ) : onReset && (
        <button 
          onClick={onReset}
          className="pk-action-btn"
          style={{ 
            marginTop: '1.25rem', 
            background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)', 
            borderColor: 'var(--border-cy)', 
            color: '#fff' 
          }}
          type="button"
        >
          🔄 NHẬN THÊM KEY KHÁC
        </button>
      )}
    </div>
  );
}
