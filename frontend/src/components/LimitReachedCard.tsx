import { useState, useEffect } from 'react';
import { SystemStats } from '../types';
import './LimitReachedCard.css';

interface LimitReachedCardProps {
  stats: SystemStats | null;
  onResetTimeReached?: () => void;
}

function getSecondsToVnMidnight(): number {
  const now = new Date();
  const vnMs = now.getTime() + 7 * 3600 * 1000;
  const vnDate = new Date(vnMs);
  const dateString = vnDate.toISOString().split('T')[0];
  const [y, m, d] = dateString.split('-').map(Number);
  const nextMidnightUtcMs = Date.UTC(y, m - 1, d + 1, 0, 0, 0) - 7 * 3600 * 1000;
  return Math.max(0, Math.floor((nextMidnightUtcMs - now.getTime()) / 1000));
}

export function LimitReachedCard({ stats, onResetTimeReached }: LimitReachedCardProps) {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    return stats?.resetSeconds !== undefined && stats.resetSeconds > 0 
      ? stats.resetSeconds 
      : getSecondsToVnMidnight();
  });

  useEffect(() => {
    if (stats?.resetSeconds !== undefined && stats.resetSeconds > 0) {
      setRemainingSeconds(stats.resetSeconds);
    }
  }, [stats?.resetSeconds]);

  useEffect(() => {
    if (remainingSeconds <= 0) {
      if (onResetTimeReached) onResetTimeReached();
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onResetTimeReached) onResetTimeReached();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds, onResetTimeReached]);

  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  const ipUsed = stats?.ipUsed ?? 2;
  const ipLimit = stats?.ipLimit ?? 2;

  return (
    <div className="pk-card pk-limit-card">
      <div className="pk-limit-badge">// THÔNG BÁO GIỚI HẠN IP</div>
      
      <div className="pk-limit-head">
        <div className="pk-limit-icon">⏳</div>
        <div className="pk-limit-title-wrap">
          <h3 className="pk-limit-title">ĐÃ ĐẠT GIỚI HẠN HÔM NAY ({ipUsed}/{ipLimit})</h3>
          <p className="pk-limit-sub">Địa chỉ IP của bạn đã dùng hết {ipLimit} lượt tạo key trong ngày</p>
        </div>
      </div>

      <div className="pk-limit-timer-container">
        <div className="pk-limit-timer-label">
          <span className="pk-limit-pulse-dot"></span>
          THỜI GIAN MỞ LẠI LƯỢT MỚI:
        </div>

        <div className="pk-limit-clock-grid">
          <div className="pk-clock-col">
            <span className="pk-clock-digit">{pad(hours)}</span>
            <span className="pk-clock-unit">GIỜ</span>
          </div>
          <span className="pk-clock-sep">:</span>
          <div className="pk-clock-col">
            <span className="pk-clock-digit">{pad(minutes)}</span>
            <span className="pk-clock-unit">PHÚT</span>
          </div>
          <span className="pk-clock-sep">:</span>
          <div className="pk-clock-col">
            <span className="pk-clock-digit">{pad(seconds)}</span>
            <span className="pk-clock-unit">GIÂY</span>
          </div>
        </div>

        <div className="pk-limit-reset-hint">
          ⏱️ Hệ thống sẽ tự động cấp lại <b>{ipLimit} lượt mới</b> vào <b>00:00:00 ngày mai</b>.
        </div>
      </div>

      <div className="pk-limit-footer">
        <span className="pk-limit-help-text">Cần nhận thêm key gấp hoặc hỗ trợ?</span>
        <a 
          href="https://zalo.me/0889696810" 
          target="_blank" 
          rel="noopener noreferrer"
          className="pk-limit-zalo-btn"
        >
          💬 LIÊN HỆ ZALO ADMIN (0889696810)
        </a>
      </div>
    </div>
  );
}
