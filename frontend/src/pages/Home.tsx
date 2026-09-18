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
  const [completedSteps, setCompletedSteps] = useState(0);
  const [activeBypassUrl, setActiveBypassUrl] = useState('');

  const bypassLinks = (state.stats?.bypassLinks && state.stats.bypassLinks.length > 0)
    ? state.stats.bypassLinks
    : (state.stats?.step1BypassUrl
      ? [{ id: '1', title: 'Máy chủ xác thực 1', url: state.stats.step1BypassUrl, passcode: state.stats.step1Passcode || '' }]
      : []);

  const totalBypassSteps = bypassLinks.length;
  const currentLink = bypassLinks[currentStepIndex] || bypassLinks[0];

  // Auto-detect completed step on page load (from ?done=1 or ?step=2 or localStorage)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const doneParam = params.get('done');
      const stepParam = params.get('step');

      let doneVal = 0;
      if (doneParam) {
        doneVal = parseInt(doneParam, 10) || 0;
      } else if (stepParam) {
        doneVal = (parseInt(stepParam, 10) || 1) - 1;
      } else {
        const saved = localStorage.getItem('thanox_done_step');
        if (saved) doneVal = parseInt(saved, 10) || 0;
      }

      if (doneVal > 0 && totalBypassSteps > 0) {
        setCompletedSteps(doneVal);
        const nextStep = Math.min(doneVal, totalBypassSteps - 1);
        setCurrentStepIndex(nextStep);
        if (doneVal < totalBypassSteps) {
          const nextLink = bypassLinks[nextStep];
          setActiveBypassUrl(nextLink?.url || '');
        }
      }
    } catch (_) {}
  }, [totalBypassSteps]);

  const isIpLimitReached = Boolean(
    state.stats && 
    state.stats.ipLimit > 0 && 
    state.stats.ipUsed >= state.stats.ipLimit
  );

  const handleActionClick = () => {
    if (isIpLimitReached) return;

    // If user has already completed all steps, go straight to ServerKey
    if (completedSteps >= totalBypassSteps && totalBypassSteps > 0) {
      try { localStorage.removeItem('thanox_done_step'); } catch (_) {}
      actions.completeStep1AndStartStep2();
      setCompletedSteps(0);
      setCurrentStepIndex(0);
      return;
    }

    if (state.status === 'created' || state.status === 'type_selected') {
      if (totalBypassSteps === 0) {
        window.open('https://serveripa.proxyvip.click/getkey', '_blank', 'noopener,noreferrer');
        return;
      }

      const targetStep = completedSteps > 0 ? Math.min(completedSteps, totalBypassSteps - 1) : 0;
      setCurrentStepIndex(targetStep);
      const targetLink = bypassLinks[targetStep];
      const targetUrl = targetLink?.url || state.stats?.step1BypassUrl || 'https://thanoxstorebot.shop/?step=1';
      setActiveBypassUrl(targetUrl);
      actions.startBypass(targetUrl, targetStep, totalBypassSteps, targetLink?.title);
    } else if (state.status === 'step1_pending') {
      const requiredPasscode = currentLink?.passcode?.trim();
      if (requiredPasscode && passcode.trim() !== requiredPasscode) {
        alert(`Mã xác nhận Bước ${currentStepIndex + 1} chưa chính xác! Vui lòng hoàn thành vượt link để lấy mã xác nhận.`);
        return;
      }

      const newDone = currentStepIndex + 1;
      setCompletedSteps(newDone);
      try { localStorage.setItem('thanox_done_step', String(newDone)); } catch (_) {}

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
        try { localStorage.removeItem('thanox_done_step'); } catch (_) {}
        actions.completeStep1AndStartStep2();
        setCurrentStepIndex(0);
        setCompletedSteps(0);
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

    if (completedSteps >= totalBypassSteps && totalBypassSteps > 0) {
      return `🚀 ĐÃ XONG TẤT CẢ BƯỚC → NHẬN KEY TẠI SERVERKEY`;
    }
    
    if (state.status === 'created' || state.status === 'type_selected') {
      const typeLabel = (state.proxyType || 'ipa').toUpperCase();
      if (completedSteps > 0 && completedSteps < totalBypassSteps) {
        return `⚡ TIẾP TỤC VƯỢT LINK ${completedSteps + 1} (BƯỚC ${completedSteps + 1}/${totalBypassSteps})`;
      }
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
              
              {/* Step Completion Notice Banner when user finished a step */}
              {completedSteps > 0 && totalBypassSteps > 0 && (
                <div className="step-success-box">
                  <div className="step-success-title">
                    <span style={{ fontSize: '1.15rem' }}>🎉</span>
                    <span>ĐÃ VƯỢT XONG BƯỚC {completedSteps}/{totalBypassSteps}!</span>
                  </div>
                  <p className="step-success-text">
                    {state.stats?.stepSuccessMsg
                      ? state.stats.stepSuccessMsg
                          .replace('{step}', String(completedSteps))
                          .replace('{total}', String(totalBypassSteps))
                      : `Bạn đã vượt xong ${completedSteps} bước rồi! Hãy bấm nút bên dưới để tiếp tục vượt Bước ${Math.min(completedSteps + 1, totalBypassSteps)}.`}
                  </p>
                  <div className="step-progress-row">
                    {bypassLinks.map((_, i) => (
                      <div key={i} className={`step-dot ${i < completedSteps ? 'done' : i === completedSteps ? 'current' : 'todo'}`}>
                        <span>{i < completedSteps ? '✓' : i + 1}</span>
                        <label>{i < completedSteps ? `Xong ${i + 1}` : `Bước ${i + 1}`}</label>
                      </div>
                    ))}
                    <div className={`step-dot ${completedSteps >= totalBypassSteps ? 'done' : 'todo'}`}>
                      <span>🔑</span>
                      <label>ServerKey</label>
                    </div>
                  </div>
                </div>
              )}

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
