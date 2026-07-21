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
    green: '#152a2a', greenEdge: 'rgba(90,150,120,.0)',
    building: 'rgba(120,140,190,.10)', buildingEdge: 'rgba(150,175,230,.14)',
    roads: ['#f6d18a', '#d9b06a', '#8f7a52', '#5f5540', '#4a4636'],
    glow: 0.5, text: '#f6ead0',
  },
  noir: {
    name: 'Neon Noir',
    bg: ['#07060d', '#120a1f'],
    water: '#0e0b22', waterEdge: 'rgba(120,80,220,.22)',
    green: '#0d1420', greenEdge: 'rgba(0,0,0,0)',
    building: 'rgba(120,60,200,.10)', buildingEdge: 'rgba(180,90,255,.16)',
    roads: ['#ff5cc8', '#c65cff', '#7d6cff', '#3f4c8f', '#2c3468'],
    glow: 1.15, text: '#ffd9f4',
  },
  blueprint: {
    name: 'Blueprint',
    bg: ['#0a2a4a', '#0d3a66'],
    water: '#0c2f57', waterEdge: 'rgba(180,220,255,.28)',
    green: '#0f3a5f', greenEdge: 'rgba(0,0,0,0)',
    building: 'rgba(200,230,255,.06)', buildingEdge: 'rgba(200,230,255,.28)',
    roads: ['#eaf6ff', '#bfe0ff', '#8fbde8', '#5f8fc0', '#4a78a8'],
    glow: 0.35, text: '#eaf6ff',
  },
  ivory: {
    name: 'Ivory Ink',
    bg: ['#f4efe4', '#e9e1d1'],
    water: '#cdd8d3', waterEdge: 'rgba(90,110,120,.25)',
    green: '#dbe2c9', greenEdge: 'rgba(0,0,0,0)',
    building: 'rgba(60,55,48,.07)', buildingEdge: 'rgba(60,55,48,.22)',
    roads: ['#2a2622', '#4a443c', '#726a5e', '#9a9184', '#b3a99a'],
    glow: 0.0, text: '#2a2622',
  },
  sunset: {
    name: 'Sunset',
    bg: ['#2a1230', '#5a1f3a', '#8a2f38'],
    water: '#3a1c46', waterEdge: 'rgba(255,180,150,.22)',
    green: '#3a2340', greenEdge: 'rgba(0,0,0,0)',
    building: 'rgba(255,150,120,.09)', buildingEdge: 'rgba(255,180,140,.18)',
    roads: ['#ffd9a0', '#ffb37c', '#ff8f6b', '#c76a68', '#8f4f5e'],
    glow: 0.7, text: '#ffe8cf',
  },
  forest: {
    name: 'Deep Forest',
    bg: ['#08160f', '#0f2a1c'],
    water: '#0c2536', waterEdge: 'rgba(120,190,220,.16)',
    green: '#123524', greenEdge: 'rgba(0,0,0,0)',
    building: 'rgba(160,200,150,.08)', buildingEdge: 'rgba(180,220,170,.16)',
    roads: ['#e9f0c9', '#c6d99a', '#93b06f', '#5f7a4a', '#4a6038'],
    glow: 0.45, text: '#eaf3d8',
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
  data: null,          // parsed OSM elements for current render
  placeName: '',
  text: { pos: 'none', color: 'auto', font: 'Fraunces', title: '', sub: '' },
};

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

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
function onDrawMove(e) {
  if (!drawStartLatLng) return;
  state.rect.setBounds(L.latLngBounds(drawStartLatLng, e.latlng));
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

async function fetchOSM(query, onProgress) {
  let lastErr;
  for (let i = 0; i < OVERPASS_ENDPOINTS.length; i++) {
    try {
      onProgress && onProgress(0.15 + i * 0.05, 'Contacting map server' + (i ? ' (mirror ' + i + ')' : '') + '…');
      const res = await fetch(OVERPASS_ENDPOINTS[i], {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(query),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      onProgress && onProgress(0.55, 'Downloading streets & water…');
      const json = await res.json();
      return json.elements || [];
    } catch (err) { lastErr = err; }
  }
  throw lastErr || new Error('All map servers unavailable');
}

/* ==================================================================
   GENERATE
================================================================== */
async function generate() {
  if (!state.bounds) return;
  const km = boundsKm(state.bounds);
  const area = km.w * km.h;
  let wantBuildings = $('#opt-buildings').checked;
  const wantGreen = $('#opt-green').checked;

  // Very large areas + buildings = enormous downloads. Protect the user.
  if (area > 90 && wantBuildings) {
    wantBuildings = false;
    toast('Large area — buildings skipped to keep it fast.');
  }

  showLoader(true);
  setLoader(0.05, 'Gathering the streets…', 'Reading OpenStreetMap');

  try {
    // Fetch a little beyond the drawn box so the cover-crop always has data.
    const fetchB = expandBounds(state.bounds, 0.10);
    const q = buildQuery(fetchB, wantBuildings, wantGreen);
    const elements = await fetchOSM(q, setLoaderP);
    if (!elements.length) throw new Error('No map features found here. Try a populated area or a bigger box.');

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
    toast(err.message || 'Something went wrong.', true);
  } finally {
    showLoader(false);
  }
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
    const res = await fetch(url, { headers: { 'Accept-Language': navigator.language || 'en' } });
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
    ctx.shadowColor = theme.waterEdge; ctx.shadowBlur = 22 * lineScale;
    for (const geom of d.water) fillPoly(ctx, geom, S);
    ctx.restore();
  }
  // waterways / coastline as soft lines
  if (d.waterways.length) {
    ctx.save();
    ctx.strokeStyle = theme.water;
    ctx.lineWidth = 2.4 * lineScale;
    ctx.shadowColor = theme.waterEdge; ctx.shadowBlur = 10 * lineScale;
    for (const geom of d.waterways) strokePath(ctx, geom, S);
    ctx.restore();
  }

  // --- buildings ---
  if (d.buildings.length) {
    ctx.fillStyle = theme.building;
    ctx.strokeStyle = theme.buildingEdge;
    ctx.lineWidth = Math.max(0.4, 0.5 * lineScale);
    for (const geom of d.buildings) {
      fillPoly(ctx, geom, S, true);
    }
  }

  // --- roads: minor first so majors sit on top ---
  for (let tier = 4; tier >= 0; tier--) {
    const segs = d.roads[tier];
    if (!segs.length) continue;
    const width = TIER_WIDTH[tier] * lineScale;
    // glow pass
    if (theme.glow > 0 && tier <= 2) {
      ctx.save();
      ctx.strokeStyle = theme.roads[tier];
      ctx.globalAlpha = 0.5 * theme.glow;
      ctx.lineWidth = width * (2.6 + theme.glow);
      ctx.shadowColor = theme.roads[tier];
      ctx.shadowBlur = width * (5 + 6 * theme.glow);
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
  applyGrain(ctx, w, h);

  // --- text overlay ---
  drawText(ctx, w, h, theme);
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
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, theme.glow > 0 ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.14)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/* very light film grain for a premium, non-flat finish */
function applyGrain(ctx, w, h) {
  const step = 3;
  const gw = Math.ceil(w / step), gh = Math.ceil(h / step);
  const noise = ctx.createImageData(gw, gh);
  for (let i = 0; i < noise.data.length; i += 4) {
    const v = (Math.random() * 255) | 0;
    noise.data[i] = noise.data[i + 1] = noise.data[i + 2] = v;
    noise.data[i + 3] = 8; // very subtle
  }
  const tmp = document.createElement('canvas');
  tmp.width = gw; tmp.height = gh;
  tmp.getContext('2d').putImageData(noise, 0, 0);
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(tmp, 0, 0, w, h);
  ctx.restore();
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

  // re-render on resolution change if result open
  $('#opt-res').onchange = () => { if (!$('#result').hidden && state.data) render(); };

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('#result').hidden) closeResult();
  });
}

/* ==================================================================
   LOADER / TOAST HELPERS
================================================================== */
function showLoader(on) { $('#loader').hidden = !on; if (on) setLoader(0.05); }
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
  initMap();
  buildThemeGrid();
  bindUI();
});
