import './LoadingOverlay.css';

interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
}

export function LoadingOverlay({ isLoading, text }: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div className="pk-loading">
      <div className="pk-spinner"></div>
      <div className="pk-loading-text">{text || 'Đang xử lý...'}</div>
    </div>
  );
}
