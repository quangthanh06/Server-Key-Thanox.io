import { useState, useEffect } from 'react';
import { ProxyType, SystemStats } from '../types';
import './PackageInfo.css';

interface PackageInfoProps {
  proxyType: ProxyType;
  stats: SystemStats | null;
}

/**
 * Animated number counter component for motion numbers
 */
function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const end = value;
    if (end === 0) {
      setDisplay(0);
      return;
    }
    const duration = 900;
    const startTime = performance.now();

    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(ease * end);
      setDisplay(current);
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        setDisplay(end);
      }
    };

    const id = requestAnimationFrame(update);
    return () => cancelAnimationFrame(id);
  }, [value]);

  return <span className="pk-animated-num">{display}</span>;
}

export function PackageInfo({ proxyType, stats }: PackageInfoProps) {
  const isIpa = proxyType === 'ipa';
  const name = isIpa ? 'KEY FREE PROXY IPA' : 'KEY FREE PROXY VPN';
  const desc = isIpa 
    ? 'Dùng cho bản cài IPA / Tweak iOS Free Fire' 
    : 'Dùng cho Server V2 / MITM / Shadowrocket';

  const used = stats?.dailyUsed || 0;
  const limit = stats?.dailyLimit || 3000;
  const ipUsed = stats?.ipUsed || 0;
  const ipLimit = stats?.ipLimit || 2;
  
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  let cls = 'green';
  if (pct >= 80) cls = 'rose';
  else if (pct >= 50) cls = 'yellow';

  const ipLeft = Math.max(0, ipLimit - ipUsed);
  const ipCls = ipLeft > 1 ? 'green' : (ipLeft === 1 ? 'yellow' : 'rose');

  return (
    <div className="package-card">
      <div className="pkg-head">
        <div className="pkg-icon" id="pkgIcon">
          {isIpa ? '📱' : '🛡️'}
        </div>
        <div style={{ flex: 1 }}>
          <div className="pkg-title-row">
            <div className="pkg-name" id="pkgName">{name}</div>
            <div className="pkg-live-badge">
              <span className="pkg-live-dot"></span> LIVE
            </div>
          </div>
          <div className="pkg-desc" id="pkgDesc">{desc}</div>
        </div>
      </div>

      <div className="pkg-divider"></div>

      <div className="pkg-stats">
        <div className="pkg-stat-col">
          <div className="pkg-stat-label">Thời hạn key</div>
          <div className="pkg-stat-value" style={{ color: 'var(--neon-yl)' }}>24 Giờ</div>
          <div className="pkg-stat-sub">1 Ngày sử dụng</div>
        </div>

        <div className="pkg-stat-col">
          <div className="pkg-stat-label">Đã vượt hôm nay</div>
          <div className={`pkg-stat-value pkg-stat-value-${cls}`}>
            <AnimatedNumber value={used} /> / {limit}
          </div>
          <div className="pkg-stat-sub">Toàn hệ thống</div>
        </div>

        <div className="pkg-stat-col">
          <div className="pkg-stat-label">IP của bạn</div>
          <div className={`pkg-stat-value pkg-stat-value-${ipCls}`}>
            <AnimatedNumber value={ipUsed} /> / {ipLimit}
          </div>
          <div className="pkg-stat-sub">Tối đa 2 lần/ngày</div>
        </div>
      </div>

      <div className="pkg-progress" aria-label="Lượt hệ thống hôm nay">
        <div className="pkg-progress-track">
          <div className={`pkg-progress-bar pkg-progress-${cls}`} style={{ width: `${Math.max(4, pct)}%` }}>
            <div className="pkg-progress-glow"></div>
          </div>
        </div>
        <div className="pkg-progress-footer">
          <span className="pkg-progress-text">
            Đã có <b>{used}</b> người vượt link hôm nay ({limit - used} key còn lại)
          </span>
          <span className="pkg-progress-pct">{pct}%</span>
        </div>
      </div>
    </div>
  );
}
