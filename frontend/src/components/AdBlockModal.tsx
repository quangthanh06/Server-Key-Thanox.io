interface AdBlockModalProps {
  onDismiss: () => void;
  onRecheck: () => void;
}

export function AdBlockModal({ onDismiss, onRecheck }: AdBlockModalProps) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(10px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        background: '#0c101c',
        border: '1px solid rgba(245, 158, 11, 0.5)',
        borderRadius: '16px',
        padding: '2rem 1.5rem',
        maxWidth: '460px',
        width: '100%',
        boxShadow: '0 0 40px rgba(245, 158, 11, 0.25)',
        textAlign: 'center',
        color: '#fff'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.8rem' }}>🛡️</div>
        <h3 style={{
          fontFamily: "'Orbitron', monospace",
          color: '#fbbf24',
          fontSize: '1.15rem',
          marginBottom: '0.8rem',
          letterSpacing: '0.04em'
        }}>
          PHÁT HIỆN CHẶN QUẢNG CÁO (ADBLOCK)
        </h3>

        <p style={{
          fontSize: '0.85rem',
          color: 'rgba(255, 255, 255, 0.75)',
          lineHeight: '1.6',
          marginBottom: '1.2rem'
        }}>
          Trình duyệt của bạn đang bật <strong>AdBlock</strong>, <strong>uBlock</strong> hoặc <strong>Brave Shields</strong>.
          Để đảm bảo link xác thực và mã key không bị lỗi kết nối hoặc mất key, vui lòng tạm thời <strong>Tắt AdBlock</strong> cho trang web này.
        </p>

        <div style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px dashed rgba(245, 158, 11, 0.3)',
          borderRadius: '8px',
          padding: '0.75rem',
          fontSize: '0.75rem',
          color: '#fef3c7',
          textAlign: 'left',
          marginBottom: '1.5rem'
        }}>
          <div style={{ fontWeight: 700, marginBottom: '0.3rem' }}>💡 Hướng dẫn nhanh:</div>
          <div>• <strong>Brave Browser:</strong> Bấm vào biểu tượng Khiên màu cam ở thanh địa chỉ → Tắt khiên.</div>
          <div>• <strong>AdBlock / uBlock:</strong> Bấm vào tiện ích mở rộng → Tắt bảo vệ cho trang này.</div>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexDirection: 'column' }}>
          <button
            type="button"
            onClick={onRecheck}
            style={{
              padding: '0.75rem',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              fontFamily: "'Orbitron', monospace"
            }}
          >
            🔄 TÔI ĐÃ TẮT ADBLOCK — KIỂM TRA LẠI
          </button>
          <button
            type="button"
            onClick={onDismiss}
            style={{
              padding: '0.55rem',
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}
          >
            Bỏ qua & Tiếp tục
          </button>
        </div>
      </div>
    </div>
  );
}
