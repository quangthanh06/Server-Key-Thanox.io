import './Footer.css';

export function Footer() {
  const handleAdminClick = () => {
    window.location.hash = '#/admin';
  };

  return (
    <footer className="pk-footer">
      <div className="pk-footer-content">
        <span 
          className="pk-footer-admin-link"
          onClick={handleAdminClick}
          title="Quản trị viên"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleAdminClick()}
        >
          © 2026 THANOX STORE
        </span>
        <span className="pk-footer-dot">•</span>
        <span>Hệ Thống Nhận Key Proxy Miễn Phí</span>
      </div>
    </footer>
  );
}
