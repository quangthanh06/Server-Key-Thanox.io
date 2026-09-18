import { useState, useEffect } from 'react';
import { useSession } from '../state/useSession';
import { api } from '../api/endpoints';
import { Header } from '../components/Header';
import { AnnouncementBanner } from '../components/AnnouncementBanner';
import { MaintenanceScreen } from '../components/MaintenanceScreen';
import { LimitReachedCard } from '../components/LimitReachedCard';
import { Card } from '../components/Card';
import { TypeSelector } from '../components/TypeSelector';
import { PackageInfo } from '../components/PackageInfo';
import { ResultBox } from '../components/ResultBox';
import { ErrorBox } from '../components/ErrorBox';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { ActionButton } from '../components/ActionButton';
import { SessionInfo } from '../components/SessionInfo';
import { Footer } from '../components/Footer';

export function Home() {
  const { state, actions } = useSession();
  const [bypassCooldown, setBypassCooldown] = useState(0);

  // Anti-cheat cooldown: 15s timer when entering step1 or step2
  useEffect(() => {
    if (state.status === 'step1_pending' || state.status === 'step2_pending') {
      setBypassCooldown(15);
    } else {
      setBypassCooldown(0);
    }
  }, [state.status]);

  useEffect(() => {
    if (bypassCooldown <= 0) return;
    const timer = setInterval(() => {
      setBypassCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [bypassCooldown]);

  const [passcode, setPasscode] = useState('');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [activeBypassUrl, setActiveBypassUrl] = useState('');

  const bypassLinks = (state.stats?.bypassLinks && state.stats.bypassLinks.length > 0)
    ? state.stats.bypassLinks
    : (state.stats?.step1BypassUrl
      ? [{ id: '1', title: 'Máy chủ xác thực 1', url: state.stats.step1BypassUrl, passcode: state.stats.step1Passcode || '' }]
      : []);

  const totalBypassSteps = bypassLinks.length;
  const currentLink = bypassLinks[currentStepIndex] || bypassLinks[0];

  const isIpLimitReached = Boolean(
    state.stats && 
    state.stats.ipLimit > 0 && 
    state.stats.ipUsed >= state.stats.ipLimit
  );

  const handleActionClick = () => {
    if (isIpLimitReached) return;

    if (state.status === 'created' || state.status === 'type_selected') {
      if (totalBypassSteps === 0) {
        window.open('https://serveripa.proxyvip.click/getkey', '_blank', 'noopener,noreferrer');
        return;
      }
      setCurrentStepIndex(0);
      const firstLink = bypassLinks[0];
      const targetUrl = firstLink?.url || state.stats?.step1BypassUrl || 'https://thanoxstorebot.shop/?step=1';
      setActiveBypassUrl(targetUrl);
      actions.startBypass(targetUrl, 0, totalBypassSteps, firstLink?.title);
    } else if (state.status === 'step1_pending') {
      const requiredPasscode = currentLink?.passcode?.trim();
      if (requiredPasscode && passcode.trim() !== requiredPasscode) {
        alert(`Mã xác nhận Bước ${currentStepIndex + 1} chưa chính xác! Vui lòng hoàn thành vượt link để lấy mã xác nhận.`);
        return;
      }

      if (currentStepIndex < totalBypassSteps - 1) {
        const nextIdx = currentStepIndex + 1;
        const nextLink = bypassLinks[nextIdx];
        const nextUrl = nextLink?.url || 'https://thanoxstorebot.shop/?step=1';
        setCurrentStepIndex(nextIdx);
        setActiveBypassUrl(nextUrl);
        setPasscode('');
        setBypassCooldown(10);

        if (state.sessionId) {
          api.completeBypass(state.sessionId, currentStepIndex, false).catch(() => {});
          api.startBypass(state.sessionId, nextIdx, totalBypassSteps, nextLink?.title).catch(() => {});
        }

        try {
          window.open(nextUrl, '_blank', 'noopener,noreferrer');
        } catch (_) {}
      } else {
        if (state.sessionId) {
          api.completeBypass(state.sessionId, currentStepIndex, true).catch(() => {});
        }
        actions.completeStep1AndStartStep2();
        setCurrentStepIndex(0);
        setPasscode('');
        setActiveBypassUrl('');
      }
    }
  };

  const getButtonText = () => {
    if (state.isLoading) return '⏳ Đang kết nối máy chủ...';

    if (isIpLimitReached) {
      const waitTime = state.stats?.resetFormatted || 'vài tiếng';
      return `🚫 ĐÃ HẾT LƯỢT HÔM NAY (QUAY LẠI SAU ${waitTime.toUpperCase()})`;
    }
    
    if (state.status === 'created' || state.status === 'type_selected') {
      const typeLabel = (state.proxyType || 'ipa').toUpperCase();
      if (totalBypassSteps > 1) {
        return `⚡ BẮT ĐẦU XÁC MINH (BƯỚC 1/${totalBypassSteps}) • ${typeLabel}`;
      }
      return `⚡ TẠO LINK NHẬN KEY PROXY ${typeLabel}`;
    }

    if (state.status === 'step1_pending') {
      if (bypassCooldown > 0) {
        return `⏳ ĐANG XÁC THỰC BƯỚC ${currentStepIndex + 1}/${totalBypassSteps} (${bypassCooldown}s)...`;
      }
      if (currentStepIndex < totalBypassSteps - 1) {
        return `✓ ĐÃ XONG BƯỚC ${currentStepIndex + 1} → SANG BƯỚC ${currentStepIndex + 2}/${totalBypassSteps}`;
      }
      return `🚀 HOÀN TẤT XÁC MINH → CẤP PHÁT KEY (SERVERKEY)`;
    }
    return undefined;
  };

  // Selector is disabled when actively in bypass, key ready, or when IP limit reached
  const isSelectorDisabled = isIpLimitReached || ['step1_pending', 'step2_pending', 'key_ready'].includes(state.status);
  
  // Action button is disabled during loading, key ready, IP limit reached, or during the 15s anti-cheat cooldown
  const isActionDisabled = isIpLimitReached || state.status === 'key_ready' || state.isLoading || bypassCooldown > 0;
  
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
          {isIpLimitReached && state.status !== 'key_ready' && (
            <LimitReachedCard stats={state.stats} onResetTimeReached={actions.loadStats} />
          )}

          {state.status !== 'key_ready' && (
            <Card title="Nhận Key Miễn Phí" tag="// FREE KEY SYSTEM">
              <LoadingOverlay isLoading={state.isLoading} />

              {/* Type Selector (IPA vs VPN) */}
              <TypeSelector 
                selectedType={state.proxyType} 
                onSelect={actions.selectType}
                disabled={isSelectorDisabled}
              />
              
              {/* Package Info — shows 24h key duration & live stats */}
              {state.proxyType && <PackageInfo proxyType={state.proxyType} stats={state.stats} />}
              
              {/* Step 1..N: Multi-step Bypass Links */}
              {state.status === 'step1_pending' && (
                <>
                  <ResultBox 
                    bypassUrl={activeBypassUrl || state.bypassUrl || currentLink?.url || ''} 
                    label={totalBypassSteps > 1 ? `// MÁY CHỦ XÁC THỰC LỚP ${currentStepIndex + 1}/${totalBypassSteps}` : '// LINK XÁC THỰC THIẾT BỊ'}
                    buttonText={`⚡ MỞ LINK XÁC THỰC BƯỚC ${currentStepIndex + 1}`}
                  />

                  {currentLink?.passcode && (
                    <div style={{
                      marginTop: '1rem',
                      padding: '0.85rem 1rem',
                      background: 'rgba(0, 240, 255, 0.05)',
                      border: '1px solid rgba(0, 240, 255, 0.25)',
                      borderRadius: '8px',
                      textAlign: 'left'
                    }}>
                      <div style={{ color: 'var(--neon-cy)', fontWeight: 700, fontSize: '0.75rem', marginBottom: '0.35rem' }}>
                        🔒 XÁC MINH BƯỚC {currentStepIndex + 1}:
                      </div>
                      <div style={{ color: 'var(--text-dim)', fontSize: '0.72rem', marginBottom: '0.6rem', lineHeight: '1.4' }}>
                        Vui lòng hoàn thành vượt link ở tab vừa mở. Nếu bạn có <b>Mã Xác Nhận</b> ở trang đích, hãy nhập vào đây:
                      </div>
                      <input 
                        type="text"
                        placeholder={`Nhập mã xác nhận Bước ${currentStepIndex + 1}...`}
                        value={passcode}
                        onChange={(e) => setPasscode(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.55rem 0.75rem',
                          background: 'rgba(5, 10, 25, 0.8)',
                          border: '1px solid rgba(0, 240, 255, 0.3)',
                          borderRadius: '6px',
                          color: '#fff',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.85rem',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  )}
                </>
              )}


              
              <ErrorBox error={state.error} onDismiss={actions.clearError} />
              
              <ActionButton 
                onClick={handleActionClick}
                disabled={isActionDisabled}
                isLoading={state.isLoading}
                proxyType={state.proxyType}
                textOverride={getButtonText()}
              />
            </Card>
          )}

          <Card title="Thông Tin" tag="// SESSION.INFO">
            <SessionInfo state={state} />
          </Card>
        </>
      )}

      <Footer />
    </div>
  );
}
