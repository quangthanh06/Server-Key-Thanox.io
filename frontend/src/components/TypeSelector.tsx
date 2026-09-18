import { ProxyType } from '../types';
import './TypeSelector.css';

interface TypeSelectorProps {
  selectedType: ProxyType | null;
  onSelect: (type: ProxyType) => void;
  disabled?: boolean;
}

export function TypeSelector({ selectedType, onSelect, disabled }: TypeSelectorProps) {
  return (
    <div className="type-selector-wrap">
      <div className="type-selector-label">// CHỌN LOẠI PROXY</div>
      <div className="type-selector-grid">
        <button 
          type="button" 
          className={`type-btn ${selectedType === 'ipa' ? 'active' : ''}`} 
          id="typeBtnIpa" 
          onClick={() => onSelect('ipa')}
          disabled={disabled}
        >
          <div className="type-btn-icon">📱</div>
          <div className="type-btn-info">
            <div className="type-btn-name">PROXY IPA</div>
            <div className="type-btn-tag">Bản Cài / Tweak</div>
          </div>
          <div className="type-check-badge">✓</div>
        </button>

        <button 
          type="button" 
          className={`type-btn ${selectedType === 'vpn' ? 'active' : ''}`} 
          id="typeBtnVpn" 
          onClick={() => onSelect('vpn')}
          disabled={disabled}
        >
          <div className="type-btn-icon">🛡️</div>
          <div className="type-btn-info">
            <div className="type-btn-name">PROXY VPN</div>
            <div className="type-btn-tag">Server V2 / MITM</div>
          </div>
          <div className="type-check-badge">✓</div>
        </button>
      </div>
    </div>
  );
}
