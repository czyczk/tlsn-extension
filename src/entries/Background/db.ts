import { Level } from 'level';
import type { RequestHistory, TdnRequestHistory } from './rpc';
const charwise = require('charwise');

const db = new Level('./ext-db', {
  valueEncoding: 'json',
});
const historyDb = db.sublevel<string, RequestHistory>('history', {
  valueEncoding: 'json',
});
const tdnHistoryDb = db.sublevel<string, TdnRequestHistory>('tdnHistory', {
  valueEncoding: 'json',
});

export async function addNotaryRequest(
  now = Date.now(),
  request: Omit<RequestHistory, 'status' | 'id'>,
): Promise<RequestHistory> {
  const id = charwise.encode(now).toString('hex');
  const newReq: RequestHistory = {
    ...request,
    id,
    status: '',
  };
  await historyDb.put(id, newReq);
  return newReq;
}

export async function addTdnRequest(
  now = Date.now(),
  request: Omit<TdnRequestHistory, 'status' | 'id'>,
): Promise<TdnRequestHistory> {
  const id = charwise.encode(now).toString('hex');
  const newReq: TdnRequestHistory = {
    ...request,
    id,
    status: '',
  };
  await tdnHistoryDb.put(id, newReq);
  return newReq;
}

export async function addNotaryRequestProofs(
  id: string,
  proof: { session: any; substrings: any },
): Promise<RequestHistory | null> {
  const existing = await historyDb.get(id);

  if (!existing) return null;

  const newReq: RequestHistory = {
    ...existing,
    proof,
    status: 'success',
  };

  await historyDb.put(id, newReq);

  return newReq;
}

export async function addTdnRequestSessionMaterials(
  id: string,
  sessionMaterials: { session: any; substrings: any },
): Promise<TdnRequestHistory | null> {
  const existing = await tdnHistoryDb.get(id);

  if (!existing) return null;

  const newReq: TdnRequestHistory = {
    ...existing,
    sessionMaterials,
    status: 'success',
  };

  await tdnHistoryDb.put(id, newReq);

  return newReq;
}

export async function setNotaryRequestStatus(
  id: string,
  status: '' | 'pending' | 'success' | 'error',
): Promise<RequestHistory | null> {
  const existing = await historyDb.get(id);

  if (!existing) return null;

  const newReq = {
    ...existing,
    status,
  };

  await historyDb.put(id, newReq);

  return newReq;
}

export async function setTdnRequestStatus(
  id: string,
  status: '' | 'pending' | 'success' | 'error',
): Promise<TdnRequestHistory | null> {
  const existing = await tdnHistoryDb.get(id);

  if (!existing) return null;

  const newReq = {
    ...existing,
    status,
  };

  await tdnHistoryDb.put(id, newReq);

  return newReq;
}

export async function setNotaryRequestError(
  id: string,
  error: any,
): Promise<RequestHistory | null> {
  const existing = await historyDb.get(id);

  if (!existing) return null;

  const newReq: RequestHistory = {
    ...existing,
    error,
    status: 'error',
  };

  await historyDb.put(id, newReq);

  return newReq;
}

export async function setTdnRequestError(
  id: string,
  error: any,
): Promise<TdnRequestHistory | null> {
  const existing = await tdnHistoryDb.get(id);

  if (!existing) return null;

  const newReq: TdnRequestHistory = {
    ...existing,
    error,
    status: 'error',
  };

  await tdnHistoryDb.put(id, newReq);

  return newReq;
}

export async function setNotaryRequestVerification(
  id: string,
  verification: { sent: string; recv: string },
): Promise<RequestHistory | null> {
  const existing = await historyDb.get(id);

  if (!existing) return null;

  const newReq = {
    ...existing,
    verification,
  };

  await historyDb.put(id, newReq);

  return newReq;
}

export async function setTdnRequestVerification(
  id: string,
  verification: { sent: string; recv: string },
): Promise<TdnRequestHistory | null> {
  const existing = await tdnHistoryDb.get(id);

  if (!existing) return null;

  const newReq = {
    ...existing,
    verification,
  };

  await tdnHistoryDb.put(id, newReq);

  return newReq;
}

export async function removeNotaryRequest(
  id: string,
): Promise<RequestHistory | null> {
  const existing = await historyDb.get(id);

  if (!existing) return null;

  await historyDb.del(id);

  return existing;
}

export async function removeTdnRequest(
  id: string,
): Promise<TdnRequestHistory | null> {
  const existing = await tdnHistoryDb.get(id);

  if (!existing) return null;

  await tdnHistoryDb.del(id);

  return existing;
}

export async function getNotaryRequests(): Promise<RequestHistory[]> {
  const retVal = [];
  for await (const [key, value] of historyDb.iterator()) {
    retVal.push(value);
  }
  return retVal;
}

export async function getTdnRequests(): Promise<TdnRequestHistory[]> {
  const retVal = [];
  for await (const [key, value] of tdnHistoryDb.iterator()) {
    retVal.push(value);
  }
  return retVal;
}

export async function getNotaryRequest(
  id: string,
): Promise<RequestHistory | null> {
  return historyDb.get(id);
}

export async function getTdnRequest(
  id: string,
): Promise<TdnRequestHistory | null> {
  return tdnHistoryDb.get(id);
}