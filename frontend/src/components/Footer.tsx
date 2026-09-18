import './Footer.css';

export function Footer() {
  const handleAdminClick = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
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
      <a 
        href="#/admin" 
        onClick={handleAdminClick}
        style={{ cursor: 'pointer' }}
        title="Admin Panel"
      >
        PROXYVIPVN
      </a>
    </div>
  );
}
