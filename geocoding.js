// Photon is independent of OSMF's public Nominatim service. This local
// pacing reduces traffic; it is NOT an application-wide rate limiter.
export function createGeocoder({ fetchImpl = globalThis.fetch, storage,
  now = Date.now, wait = ms => new Promise(resolve => setTimeout(resolve, ms)),
  interval = 1100, timeout = 10000, language = 'en' } = {}) {
  const cacheKey = 'cartogram-photon-v1';
  const ttl = 24 * 60 * 60 * 1000;
  const cache = new Map();
  const pending = new Map();
  let configPromise, queue = Promise.resolve(), nextStart = 0, cooldown = 0;
  try {
    for (const [key, value] of JSON.parse(storage?.getItem(cacheKey) || '[]')) {
      if (value.expires > now() && Array.isArray(value.features)) cache.set(key, value);
    }
  } catch (_) { /* Storage may be disabled or corrupt. */ }
  function save() {
    for (const [key, value] of cache) if (value.expires <= now()) cache.delete(key);
    while (cache.size > 50) cache.delete(cache.keys().next().value);
    try { storage?.setItem(cacheKey, JSON.stringify([...cache])); } catch (_) { /* quota/private mode */ }
  }
  save();
  async function fetchWithTimeout(url, options = {}, consume = res => res) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetchImpl(url, { ...options, signal: controller.signal });
      return await consume(res);
    }
    catch (error) {
      if (error.name === 'SyntaxError') throw new Error('Location search returned an invalid response.');
      if (error.name !== 'AbortError' && error.name !== 'TypeError') throw error;
      throw new Error(error.name === 'AbortError'
        ? 'Location search timed out. Try again.'
        : 'Location search is unavailable. Check your connection and try again.');
    } finally { clearTimeout(timer); }
  }
  function config() {
    if (!configPromise) {
      configPromise = (async () => {
        const value = await fetchWithTimeout('./geocoding-config.json', { cache: 'no-store' }, async res => {
          if (!res.ok) throw new Error('Location search configuration is unavailable.');
          return res.json();
        });
        const url = new URL(value.endpoint);
        if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
            url.hostname === 'nominatim.openstreetmap.org') {
          throw new Error('Location search requires an HTTPS Photon endpoint.');
        }
        return url.href.replace(/\/$/, '') + '/';
      })().catch(error => { configPromise = null; throw error; });
    }
    return configPromise;
  }
  async function request(path, params) {
    const endpoint = await config();
    const url = new URL(path, endpoint);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    url.searchParams.set('lang', ['en', 'de', 'fr'].includes(language.split('-')[0]) ? language.split('-')[0] : 'en');
    const key = url.href;
    const hit = cache.get(key);
    if (hit?.expires > now()) return normalizeFeatures(hit.features);
    if (pending.has(key)) return pending.get(key);
    if (pending.size >= 8) throw new Error('Please wait for the current location searches to finish.');
    const task = queue.catch(() => {}).then(async () => {
      if (cooldown > now()) throw new Error('Location search is busy. Please try again later.');
      await wait(Math.max(0, nextStart - now()));
      nextStart = now() + interval;
      const data = await fetchWithTimeout(url.href, { headers: { Accept: 'application/json' } }, async res => {
        if (res.status === 429 || res.status === 503) {
          const retry = res.headers.get('Retry-After');
          const seconds = retry === null ? NaN : Number(retry);
          const until = Number.isFinite(seconds) ? now() + seconds * 1000 : Date.parse(retry);
          cooldown = Math.max(now() + 60000, Number.isFinite(until) ? until : 0);
          throw new Error('Location search is busy. Please try again later.');
        }
        if (!res.ok) throw new Error('Location search failed. Please try again.');
        return res.json();
      });
      if (!Array.isArray(data.features)) throw new Error('Location search returned an invalid response.');
      const results = normalizeFeatures(data.features);
      cache.delete(key);
      cache.set(key, { expires: now() + ttl, features: data.features });
      save();
      return results;
    });
    pending.set(key, task);
    queue = task;
    try { return await task; } finally { pending.delete(key); }
  }
  return {
    search(query) {
      const q = query.trim().replace(/\s+/g, ' ');
      if (!q) return Promise.resolve([]);
      return request('api/', { q: q.toLowerCase(), limit: 6 });
    },
    reverse({ lat, lng }) {
      // Cache nearby requests at roughly metre precision.
      return request('reverse', { lat: lat.toFixed(5), lon: lng.toFixed(5), limit: 1 });
    },
  };
}

export function normalizeFeatures(features) {
  return features.flatMap(feature => {
    const p = feature?.properties || {};
    const coords = feature?.geometry?.coordinates;
    if (feature?.geometry?.type !== 'Point' || !Array.isArray(coords) || coords.length < 2 ||
        !Number.isFinite(coords[0]) || !Number.isFinite(coords[1]) ||
        Math.abs(coords[0]) > 180 || Math.abs(coords[1]) > 90) return [];
    const street = [p.street, p.housenumber].filter(Boolean).join(' ');
    const name = p.name || street || p.city || p.county || p.state || p.country;
    if (typeof name !== 'string' || !name) return [];
    const context = [...new Set([street, p.city, p.county, p.state, p.country]
      .filter(value => typeof value === 'string' && value && value !== name))].join(', ');
    const result = { name, context, lon: coords[0], lat: coords[1] };
    const locality = [p.city, p.county, p.state].find(value => typeof value === 'string' && value);
    if (locality) result.locality = locality;
    // Photon's extent is west, north, east, south.
    if (Array.isArray(p.extent) && p.extent.length === 4 && p.extent.every(Number.isFinite)) {
      const [w, n, e, s] = p.extent;
      if (w <= e && s <= n && w >= -180 && e <= 180 && s >= -90 && n <= 90)
        result.boundingbox = [s, n, w, e];
    }
    return [result];
  });
}
