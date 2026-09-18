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
    if (isLoading) return '⏳ Đang tạo link...';
    if (textOverride) return textOverride;
    if (proxyType === 'ipa') return '⚡ TẠO LINK NHẬN KEY PROXY IPA';
    if (proxyType === 'vpn') return '⚡ TẠO LINK NHẬN KEY PROXY VPN';
    return '⚡ TẠO LINK NHẬN KEY PROXY IPA';
  };

  return (
    <button 
      type="button"
      className="btn-main"
      id="getBtn"
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      {getText()}
    </button>
  );
}
