export const NOTARY_API_LS_KEY = 'notary-api';
export const PROXY_API_LS_KEY = 'proxy-api';
export const HISTORY_LS_KEY = 'history';

export const TDN_PWD_PROOF_LS_KEY = 'tdn-pwd-proof';
export const TDN_PUB_KEY_CONSUMER_BASE64_LS_KEY = 'tdn-pub-key-consumer-base64';

export async function set(key: string, value: string) {
  return chrome.storage.sync.set({ [key]: value });
}

export async function get(key: string, defaultValue?: string) {
  return chrome.storage.sync
    .get(key)
    .then((json: any) => json[key] || defaultValue)
    .catch(() => '');
}
