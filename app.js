/* =========================================================
   Cartogram — Map Artwork Background Builder
   Fetches raw OpenStreetMap vector data for a drawn box and
   renders it as stylised artwork on a canvas. 100% client-side.
   ========================================================= */
'use strict';

/* ------------------------------------------------------------------
   THEMES
   Each theme is a full palette. Colours are chosen to read as a
   beautiful desktop background, not a literal map.
   roads = [major, medium, minor, service, path]
------------------------------------------------------------------ */
const THEMES = {
  midnight: {
    name: 'Midnight Gold',
    bg: ['#0a0e17', '#131b2e'],
    water: '#12203b', waterEdge: 'rgba(120,160,220,.18)',
    green: '#152a2a',
    building: 'rgba(120,140,190,.10)', buildingEdge: 'rgba(150,175,230,.14)',
    roof: '#2b3350', wall: '#171d2e',
    roads: ['#f6d18a', '#d9b06a', '#8f7a52', '#5f5540', '#4a4636'],
    glow: 0.5, text: '#f6ead0',
  },
  copper: {
    name: 'Copper',
    bg: ['#0b0906', '#1a130d'],
    water: '#12181a', waterEdge: 'rgba(200,150,110,.16)',
    green: '#1a1a10',
    building: 'rgba(230,160,110,.08)', buildingEdge: 'rgba(240,180,130,.16)',
    roof: '#3a281a', wall: '#1c130c',
    roads: ['#ffbf8a', '#e08a4f', '#b3653c', '#7c472c', '#5a3420'],
    glow: 0.6, text: '#ffe6cf',
  },
  rosegold: {
    name: 'Rosé Gold',
    bg: ['#0e0810', '#20121c'],
    water: '#1b1222', waterEdge: 'rgba(230,180,200,.18)',
    green: '#201826',
    building: 'rgba(230,180,190,.08)', buildingEdge: 'rgba(240,200,200,.16)',
    roof: '#3a2430', wall: '#1e131c',
    roads: ['#f7cbc2', '#e6a091', '#c07d76', '#8a5a58', '#5e3e40'],
    glow: 0.55, text: '#f9e3dc',
  },
  platinum: {
    name: 'Platinum Noir',
    bg: ['#070709', '#15171c'],
    water: '#0f141d', waterEdge: 'rgba(200,215,235,.18)',
    green: '#12161c',
    building: 'rgba(210,220,235,.07)', buildingEdge: 'rgba(220,230,245,.20)',
    roof: '#2a2f3a', wall: '#171b22',
    roads: ['#ffffff', '#d6dce6', '#9aa3b1', '#606a78', '#454c58'],
    glow: 0.5, text: '#eef2f8',
  },
  crimson: {
    name: 'Crimson Noir',
    bg: ['#0d0708', '#200d11'],
    water: '#1a0e18', waterEdge: 'rgba(230,150,150,.16)',
    green: '#1a1016',
    building: 'rgba(230,140,130,.08)', buildingEdge: 'rgba(240,170,150,.16)',
    roof: '#3a1820', wall: '#1e0d12',
    roads: ['#ffd9a0', '#e86a6a', '#b74a52', '#7c3440', '#5a2833'],
    glow: 0.7, text: '#ffe0d5',
  },
  emeraldgold: {
    name: 'Emerald & Gold',
    bg: ['#06120d', '#0d2018'],
    water: '#0b2330', waterEdge: 'rgba(120,190,200,.16)',
    green: '#0f3324',
    building: 'rgba(180,200,150,.08)', buildingEdge: 'rgba(210,200,150,.16)',
    roof: '#153a2a', wall: '#0c241a',
    roads: ['#f6d99a', '#9fd6a0', '#6faf86', '#4c7a5e', '#39604a'],
    glow: 0.5, text: '#eef3d8',
  },
  sapphire: {
    name: 'Sapphire',
    bg: ['#060a16', '#0c1732'],
    water: '#0a1530', waterEdge: 'rgba(150,190,255,.22)',
    green: '#0d2036',
    building: 'rgba(150,190,255,.07)', buildingEdge: 'rgba(180,210,255,.18)',
    roof: '#123056', wall: '#0a1f3e',
    roads: ['#c7e0ff', '#7fb0ff', '#5f8fd8', '#48699f', '#39507a'],
    glow: 0.6, text: '#e6f0ff',
  },
  noir: {
    name: 'Neon Noir',
    bg: ['#07060d', '#120a1f'],
    water: '#0e0b22', waterEdge: 'rgba(120,80,220,.22)',
    green: '#0d1420',
    building: 'rgba(120,60,200,.10)', buildingEdge: 'rgba(180,90,255,.16)',
    roof: '#2a1840', wall: '#160b26',
    roads: ['#ff5cc8', '#c65cff', '#7d6cff', '#3f4c8f', '#2c3468'],
    glow: 1.15, text: '#ffd9f4',
  },
  sunset: {
    name: 'Sunset',
    bg: ['#2a1230', '#5a1f3a', '#8a2f38'],
    water: '#3a1c46', waterEdge: 'rgba(255,180,150,.22)',
    green: '#3a2340',
    building: 'rgba(255,150,120,.09)', buildingEdge: 'rgba(255,180,140,.18)',
    roof: '#512746', wall: '#301733',
    roads: ['#ffd9a0', '#ffb37c', '#ff8f6b', '#c76a68', '#8f4f5e'],
    glow: 0.7, text: '#ffe8cf',
  },
  forest: {
    name: 'Deep Forest',
    bg: ['#08160f', '#0f2a1c'],
    water: '#0c2536', waterEdge: 'rgba(120,190,220,.16)',
    green: '#123524',
    building: 'rgba(160,200,150,.08)', buildingEdge: 'rgba(180,220,170,.16)',
    roof: '#193c2b', wall: '#0e251b',
    roads: ['#e9f0c9', '#c6d99a', '#93b06f', '#5f7a4a', '#4a6038'],
    glow: 0.45, text: '#eaf3d8',
  },
  blueprint: {
    name: 'Blueprint',
    bg: ['#0a2a4a', '#0d3a66'],
    water: '#0c2f57', waterEdge: 'rgba(180,220,255,.28)',
    green: '#0f3a5f',
    building: 'rgba(200,230,255,.06)', buildingEdge: 'rgba(200,230,255,.28)',
    roof: '#134066', wall: '#0b2c4e',
    roads: ['#eaf6ff', '#bfe0ff', '#8fbde8', '#5f8fc0', '#4a78a8'],
    glow: 0.35, text: '#eaf6ff',
  },
  ivory: {
    name: 'Ivory Ink',
    bg: ['#f4efe4', '#e9e1d1'],
    water: '#cdd8d3', waterEdge: 'rgba(90,110,120,.25)',
    green: '#dbe2c9',
    building: 'rgba(60,55,48,.07)', buildingEdge: 'rgba(60,55,48,.22)',
    roof: '#d9cdb6', wall: '#c0b298',
    roads: ['#2a2622', '#4a443c', '#726a5e', '#9a9184', '#b3a99a'],
    glow: 0.0, text: '#2a2622',
  },
  vintage: {
    name: 'Vintage Atlas',
    bg: ['#e9ddc2', '#dcc9a4'],
    water: '#bcccc2', waterEdge: 'rgba(120,140,130,.25)',
    green: '#d0d8ab',
    building: 'rgba(95,72,45,.10)', buildingEdge: 'rgba(95,72,45,.28)',
    roof: '#cdb994', wall: '#a68f6a',
    roads: ['#3b2d1d', '#5c4831', '#7c6549', '#9c8669', '#b3a486'],
    glow: 0.0, text: '#3b2d1d',
  },
};

/* highway classification -> road tier index + base width (px @1920w) */
const ROAD_TIER = {
  motorway: 0, motorway_link: 0, trunk: 0, trunk_link: 0, primary: 0, primary_link: 0,
  secondary: 1, secondary_link: 1, tertiary: 1, tertiary_link: 1,
  residential: 2, unclassified: 2, living_street: 2, road: 2,
  service: 3,
  footway: 4, path: 4, pedestrian: 4, cycleway: 4, track: 4, steps: 4, bridleway: 4,
};
const TIER_WIDTH = [3.4, 2.1, 1.25, 0.75, 0.6];

/* ------------------------------------------------------------------
   STATE
------------------------------------------------------------------ */
const state = {
  map: null,
  drawing: false,
  rect: null,          // leaflet rectangle layer
  bounds: null,        // leaflet LatLngBounds of selection
  theme: 'midnight',
  effect: 'glow',      // 'glow' | '3d' | 'flat'
  data: null,          // parsed OSM elements for current render
  abort: null,         // AbortController for the in-flight fetch
  placeName: '',
  text: { pos: 'none', color: 'auto', font: 'Fraunces', title: '', sub: '' },
};

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

/* Lightweight console-only diagnostics (invisible to users). */
function dbg(msg) { try { console.log('[cartogram] ' + msg); } catch (_) {} }

/* ==================================================================
   MAP SETUP
================================================================== */
function initMap() {
  const map = L.map('map', { zoomControl: true, attributionControl: true, worldCopyJump: true })
    .setView([40.758, -73.9855], 13); // Times Square-ish

  // Dark, low-key basemap so the selection UI feels like part of the app.
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: 'abcd', maxZoom: 20,
  }).addTo(map);

  map.zoomControl.setPosition('topright');
  state.map = map;

  map.on('mousedown', onDrawStart);
  updateBadge();
  map.on('moveend zoomend', updateBadge);
}

function updateBadge() {
  const badge = $('#map-badge');
  if (state.bounds) {
    const km = boundsKm(state.bounds);
    badge.hidden = false;
    badge.innerHTML = `Selection <b>${km.w.toFixed(1)} × ${km.h.toFixed(1)} km</b>`;
  } else {
    badge.hidden = true;
  }
}

/* ---- rectangle drawing (drag to draw) ---- */
let drawStartLatLng = null;
function toggleDraw() {
  state.drawing = !state.drawing;
  $('#draw-btn').classList.toggle('active', state.drawing);
  document.body.classList.toggle('drawing', state.drawing);
  state.map.dragging[state.drawing ? 'disable' : 'enable']();
  $('#select-hint').textContent = state.drawing
    ? 'Now drag a box across the map…'
    : 'Click, then drag a box across the map to frame your scene.';
}

function onDrawStart(e) {
  if (!state.drawing) return;
  drawStartLatLng = e.latlng;
  if (state.rect) { state.map.removeLayer(state.rect); state.rect = null; }
  state.rect = L.rectangle([drawStartLatLng, drawStartLatLng], {
    color: '#7c8cff', weight: 2, fillColor: '#7c8cff', fillOpacity: 0.10, dashArray: '6 5',
  }).addTo(state.map);
  state.map.on('mousemove', onDrawMove);
  state.map.on('mouseup', onDrawEnd);
}
/* aspect ratio (w/h) of the selected output resolution */
function outputAspect() {
  const [w, h] = $('#opt-res').value.split('x').map(Number);
  return w / h;
}

function onDrawMove(e) {
  if (!drawStartLatLng) return;
  // Lock the box to the wallpaper's aspect ratio so what you draw is exactly
  // what you get (no crop). Work in container pixels (linear in Web Mercator).
  const asp = outputAspect();
  const p0 = state.map.latLngToContainerPoint(drawStartLatLng);
  const p1 = state.map.latLngToContainerPoint(e.latlng);
  const sx = p1.x < p0.x ? -1 : 1, sy = p1.y < p0.y ? -1 : 1;
  let w = Math.abs(p1.x - p0.x), h = Math.abs(p1.y - p0.y);
  if (w / h > asp) h = w / asp; else w = h * asp;   // grow to contain the drag
  const corner = state.map.containerPointToLatLng(L.point(p0.x + sx * w, p0.y + sy * h));
  state.rect.setBounds(L.latLngBounds(drawStartLatLng, corner));
}

/* Reshape the existing selection around its center to a new aspect ratio
   (used when the resolution changes after a box is drawn). */
function reshapeSelection() {
  if (!state.bounds || !state.rect) return;
  const map = state.map, asp = outputAspect();
  const c = map.latLngToContainerPoint(state.bounds.getCenter());
  const nw = map.latLngToContainerPoint(state.bounds.getNorthWest());
  const se = map.latLngToContainerPoint(state.bounds.getSouthEast());
  let w = Math.abs(se.x - nw.x), h = Math.abs(se.y - nw.y);
  if (w / h > asp) h = w / asp; else w = h * asp;
  const nb = L.latLngBounds(
    map.containerPointToLatLng(L.point(c.x - w / 2, c.y - h / 2)),
    map.containerPointToLatLng(L.point(c.x + w / 2, c.y + h / 2))
  );
  state.bounds = nb;
  state.rect.setBounds(nb);
  updateBadge();
}
function onDrawEnd() {
  state.map.off('mousemove', onDrawMove);
  state.map.off('mouseup', onDrawEnd);
  if (!state.rect) return;
  const b = state.rect.getBounds();
  // ignore accidental tiny drags
  if (b.getNorth() - b.getSouth() < 1e-4 && b.getEast() - b.getWest() < 1e-4) {
    state.map.removeLayer(state.rect); state.rect = null;
    drawStartLatLng = null; return;
  }
  state.bounds = b;
  state.rect.setStyle({ dashArray: null, fillOpacity: 0.06 });
  drawStartLatLng = null;
  if (state.drawing) toggleDraw();
  $('#generate-btn').disabled = false;
  updateBadge();
  dbg('box drawn: ' + boundsKm(b).w.toFixed(1) + '×' + boundsKm(b).h.toFixed(1) + ' km');
}

/* ==================================================================
   GEO HELPERS
================================================================== */
function boundsKm(b) {
  const midLat = (b.getNorth() + b.getSouth()) / 2;
  const h = (b.getNorth() - b.getSouth()) * 111.32;
  const w = (b.getEast() - b.getWest()) * 111.32 * Math.cos(midLat * Math.PI / 180);
  return { w: Math.abs(w), h: Math.abs(h) };
}

/* Expand a bounds by a fraction on each side (for fetch margin). Returns a
   plain object exposing the same getters buildQuery/boundsKm rely on. */
function expandBounds(b, frac) {
  const dLat = (b.getNorth() - b.getSouth()) * frac;
  const dLon = (b.getEast() - b.getWest()) * frac;
  const s = b.getSouth() - dLat, n = b.getNorth() + dLat;
  const w = b.getWest() - dLon, e = b.getEast() + dLon;
  return {
    getSouth: () => s, getNorth: () => n, getWest: () => w, getEast: () => e,
    getCenter: () => ({ lat: (s + n) / 2, lng: (w + e) / 2 }),
  };
}

/* Web Mercator projection to unit space (0..1). */
function project(lat, lon) {
  const x = (lon + 180) / 360;
  const s = Math.sin(lat * Math.PI / 180);
  const y = 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI);
  return { x, y };
}

/* ==================================================================
   SEARCH (Nominatim geocoding)
================================================================== */
let searchTimer = null;
async function onSearchInput() {
  const q = $('#search-input').value.trim();
  clearTimeout(searchTimer);
  if (q.length < 3) { $('#search-results').hidden = true; return; }
  searchTimer = setTimeout(() => runSearch(q), 350);
}
async function runSearch(q) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, { headers: { 'Accept-Language': navigator.language || 'en' } });
    const list = await res.json();
    const ul = $('#search-results');
    ul.innerHTML = '';
    if (!list.length) { ul.hidden = true; return; }
    list.forEach((r) => {
      const li = document.createElement('li');
      const main = r.display_name.split(',')[0];
      li.innerHTML = `<b>${escapeHtml(main)}</b><br>${escapeHtml(r.display_name.slice(main.length + 2))}`;
      li.onclick = () => selectSearch(r);
      ul.appendChild(li);
    });
    ul.hidden = false;
  } catch (_) { /* offline etc. */ }
}
function selectSearch(r) {
  $('#search-results').hidden = true;
  $('#search-input').value = r.display_name.split(',')[0];
  state.placeName = r.display_name.split(',')[0];
  if (r.boundingbox) {
    const [s, n, w, e] = r.boundingbox.map(Number);
    state.map.fitBounds([[s, w], [n, e]], { maxZoom: 15, padding: [30, 30] });
  } else {
    state.map.setView([+r.lat, +r.lon], 14);
  }
}

/* ==================================================================
   OVERPASS FETCH
================================================================== */
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

function buildQuery(b, wantBuildings, wantGreen) {
  const bbox = `${b.getSouth()},${b.getWest()},${b.getNorth()},${b.getEast()}`;
  const parts = [
    `way["highway"](${bbox});`,
    `way["natural"="water"](${bbox});`,
    `way["waterway"~"river|canal|stream"](${bbox});`,
    `relation["natural"="water"](${bbox});`,
    `way["natural"="coastline"](${bbox});`,
  ];
  if (wantGreen) {
    parts.push(`way["leisure"~"park|garden|nature_reserve"](${bbox});`);
    parts.push(`way["landuse"~"forest|grass|meadow|recreation_ground|cemetery"](${bbox});`);
    parts.push(`way["natural"="wood"](${bbox});`);
  }
  if (wantBuildings) parts.push(`way["building"](${bbox});`);
  return `[out:json][timeout:60];(${parts.join('')});out geom;`;
}

/* fetch with a per-request timeout, honouring an external cancel signal. */
function fetchWithTimeout(url, opts, ms, signal) {
  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  if (signal) {
    if (signal.aborted) ctrl.abort();
    else signal.addEventListener('abort', onAbort);
  }
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onAbort);
  });
}

const CANCELLED = '__cancelled__';

async function fetchOSM(query, onProgress, signal, reqTimeout) {
  reqTimeout = reqTimeout || 12000;
  let lastErr;
  for (let i = 0; i < OVERPASS_ENDPOINTS.length; i++) {
    // If the user hit Cancel, stop immediately.
    if (signal && signal.aborted) throw new Error(CANCELLED);
    try {
      onProgress && onProgress(0.15 + i * 0.08,
        i ? `Server was busy — trying mirror ${i}…` : 'Contacting map server…');
      dbg('fetch → ' + OVERPASS_ENDPOINTS[i] + ' (timeout ' + reqTimeout + 'ms)');
      const t0 = Date.now();
      const res = await fetchWithTimeout(OVERPASS_ENDPOINTS[i], {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(query),
      }, reqTimeout, signal);
      dbg('response ' + res.status + ' in ' + (Date.now() - t0) + 'ms');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      onProgress && onProgress(0.55, 'Downloading map data…');
      const json = await res.json();
      dbg('parsed ' + (json.elements ? json.elements.length : 0) + ' elements');
      return json.elements || [];
    } catch (err) {
      dbg('fetch failed: ' + (err.name || '') + ' ' + (err.message || err));
      // A user cancel aborts the shared signal; a per-request timeout does not.
      if (signal && signal.aborted) throw new Error(CANCELLED);
      lastErr = err;
    }
  }
  throw lastErr || new Error('busy');
}

/* ==================================================================
   GENERATE
================================================================== */
async function generate() {
  if (!state.bounds) { dbg('generate: no bounds'); return; }
  const km = boundsKm(state.bounds);
  const area = km.w * km.h;
  dbg('generate start · area ' + area.toFixed(1) + ' km²');
  let wantBuildings = $('#opt-buildings').checked;
  const wantGreen = $('#opt-green').checked;

  // Only skip buildings for extreme areas where the download would be huge
  // and they'd be invisible specks anyway. Otherwise honour the toggle and
  // give the request the time it needs.
  if (area > 450 && wantBuildings) {
    wantBuildings = false;
    toast('Very large area — buildings skipped (too much data to draw meaningfully).');
  } else if (wantBuildings && area > 70) {
    toast('Including buildings for a large area — this can take up to a minute.');
  }

  // Building queries over big areas are heavy: scale the per-request timeout
  // (and the overall watchdog) with the area so we don't abort a slow download.
  const reqTimeout = wantBuildings
    ? Math.min(75000, Math.max(20000, Math.round(area * 350)))
    : 12000;

  state.abort = new AbortController();
  showLoader(true);
  setLoader(0.05, 'Gathering the streets…', wantBuildings && area > 70 ? 'Large area — please wait' : 'Reading OpenStreetMap');

  // Hard watchdog: whatever happens, never spin forever.
  const watchdog = setTimeout(() => {
    if (state.abort) state.abort.abort();
  }, reqTimeout * OVERPASS_ENDPOINTS.length + 20000);

  try {
    // Fetch a little beyond the drawn box so the cover-crop always has data.
    const fetchB = expandBounds(state.bounds, 0.10);
    const q = buildQuery(fetchB, wantBuildings, wantGreen);
    dbg('query built (' + q.length + ' chars) buildings=' + wantBuildings + ' timeout=' + reqTimeout);
    const elements = await fetchOSM(q, setLoaderP, state.abort.signal, reqTimeout);
    if (!elements.length) throw new Error('No map features found here. Try a populated area or a bigger box.');

    dbg('rendering ' + elements.length + ' elements');
    setLoader(0.7, 'Painting your artwork…', 'Rendering vectors');
    // sort into layers
    state.data = classify(elements);

    // Reverse-geocode for a nice default title (non-blocking failure).
    setLoader(0.85, 'Naming your place…', 'Almost there');
    await ensurePlaceName();

    // Prepare text defaults
    state.text.title = state.placeName || '';
    state.text.sub = formatCoords(state.bounds);
    $('#txt-title').value = state.text.title;
    $('#txt-sub').value = state.text.sub;

    setLoader(1, 'Done', '');
    await nextFrame();
    openResult();
    render();
  } catch (err) {
    console.error(err);
    if (err.message === CANCELLED) {
      toast('Generation cancelled.');
    } else if (err.message.startsWith('No map features')) {
      toast(err.message, true);
    } else {
      // network error, timeout, busy server, or HTTP error
      toast('Could not reach the map servers — they may be busy, or the area is too large. Try a smaller box or retry in a moment.', true);
    }
  } finally {
    clearTimeout(watchdog);
    state.abort = null;
    showLoader(false);
  }
}

function cancelGenerate() {
  if (state.abort) state.abort.abort();
}

function classify(elements) {
  const roads = [[], [], [], [], []], water = [], green = [], buildings = [], waterways = [];
  for (const el of elements) {
    const g = el.geometry;
    if (!g || !g.length) continue;
    const t = el.tags || {};
    if (t.highway && ROAD_TIER[t.highway] !== undefined) {
      roads[ROAD_TIER[t.highway]].push(g);
    } else if (t.natural === 'water' || (el.type === 'relation' && t.natural === 'water')) {
      water.push(g);
    } else if (t.waterway) {
      waterways.push(g);
    } else if (t.natural === 'coastline') {
      waterways.push(g); // treated as line-ish edge
    } else if (t.leisure || t.landuse || t.natural === 'wood') {
      green.push(g);
    } else if (t.building) {
      buildings.push(g);
    }
  }
  return { roads, water, green, buildings, waterways };
}

async function ensurePlaceName() {
  if (state.placeName) return;
  try {
    const c = state.bounds.getCenter();
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${c.lat}&lon=${c.lng}&zoom=12`;
    const res = await fetchWithTimeout(url, { headers: { 'Accept-Language': navigator.language || 'en' } }, 8000);
    const j = await res.json();
    const a = j.address || {};
    state.placeName = a.city || a.town || a.village || a.suburb || a.county || a.state || (j.name || '');
  } catch (_) { /* ignore */ }
}

function formatCoords(b) {
  const c = b.getCenter();
  const ns = c.lat >= 0 ? 'N' : 'S', ew = c.lng >= 0 ? 'E' : 'W';
  return `${Math.abs(c.lat).toFixed(4)}° ${ns}   ${Math.abs(c.lng).toFixed(4)}° ${ew}`;
}

/* ==================================================================
   RENDERING  (the artwork engine)
================================================================== */
function currentSize() {
  const [w, h] = $('#opt-res').value.split('x').map(Number);
  return { w, h };
}

function render() {
  const canvas = $('#art-canvas');
  const { w, h } = currentSize();
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  const theme = THEMES[state.theme];
  const d = state.data;

  // --- geographic -> screen transform (COVER: fill canvas, crop overflow) ---
  const b = state.bounds;
  const p1 = project(b.getNorth(), b.getWest()); // top-left
  const p2 = project(b.getSouth(), b.getEast()); // bottom-right
  const minX = p1.x, minY = p1.y;
  const dw = p2.x - minX, dh = p2.y - minY;
  const scale = Math.max(w / dw, h / dh);       // cover
  const offX = (w - dw * scale) / 2;
  const offY = (h - dh * scale) / 2;
  const S = (lat, lon) => {
    const p = project(lat, lon);
    return [(p.x - minX) * scale + offX, (p.y - minY) * scale + offY];
  };
  const lineScale = w / 1920;

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // --- background gradient ---
  paintBackground(ctx, w, h, theme);

  // --- green / parks ---
  if (d.green.length) {
    ctx.fillStyle = theme.green;
    for (const geom of d.green) fillPoly(ctx, geom, S);
  }

  // --- water bodies ---
  if (d.water.length) {
    ctx.save();
    ctx.fillStyle = theme.water;
    ctx.shadowColor = theme.waterEdge; ctx.shadowBlur = 8 * lineScale;
    for (const geom of d.water) fillPoly(ctx, geom, S);
    ctx.restore();
  }
  // waterways / coastline as soft lines
  if (d.waterways.length) {
    ctx.save();
    ctx.strokeStyle = theme.water;
    ctx.lineWidth = 2.4 * lineScale;
    ctx.shadowColor = theme.waterEdge; ctx.shadowBlur = 4 * lineScale;
    for (const geom of d.waterways) strokePath(ctx, geom, S);
    ctx.restore();
  }

  // --- buildings ---
  if (d.buildings.length) {
    if (state.effect === '3d') {
      drawBuildings3D(ctx, d.buildings, S, theme, lineScale);
    } else {
      ctx.fillStyle = theme.building;
      ctx.strokeStyle = theme.buildingEdge;
      ctx.lineWidth = Math.max(0.4, 0.5 * lineScale);
      for (const geom of d.buildings) fillPoly(ctx, geom, S, true);
    }
  }

  const glowOn = state.effect !== 'flat';

  // --- roads: minor first so majors sit on top ---
  for (let tier = 4; tier >= 0; tier--) {
    const segs = d.roads[tier];
    if (!segs.length) continue;
    const width = TIER_WIDTH[tier] * lineScale;
    // glow pass — tight, subtle halo (capped so no style is overwhelming)
    const g = Math.min(0.6, theme.glow);
    if (glowOn && g > 0 && tier <= 2) {
      ctx.save();
      ctx.strokeStyle = theme.roads[tier];
      ctx.globalAlpha = 0.4 * g;
      ctx.lineWidth = width * (1.5 + g);
      ctx.shadowColor = theme.roads[tier];
      ctx.shadowBlur = width * (2 + 3 * g);
      for (const geom of segs) strokePath(ctx, geom, S);
      ctx.restore();
    }
    // crisp pass
    ctx.strokeStyle = theme.roads[tier];
    ctx.lineWidth = width;
    for (const geom of segs) strokePath(ctx, geom, S);
  }

  // --- finishing touches ---
  applyVignette(ctx, w, h, theme);

  // --- text overlay ---
  drawText(ctx, w, h, theme);
}

/* stable pseudo-random in [0,1) from a number (so re-renders are identical) */
function hash01(x) {
  const s = Math.sin(x * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}

/* Extruded "3D" buildings: each footprint gets varied height, shaded walls
   and a lighter roof, drawn back-to-front for a believable little skyline. */
function drawBuildings3D(ctx, buildings, S, theme, lineScale) {
  const base = 7 * lineScale;                 // base extrusion height (px)
  const dirX = 0.55;                          // light/extrusion direction
  const polys = [];
  for (const g of buildings) {
    if (g.length < 3) continue;
    const pts = g.map((p) => S(p.lat, p.lon));
    let cx = 0, cy = 0;
    for (const p of pts) { cx += p[0]; cy += p[1]; }
    cx /= pts.length; cy /= pts.length;
    const mag = base * (0.5 + 1.4 * hash01(cx * 0.13 + cy * 0.07));
    polys.push({ pts, cy, ex: mag * dirX, ey: -mag });
  }
  // draw far (top of image) first so nearer buildings overlap correctly
  polys.sort((a, b) => a.cy - b.cy);

  for (const { pts, ex, ey } of polys) {
    // walls
    ctx.fillStyle = theme.wall;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.lineTo(b[0] + ex, b[1] + ey);
      ctx.lineTo(a[0] + ex, a[1] + ey);
      ctx.closePath();
      ctx.fill();
    }
    // roof
    ctx.fillStyle = theme.roof;
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const x = pts[i][0] + ex, y = pts[i][1] + ey;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = theme.buildingEdge;
    ctx.lineWidth = Math.max(0.4, 0.5 * lineScale);
    ctx.stroke();
  }
}

function paintBackground(ctx, w, h, theme) {
  const g = ctx.createLinearGradient(0, 0, w * 0.6, h);
  const stops = theme.bg;
  stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // subtle radial lift in the upper area
  const r = ctx.createRadialGradient(w * 0.35, h * 0.2, 0, w * 0.35, h * 0.2, Math.max(w, h) * 0.9);
  r.addColorStop(0, 'rgba(255,255,255,0.05)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = r;
  ctx.fillRect(0, 0, w, h);
}

function fillPoly(ctx, geom, S, stroke) {
  ctx.beginPath();
  for (let i = 0; i < geom.length; i++) {
    const [x, y] = S(geom[i].lat, geom[i].lon);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  if (stroke) ctx.stroke();
}

function strokePath(ctx, geom, S) {
  ctx.beginPath();
  for (let i = 0; i < geom.length; i++) {
    const [x, y] = S(geom[i].lat, geom[i].lon);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function applyVignette(ctx, w, h, theme) {
  // Gentle vignette so the artwork reads as a calm background, not a spotlight.
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.78);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, theme.glow > 0 ? 'rgba(0,0,0,0.22)' : 'rgba(0,0,0,0.08)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/* ==================================================================
   TEXT OVERLAY
================================================================== */
function drawText(ctx, w, h, theme) {
  const t = state.text;
  if (t.pos === 'none' || (!t.title && !t.sub)) return;

  const color = t.color === 'auto' ? theme.text : t.color;
  const pad = w * 0.055;
  const titleSize = Math.round(w * 0.052);
  const subSize = Math.round(w * 0.0155);
  const font = t.font === 'Manrope' ? 'Manrope' : 'Fraunces';

  // vertical align + horizontal align from position code
  const v = t.pos[0]; // t / c / b
  const hAlign = t.pos[1]; // l / c / r
  let x, align;
  if (hAlign === 'l') { x = pad; align = 'left'; }
  else if (hAlign === 'r') { x = w - pad; align = 'right'; }
  else { x = w / 2; align = 'center'; }

  let y;
  if (v === 't') y = pad + titleSize * 0.85;
  else if (v === 'b') y = h - pad - (t.sub ? subSize * 2.2 : 0);
  else y = h / 2 - (t.sub ? subSize : 0);

  ctx.save();
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = titleSize * 0.25;
  ctx.fillStyle = color;

  // Title
  if (t.title) {
    ctx.font = `700 ${titleSize}px ${font}, serif`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = font === 'Manrope' ? '0.02em' : '0px';
    ctx.fillText(t.title, x, y);
  }

  // Divider + subtitle
  if (t.sub) {
    const sy = y + subSize * 1.9;
    ctx.shadowBlur = subSize * 0.4;
    // thin divider line
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, w * 0.0012);
    const lineW = w * 0.16;
    let lx0, lx1;
    if (align === 'left') { lx0 = x; lx1 = x + lineW; }
    else if (align === 'right') { lx0 = x - lineW; lx1 = x; }
    else { lx0 = x - lineW / 2; lx1 = x + lineW / 2; }
    ctx.beginPath();
    ctx.moveTo(lx0, y + subSize * 0.7);
    ctx.lineTo(lx1, y + subSize * 0.7);
    ctx.stroke();
    ctx.restore();

    ctx.font = `500 ${subSize}px Manrope, sans-serif`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0.28em';
    ctx.globalAlpha = 0.92;
    ctx.fillText(t.sub.toUpperCase(), align === 'left' ? x : align === 'right' ? x : x, sy);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  }
  ctx.restore();
}

/* ==================================================================
   RESULT PANEL / EXPORT
================================================================== */
function openResult() { $('#result').hidden = false; }
function closeResult() { $('#result').hidden = true; }

function download() {
  const canvas = $('#art-canvas');
  const name = (state.text.title || state.placeName || 'cartogram')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cartogram';
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${name}-wallpaper.png`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Saved ✓');
  }, 'image/png');
}

/* ==================================================================
   THEME SWATCH PREVIEWS
================================================================== */
function buildThemeGrid() {
  const grid = $('#theme-grid');
  Object.entries(THEMES).forEach(([key, theme]) => {
    const btn = document.createElement('button');
    btn.className = 'theme-swatch' + (key === state.theme ? ' active' : '');
    btn.dataset.theme = key;
    const c = document.createElement('canvas');
    c.width = 120; c.height = 75;
    drawSwatch(c.getContext('2d'), theme);
    btn.appendChild(c);
    const label = document.createElement('span');
    label.className = 'tname'; label.textContent = theme.name;
    btn.appendChild(label);
    btn.onclick = () => selectTheme(key);
    grid.appendChild(btn);
  });
}

/* miniature schematic map so users instantly get the vibe */
function drawSwatch(ctx, theme) {
  const w = 120, h = 75;
  const g = ctx.createLinearGradient(0, 0, w, h);
  theme.bg.forEach((c, i) => g.addColorStop(i / (theme.bg.length - 1), c));
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  // water blob
  ctx.fillStyle = theme.water;
  ctx.beginPath(); ctx.ellipse(96, 58, 34, 24, 0.4, 0, 7); ctx.fill();
  // roads
  ctx.lineCap = 'round';
  const lines = [
    [3, [8, 12, 112, 30]], [3, [30, 4, 44, 70]], [3, [70, 6, 88, 68]],
    [2, [4, 40, 116, 52]], [1, [8, 24, 60, 60]], [1, [50, 10, 110, 46]],
  ];
  lines.forEach(([tier, [x0, y0, x1, y1]]) => {
    if (theme.glow > 0) {
      ctx.strokeStyle = theme.roads[tier]; ctx.globalAlpha = 0.5;
      ctx.lineWidth = tier === 3 ? 5 : 3.5; ctx.shadowColor = theme.roads[tier]; ctx.shadowBlur = 5;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    }
    ctx.strokeStyle = theme.roads[tier === 3 ? 0 : tier];
    ctx.lineWidth = tier === 3 ? 2.4 : tier === 2 ? 1.6 : 1;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  });
}

function selectTheme(key) {
  state.theme = key;
  $$('.theme-swatch').forEach((s) => s.classList.toggle('active', s.dataset.theme === key));
  if (!$('#result').hidden && state.data) render();
}

/* ==================================================================
   UI GLUE
================================================================== */
function bindUI() {
  $('#draw-btn').onclick = toggleDraw;
  $('#generate-btn').onclick = generate;
  $('#loader-cancel').onclick = cancelGenerate;
  $('#search-input').oninput = onSearchInput;
  $('#search-form').onsubmit = (e) => { e.preventDefault(); const q = $('#search-input').value.trim(); if (q) runSearch(q); };
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search')) $('#search-results').hidden = true;
  });

  // result panel
  $('#close-result').onclick = closeResult;
  $('#download-btn').onclick = download;
  $('#regen-btn').onclick = render;

  // text inputs
  $('#txt-title').oninput = (e) => { state.text.title = e.target.value; render(); };
  $('#txt-sub').oninput = (e) => { state.text.sub = e.target.value; render(); };
  $('#txt-font').onchange = (e) => { state.text.font = e.target.value; render(); };

  // position grid
  $$('#pos-grid .pos').forEach((btn) => {
    btn.onclick = () => {
      $$('#pos-grid .pos').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.text.pos = btn.dataset.pos;
      render();
    };
  });
  // default to bottom-left once we have text — nicer than none
  // (kept as 'none' initially; user picks)

  // text colour
  $$('#text-color-row .cswatch').forEach((btn) => {
    btn.onclick = () => {
      $$('#text-color-row .cswatch').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.text.color = btn.dataset.color;
      render();
    };
  });

  // re-render on resolution change; also reshape the box to the new ratio
  $('#opt-res').onchange = () => {
    reshapeSelection();
    if (!$('#result').hidden && state.data) render();
  };
  // depth / effect
  $('#opt-effect').onchange = (e) => {
    state.effect = e.target.value;
    if (!$('#result').hidden && state.data) render();
  };

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('#result').hidden) closeResult();
  });
}

/* ==================================================================
   LOADER / TOAST HELPERS
================================================================== */
let loaderTimer = null, loaderStart = 0;
function showLoader(on) {
  $('#loader').hidden = !on;
  clearInterval(loaderTimer);
  if (on) {
    setLoader(0.05);
    loaderStart = Date.now();
    const el = $('#loader-elapsed');
    if (el) {
      el.textContent = '0s';
      loaderTimer = setInterval(() => {
        el.textContent = Math.round((Date.now() - loaderStart) / 1000) + 's';
      }, 500);
    }
  }
}
function setLoader(p, title, sub) {
  $('#loader-bar-fill').style.width = Math.round(p * 100) + '%';
  if (title !== undefined) $('#loader-title').textContent = title;
  if (sub !== undefined) $('#loader-sub').textContent = sub;
}
function setLoaderP(p, msg) { setLoader(p, undefined, msg); }

let toastTimer = null;
function toast(msg, isErr) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.toggle('err', !!isErr);
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add('show'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => (el.hidden = true), 250);
  }, isErr ? 4200 : 2200);
}

const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ==================================================================
   BOOT
================================================================== */
document.addEventListener('DOMContentLoaded', async () => {
  // make sure fonts are ready before any canvas text render
  if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (_) {} }
  // Guard each init step so one failure can't take down the rest of the UI.
  dbg('boot · L=' + typeof L);
  if (typeof L === 'undefined') {
    toast('Map library failed to load. Check your connection and reload.', true);
  } else {
    try { initMap(); dbg('map ready'); } catch (e) { dbg('initMap error: ' + e.message); toast('Map failed to start.', true); }
  }
  try { buildThemeGrid(); } catch (e) { dbg('themeGrid error: ' + e.message); }
  try { bindUI(); dbg('UI ready — draw a box'); } catch (e) { dbg('bindUI error: ' + e.message); }
});
