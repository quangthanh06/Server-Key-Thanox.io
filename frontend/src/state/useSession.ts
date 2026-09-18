import { useReducer, useEffect, useCallback } from 'react';
import { sessionReducer, initialState } from './machine';
import { api } from '../api/endpoints';
import { ProxyType } from '../types';

export function useSession() {
  const [state, dispatch] = useReducer(sessionReducer, initialState);

  // Load public system stats
  const loadStats = useCallback(async () => {
    const res = await api.getStats();
    if (res.data) {
      dispatch({ type: 'STATS_UPDATED', stats: res.data });
    }
  }, []);

  // Instant local type selection (switches between IPA and VPN)
  const selectType = async (proxyType: ProxyType) => {
    dispatch({ type: 'TYPE_SELECTED', proxyType });
    if (state.sessionId) {
      api.selectType(state.sessionId, proxyType).catch(() => {});
    }
  };

  // STEP 1: Create session and start Link 1 bypass
  const startBypass = async () => {
    // Immediate pre-check if IP limit is already reached
    if (state.stats && state.stats.ipUsed >= state.stats.ipLimit) {
      dispatch({
        type: 'ERROR',
        error: {
          code: 'IP_LIMIT_EXCEEDED',
          message: `Bạn đã đạt giới hạn ${state.stats.ipUsed}/${state.stats.ipLimit} lượt hôm nay. Vui lòng quay lại sau ${state.stats.resetFormatted || '00:00 ngày mai'}!`
        }
      });
      return;
    }

    dispatch({ type: 'SET_LOADING', isLoading: true });
    dispatch({ type: 'CLEAR_ERROR' });

    let sid = state.sessionId;

    // Create session if not already created
    if (!sid) {
      const sessionRes = await api.createSession();
      if (sessionRes.data?.sessionId) {
        sid = sessionRes.data.sessionId;
      } else {
        sid = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      }
      dispatch({ type: 'SESSION_CREATED', sessionId: sid, stats: state.stats });
    }

    const currentType = state.proxyType || 'ipa';
    api.selectType(sid, currentType).catch(() => {});
    
    const res = await api.startBypass(sid);
    const bypassUrl = res.data?.redirectUrl || 'https://thanoxstorebot.shop/?step=1';
    
    dispatch({ type: 'STEP1_STARTED', bypassUrl });
    try {
      window.open(bypassUrl, '_blank', 'noopener,noreferrer');
    } catch (_) {}
  };

  // STEP 2: Confirms Step 1 is done, then calls ServerKey (serveripa.proxyvip.click) to get Step 2 link
  const completeStep1AndStartStep2 = async () => {
    let sid = state.sessionId;
    if (!sid) {
      sid = `sess_${Date.now()}`;
      dispatch({ type: 'SESSION_CREATED', sessionId: sid, stats: state.stats });
    }

    dispatch({ type: 'SET_LOADING', isLoading: true });
    dispatch({ type: 'CLEAR_ERROR' });

    // Mark Step 1 completed in backend
    api.completeBypass(sid).catch(() => {});

    // Call real ServerKey API (https://serveripa.proxyvip.click/api/getkey)
    const res = await api.startStep2(sid);
    const flowUrl = (res.data as any)?.flowUrl || (res.data as any)?.url;

    if (flowUrl) {
      dispatch({ type: 'STEP2_STARTED', flowUrl });
      try {
        window.open(flowUrl, '_blank', 'noopener,noreferrer');
      } catch (_) {}
    } else if (res.error) {
      dispatch({ 
        type: 'ERROR', 
        error: { 
          code: res.error.code, 
          message: res.error.message || 'Hệ thống ServerKey đang bảo trì hoặc hết lượt hôm nay.' 
        } 
      });
    } else {
      dispatch({ 
        type: 'ERROR', 
        error: { code: 'NO_URL', message: 'Không thể lấy được link từ ServerKey. Vui lòng thử lại sau!' } 
      });
    }
  };

  // STEP 3: Confirms Step 2 (ServerKey) is done, and claims the final Key
  const completeStep2AndClaimKey = async () => {
    if (!state.sessionId) return;
    dispatch({ type: 'SET_LOADING', isLoading: true });
    dispatch({ type: 'CLEAR_ERROR' });

    // Mark step 2 completed
    await api.completeStep2(state.sessionId);

    // Claim key
    const res = await api.claimKey(state.sessionId);
    if (res.error) {
      dispatch({ type: 'ERROR', error: res.error });
    } else if (res.data) {
      dispatch({ type: 'KEY_RECEIVED', key: res.data.key, expiresAt: res.data.expiresAt });
      loadStats();
    }
  };

  // Reset to take another key
  const resetFlow = () => {
    dispatch({ type: 'RESET_FLOW' });
    loadStats();
  };

  // Only load live stats on initial mount
  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [loadStats]);

  return {
    state,
    actions: {
      selectType,
      startBypass,
      completeStep1AndStartStep2,
      completeStep2AndClaimKey,
      resetFlow,
      loadStats,
      clearError: () => dispatch({ type: 'CLEAR_ERROR' })
    }
  };
}
