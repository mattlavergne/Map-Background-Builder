import test from 'node:test';
import assert from 'node:assert/strict';
import { createGeocoder, normalizeFeatures } from '../geocoding.js';

const feature = { type: 'Feature', geometry: { type: 'Point', coordinates: [-92.02, 30.22] },
  properties: { name: 'Lafayette', state: 'Louisiana', country: 'United States', extent: [-92.1, 30.3, -91.9, 30.1] } };
const response = (body, status = 200, headers = {}) => ({ ok: status >= 200 && status < 300,
  status, headers: new Headers(headers), json: async () => body });
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
function setup(handler = () => response({ features: [feature] }), extra = {}) {
  const requests = [], waits = [], starts = [];
  let time = 100000;
  const values = new Map();
  const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  const fetchImpl = async (url, options) => {
    if (url === './geocoding-config.json') return response({ endpoint: 'https://photon.komoot.io/' });
    requests.push(url); starts.push(time);
    return handler(url, options);
  };
  const options = { fetchImpl, storage, now: () => time,
    wait: async ms => { waits.push(ms); time += ms; }, ...extra };
  return { client: createGeocoder(options), options, requests, waits, starts,
    advance: ms => { time += ms; } };
}

test('normalizes Photon labels, coordinates and extent for existing map selection', () => {
  assert.deepEqual(normalizeFeatures([feature]), [{ name: 'Lafayette', context: 'Louisiana, United States',
    lon: -92.02, lat: 30.22, locality: 'Louisiana', boundingbox: [30.1, 30.3, -92.1, -91.9] }]);
  assert.deepEqual(normalizeFeatures([{ geometry: { type: 'Point', coordinates: [400, 0] } }, null]), []);
  const street = structuredClone(feature);
  street.properties = { street: 'Duhon Road', housenumber: '100', city: 'Lafayette' };
  assert.equal(normalizeFeatures([street])[0].name, 'Duhon Road 100');
});

test('deduplicates in-flight requests and caches normalized queries including empty results', async () => {
  const gate = deferred();
  const s = setup(() => gate.promise);
  const a = s.client.search('  Lafayette  Louisiana ');
  const b = s.client.search('lafayette Louisiana');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(s.requests.length, 1);
  gate.resolve(response({ features: [] }));
  assert.deepEqual(await a, []); assert.deepEqual(await b, []);
  await s.client.search('LAFAYETTE   Louisiana');
  assert.equal(s.requests.length, 1);
  assert.equal(new URL(s.requests[0]).searchParams.get('q'), 'lafayette louisiana');
  assert.ok(s.requests.every(url => !url.includes('nominatim')));
});

test('shares pacing and cache between forward and reverse requests, persists and expires cache', async () => {
  const s = setup();
  await Promise.all([s.client.search('Lafayette'), s.client.reverse({ lat: 30.22, lng: -92.02 })]);
  assert.deepEqual(s.starts, [100000, 101100]);
  await createGeocoder(s.options).search('Lafayette');
  assert.equal(s.requests.length, 2);
  s.advance(86400001);
  await s.client.search('Lafayette');
  assert.equal(s.requests.length, 3);
});

test('cache stays bounded and works with unavailable storage', async () => {
  const s = setup();
  for (let i = 0; i < 55; i++) await s.client.search(`place ${i}`);
  const stored = JSON.parse(s.options.storage.getItem('cartogram-photon-v1'));
  assert.equal(stored.length, 50);
  const broken = setup(undefined, { storage: { getItem() { throw Error(); }, setItem() { throw Error(); } } });
  await broken.client.search('Lafayette');
  await broken.client.search('Lafayette');
  assert.equal(broken.requests.length, 1);
});

for (const status of [429, 503]) for (const retry of ['120', new Date(220000).toUTCString()]) {
  test(`${status} honors Retry-After ${retry} without automatic retries, including queued requests`, async () => {
    let first = true;
    const s = setup(() => {
      if (first) { first = false; return response({}, status, { 'Retry-After': retry }); }
      return response({ features: [feature] });
    });
    const requests = await Promise.allSettled([s.client.search('Lafayette'), s.client.reverse({ lat: 30, lng: -92 })]);
    assert.ok(requests.every(r => r.status === 'rejected'));
    assert.equal(s.requests.length, 1);
    s.advance(119000);
    await assert.rejects(s.client.search('Paris'), /busy/);
    s.advance(1001);
    await s.client.search('Lafayette');
    assert.equal(s.requests.length, 2);
  });
}

for (const [label, handler] of [
  ['HTTP error', () => response({}, 500)],
  ['malformed payload', () => response({ unexpected: true })],
  ['offline', () => { throw new TypeError('network'); }],
]) test(`${label} fails visibly, is not cached and allows a manual retry`, async () => {
  let fail = true;
  const s = setup((...args) => fail ? handler(...args) : response({ features: [feature] }));
  await assert.rejects(s.client.search('Lafayette'));
  fail = false;
  assert.equal((await s.client.search('Lafayette'))[0].name, 'Lafayette');
  assert.equal(s.requests.length, 2);
});

test('timeout aborts a hung request and releases duplicate suppression', async () => {
  let hang = true;
  const s = setup((url, { signal }) => hang ? new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('timeout', 'AbortError')));
  }) : response({ features: [feature] }), { timeout: 10 });
  await assert.rejects(s.client.search('Lafayette'), /timed out/);
  hang = false;
  await s.client.search('Lafayette');
  assert.equal(s.requests.length, 2);
});

test('config failure is recoverable and public Nominatim is rejected', async () => {
  let fail = true;
  const client = createGeocoder({ fetchImpl: async () => fail ? response({}, 500)
    : response({ endpoint: 'https://nominatim.openstreetmap.org/' }) });
  await assert.rejects(client.search('Lafayette'), /configuration/);
  fail = false;
  await assert.rejects(client.search('Lafayette'), /Photon endpoint/);
});
