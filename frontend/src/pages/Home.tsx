import { useState, useEffect } from 'react';
import { useSession } from '../state/useSession';
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
      const requiredPasscode = state.stats?.step1Passcode?.trim();
      if (requiredPasscode && passcode.trim() !== requiredPasscode) {
        alert('Mã xác nhận chưa chính xác! Vui lòng hoàn thành vượt link 1 để lấy mã xác nhận.');
        return;
      }
      // Step 1 done: Calls ServerKey (serveripa.proxyvip.click/api/getkey)
      actions.completeStep1AndStartStep2();
    }
  };

  const getButtonText = () => {
    if (state.isLoading) return '⏳ Đang tạo link...';

    if (isIpLimitReached) {
      const waitTime = state.stats?.resetFormatted || 'vài tiếng';
      return `🚫 ĐÃ HẾT LƯỢT HÔM NAY (QUAY LẠI SAU ${waitTime.toUpperCase()})`;
    }
    
    if (state.status === 'created' || state.status === 'type_selected') {
      const typeLabel = (state.proxyType || 'ipa').toUpperCase();
      return `⚡ TẠO LINK NHẬN KEY PROXY ${typeLabel}`;
    }
    if (state.status === 'step1_pending') {
      if (bypassCooldown > 0) {
        return `⏳ ĐANG VƯỢT LINK 1 (${bypassCooldown}s)...`;
      }
      return '✓ ĐÃ VƯỢT XONG LINK 1 → LẤY KEY TẠI SERVERKEY';
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
              
              {/* Step 1: My Bypass Link */}
              {state.status === 'step1_pending' && state.bypassUrl && (
                <>
                  <ResultBox 
                    bypassUrl={state.bypassUrl} 
                    label="// LINK ĐÃ SẴN SÀNG"
                    buttonText="⚡ VƯỢT LINK NGAY"
                  />

                  {state.stats?.step1Passcode && (
                    <div style={{
                      marginTop: '1rem',
                      padding: '0.85rem 1rem',
                      background: 'rgba(0, 240, 255, 0.05)',
                      border: '1px solid rgba(0, 240, 255, 0.25)',
                      borderRadius: '8px',
                      textAlign: 'left'
                    }}>
                      <div style={{ color: 'var(--neon-cy)', fontWeight: 700, fontSize: '0.75rem', marginBottom: '0.35rem' }}>
                        🔒 XÁC MINH VƯỢT LINK 1:
                      </div>
                      <div style={{ color: 'var(--text-dim)', fontSize: '0.72rem', marginBottom: '0.6rem', lineHeight: '1.4' }}>
                        Vui lòng hoàn thành vượt link ở tab vừa mở. Nếu bạn có <b>Mã Xác Nhận</b> ở trang đích, hãy nhập vào đây:
                      </div>
                      <input 
                        type="text"
                        placeholder="Nhập mã xác nhận..."
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

              {/* Step 2: Direct ServerKey Notice & Link */}
              {state.status === 'step2_pending' && state.step2FlowUrl && (
                <div style={{
                  marginTop: '1.25rem',
                  padding: '1.2rem',
                  background: 'linear-gradient(180deg, rgba(0, 240, 255, 0.08) 0%, rgba(138, 43, 226, 0.08) 100%)',
                  border: '1px solid var(--border-cy)',
                  borderRadius: '10px',
                  textAlign: 'center',
                  boxShadow: '0 0 20px rgba(0, 240, 255, 0.15)'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🚀</div>
                  <h3 style={{ fontFamily: 'var(--font-brand)', color: '#fff', fontSize: '1.1rem', margin: '0 0 0.5rem' }}>
                    ĐÃ CHUYỂN SANG SERVERKEY!
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', margin: '0 0 1rem', lineHeight: '1.5' }}>
                    Hệ thống đã kết nối trực tiếp với <b>serveripa.proxyvip.click</b> và tạo link vượt mới nhất.
                  </p>

                  <div style={{
                    padding: '0.75rem 1rem',
                    background: 'rgba(245, 255, 61, 0.08)',
                    border: '1px dashed rgba(245, 255, 61, 0.4)',
                    borderRadius: '8px',
                    color: 'var(--neon-yl)',
                    fontSize: '0.75rem',
                    lineHeight: '1.5',
                    marginBottom: '1.25rem',
                    textAlign: 'left'
                  }}>
                    ⭐ <b>LƯU Ý QUAN TRỌNG:</b>
                    <br />
                    Vui lòng hoàn thành link vượt ServerKey bên dưới. <b>Mã Key sẽ hiển thị trực tiếp tại trang web ServerKey</b> để bạn sao chép. Bạn <b>không cần quay lại trang web này nữa!</b>
                  </div>

                  <a 
                    href={state.step2FlowUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="pk-action-btn"
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      textDecoration: 'none',
                      fontSize: '0.9rem',
                      padding: '0.85rem'
                    }}
                  >
                    ⚡ MỞ LINK SERVERKEY ĐỂ LẤY KEY
                  </a>

                  <button 
                    type="button" 
                    onClick={actions.resetFlow}
                    style={{ 
                      marginTop: '1rem', 
                      background: 'transparent', 
                      border: 'none', 
                      color: 'var(--text-dim)', 
                      fontSize: '0.75rem', 
                      cursor: 'pointer', 
                      textDecoration: 'underline' 
                    }}
                  >
                    🔄 Nhận thêm lượt khác / Chọn lại
                  </button>
                </div>
              )}
              
              <ErrorBox error={state.error} onDismiss={actions.clearError} />
              
              {/* Action Button: only shown if not already in Step 2 */}
              {state.status !== 'step2_pending' && (
                <ActionButton 
                  onClick={handleActionClick}
                  disabled={isActionDisabled}
                  isLoading={state.isLoading}
                  proxyType={state.proxyType}
                  textOverride={getButtonText()}
                />
              )}
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
