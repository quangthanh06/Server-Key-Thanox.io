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

    // Create session only when the user actually initiates
    if (!sid) {
      const sessionRes = await api.createSession();
      if (sessionRes.error || !sessionRes.data) {
        dispatch({ 
          type: 'ERROR', 
          error: sessionRes.error || { code: 'INIT_FAILED', message: 'Không thể kết nối đến máy chủ. Vui lòng thử lại!' } 
        });
        return;
      }
      sid = sessionRes.data.sessionId;
      const statsRes = await api.getStats();
      if (statsRes.data) {
        dispatch({ type: 'SESSION_CREATED', sessionId: sid, stats: statsRes.data });
      }
    }

    const currentType = state.proxyType || 'ipa';
    await api.selectType(sid, currentType);
    
    const res = await api.startBypass(sid);
    if (res.error) {
      dispatch({ type: 'ERROR', error: res.error });
    } else if (res.data) {
      dispatch({ type: 'STEP1_STARTED', bypassUrl: res.data.redirectUrl });
      try {
        window.open(res.data.redirectUrl, '_blank', 'noopener,noreferrer');
      } catch (_) {}
    }
  };

  // STEP 2: Confirms Step 1 is done, then calls ServerKey (serveripa.proxyvip.click) to get Step 2 link
  const completeStep1AndStartStep2 = async () => {
    if (!state.sessionId) return;
    dispatch({ type: 'SET_LOADING', isLoading: true });
    dispatch({ type: 'CLEAR_ERROR' });

    // Mark Step 1 completed in backend
    const step1Res = await api.completeBypass(state.sessionId);
    if (step1Res.error && step1Res.error.code !== 'INVALID_STATE') {
      console.warn('Step 1 complete note:', step1Res.error);
    }

    // Call real ServerKey API (https://serveripa.proxyvip.click/api/getkey)
    const res = await api.startStep2(state.sessionId);
    if (res.error) {
      dispatch({ 
        type: 'ERROR', 
        error: { 
          code: res.error.code, 
          message: `Lỗi kết nối ServerKey (${res.error.message}). Vui lòng thử lại!` 
        } 
      });
    } else if (res.data?.flowUrl) {
      dispatch({ type: 'STEP2_STARTED', flowUrl: res.data.flowUrl });
      try {
        window.open(res.data.flowUrl, '_blank', 'noopener,noreferrer');
      } catch (_) {}
    } else {
      dispatch({ 
        type: 'ERROR', 
        error: { code: 'NO_URL', message: 'Không thể lấy được link từ ServerKey. Vui lòng thử lại!' } 
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
