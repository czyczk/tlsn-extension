import React, { ReactElement, useState, useEffect, useCallback } from 'react';
import {
  set,
  get,
  NOTARY_API_LS_KEY,
  PROXY_API_LS_KEY,
  TDN_PWD_PROOF_LS_KEY,
  TDN_PUB_KEY_CONSUMER_BASE64_LS_KEY,
  TDN_EVM_ADDR_LS_KEY,
} from '../../utils/storage';

export default function Options(): ReactElement {
  const [notary, setNotary] = useState('http://localhost:7047');
  const [proxy, setProxy] = useState('wss://notary.pse.dev/proxy');
  const [pwdProof, setPwdProof] = useState('abc');
  const [pubKeyConsumerBase64, setPubKeyConsumerBase64] = useState(
    'BHhNtkKWjJoc9AvKkvfPEHvqBd/zYBi0G5efy2m9MrFQXQDy4RSvJyz4LT4Fcqj9RSbxGWK5asGlDJZgg34rW4Y=',
  );
  const [evmSettlementAddrProver, setEvmSettlementAddrProver] = useState(
    '0xeeb89d376693a94773da6baa0eb5922aebaf1f82',
  );
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    (async () => {
      setNotary(await get(NOTARY_API_LS_KEY));
      setProxy(await get(PROXY_API_LS_KEY));
      setPwdProof(await get(TDN_PWD_PROOF_LS_KEY));
      setPubKeyConsumerBase64(await get(TDN_PUB_KEY_CONSUMER_BASE64_LS_KEY));
      setEvmSettlementAddrProver(await get(TDN_EVM_ADDR_LS_KEY));
    })();
  }, []);

  const onSave = useCallback(async () => {
    await set(NOTARY_API_LS_KEY, notary);
    await set(PROXY_API_LS_KEY, proxy);
    await set(TDN_PWD_PROOF_LS_KEY, pwdProof);
    await set(TDN_PUB_KEY_CONSUMER_BASE64_LS_KEY, pubKeyConsumerBase64);
    await set(TDN_EVM_ADDR_LS_KEY, evmSettlementAddrProver);
    setDirty(false);
  }, [notary, proxy, pwdProof, pubKeyConsumerBase64, evmSettlementAddrProver]);

  return (
    <div className="flex flex-col flex-nowrap flex-grow">
      <div className="flex flex-row flex-nowrap py-1 px-2 gap-2 font-bold text-base">
        Settings (TDN version)
      </div>
      <div className="flex flex-col flex-nowrap py-1 px-2 gap-2">
        <div className="font-semibold">Notary API</div>
        <input
          type="text"
          className="input border"
          placeholder="http://localhost:7047"
          onChange={(e) => {
            setNotary(e.target.value);
            setDirty(true);
          }}
          value={notary}
        />
      </div>
      <div className="flex flex-col flex-nowrap py-1 px-2 gap-2">
        <div className="font-semibold">Proxy API</div>
        <input
          type="text"
          className="input border"
          placeholder="ws://127.0.0.1:55688"
          onChange={(e) => {
            setProxy(e.target.value);
            setDirty(true);
          }}
          value={proxy}
        />
      </div>
      <div className="flex flex-col flex-nowrap py-1 px-2 gap-2">
        <div className="font-semibold">Pwd proof</div>
        <input
          type="text"
          className="input border"
          placeholder="abc"
          onChange={(e) => {
            setPwdProof(e.target.value);
            setDirty(true);
          }}
          value={pwdProof}
        />
      </div>
      <div className="flex flex-col flex-nowrap py-1 px-2 gap-2">
        <div className="font-semibold">Consumer public key base64</div>
        <input
          type="text"
          className="input border"
          placeholder="BHhNtkKWjJoc9AvKkvfPEHvqBd/zYBi0G5efy2m9MrFQXQDy4RSvJyz4LT4Fcqj9RSbxGWK5asGlDJZgg34rW4Y="
          onChange={(e) => {
            setPubKeyConsumerBase64(e.target.value);
            setDirty(true);
          }}
          value={pubKeyConsumerBase64}
        />
      </div>
      <div className="flex flex-col flex-nowrap py-1 px-2 gap-2">
        <div className="font-semibold">Prover EVM settlement address</div>
        <input
          type="text"
          className="input border"
          placeholder="0xeeb89d376693a94773da6baa0eb5922aebaf1f82"
          onChange={(e) => {
            setEvmSettlementAddrProver(e.target.value);
            setDirty(true);
          }}
          value={evmSettlementAddrProver}
        />
      </div>
      <div className="flex flex-row flex-nowrap justify-end gap-2 p-2">
        <button
          className="button !bg-primary/[0.9] hover:bg-primary/[0.8] active:bg-primary !text-white"
          disabled={!dirty}
          onClick={onSave}
        >
          Save
        </button>
      </div>
    </div>
  );
}
