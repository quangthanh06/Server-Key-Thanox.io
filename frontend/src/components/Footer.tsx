import './Footer.css';

export function Footer() {
  const handleAdminClick = () => {
    window.location.hash = '#/admin';
  };

  return (
    <div className="footer">
      <span 
        onClick={handleAdminClick} 
        style={{ cursor: 'pointer' }}
        title="Admin Panel"
      >
        //SERVERKEY • v2.4
      </span>
      &nbsp;|&nbsp;
      <a href="https://dtnshop.io.vn/" target="_blank" rel="noopener noreferrer">
        PROXYVIPVN
      </a>
    </div>
  );
}
