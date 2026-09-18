import './AnnouncementBanner.css';

interface AnnouncementBannerProps {
  message: string;
}

export function AnnouncementBanner({ message }: AnnouncementBannerProps) {
  if (!message || !message.trim()) return null;

  return (
    <div className="pk-announcement">
      <div className="pk-announcement-badge">
        <span className="pk-announcement-dot" />
        <span>THÔNG BÁO</span>
      </div>
      <div className="pk-announcement-text">{message}</div>
    </div>
  );
}
