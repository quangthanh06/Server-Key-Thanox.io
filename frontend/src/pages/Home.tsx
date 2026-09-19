import { useState } from 'react';
import { useSession } from '../state/useSession';
import { Header } from '../components/Header';
import { AnnouncementBanner } from '../components/AnnouncementBanner';
import { MaintenanceScreen } from '../components/MaintenanceScreen';
import { LimitReachedCard } from '../components/LimitReachedCard';
import { Card } from '../components/Card';
import { TypeSelector } from '../components/TypeSelector';
import { PackageInfo } from '../components/PackageInfo';
import { SessionInfo } from '../components/SessionInfo';
import { Footer } from '../components/Footer';
import { ProxyType } from '../types';

export function Home() {
  const { state, actions } = useSession();
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [btnText, setBtnText] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const proxyType: ProxyType = state.proxyType || 'ipa';

  const isIpLimitReached = Boolean(
    state.stats && 
    state.stats.ipLimit > 0 && 
    state.stats.ipUsed >= state.stats.ipLimit
  );

  // Switch proxy type (IPA / VPN) — resets result and button text
  const handleSelectType = (type: ProxyType) => {
    actions.selectType(type);
    setCreatedUrl(null);
    setBtnText(null);
    setToastMsg(null);
  };

  // Main CTA button click: doGetKey (matching reference site getkey.js)
  const doGetKey = async () => {
    if (isIpLimitReached || isGenerating) return;

    setCreatedUrl(null);
    setToastMsg(null);
    setIsGenerating(true);

    try {
      const res = await fetch('/api/getkey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyType: proxyType, sessionId: state.sessionId })
      });
      const data = await res.json();
      setIsGenerating(false);

      const targetUrl = data?.url || data?.data?.url || state.stats?.step1BypassUrl || 'https://layma.net/RwlXK7AH6';

      if (data && (data.ok || data.success) && targetUrl) {
        setCreatedUrl(targetUrl);
        setBtnText('✓ ĐÃ TẠO — LẤY THÊM');

        // Smooth scroll to result box on mobile
        setTimeout(() => {
          try {
            document.getElementById('resultBox')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } catch (_) {}
        }, 100);

        // Auto open link in new tab
        try {
          const win = window.open(targetUrl, '_blank', 'noopener,noreferrer');
          if (!win) {
            setToastMsg({ text: 'Trình duyệt chặn popup. Nhấn vào nút "VƯỢT LINK NGAY" bên dưới để mở link.', isError: false });
          }
        } catch (_) {
          setToastMsg({ text: 'Không thể tự động mở tab mới. Nhấn nút bên dưới để mở link.', isError: false });
        }
      } else {
        setToastMsg({ text: (data && (data.msg || data.error?.message)) || 'Đã xảy ra lỗi, vui lòng thử lại.', isError: true });
      }
    } catch (err: any) {
      setIsGenerating(false);
      setToastMsg({ text: 'Lỗi kết nối máy chủ: ' + (err?.message || err), isError: true });
    }
  };

  const getMainButtonText = () => {
    if (isGenerating) return '⏳ Đang tạo link...';
    if (isIpLimitReached) {
      const waitTime = state.stats?.resetFormatted || 'vài tiếng';
      return `🚫 ĐÃ HẾT LƯỢT HÔM NAY (QUAY LẠI SAU ${waitTime.toUpperCase()})`;
    }
    if (btnText) return btnText;
    if (proxyType === 'ipa') return '⚡ TẠO LINK NHẬN KEY PROXY IPA';
    if (proxyType === 'vpn') return '⚡ TẠO LINK NHẬN KEY PROXY VPN';
    return '⚡ TẠO LINK NHẬN KEY PROXY IPA';
  };

  const isMaintenance = Boolean(state.stats?.maintenanceMode);

  return (
    <div className="wrap">
      <Header />

      {/* Admin Announcement Banner (if configured) */}
      {state.stats?.announcement && (
        <AnnouncementBanner message={state.stats.announcement} />
      )}
      
      {/* Maintenance Mode Screen with Admin Zalo */}
      {isMaintenance ? (
        <MaintenanceScreen zaloPhone={state.stats?.adminZalo || '0889696810'} />
      ) : (
        <>
          {/* Limit Reached Notice with Live Countdown */}
          {isIpLimitReached && (
            <LimitReachedCard stats={state.stats} onResetTimeReached={actions.loadStats} />
          )}

          {/* Main Card — Nhận Key Miễn Phí */}
          <Card title="Nhận Key Miễn Phí" tag="// FREE KEY SYSTEM">
            {/* Type Selector (IPA vs VPN) */}
            <TypeSelector 
              selectedType={proxyType} 
              onSelect={handleSelectType}
              disabled={isIpLimitReached || isGenerating}
            />
            
            {/* Package Info — shows 24h key duration & live stats */}
            <PackageInfo proxyType={proxyType} stats={state.stats} />
            
            {/* Result Box (shown after generating link, matching reference site #resultBox) */}
            <div id="resultBox" className={`result-box ${createdUrl ? 'show' : ''}`}>
              <div className="result-label">// LINK ĐÃ SẴN SÀNG</div>
              <div id="resultUrl" className="result-url">
                {createdUrl}
              </div>
              <button 
                type="button" 
                className="btn-main" 
                style={{ marginTop: '0.5rem' }} 
                onClick={() => {
                  if (createdUrl) window.open(createdUrl, '_blank', 'noopener,noreferrer');
                }}
              >
                ⚡ VƯỢT LINK NGAY
              </button>
            </div>

            {/* Error / Toast message */}
            {toastMsg && (
              <div className={`error-box show ${toastMsg.isError ? 'error' : ''}`}>
                {toastMsg.text}
              </div>
            )}

            {/* Loading Overlay */}
            <div className={`loading-overlay ${isGenerating ? 'show' : ''}`}>
              <div className="spinner"></div>
              <div className="loading-text">Đang khởi tạo link...</div>
            </div>

            {/* Main CTA button */}
            <button 
              type="button" 
              className="btn-main" 
              id="getBtn" 
              onClick={doGetKey}
              disabled={isIpLimitReached || isGenerating}
            >
              {getMainButtonText()}
            </button>
          </Card>

          {/* Info Card — Thông Tin */}
          <Card title="Thông Tin" tag="// SESSION.INFO">
            <SessionInfo state={state} />
          </Card>
        </>
      )}

      <Footer />
    </div>
  );
}
