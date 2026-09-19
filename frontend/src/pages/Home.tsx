import { useState, useEffect } from 'react';
import { useSession } from '../state/useSession';
import { Header } from '../components/Header';
import { AnnouncementBanner } from '../components/AnnouncementBanner';
import { MaintenanceScreen } from '../components/MaintenanceScreen';
import { BannedScreen } from '../components/BannedScreen';
import { AdBlockModal } from '../components/AdBlockModal';
import { LimitReachedCard } from '../components/LimitReachedCard';
import { Card } from '../components/Card';
import { TypeSelector } from '../components/TypeSelector';
import { PackageInfo } from '../components/PackageInfo';
import { SessionInfo } from '../components/SessionInfo';
import { Footer } from '../components/Footer';
import { ProxyType } from '../types';
import { detectAdBlock } from '../utils/adblockDetector';
import '../components/ActionButton.css';
import '../components/ResultBox.css';
import '../components/LoadingOverlay.css';
import '../components/ErrorBox.css';

export function Home() {
  const { state, actions } = useSession();
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [btnText, setBtnText] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [hasAdBlock, setHasAdBlock] = useState(false);
  const [showAdBlockModal, setShowAdBlockModal] = useState(false);
  const [adBlockDismissed, setAdBlockDismissed] = useState(false);

  useEffect(() => {
    detectAdBlock().then((blocked) => {
      if (blocked) setHasAdBlock(true);
    });

    // Capture precise device GPS coordinates if permitted
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (pos.coords?.latitude && pos.coords?.longitude) {
            fetch('/api/session/gps', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId: state.sessionId,
                lat: pos.coords.latitude,
                lon: pos.coords.longitude,
                accuracy: pos.coords.accuracy
              })
            }).catch(() => {});
          }
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    }
  }, [state.sessionId]);

  const handleRecheckAdBlock = async () => {
    const blocked = await detectAdBlock();
    setHasAdBlock(blocked);
    if (!blocked) {
      setShowAdBlockModal(false);
      setToastMsg({ text: '✓ Đã phát hiện AdBlock đã tắt. Bạn có thể tiếp tục!', isError: false });
    } else {
      alert('Vẫn còn tiện ích chặn quảng cáo hoạt động. Vui lòng tắt hoặc tải lại trang.');
    }
  };

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

    if (hasAdBlock && !adBlockDismissed) {
      setShowAdBlockModal(true);
      return;
    }

    setCreatedUrl(null);
    setToastMsg(null);
    setIsGenerating(true);

    // Synchronously create window reference to prevent browser popup blockers
    let popupWindow: Window | null = null;
    try {
      popupWindow = window.open('about:blank', '_blank');
    } catch (_) {
      popupWindow = null;
    }

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

        // Auto open link in pre-opened tab
        if (popupWindow && !popupWindow.closed) {
          try {
            popupWindow.location.href = targetUrl;
          } catch (_) {
            window.open(targetUrl, '_blank', 'noopener,noreferrer');
          }
        } else {
          // If popup window was blocked
          const win = window.open(targetUrl, '_blank', 'noopener,noreferrer');
          if (!win) {
            setToastMsg({ text: 'Trình duyệt chặn popup. Nhấn vào nút "VƯỢT LINK NGAY" bên dưới để mở link.', isError: false });
            setTimeout(() => setToastMsg(null), 4000);
          }
        }
      } else {
        if (popupWindow && !popupWindow.closed) popupWindow.close();
        setToastMsg({ text: (data && (data.msg || data.error?.message)) || 'Đã xảy ra lỗi, vui lòng thử lại.', isError: true });
      }
    } catch (err: any) {
      if (popupWindow && !popupWindow.closed) popupWindow.close();
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
  const isBanned = state.error?.code === 'IP_BANNED';

  return (
    <div className="wrap">
      <Header />

      {/* Admin Announcement Banner (if configured) */}
      {state.stats?.announcement && (
        <AnnouncementBanner message={state.stats.announcement} />
      )}
      
      {/* Banned IP Screen */}
      {isBanned ? (
        <BannedScreen zaloPhone={state.stats?.adminZalo || '0889696810'} />
      ) : isMaintenance ? (
        /* Maintenance Mode Screen with Admin Zalo */
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
            {createdUrl && (
              <div id="resultBox" className="result-box show">
                <div className="result-label">// LINK ĐÃ SẴN SÀNG</div>
                <div id="resultUrl" className="result-url">
                  {createdUrl}
                </div>
                <button 
                  type="button" 
                  className="btn-main" 
                  style={{ marginTop: '0.5rem' }} 
                  onClick={() => {
                    window.open(createdUrl, '_blank', 'noopener,noreferrer');
                  }}
                >
                  ⚡ VƯỢT LINK NGAY
                </button>
              </div>
            )}

            {/* Error / Toast message */}
            {toastMsg && (
              <div className={`error-box show ${toastMsg.isError ? 'error' : ''}`}>
                {toastMsg.text}
              </div>
            )}

            {/* Loading Overlay */}
            {isGenerating && (
              <div id="loadingBox" className="loading-overlay show">
                <div className="spinner"></div>
                <div className="loading-text">Đang khởi tạo link...</div>
              </div>
            )}

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

      {/* AdBlock Modal Warning */}
      {showAdBlockModal && (
        <AdBlockModal 
          onDismiss={() => { setShowAdBlockModal(false); setAdBlockDismissed(true); }}
          onRecheck={handleRecheckAdBlock}
        />
      )}

      <Footer />
    </div>
  );
}
