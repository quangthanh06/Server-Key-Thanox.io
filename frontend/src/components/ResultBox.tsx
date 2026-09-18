import './ResultBox.css';

interface ResultBoxProps {
  bypassUrl: string;
  label?: string;
  buttonText?: string;
}

export function ResultBox({ bypassUrl, label, buttonText }: ResultBoxProps) {
  const handleOpen = () => {
    window.open(bypassUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div id="resultBox" className="result-box show">
      <div className="result-label">{label || '// LINK ĐÃ SẴN SÀNG'}</div>
      <div id="resultUrl" className="result-url">
        {bypassUrl}
      </div>
      <button 
        type="button" 
        className="btn-main" 
        style={{ marginTop: '0.5rem' }}
        onClick={handleOpen}
      >
        {buttonText || '⚡ VƯỢT LINK NGAY'}
      </button>
    </div>
  );
}
