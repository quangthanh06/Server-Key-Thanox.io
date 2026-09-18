import { SessionState, ProxyType, SystemStats } from '../types';

export type Action = 
  | { type: 'SESSION_CREATED'; sessionId: string; stats: SystemStats }
  | { type: 'TYPE_SELECTED'; proxyType: ProxyType }
  | { type: 'STEP1_STARTED'; bypassUrl: string }
  | { type: 'STEP1_COMPLETED' }
  | { type: 'STEP2_STARTED'; flowUrl?: string }
  | { type: 'STEP2_COMPLETED' }
  | { type: 'KEY_RECEIVED'; key: string; expiresAt: string }
  | { type: 'ERROR'; error: { code: string; message: string } }
  | { type: 'CLEAR_ERROR' }
  | { type: 'STATS_UPDATED'; stats: SystemStats }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'RESET_FLOW' }
  | { type: 'SESSION_EXPIRED' };

export const initialState: SessionState = {
  status: 'created',
  sessionId: null,
  proxyType: 'ipa', // Default to IPA matching reference site
  key: null,
  keyExpiresAt: null,
  error: null,
  stats: null,
  bypassUrl: null,
  step2FlowUrl: null,
  isLoading: false,
};

export function sessionReducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case 'SESSION_CREATED':
      return { 
        ...state, 
        sessionId: action.sessionId, 
        stats: action.stats, 
        isLoading: false, 
        error: null 
      };

    case 'TYPE_SELECTED':
      // Allow switching types freely while before step 1 is started
      if (['created', 'type_selected'].includes(state.status)) {
        return { 
          ...state, 
          status: 'type_selected', 
          proxyType: action.proxyType, 
          isLoading: false, 
          error: null 
        };
      }
      return state;

    case 'STEP1_STARTED':
      return { ...state, status: 'step1_pending', bypassUrl: action.bypassUrl, isLoading: false, error: null };

    case 'STEP1_COMPLETED':
      return { ...state, status: 'step1_completed', bypassUrl: null, isLoading: false, error: null };

    case 'STEP2_STARTED':
      return { ...state, status: 'step2_pending', step2FlowUrl: action.flowUrl || null, isLoading: false, error: null };

    case 'STEP2_COMPLETED':
      return { ...state, status: 'step2_completed', isLoading: false, error: null };

    case 'KEY_RECEIVED':
      return { ...state, status: 'key_ready', key: action.key, keyExpiresAt: action.expiresAt, isLoading: false, error: null };

    case 'ERROR':
      return { ...state, error: action.error, isLoading: false };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'STATS_UPDATED':
      return { ...state, stats: action.stats };

    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };

    case 'SESSION_EXPIRED':
      return { ...state, status: 'expired', isLoading: false };

    case 'RESET_FLOW':
      return {
        ...initialState,
        stats: state.stats,
        proxyType: state.proxyType || 'ipa'
      };

    default:
      return state;
  }
}
