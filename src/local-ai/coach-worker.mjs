// A new worker is created for every load, including the network-blocked cache test.
import {WebWorkerMLCEngineHandler} from '../../assets/vendor/local-coach-runtime.mjs';
if (new URL(self.location.href).searchParams.get('offline') === '1') {
  // Never fall through to the network, even if navigator.onLine says online.
  self.fetch = async (input, init) => {
    const request = new Request(input, init);
    if (request.method !== 'GET') throw Error('Offline model test blocks network requests');
    const cached = await caches.match(request);
    if (!cached) throw Error('Offline model test: required file is missing from cache');
    return cached;
  };
}
const handler = new WebWorkerMLCEngineHandler();
self.onmessage = event => handler.onmessage(event);
