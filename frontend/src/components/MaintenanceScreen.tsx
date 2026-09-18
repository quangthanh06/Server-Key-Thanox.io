import './MaintenanceScreen.css';

interface MaintenanceScreenProps {
  zaloPhone?: string;
}

export function MaintenanceScreen({ zaloPhone = '0889696810' }: MaintenanceScreenProps) {
  return (
    <div className="pk-maint-card">
      <div className="pk-maint-icon">🛡️</div>
      <h2 className="pk-maint-title">HỆ THỐNG ĐANG BẢO TRÌ</h2>
      <p className="pk-maint-desc">
        Hệ thống tạm dừng cấp key để nâng cấp server và tối ưu hoá đường truyền Proxy VIP.
        Vui lòng quay lại sau ít phút!
      </p>

      <div className="pk-maint-zalo-box">
        <div className="pk-maint-zalo-label">HỖ TRỢ TRỰC TIẾP QUA ZALO ADMIN</div>
        <div className="pk-maint-zalo-phone">{zaloPhone}</div>
        <a 
          href={`https://zalo.me/${zaloPhone}`} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="pk-maint-zalo-btn"
        >
          💬 LIÊN HỆ ZALO NGAY ({zaloPhone})
        </a>
      </div>
    </div>
  );
}
