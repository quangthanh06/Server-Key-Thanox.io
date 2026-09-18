import './LoadingOverlay.css';

interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
}

export function LoadingOverlay({ isLoading, text }: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div id="loadingBox" className="loading-overlay show">
      <div className="spinner"></div>
      <div className="loading-text">{text || 'Đang khởi tạo link...'}</div>
    </div>
  );
}
