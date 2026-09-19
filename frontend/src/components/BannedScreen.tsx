interface BannedScreenProps {
  zaloPhone?: string;
}

export function BannedScreen({ zaloPhone = '0889696810' }: BannedScreenProps) {
  return (
    <div style={{
      background: 'rgba(20, 10, 20, 0.85)',
      border: '1px solid rgba(255, 0, 55, 0.4)',
      borderRadius: '16px',
      padding: '2.5rem 1.5rem',
      textAlign: 'center',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 0 35px rgba(255, 0, 55, 0.25)',
      margin: '2rem 0'
    }}>
      <div style={{ fontSize: '3.5rem', marginBottom: '1rem', animation: 'bounce 2s infinite' }}>🚫</div>
      <h2 style={{
        fontFamily: "'Orbitron', monospace",
        color: '#ff3366',
        fontSize: '1.4rem',
        marginBottom: '0.8rem',
        letterSpacing: '0.05em'
      }}>
        ĐỊA CHỈ IP ĐÃ BỊ CẤM (BANNED)
      </h2>
      <p style={{
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '0.9rem',
        lineHeight: '1.6',
        maxWidth: '480px',
        margin: '0 auto 1.5rem auto'
      }}>
        Hệ thống an ninh phát hiện thiết bị hoặc địa chỉ IP của bạn có dấu hiệu bất thường, vượt link tự động hoặc vi phạm điều khoản dịch vụ. Quyền nhận key của bạn đã tạm thời bị khóa.
      </p>

      <div style={{
        background: 'rgba(255, 0, 55, 0.08)',
        border: '1px solid rgba(255, 0, 55, 0.25)',
        borderRadius: '12px',
        padding: '1.25rem',
        maxWidth: '400px',
        margin: '0 auto'
      }}>
        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
          YÊU CẦU MỞ CẤM / KHIẾU NẠI QUA ZALO ADMIN
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: '1.2rem', color: '#ff3366', fontWeight: 700, marginBottom: '0.8rem' }}>
          {zaloPhone}
        </div>
        <a 
          href={`https://zalo.me/${zaloPhone}`} 
          target="_blank" 
          rel="noopener noreferrer" 
          style={{
            display: 'inline-block',
            width: '100%',
            padding: '0.75rem',
            background: 'linear-gradient(135deg, rgba(255, 0, 55, 0.3), rgba(255, 0, 55, 0.1))',
            border: '1px solid #ff0037',
            color: '#fff',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '0.85rem',
            fontFamily: "'Orbitron', monospace",
            boxSizing: 'border-box'
          }}
        >
          💬 LIÊN HỆ ADMIN ĐỂ MỞ CẤM
        </a>
      </div>
    </div>
  );
}
