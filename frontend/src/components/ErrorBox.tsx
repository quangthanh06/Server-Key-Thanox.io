import './ErrorBox.css';

interface ErrorBoxProps {
  error: { code: string; message: string } | null;
  onDismiss?: () => void;
}

export function ErrorBox({ error, onDismiss }: ErrorBoxProps) {
  if (!error) return null;

  return (
    <div id="errorBox" className="error-box show error">
      <span>⚠ {error.message}</span>
      {onDismiss && (
        <button className="pk-error-dismiss" onClick={onDismiss} aria-label="Đóng">✕</button>
      )}
    </div>
  );
}
