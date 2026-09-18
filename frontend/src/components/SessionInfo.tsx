import { SessionState } from '../types';
import './SessionInfo.css';

interface SessionInfoProps {
  state: SessionState;
}

export function SessionInfo({ state }: SessionInfoProps) {
  const { sessionId, stats, status } = state;
  const displayId = sessionId ? `${sessionId.substring(0, 8)}...` : 'Chưa tạo (Sẵn sàng)';
  
  const ipUsed = stats?.ipUsed || 0;
  const ipLimit = stats?.ipLimit || 2;
  const ipLeft = Math.max(0, ipLimit - ipUsed);
  const ipCls = ipLeft > 1 ? 'green' : (ipLeft === 1 ? 'yellow' : 'rose');

  const sysUsed = stats?.dailyUsed || 0;
  const sysLimit = stats?.dailyLimit || 3000;
  const sysLeft = Math.max(0, sysLimit - sysUsed);
  const sysPct = sysLimit > 0 ? (sysUsed / sysLimit) : 0;
  const sysCls = sysPct < 0.5 ? 'green' : (sysPct < 0.8 ? 'yellow' : 'rose');

  const statusMap: Record<string, string> = {
    created: 'Sẵn sàng nhận key',
    type_selected: 'Đã chọn loại proxy',
    step1_pending: 'Đang vượt link 1',
    step1_completed: 'Đã hoàn thành bước 1',
    step2_pending: 'Đang vượt ServerKey',
    step2_completed: 'Sẵn sàng cấp key',
    key_ready: 'Đã nhận key thành công',
    expired: 'Hết hạn',
    blocked: 'Bị khóa'
  };

  const currentStatusText = !sessionId ? 'Sẵn sàng bắt đầu' : (statusMap[status] || status);

  return (
    <div className="stats-bar">
      <div className="stat-row">
        <span className="stat-label">Session ID</span>
        <span className="stat-value">{displayId}</span>
      </div>
      <div className="stat-row">
        <span className="stat-label">Lượt còn lại (IP của bạn)</span>
        <span className={`stat-value stat-value-${ipCls}`}>{ipLeft} / {ipLimit}</span>
      </div>
      <div className="stat-row">
        <span className="stat-label">Key còn lại (Toàn hệ thống)</span>
        <span className={`stat-value stat-value-${sysCls}`}>{sysLeft} / {sysLimit}</span>
      </div>
      <div className="stat-row">
        <span className="stat-label">Trạng thái</span>
        <span className="stat-value" style={{ color: 'var(--neon-cy)' }}>{currentStatusText}</span>
      </div>
      {ipLeft === 0 && (
        <div className="stat-row">
          <span className="stat-label">Lượt mới mở lúc</span>
          <span className="stat-value" style={{ color: 'var(--neon-yl)' }}>
            Sau {stats?.resetFormatted || '00:00 ngày mai'}
          </span>
        </div>
      )}
    </div>
  );
}
