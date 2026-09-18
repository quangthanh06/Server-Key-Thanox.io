import { useState, useEffect } from 'react';
import './OnlineCounter.css';

interface OnlineCounterProps {
  todayKeys?: number;
}

export function OnlineCounter({ todayKeys = 588 }: OnlineCounterProps) {
  const [onlineCount, setOnlineCount] = useState(() => Math.floor(135 + Math.random() * 25));

  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCount((prev) => {
        const delta = Math.floor(Math.random() * 7) - 3;
        const next = prev + delta;
        if (next < 125) return 128;
        if (next > 195) return 190;
        return next;
      });
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="pk-online-counter">
      <div className="pk-online-left">
        <span className="pk-online-dot"></span>
        <span className="pk-online-text">
          <b>{onlineCount}</b> người đang online nhận key
        </span>
      </div>
      <div className="pk-online-badge">
        🔥 Đã cấp <b>{todayKeys > 0 ? todayKeys : 588}</b> key
      </div>
    </div>
  );
}
