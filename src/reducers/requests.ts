import {
  type RequestLog,
  type RequestHistory,
  type TdnRequestHistory,
} from '../entries/Background/rpc';
import { useSelector } from 'react-redux';
import { AppRootState } from './index';
import deepEqual from 'fast-deep-equal';
import { get, NOTARY_API_LS_KEY, PROXY_API_LS_KEY, TDN_PUB_KEY_CONSUMER_BASE64_LS_KEY, TDN_PWD_PROOF_LS_KEY } from '../utils/storage';
import { BackgroundActiontype } from '../entries/Background/rpc';
import browser from 'webextension-polyfill';

enum ActionType {
  '/requests/setRequests' = '/requests/setRequests',
  '/requests/addRequest' = '/requests/addRequest',
  '/requests/setActiveTab' = '/requests/setActiveTab',
}

type Action<payload> = {
  type: ActionType;
  payload?: payload;
  error?: boolean;
  meta?: any;
};

type State = {
  map: {
    [requestId: string]: RequestLog;
  };
  activeTab: chrome.tabs.Tab | null;
};

const initialState: State = {
  map: {},
  activeTab: null,
};

export const setRequests = (requests: RequestLog[]): Action<RequestLog[]> => ({
  type: ActionType['/requests/setRequests'],
  payload: requests,
});

export const notarizeRequest = (options: RequestHistory) => async () => {
  const notaryUrl = await get(
    NOTARY_API_LS_KEY,
    'https://notary.pse.dev/v0.1.0-alpha.5',
  );
  const websocketProxyUrl = await get(
    PROXY_API_LS_KEY,
    'wss://notary.pse.dev/proxy',
  );

  chrome.runtime.sendMessage<any, string>({
    type: BackgroundActiontype.prove_request_start,
    data: {
      url: options.url,
      method: options.method,
      headers: options.headers,
      body: options.body,
      maxTranscriptSize: options.maxTranscriptSize,
      secretHeaders: options.secretHeaders,
      secretResps: options.secretResps,
      notaryUrl,
      websocketProxyUrl,
    },
  });
};

export const tdnCollectRequest = (options: TdnRequestHistory) => async () => {
  const notaryUrl = await get(
    NOTARY_API_LS_KEY,
    'http://localhost:7047',
  );
  const websocketProxyUrl = await get(
    PROXY_API_LS_KEY,
    'wss://notary.pse.dev/proxy',
  );
  const pwdProof = await get(
    TDN_PWD_PROOF_LS_KEY,
    'abc',
  );
  const pubKeyConsumerBase64 = await get(
    TDN_PUB_KEY_CONSUMER_BASE64_LS_KEY,
    'BPa8DCAo9X+M5s+lAjL6jrtBWqolWpcQTwp2OcSJ/T2zACKH8IkR/3t+m+6x+qkXNnAS9l63tmdmu/rSQmRm5b0=',
  );

  chrome.runtime.sendMessage<any, string>({
    type: BackgroundActiontype.tdn_collect_request_start,
    data: {
      url: options.url,
      pwdProof,
      pubKeyConsumerBase64,
      method: options.method,
      headers: options.headers,
      body: options.body,
      maxTranscriptSize: options.maxTranscriptSize,
      notaryUrl,
      websocketProxyUrl,
    },
  });
};

export const setActiveTab = (
  activeTab: browser.Tabs.Tab | null,
): Action<browser.Tabs.Tab | null> => ({
  type: ActionType['/requests/setActiveTab'],
  payload: activeTab,
});

export const addRequest = (request: RequestLog): Action<RequestLog> => ({
  type: ActionType['/requests/addRequest'],
  payload: request,
});

export default function requests(
  state = initialState,
  action: Action<any>,
): State {
  switch (action.type) {
    case ActionType['/requests/setRequests']:
      return {
        ...state,
        map: {
          ...(action?.payload || []).reduce(
            (acc: { [requestId: string]: RequestLog }, req: RequestLog) => {
              if (req) {
                acc[req.requestId] = req;
              }
              return acc;
            },
            {},
          ),
        },
      };
    case ActionType['/requests/setActiveTab']:
      return {
        ...state,
        activeTab: action.payload,
      };
    case ActionType['/requests/addRequest']:
      return {
        ...state,
        map: {
          ...state.map,
          [action.payload.requestId]: action.payload,
        },
      };
    default:
      return state;
  }
}

export const useRequests = (): RequestLog[] => {
  return useSelector((state: AppRootState) => {
    return Object.values(state.requests.map);
  }, deepEqual);
};

export const useRequest = (requestId?: string): RequestLog | null => {
  return useSelector((state: AppRootState) => {
    return requestId ? state.requests.map[requestId] : null;
  }, deepEqual);
};

export const useActiveTab = (): chrome.tabs.Tab | null => {
  return useSelector((state: AppRootState) => {
    return state.requests.activeTab;
  }, deepEqual);
};

export const useActiveTabUrl = (): URL | null => {
  return useSelector((state: AppRootState) => {
    const activeTab = state.requests.activeTab;
    return activeTab?.url ? new URL(activeTab.url) : null;
  }, deepEqual);
};
