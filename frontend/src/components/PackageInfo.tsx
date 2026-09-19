import { ProxyType, SystemStats } from '../types';
import './PackageInfo.css';

interface PackageInfoProps {
  proxyType: ProxyType;
  stats: SystemStats | null;
}

export function PackageInfo({ proxyType, stats }: PackageInfoProps) {
  const isIpa = proxyType === 'ipa';
  const name = isIpa ? 'KEY FREE PROXY IPA' : 'KEY FREE PROXY VPN';
  const desc = isIpa 
    ? 'Dùng cho bản cài IPA / Tweak iOS Free Fire' 
    : 'Dùng cho hệ thống Proxy Server V2 (Kích hoạt Web / App)';
  const icon = isIpa ? '📱' : '🛡️';

  const used = stats?.dailyUsed ?? 542;
  const limit = stats?.dailyLimit || 3000;
  const ipUsed = stats?.ipUsed ?? 0;
  const ipLimit = stats?.ipLimit || 2;
  
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 18;

  return (
    <div className="package-card">
      <div className="pkg-head">
        <div className="pkg-icon" id="pkgIcon">{icon}</div>
        <div>
          <div className="pkg-name" id="pkgName">{name}</div>
          <div className="pkg-desc" id="pkgDesc">{desc}</div>
        </div>
      </div>
      <div className="pkg-divider"></div>
      <div className="pkg-stats">
        <div>
          <div className="pkg-stat-label">Thời hạn key</div>
          <div className="pkg-stat-value">1 Giờ</div>
        </div>
        <div>
          <div className="pkg-stat-label">Hôm nay</div>
          <div className="pkg-stat-value" data-stat="dailyUsed">
            {used} / {limit}
          </div>
        </div>
        <div>
          <div className="pkg-stat-label">IP này</div>
          <div className="pkg-stat-value">
            {ipUsed} / {ipLimit}
          </div>
        </div>
      </div>
      <div className="pkg-progress" aria-label="Lượt hệ thống hôm nay">
        <div className="pkg-progress-bar" style={{ width: `${pct}%` }}></div>
        <div className="pkg-progress-text">Đã dùng {pct}% — {used}/{limit} key hôm nay</div>
      </div>
    </div>
  );
}
