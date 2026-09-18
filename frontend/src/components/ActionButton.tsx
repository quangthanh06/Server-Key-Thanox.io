import { ProxyType } from '../types';
import './ActionButton.css';

interface ActionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  proxyType: ProxyType | null;
  textOverride?: string;
}

export function ActionButton({ onClick, disabled, isLoading, proxyType, textOverride }: ActionButtonProps) {
  const getText = () => {
    if (isLoading) return '⏳ ĐANG XỬ LÝ...';
    if (textOverride) return textOverride;
    if (proxyType === 'ipa') return '⚡ TẠO LINK NHẬN KEY PROXY IPA';
    if (proxyType === 'vpn') return '⚡ TẠO LINK NHẬN KEY PROXY VPN';
    return '⚡ CHỌN LOẠI PROXY';
  };

  return (
    <button 
      className="pk-action-btn"
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      <span className="pk-action-btn-text">{getText()}</span>
      <div className="pk-action-btn-glow"></div>
    </button>
  );
}
