import React, { useEffect } from 'react';
import { BackgroundActiontype } from '../Background/rpc';
import { prove, set_tlsn_logging_filter, set_tdn_logging_filter, verify, tdnCollectSessionMaterials } from 'tlsn-js';
import { urlify } from '../../utils/misc';
import browser from 'webextension-polyfill';
import { LOGGING_LEVEL_DEBUG } from '../../utils/constants';

const Offscreen = () => {
  useEffect(() => {
    // @ts-ignore
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.type) {
        case BackgroundActiontype.process_prove_request: {
          const {
            url,
            method,
            headers,
            body = '',
            maxTranscriptSize,
            notaryUrl,
            websocketProxyUrl,
            id,
            secretHeaders,
            secretResps,
            loggingFilter = LOGGING_LEVEL_DEBUG,
          } = request.data;

          (async () => {
            try {
              const token = urlify(url)?.hostname || '';
              await set_tlsn_logging_filter(loggingFilter);
              const proof = await prove(url, {
                method,
                headers,
                body,
                maxTranscriptSize,
                notaryUrl,
                websocketProxyUrl: websocketProxyUrl + `?token=${token}`,
                secretHeaders,
                secretResps,
              });

              browser.runtime.sendMessage({
                type: BackgroundActiontype.finish_prove_request,
                data: {
                  id,
                  proof,
                },
              });
            } catch (error) {
              console.log('i caught an error');
              console.error(error);
              browser.runtime.sendMessage({
                type: BackgroundActiontype.finish_prove_request,
                data: {
                  id,
                  error,
                },
              });
            }
          })();

          break;
        }
        case BackgroundActiontype.process_tdn_collect_request: {
          const {
            url,
            method,
            headers,
            body = '',
            maxTranscriptSize,
            notaryUrl,
            websocketProxyUrl,
            id,
            loggingFilter = LOGGING_LEVEL_DEBUG,
          } = request.data;

          (async () => {
            try {
              const token = urlify(url)?.hostname || '';
              await set_tdn_logging_filter(loggingFilter);
              const sessionMaterials = await tdnCollectSessionMaterials(url, {
                method,
                headers,
                body,
                maxTranscriptSize,
                notaryUrl,
                websocketProxyUrl: websocketProxyUrl + `?token=${token}`,
              });

              browser.runtime.sendMessage({
                type: BackgroundActiontype.finish_tdn_collect_request,
                data: {
                  id,
                  sessionMaterials,
                },
              });
            } catch (error) {
              console.log('i caught an error');
              console.error(error);
              browser.runtime.sendMessage({
                type: BackgroundActiontype.finish_tdn_collect_request,
                data: {
                  id,
                  error,
                },
              });
            }
          })();

          break;
        }
        case BackgroundActiontype.verify_proof: {
          (async () => {
            const result = await verify(request.data);
            sendResponse(result);
          })();

          return true;
        }
        case BackgroundActiontype.verify_prove_request: {
          (async () => {
            const result = await verify(request.data.proof);

            if (result) {
              chrome.runtime.sendMessage<any, string>({
                type: BackgroundActiontype.finish_prove_request,
                data: {
                  id: request.data.id,
                  verification: {
                    sent: result.sent,
                    recv: result.recv,
                  },
                },
              });
            }
          })();
          break;
        }
        default:
          break;
      }
    });
  }, []);

  return <div className="App" />;
};

export default Offscreen;
