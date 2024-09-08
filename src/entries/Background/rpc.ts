import browser from 'webextension-polyfill';
import { clearCache, getCacheByTabId } from './cache';
import { addRequestHistory, addTdnRequestHistory } from '../../reducers/history';
import {
  getNotaryRequests,
  addNotaryRequest,
  addNotaryRequestProofs,
  getNotaryRequest,
  setNotaryRequestStatus,
  setNotaryRequestError,
  setNotaryRequestVerification,
  removeNotaryRequest,
  getTdnRequests,
  addTdnRequest,
  addTdnRequestSessionMaterials,
  getTdnRequest,
  setTdnRequestStatus,
  setTdnRequestError,
  setTdnRequestVerification,
  removeTdnRequest,
} from './db';

export enum BackgroundActiontype {
  get_requests = 'get_requests',
  clear_requests = 'clear_requests',
  push_action = 'push_action',
  get_prove_requests = 'get_prove_requests',
  prove_request_start = 'prove_request_start',
  process_prove_request = 'process_prove_request',
  finish_prove_request = 'finish_prove_request',
  verify_prove_request = 'verify_prove_request',
  verify_proof = 'verify_proof',
  delete_prove_request = 'delete_prove_request',
  retry_prove_request = 'retry_prove_request',

  tdn_collect_request_start = 'tdn_collect_request_start',
  process_tdn_collect_request = 'process_tdn_collect_request',
  finish_tdn_collect_request = 'finish_tdn_collect_request',
  delete_tdn_collect_request = 'delete_tdn_collect_request',
}

export type BackgroundAction = {
  type: BackgroundActiontype;
  data?: any;
  meta?: any;
  error?: boolean;
};

export type RequestLog = {
  requestId: string;
  tabId: number;
  method: string;
  type: string;
  url: string;
  initiator: string | null;
  requestHeaders: browser.WebRequest.HttpHeaders;
  requestBody?: string;
  formData?: {
    [k: string]: string[];
  };
  responseHeaders?: browser.WebRequest.HttpHeaders;
};

export type RequestHistory = {
  id: string;
  url: string;
  method: string;
  headers: { [key: string]: string };
  body?: string;
  maxTranscriptSize: number;
  notaryUrl: string;
  websocketProxyUrl: string;
  status: '' | 'pending' | 'success' | 'error';
  error?: any;
  proof?: { session: any; substrings: any };
  requestBody?: any;
  verification?: {
    sent: string;
    recv: string;
  };
  secretHeaders?: string[];
  secretResps?: string[];
};

export type TdnRequestHistory = {
  id: string;
  url: string;
  method: string;
  headers: { [key: string]: string };
  body?: string;
  maxTranscriptSize: number;
  notaryUrl: string;
  websocketProxyUrl: string;
  status: '' | 'pending' | 'success' | 'error';
  error?: any;
  sessionMaterials?: { session: any; substrings: any };
  requestBody?: any;
  verification?: {
    sent: string;
    recv: string;
  };
};

export const initRPC = () => {
  browser.runtime.onMessage.addListener(
    async (request, sender, sendResponse) => {
      switch (request.type) {
        case BackgroundActiontype.get_requests:
          return handleGetRequests(request, sendResponse);
        case BackgroundActiontype.clear_requests:
          clearCache();
          return sendResponse();
        case BackgroundActiontype.get_prove_requests:
          return handleGetProveRequests(request, sendResponse);
        case BackgroundActiontype.finish_prove_request:
          return handleFinishProveRequest(request, sendResponse);
        case BackgroundActiontype.delete_prove_request:
          await removeNotaryRequest(request.data);
          return sendResponse();
        case BackgroundActiontype.retry_prove_request:
          return handleRetryProveReqest(request, sendResponse);
        case BackgroundActiontype.prove_request_start:
          return handleProveRequestStart(request, sendResponse);
        case BackgroundActiontype.finish_tdn_collect_request:
          return handleFinishTdnCollectRequest(request, sendResponse);
        case BackgroundActiontype.tdn_collect_request_start:
          return handleTdnCollectRequestStart(request, sendResponse);
        default:
          break;
      }
    },
  );
};

function handleGetRequests(
  request: BackgroundAction,
  sendResponse: (data?: any) => void,
) {
  const cache = getCacheByTabId(request.data);
  const keys = cache.keys() || [];
  const data = keys.map((key) => cache.get(key));
  return data;
}

async function handleGetProveRequests(
  request: BackgroundAction,
  sendResponse: (data?: any) => void,
) {
  const reqs = await getNotaryRequests();
  for (const req of reqs) {
    await browser.runtime.sendMessage({
      type: BackgroundActiontype.push_action,
      data: {
        tabId: 'background',
      },
      action: addRequestHistory(req),
    });
  }
  return sendResponse();
}

async function handleFinishProveRequest(
  request: BackgroundAction,
  sendResponse: (data?: any) => void,
) {
  const { id, proof, error, verification } = request.data;

  if (proof) {
    const newReq = await addNotaryRequestProofs(id, proof);
    if (!newReq) return;

    await browser.runtime.sendMessage({
      type: BackgroundActiontype.push_action,
      data: {
        tabId: 'background',
      },
      action: addRequestHistory(await getNotaryRequest(id)),
    });
  }

  if (error) {
    const newReq = await setNotaryRequestError(id, error);
    if (!newReq) return;

    await browser.runtime.sendMessage({
      type: BackgroundActiontype.push_action,
      data: {
        tabId: 'background',
      },
      action: addRequestHistory(await getNotaryRequest(id)),
    });
  }

  if (verification) {
    const newReq = await setNotaryRequestVerification(id, verification);
    if (!newReq) return;

    await browser.runtime.sendMessage({
      type: BackgroundActiontype.push_action,
      data: {
        tabId: 'background',
      },
      action: addRequestHistory(await getNotaryRequest(id)),
    });
  }

  return sendResponse();
}

async function handleRetryProveReqest(
  request: BackgroundAction,
  sendResponse: (data?: any) => void,
) {
  const { id, notaryUrl, websocketProxyUrl } = request.data;

  await setNotaryRequestError(id, null);
  await setNotaryRequestStatus(id, 'pending');

  const req = await getNotaryRequest(id);

  await browser.runtime.sendMessage({
    type: BackgroundActiontype.push_action,
    data: {
      tabId: 'background',
    },
    action: addRequestHistory(req),
  });

  await browser.runtime.sendMessage({
    type: BackgroundActiontype.process_prove_request,
    data: {
      ...req,
      notaryUrl,
      websocketProxyUrl,
    },
  });

  return sendResponse();
}

async function handleProveRequestStart(
  request: BackgroundAction,
  sendResponse: (data?: any) => void,
) {
  const {
    url,
    method,
    headers,
    body,
    maxTranscriptSize,
    notaryUrl,
    websocketProxyUrl,
    secretHeaders,
    secretResps,
  } = request.data;

  const { id } = await addNotaryRequest(Date.now(), {
    url,
    method,
    headers,
    body,
    maxTranscriptSize,
    notaryUrl,
    websocketProxyUrl,
    secretHeaders,
    secretResps,
  });

  await setNotaryRequestStatus(id, 'pending');

  await browser.runtime.sendMessage({
    type: BackgroundActiontype.push_action,
    data: {
      tabId: 'background',
    },
    action: addRequestHistory(await getNotaryRequest(id)),
  });

  await browser.runtime.sendMessage({
    type: BackgroundActiontype.process_prove_request,
    data: {
      id,
      url,
      method,
      headers,
      body,
      maxTranscriptSize,
      notaryUrl,
      websocketProxyUrl,
      secretHeaders,
      secretResps,
    },
  });

  return sendResponse();
}

async function handleFinishTdnCollectRequest(
  request: BackgroundAction,
  sendResponse: (data?: any) => void,
) {
  const { id, sessionMaterials, error, verification } = request.data;

  if (sessionMaterials) {
    console.log('rpc.ts|handleFinishTdnCollectRequest(); sessionMaterials');
    const newReq = await addTdnRequestSessionMaterials(id, sessionMaterials);
    if (!newReq) return;

    await browser.runtime.sendMessage({
      type: BackgroundActiontype.push_action,
      data: {
        tabId: 'background',
      },
      action: addTdnRequestHistory(await getTdnRequest(id)),
    });
  }

  if (error) {
    console.log('rpc.ts|handleFinishTdnCollectRequest(); error');
    const newReq = await setTdnRequestError(id, error);
    if (!newReq) return;

    await browser.runtime.sendMessage({
      type: BackgroundActiontype.push_action,
      data: {
        tabId: 'background',
      },
      action: addTdnRequestHistory(await getTdnRequest(id)),
    });
  }

  if (verification) {
    console.log('rpc.ts|handleFinishTdnCollectRequest(); verification');
    const newReq = await setTdnRequestVerification(id, verification);
    if (!newReq) return;

    await browser.runtime.sendMessage({
      type: BackgroundActiontype.push_action,
      data: {
        tabId: 'background',
      },
      action: addTdnRequestHistory(await getTdnRequest(id)),
    });
  }

  console.log('rpc.ts|handleFinishTdnCollectRequest(); done');
  return sendResponse();
}

async function handleTdnCollectRequestStart(
  request: BackgroundAction,
  sendResponse: (data?: any) => void,
) {
  const {
    url,
    method,
    headers,
    body,
    maxTranscriptSize,
    notaryUrl,
    websocketProxyUrl,
  } = request.data;

  const { id } = await addTdnRequest(Date.now(), {
    url,
    method,
    headers,
    body,
    maxTranscriptSize,
    notaryUrl,
    websocketProxyUrl,
  });

  await setTdnRequestStatus(id, 'pending');

  await browser.runtime.sendMessage({
    type: BackgroundActiontype.push_action,
    data: {
      tabId: 'background',
    },
    action: addTdnRequestHistory(await getTdnRequest(id)),
  });

  await browser.runtime.sendMessage({
    type: BackgroundActiontype.process_tdn_collect_request,
    data: {
      id,
      url,
      method,
      headers,
      body,
      maxTranscriptSize,
      notaryUrl,
      websocketProxyUrl,
    },
  });

  return sendResponse();
}