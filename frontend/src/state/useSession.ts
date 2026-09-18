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
  const startBypass = async (customUrl?: string, stepIndex = 0, totalSteps = 1, stepTitle?: string) => {
    // Immediate pre-check if IP limit is already reached
    if (state.stats && state.stats.ipLimit > 0 && state.stats.ipUsed >= state.stats.ipLimit) {
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
    
    const res = await api.startBypass(sid, stepIndex, totalSteps, stepTitle);
    const bypassUrl = customUrl || res.data?.redirectUrl || 'https://thanoxstorebot.shop/?step=1';
    
    dispatch({ type: 'STEP1_STARTED', bypassUrl });
    try {
      window.open(bypassUrl, '_blank', 'noopener,noreferrer');
    } catch (_) {}
  };

  // STEP 2: Confirms Step 1 is done, then redirects user DIRECTLY to ServerKey page
  // User gets key directly from serveripa.proxyvip.click/getkey — no intermediate screen.
  const completeStep1AndStartStep2 = async () => {
    let sid = state.sessionId;
    if (!sid) {
      sid = `sess_${Date.now()}`;
      dispatch({ type: 'SESSION_CREATED', sessionId: sid, stats: state.stats });
    }

    dispatch({ type: 'SET_LOADING', isLoading: true });
    dispatch({ type: 'CLEAR_ERROR' });

    // Mark Step 1 completed in backend (for admin tracking)
    api.completeBypass(sid).catch(() => {});

    // Notify backend for live tracking (step2 started)
    api.startStep2(sid, state.proxyType || 'ipa').catch(() => {});

    // Redirect user DIRECTLY to ServerKey page with their own IP
    const serverKeyUrl = 'https://serveripa.proxyvip.click/getkey';
    try {
      window.open(serverKeyUrl, '_blank', 'noopener,noreferrer');
    } catch (_) {}

    // Reset flow back to start — user gets key at ServerKey, no notification needed here
    dispatch({ type: 'RESET_FLOW' });
    loadStats();
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
