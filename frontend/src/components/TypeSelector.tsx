import { ProxyType } from '../types';
import './TypeSelector.css';

interface TypeSelectorProps {
  selectedType: ProxyType | null;
  onSelect: (type: ProxyType) => void;
  disabled?: boolean;
}

export function TypeSelector({ selectedType, onSelect, disabled }: TypeSelectorProps) {
  return (
    <div className="pk-type-wrap">
      <div className="pk-type-label">// CHỌN PHIÊN BẢN PROXY</div>
      <div className="pk-type-grid">
        <button 
          className={`pk-type-btn ${selectedType === 'ipa' ? 'active' : ''}`}
          onClick={() => onSelect('ipa')}
          disabled={disabled}
          aria-pressed={selectedType === 'ipa'}
          aria-label="Chọn Proxy IPA"
          type="button"
        >
          <span className="pk-type-icon">📱</span>
          <span className="pk-type-info">
            <span className="pk-type-name">PROXY IPA</span>
            <span className="pk-type-tag">Bản Cài / Tweak iOS</span>
          </span>
          {selectedType === 'ipa' && <span className="pk-type-check">✓</span>}
        </button>

        <button 
          className={`pk-type-btn vpn ${selectedType === 'vpn' ? 'active' : ''}`}
          onClick={() => onSelect('vpn')}
          disabled={disabled}
          aria-pressed={selectedType === 'vpn'}
          aria-label="Chọn Proxy VPN"
          type="button"
        >
          <span className="pk-type-icon">🛡️</span>
          <span className="pk-type-info">
            <span className="pk-type-name">PROXY VPN</span>
            <span className="pk-type-tag">Server V2 / Shadowrocket</span>
          </span>
          {selectedType === 'vpn' && <span className="pk-type-check">✓</span>}
        </button>
      </div>
    </div>
  );
}
