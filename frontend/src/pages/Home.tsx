import { useState, useEffect } from 'react';
import { useSession } from '../state/useSession';
import { Header } from '../components/Header';
import { AnnouncementBanner } from '../components/AnnouncementBanner';
import { MaintenanceScreen } from '../components/MaintenanceScreen';
import { LimitReachedCard } from '../components/LimitReachedCard';
import { Card } from '../components/Card';
import { StepsTracker } from '../components/StepsTracker';
import { TypeSelector } from '../components/TypeSelector';
import { PackageInfo } from '../components/PackageInfo';
import { ResultBox } from '../components/ResultBox';
import { ErrorBox } from '../components/ErrorBox';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { ActionButton } from '../components/ActionButton';
import { KeyDisplay } from '../components/KeyDisplay';
import { SessionInfo } from '../components/SessionInfo';
import { GuideCard } from '../components/GuideCard';
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

  const isIpLimitReached = Boolean(
    state.stats && 
    state.stats.ipLimit > 0 && 
    state.stats.ipUsed >= state.stats.ipLimit
  );

  const handleActionClick = () => {
    if (isIpLimitReached) return;

    if (state.status === 'created' || state.status === 'type_selected') {
      // Step 1: Start Link 1 bypass
      actions.startBypass();
    } else if (state.status === 'step1_pending') {
      // Step 1 done: Calls ServerKey (serveripa.proxyvip.click/api/getkey)
      actions.completeStep1AndStartStep2();
    } else if (state.status === 'step2_pending' || state.status === 'step2_completed') {
      // Step 2 done: Claims the final key
      actions.completeStep2AndClaimKey();
    }
  };

  const getButtonText = () => {
    if (state.isLoading) return '⏳ ĐANG XỬ LÝ...';

    if (isIpLimitReached) {
      const waitTime = state.stats?.resetFormatted || 'vài tiếng';
      return `🚫 ĐÃ HẾT LƯỢT HÔM NAY (QUAY LẠI SAU ${waitTime.toUpperCase()})`;
    }
    
    if (state.status === 'created' || state.status === 'type_selected') {
      const typeLabel = (state.proxyType || 'ipa').toUpperCase();
      return `⚡ BƯỚC 1: TẠO LINK VƯỢT PROXY ${typeLabel}`;
    }
    if (state.status === 'step1_pending') {
      if (bypassCooldown > 0) {
        return `⏳ ĐANG VƯỢT LINK 1 (${bypassCooldown}s)...`;
      }
      return '✓ TIẾP TỤC QUA BƯỚC 2 (SERVERKEY)';
    }
    if (state.status === 'step2_pending' || state.status === 'step2_completed') {
      if (bypassCooldown > 0) {
        return `⏳ ĐANG VƯỢT SERVERKEY (${bypassCooldown}s)...`;
      }
      return '🔑 BẤM ĐỂ LẤY KEY';
    }
    return undefined;
  };

  // Selector is disabled when actively in bypass, key ready, or when IP limit reached
  const isSelectorDisabled = isIpLimitReached || ['step1_pending', 'step2_pending', 'key_ready'].includes(state.status);
  
  // Action button is disabled during loading, key ready, IP limit reached, or during the 15s anti-cheat cooldown
  const isActionDisabled = isIpLimitReached || state.status === 'key_ready' || state.isLoading || bypassCooldown > 0;
  
  const isMaintenance = Boolean(state.stats?.maintenanceMode);

  return (
    <div className="pk-wrap">
      <Header />

      {/* Admin Announcement Banner (if configured) */}
      {state.stats?.announcement && (
        <AnnouncementBanner message={state.stats.announcement} />
      )}
      
      {/* Maintenance Mode Screen with Admin Zalo */}
      {isMaintenance ? (
        <MaintenanceScreen zaloPhone="0889696810" />
      ) : (
        <>
          {/* Limit Reached Notice with Live Countdown */}
          {isIpLimitReached && state.status !== 'key_ready' && (
            <LimitReachedCard stats={state.stats} onResetTimeReached={actions.loadStats} />
          )}

          {state.status !== 'key_ready' && (
            <Card title="Nhận Key Proxy" tag="// HỆ THỐNG GET KEY">
              <LoadingOverlay isLoading={state.isLoading} />
              
              {/* Responsive 4-Step Flow Tracker */}
              <StepsTracker status={state.status} />

              {/* Type Selector (IPA vs VPN) */}
              <TypeSelector 
                selectedType={state.proxyType} 
                onSelect={actions.selectType}
                disabled={isSelectorDisabled}
              />
              
              {/* Package Info — shows 24h key duration & live stats */}
              {state.proxyType && <PackageInfo proxyType={state.proxyType} stats={state.stats} />}
              
              {/* Step 1: My Bypass Link */}
              {state.status === 'step1_pending' && state.bypassUrl && (
                <ResultBox 
                  bypassUrl={state.bypassUrl} 
                  label="// BƯỚC 1: LINK VƯỢT ĐÃ SẴN SÀNG"
                  buttonText="⚡ MỞ LINK VƯỢT BƯỚC 1"
                />
              )}

              {/* Step 2: Real ServerKey Link (serveripa.proxyvip.click) */}
              {state.status === 'step2_pending' && state.step2FlowUrl && (
                <ResultBox 
                  bypassUrl={state.step2FlowUrl} 
                  label="// BƯỚC 2: LINK TỪ SERVERKEY ĐÃ SẴN SÀNG"
                  buttonText="⚡ MỞ LINK VƯỢT SERVERKEY NGAY"
                />
              )}
              
              <ErrorBox error={state.error} onDismiss={actions.clearError} />
              
              {/* Main Action CTA Button — with anti-cheat cooldown & clean label */}
              <ActionButton 
                onClick={handleActionClick}
                disabled={isActionDisabled}
                isLoading={state.isLoading}
                proxyType={state.proxyType}
                textOverride={getButtonText()}
              />
            </Card>
          )}

          {/* Final Step: Key Display */}
          {state.status === 'key_ready' && state.key && state.keyExpiresAt && state.proxyType && (
            <KeyDisplay 
              keyValue={state.key} 
              expiresAt={state.keyExpiresAt} 
              proxyType={state.proxyType}
              stats={state.stats}
              onReset={actions.resetFlow}
            />
          )}

          <Card title="Trạng Thái Phiên" tag="// THÔNG TIN HỆ THỐNG">
            <SessionInfo state={state} />
          </Card>

          <GuideCard />
        </>
      )}

      <Footer />
    </div>
  );
}
