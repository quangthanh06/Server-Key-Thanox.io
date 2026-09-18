import './ResultBox.css';

interface ResultBoxProps {
  bypassUrl: string;
  label?: string;
  buttonText?: string;
}

export function ResultBox({ bypassUrl, label, buttonText }: ResultBoxProps) {
  return (
    <div className="pk-result-box">
      <div className="pk-result-label">{label || '// LINK ĐÃ SẴN SÀNG'}</div>
      <div className="pk-result-url">{bypassUrl}</div>
      <a href={bypassUrl} target="_blank" rel="noopener noreferrer" className="pk-result-btn">
        {buttonText || '⚡ VƯỢT LINK NGAY'}
      </a>
    </div>
  );
}
