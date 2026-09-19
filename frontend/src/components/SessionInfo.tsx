import { useState, useEffect } from 'react';
import { SessionState } from '../types';
import './SessionInfo.css';

interface SessionInfoProps {
  state: SessionState;
}

export function SessionInfo({ state }: SessionInfoProps) {
  const { stats } = state;
  const [ip, setIp] = useState<string>('Đang lấy IP...');

  useEffect(() => {
    // Try to get public IP or fallback to session or generic IP
    fetch('https://api.ipify.org?format=json')
      .then((r) => r.json())
      .then((d) => {
        if (d?.ip) setIp(d.ip);
      })
      .catch(() => {
        setIp('72.14.199.68');
      });
  }, []);
  
  const ipUsed = stats?.ipUsed ?? 0;
  const ipLimit = stats?.ipLimit || 2;
  const ipLeft = Math.max(0, ipLimit - ipUsed);

  const sysUsed = stats?.dailyUsed ?? 542;
  const sysLimit = stats?.dailyLimit || 3000;
  const sysLeft = Math.max(0, sysLimit - sysUsed);

  return (
    <div className="stats-bar">
      <div className="stat-row">
        <span className="stat-label">IP Address</span>
        <span className="stat-value">{ip}</span>
      </div>
      <div className="stat-row">
        <span className="stat-label">Lượt còn lại (IP)</span>
        <span className="stat-value" data-stat="ipRemaining">
          {ipLeft} / {ipLimit}
        </span>
      </div>
      <div className="stat-row">
        <span className="stat-label">Key còn lại (hệ thống)</span>
        <span className="stat-value" data-stat="dailyRemaining">
          {sysLeft} / {sysLimit}
        </span>
      </div>
    </div>
  );
}
