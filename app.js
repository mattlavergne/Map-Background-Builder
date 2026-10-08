/* =========================================================
   Cartogram — Map Artwork Background Builder
   A live, restylable OpenStreetMap (vector tiles from OpenFreeMap,
   no API key) that you frame and export as a full-resolution
   wallpaper. 100% client-side.
   ========================================================= */
import * as maplibregl from './vendor/maplibre/maplibre-gl.mjs';

/* ------------------------------------------------------------------
   THEMES
   'detailed' themes keep the full map look (road casings, POIs,
   shields, street names). 'art' themes drop the cartographic clutter
   for clean, glowing line-work.
   roads = [motorway/primary, secondary/tertiary, street, service, path]
------------------------------------------------------------------ */
const THEMES = {
  /* ---------- Detailed ---------- */
  street: {
    name: 'Street', kind: 'detailed', raw: true, labels: 'all',
    // Liberty's own colours (used for the swatch + title text only).
    bg: ['#f8f4f0'], water: '#9ebdff', green: '#d8e8c8',
    roads: ['#ffcc88', '#ffeeaa', '#ffffff', '#ffffff', '#ffffff'], casing: '#e9ac77',
    text: '#2b2b2b',
  },
  night: {
    name: 'Night', kind: 'detailed', labels: 'all',
    bg: ['#1b1f27'], landAlt: 'rgba(255,255,255,.025)', landOther: 'rgba(255,255,255,.035)',
    water: '#183247', green: '#1c3024', wood: '#1d3727',
    building: '#272c36', buildingEdge: '#323844', roof: '#353c4a',
    roads: ['#cf8c5c', '#8f887a', '#464c59', '#3b404c', '#565c6b'], casing: '#12151b',
    rail: '#5c6370', boundary: '#7a8190',
    label: '#dfe3ea', halo: '#14171d', roadLabel: '#a9b0bd', waterLabel: '#7fb0d0', poiText: '#b9c0cc',
    text: '#eef2f8',
  },
  paper: {
    name: 'Paper', kind: 'detailed', labels: 'all',
    bg: ['#f3f2ee'], landAlt: 'rgba(0,0,0,.025)', landOther: 'rgba(0,0,0,.03)',
    water: '#c3d3dd', green: '#e0e8d6', wood: '#d6e1cb',
    building: '#e4e2dc', buildingEdge: '#d5d2c9', roof: '#ebe9e4',
    roads: ['#ffffff', '#ffffff', '#ffffff', '#fbfbf9', '#ffffff'], casing: '#d4d1c8',
    rail: '#c6c3bb', boundary: '#b3b0a8',
    label: '#575a62', halo: '#f7f6f3', roadLabel: '#878a91', waterLabel: '#6f8a9c', poiText: '#7b7e86',
    text: '#2c2e33',
  },
  fiord: {
    name: 'Fiord', kind: 'detailed', labels: 'all',
    bg: ['#3d4a62'], landAlt: 'rgba(255,255,255,.03)', landOther: 'rgba(255,255,255,.04)',
    water: '#2b364c', green: '#3e505c', wood: '#3c5160',
    building: '#4a5870', buildingEdge: '#55647d', roof: '#5a6a88',
    roads: ['#9fb6d6', '#8aa0c0', '#5d6c86', '#56647c', '#6b7a94'], casing: '#333f55',
    rail: '#6b7891', boundary: '#8c99b3',
    label: '#e3e9f3', halo: '#2f3a50', roadLabel: '#b3c0d6', waterLabel: '#9db3d4', poiText: '#c3cee0',
    text: '#eef3fb',
  },

  /* ---------- Artistic ---------- */
  midnight: {
    name: 'Midnight', kind: 'art', labels: 'none',
    bg: ['#0a0e17', '#131b2e'],
    water: '#12203b', green: '#152a2a',
    building: 'rgba(120,140,190,.10)', buildingEdge: 'rgba(150,175,230,.14)', roof: '#2b3350',
    roads: ['#f6d18a', '#ecc47c', '#dcb46e', '#cba564', '#bb975c'],
    glow: 0.5, text: '#f6ead0',
  },
  copper: {
    name: 'Copper', kind: 'art', labels: 'none',
    bg: ['#0b0906', '#1a130d'],
    water: '#12181a', green: '#1a1a10',
    building: 'rgba(230,160,110,.08)', buildingEdge: 'rgba(240,180,130,.16)', roof: '#3a281a',
    roads: ['#ffbf8a', '#f4aa72', '#e2945c', '#d0824c', '#bf7340'],
    glow: 0.6, text: '#ffe6cf',
  },
  rosegold: {
    name: 'Rosé Gold', kind: 'art', labels: 'none',
    bg: ['#0e0810', '#20121c'],
    water: '#1b1222', green: '#201826',
    building: 'rgba(230,180,190,.08)', buildingEdge: 'rgba(240,200,200,.16)', roof: '#3a2430',
    roads: ['#f7cbc2', '#eeb4a9', '#e2a094', '#d48d82', '#c67d73'],
    glow: 0.55, text: '#f9e3dc',
  },
  platinum: {
    name: 'Platinum', kind: 'art', labels: 'none',
    bg: ['#070709', '#15171c'],
    water: '#0f141d', green: '#12161c',
    building: 'rgba(210,220,235,.07)', buildingEdge: 'rgba(220,230,245,.20)', roof: '#2a2f3a',
    roads: ['#ffffff', '#e9edf3', '#d2d9e2', '#bcc4d0', '#a4adba'],
    glow: 0.5, text: '#eef2f8',
  },
  crimson: {
    name: 'Crimson', kind: 'art', labels: 'none',
    bg: ['#0d0708', '#200d11'],
    water: '#1a0e18', green: '#1a1016',
    building: 'rgba(230,140,130,.08)', buildingEdge: 'rgba(240,170,150,.16)', roof: '#3a1820',
    roads: ['#ffd9a0', '#f2907e', '#e8746e', '#d86068', '#c8535d'],
    glow: 0.7, text: '#ffe0d5',
  },
  emeraldgold: {
    name: 'Emerald', kind: 'art', labels: 'none',
    bg: ['#06120d', '#0d2018'],
    water: '#0b2330', green: '#0f3324',
    building: 'rgba(180,200,150,.08)', buildingEdge: 'rgba(210,200,150,.16)', roof: '#153a2a',
    roads: ['#f6d99a', '#bfe0a0', '#a2d290', '#88c17e', '#72b06f'],
    glow: 0.5, text: '#eef3d8',
  },
  sapphire: {
    name: 'Sapphire', kind: 'art', labels: 'none',
    bg: ['#060a16', '#0c1732'],
    water: '#0a1530', green: '#0d2036',
    building: 'rgba(150,190,255,.07)', buildingEdge: 'rgba(180,210,255,.18)', roof: '#123056',
    roads: ['#d7ebff', '#a8ccff', '#8fb8f5', '#7aa4e8', '#6892d8'],
    glow: 0.6, text: '#e6f0ff',
  },
  noir: {
    name: 'Neon', kind: 'art', labels: 'none',
    bg: ['#07060d', '#120a1f'],
    water: '#0e0b22', green: '#0d1420',
    building: 'rgba(120,60,200,.10)', buildingEdge: 'rgba(180,90,255,.16)', roof: '#2a1840',
    roads: ['#ff5cc8', '#e666e0', '#cc74ff', '#ab82ff', '#948dff'],
    glow: 1.0, text: '#ffd9f4',
  },
  sunset: {
    name: 'Sunset', kind: 'art', labels: 'none',
    bg: ['#2a1230', '#5a1f3a', '#8a2f38'],
    water: '#3a1c46', green: '#3a2340',
    building: 'rgba(255,150,120,.09)', buildingEdge: 'rgba(255,180,140,.18)', roof: '#512746',
    roads: ['#ffd9a0', '#ffc088', '#ffab7a', '#f5926f', '#e17e6a'],
    glow: 0.7, text: '#ffe8cf',
  },
  forest: {
    name: 'Forest', kind: 'art', labels: 'none',
    bg: ['#08160f', '#0f2a1c'],
    water: '#0c2536', green: '#123524',
    building: 'rgba(160,200,150,.08)', buildingEdge: 'rgba(180,220,170,.16)', roof: '#193c2b',
    roads: ['#e9f0c9', '#d2e0a8', '#bccf90', '#a7bf7a', '#94b06f'],
    glow: 0.45, text: '#eaf3d8',
  },
  blueprint: {
    name: 'Blueprint', kind: 'art', labels: 'none',
    bg: ['#0a2a4a', '#0d3a66'],
    water: '#0c2f57', green: '#0f3a5f',
    building: 'rgba(200,230,255,.06)', buildingEdge: 'rgba(200,230,255,.28)', roof: '#134066',
    roads: ['#eaf6ff', '#cfe6ff', '#b6d8f6', '#9fcaee', '#8bbde8'],
    glow: 0.35, text: '#eaf6ff',
  },
  toner: {
    name: 'Toner', kind: 'art', labels: 'places',
    bg: ['#ffffff'],
    water: '#111111', green: '#ffffff',
    building: '#dcdcdc', buildingEdge: '#c4c4c4', roof: '#e8e8e8',
    roads: ['#000000', '#000000', '#111111', '#2a2a2a', '#555555'],
    glow: 0, text: '#000000', label: '#000000', halo: '#ffffff',
  },
  ivory: {
    name: 'Ivory', kind: 'art', labels: 'none',
    bg: ['#f4efe4', '#e9e1d1'],
    water: '#cdd8d3', green: '#dbe2c9',
    building: 'rgba(60,55,48,.07)', buildingEdge: 'rgba(60,55,48,.22)', roof: '#d9cdb6',
    roads: ['#231e19', '#312b24', '#3f3830', '#4d453c', '#5c5248'],
    glow: 0, text: '#2a2622',
  },
  vintage: {
    name: 'Vintage', kind: 'art', labels: 'none',
    bg: ['#e9ddc2', '#dcc9a4'],
    water: '#bcccc2', green: '#d0d8ab',
    building: 'rgba(95,72,45,.10)', buildingEdge: 'rgba(95,72,45,.28)', roof: '#cdb994',
    roads: ['#3b2d1d', '#493829', '#584634', '#665440', '#75634c'],
    glow: 0, text: '#3b2d1d',
  },
};

/* Line widths (CSS px by zoom) for art themes: every street stays visible
   from city scale down, with no casings. Exported images scale these with
   the resolution, so the result matches the preview exactly. */
const ART_WIDTH = [
  [5, 0.6, 9, 1.2, 12, 2.2, 14, 3.6, 16, 7, 18, 14],
  [8, 0.4, 11, 0.9, 13, 1.6, 14, 2.2, 16, 4.5, 18, 9],
  [12, 0.35, 13, 0.7, 14, 1.15, 15, 1.8, 16, 3, 18, 7],
  [13, 0.25, 14, 0.6, 15, 0.9, 16, 1.6, 18, 4],
  [14, 0.35, 15, 0.6, 16, 1, 18, 2.2],
];

const RESOLUTIONS = [
  ['1920x1080', 'Desktop 1080p · 1920 × 1080'],
  ['2560x1440', 'Desktop 1440p · 2560 × 1440'],
  ['3840x2160', 'Desktop 4K · 3840 × 2160'],
  ['2880x1800', 'MacBook 16:10 · 2880 × 1800'],
  ['3440x1440', 'Ultrawide · 3440 × 1440'],
  ['1290x2796', 'iPhone · 1290 × 2796'],
  ['1440x3200', 'Android · 1440 × 3200'],
];

const CREDIT = '© OpenStreetMap contributors · OpenMapTiles · OpenFreeMap';

/* ------------------------------------------------------------------
   STATE
------------------------------------------------------------------ */
const state = {
  map: null,
  base: null,          // OpenFreeMap "Liberty" style JSON (vendored snapshot)
  theme: 'night',
  labels: 'all',       // 'none' | 'places' | 'all'
  buildings: true,
  tilt: false,
  size: { w: 2560, h: 1440 },
  frame: { x: 0, y: 0, w: 0, h: 0 },  // frame rect in map-container CSS px
  placeName: '',
  text: { pos: 'none', font: 'Fraunces', title: '', sub: '', subAuto: true },
  exporting: false,
};

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

/* ==================================================================
   STYLE ENGINE — recolour Liberty by layer role
================================================================== */
function layerRole(id) {
  if (id === 'background') return 'background';
  if (id === 'natural_earth') return 'relief';
  if (id === 'park') return 'park';
  if (id === 'park_outline') return 'hide';
  if (id === 'landuse_residential') return 'landAlt';
  if (id === 'landcover_wood') return 'wood';
  if (id === 'landcover_grass') return 'green';
  if (id === 'landcover_wetland' || id === 'road_area_pattern') return 'hide';
  if (/^landcover_|^landuse_|^aeroway_fill$/.test(id)) return 'landOther';
  if (/^aeroway_/.test(id)) return 'aeroway';
  if (id === 'water') return 'water';
  if (id === 'waterway_tunnel') return 'hide';
  if (/^waterway_(river|other)$/.test(id)) return 'waterway';
  if (/one_way/.test(id)) return 'oneway';
  if (/shield/.test(id)) return 'shield';
  if (/rail_hatching$/.test(id)) return 'railHatch';
  if (/rail$/.test(id)) return 'rail';
  if (/^(road|tunnel|bridge)_/.test(id)) return /_casing$/.test(id) ? 'casing' : 'road';
  if (id === 'building') return 'building';
  if (id === 'building-3d') return 'building3d';
  if (/^boundary/.test(id)) return 'boundary';
  if (/^poi_|^airport$/.test(id)) return 'poi';
  if (/^highway-name/.test(id)) return 'roadLabel';
  if (/^water(way)?_.*label$/.test(id)) return 'waterLabel';
  if (/^label_/.test(id)) return 'placeLabel';
  return 'other';
}

function roadTier(id) {
  if (/motorway|trunk_primary/.test(id)) return 0;
  if (/secondary_tertiary|_link/.test(id)) return 1;
  if (/minor|street/.test(id)) return 2;
  if (/service_track/.test(id)) return 3;
  return 4; // path_pedestrian
}

/* Multiply a (possibly zoom-interpolated) width by k. */
function scaleWidth(v, k) {
  if (typeof v === 'number') return v * k;
  if (Array.isArray(v) && v[0] === 'interpolate') {
    // ["interpolate", interp, ["zoom"], z0, v0, z1, v1, …] — scale the v's.
    return v.map((x, i) => (i >= 4 && i % 2 === 0 && typeof x === 'number' ? x * k : x));
  }
  if (v && v.stops) return { ...v, stops: v.stops.map(([z, w]) => [z, w * k]) };
  return v;
}

const artWidth = (tier) => ['interpolate', ['exponential', 1.5], ['zoom'], ...ART_WIDTH[tier]];

function isDark(hex) {
  const c = hex.replace('#', '');
  const n = parseInt(c.length === 3 ? c.replace(/./g, '$&$&') : c.slice(0, 6), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.45;
}

function labelVisible(role, mode, theme) {
  if (mode === 'none') return false;
  if (role === 'placeLabel' || role === 'waterLabel') return true;
  if (mode === 'places') return false;
  if (role === 'shield') return theme.kind === 'detailed';
  return true; // poi, roadLabel
}

function buildStyle() {
  const theme = THEMES[state.theme];
  const style = JSON.parse(JSON.stringify(state.base));
  const art = theme.kind === 'art';
  const dark = isDark(theme.bg[0]);
  const out = [];
  const glowLayers = [];

  for (const layer of style.layers) {
    const role = layerRole(layer.id);
    const paint = (layer.paint = layer.paint || {});
    const layout = (layer.layout = layer.layout || {});
    let visible = true;

    // The page paints the background (so art themes can use a gradient).
    if (role === 'background') visible = false;
    if (role === 'building' || role === 'building3d') visible = state.buildings;
    if (role === 'building3d') visible = state.buildings && state.tilt;
    if (['placeLabel', 'waterLabel', 'poi', 'roadLabel', 'shield'].includes(role)) {
      visible = labelVisible(role, state.labels, theme);
    }
    if (role === 'oneway') visible = !!theme.raw && state.labels === 'all';

    if (!theme.raw) {
      const label = theme.label || theme.text;
      const halo = theme.halo || theme.bg[0];
      switch (role) {
        case 'relief': case 'hide': case 'oneway': case 'railHatch':
          visible = false; break;
        case 'landAlt': case 'landOther':
          paint['fill-color'] = theme[role] || 'rgba(0,0,0,0)'; paint['fill-opacity'] = 1; break;
        case 'park': case 'green':
          paint['fill-color'] = theme.green; paint['fill-opacity'] = 1;
          delete paint['fill-outline-color']; break;
        case 'wood':
          paint['fill-color'] = theme.wood || theme.green; paint['fill-opacity'] = 1; break;
        case 'water':
          paint['fill-color'] = theme.water; break;
        case 'waterway':
          paint['line-color'] = theme.water; break;
        case 'aeroway':
          paint['line-color'] = theme.roads[3]; paint['line-opacity'] = art ? 0.5 : 1; break;
        case 'casing':
          if (art || !theme.casing) visible = false;
          else paint['line-color'] = theme.casing;
          break;
        case 'road': {
          const tier = roadTier(layer.id);
          paint['line-color'] = theme.roads[tier];
          if (art) {
            paint['line-width'] = artWidth(tier);
            delete paint['line-dasharray'];
            // Let every class appear as soon as the tiles carry it.
            delete layer.minzoom;
          }
          if (layer.id.startsWith('tunnel_')) paint['line-opacity'] = 0.55;
          if (art && theme.glow > 0 && tier <= 2 && !layer.id.startsWith('tunnel_')) {
            glowLayers.push({
              id: layer.id + '-glow', type: 'line', source: layer.source,
              'source-layer': layer['source-layer'], filter: layer.filter,
              layout: { 'line-cap': 'round', 'line-join': 'round' },
              paint: {
                'line-color': theme.roads[tier],
                'line-width': scaleWidth(paint['line-width'], 3.2),
                'line-blur': scaleWidth(paint['line-width'], 2.2),
                'line-opacity': Math.min(0.55, 0.42 * theme.glow),
              },
            });
          }
          break;
        }
        case 'rail':
          paint['line-color'] = theme.rail || theme.roads[3];
          if (art) paint['line-opacity'] = 0.45;
          break;
        case 'building':
          paint['fill-color'] = theme.building;
          paint['fill-outline-color'] = theme.buildingEdge;
          break;
        case 'building3d':
          paint['fill-extrusion-color'] = theme.roof; paint['fill-extrusion-opacity'] = 0.9; break;
        case 'boundary':
          if (art) visible = false;
          else paint['line-color'] = theme.boundary || label;
          break;
        case 'placeLabel': case 'waterLabel': case 'roadLabel': case 'poi':
          paint['text-color'] = role === 'waterLabel' ? (theme.waterLabel || label)
            : role === 'roadLabel' ? (theme.roadLabel || label)
            : role === 'poi' ? (theme.poiText || label) : label;
          paint['text-halo-color'] = halo;
          paint['text-halo-width'] = 1.2;
          // Liberty's black town dots and colour POI icons are drawn for a
          // light map; tone them down (or drop them) elsewhere.
          if (role === 'placeLabel') paint['icon-opacity'] = 0;
          if (role === 'poi') paint['icon-opacity'] = dark ? 0.7 : 0.9;
          break;
      }
    }

    layout.visibility = visible ? 'visible' : 'none';
    out.push(layer);
  }

  // Glow sits under the crisp road lines but above everything below them.
  if (glowLayers.length) {
    const at = out.findIndex((l) => /^(road|bridge)_/.test(l.id));
    out.splice(at, 0, ...glowLayers);
  }
  style.layers = out;
  return style;
}

function applyStyle() {
  if (!state.map || !state.base) return;
  state.map.setStyle(buildStyle(), { diff: true });
  paintBackdrop();
  drawOverlay();
}

/* ==================================================================
   MAP + FRAME
================================================================== */
async function initMap() {
  const res = await fetch('vendor/styles/liberty.json');
  state.base = await res.json();

  const map = new maplibregl.Map({
    container: 'map',
    style: buildStyle(),
    center: [-73.9855, 40.758], zoom: 13.2,  // Midtown Manhattan
    attributionControl: { compact: true },
    canvasContextAttributes: { antialias: true },
    maxPitch: 70,
  });
  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
  state.map = map;

  map.on('move', updateBadge);
  map.on('moveend', onMoveEnd);
  map.on('pitchend', () => {
    // Keep the 3D switch honest if the user tilts with right-drag / ctrl-drag.
    const tilted = map.getPitch() > 5;
    if (tilted !== state.tilt) { state.tilt = tilted; $('#opt-tilt').checked = tilted; applyStyle(); }
  });

  new ResizeObserver(layoutFrame).observe($('.map-wrap'));
  layoutFrame();
}

/* Fit the wallpaper-shaped frame inside the map area, centred, so that the
   map centre is always the frame centre. */
function layoutFrame() {
  const wrap = $('.map-wrap');
  const cw = wrap.clientWidth, ch = wrap.clientHeight;
  const asp = state.size.w / state.size.h;
  const m = Math.max(18, Math.min(cw, ch) * 0.05);
  let fw = cw - 2 * m, fh = fw / asp;
  if (fh > ch - 2 * m) { fh = ch - 2 * m; fw = fh * asp; }
  // Whole pixels keep the export crop exact.
  fw = Math.round(fw); fh = Math.round(fh);
  const f = { x: Math.round((cw - fw) / 2), y: Math.round((ch - fh) / 2), w: fw, h: fh };
  state.frame = f;
  for (const el of [$('#frame'), $('#overlay'), $('#backdrop-frame')]) {
    Object.assign(el.style, { left: f.x + 'px', top: f.y + 'px', width: f.w + 'px', height: f.h + 'px' });
  }
  paintBackdrop();
  drawOverlay();
  updateBadge();
}

function updateBadge() {
  if (!state.map) return;
  const f = state.frame, map = state.map;
  const a = map.unproject([f.x, f.y + f.h / 2]), b = map.unproject([f.x + f.w, f.y + f.h / 2]);
  const c = map.unproject([f.x + f.w / 2, f.y]), d = map.unproject([f.x + f.w / 2, f.y + f.h]);
  const wKm = a.distanceTo(b) / 1000, hKm = c.distanceTo(d) / 1000;
  const fmt = (v) => (v < 10 ? v.toFixed(1) : Math.round(v));
  $('#map-badge').innerHTML = `${state.size.w} × ${state.size.h} · <b>${fmt(wKm)} × ${fmt(hKm)} km</b>`;
}

function onMoveEnd() {
  if (state.text.subAuto) {
    state.text.sub = formatCoords(state.map.getCenter());
    $('#txt-sub').value = state.text.sub;
    drawOverlay();
  }
}

/* ==================================================================
   BACKDROP / OVERLAY (shared by the live preview and the export)
================================================================== */
function paintBackground(ctx, w, h, theme) {
  const g = ctx.createLinearGradient(0, 0, w * 0.6, h);
  const stops = theme.bg.length > 1 ? theme.bg : [theme.bg[0], theme.bg[0]];
  stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  if (theme.kind === 'art' && isDark(theme.bg[0])) {
    // subtle radial lift in the upper area
    const r = ctx.createRadialGradient(w * 0.35, h * 0.2, 0, w * 0.35, h * 0.2, Math.max(w, h) * 0.9);
    r.addColorStop(0, 'rgba(255,255,255,0.05)');
    r.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = r;
    ctx.fillRect(0, 0, w, h);
  }
}

function applyVignette(ctx, w, h, theme) {
  if (theme.kind !== 'art') return;
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.5, w / 2, h / 2, Math.max(w, h) * 0.82);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, theme.glow > 0 ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.05)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function drawCredit(ctx, w, h, theme) {
  const base = Math.sqrt(w * h);
  const size = Math.max(9, base * 0.0082);
  ctx.save();
  ctx.font = `500 ${size}px Manrope, sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = theme.text;
  ctx.globalAlpha = 0.45;
  ctx.fillText(CREDIT, w - base * 0.016, h - base * 0.013);
  ctx.restore();
}

/* Everything painted on top of the map: vignette, title text, credit. */
function paintOverlay(ctx, w, h) {
  const theme = THEMES[state.theme];
  applyVignette(ctx, w, h, theme);
  drawText(ctx, w, h, theme);
  drawCredit(ctx, w, h, theme);
}

function sizeCanvas(c) {
  const dpr = window.devicePixelRatio || 1;
  const w = Math.round(state.frame.w * dpr), h = Math.round(state.frame.h * dpr);
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  return { w, h };
}

function paintBackdrop() {
  const theme = THEMES[state.theme];
  $('.map-wrap').style.background = theme.bg[0];
  const c = $('#backdrop-frame');
  const { w, h } = sizeCanvas(c);
  paintBackground(c.getContext('2d'), w, h, theme);
}

function drawOverlay() {
  const c = $('#overlay');
  const { w, h } = sizeCanvas(c);
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, w, h);
  paintOverlay(ctx, w, h);
}

/* ==================================================================
   TEXT
================================================================== */
function withAlpha(hex, a) {
  const c = hex.replace('#', '');
  const n = parseInt(c.length === 3 ? c.replace(/./g, '$&$&') : c.slice(0, 6), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function drawText(ctx, w, h, theme) {
  const t = state.text;
  if (t.pos === 'none' || (!t.title && !t.sub)) return;

  // Size from the image area so portrait (phone) and landscape read alike.
  const base = Math.sqrt(w * h);
  const color = theme.text;
  const pad = base * 0.073;
  const font = t.font === 'Manrope' ? 'Manrope' : 'Fraunces';
  const subSize = Math.round(base * 0.0207);
  let titleSize = Math.round(base * (t.pos === 'cc' ? 0.085 : 0.069));

  const v = t.pos[0];      // b / c
  const hAlign = t.pos[1]; // l / c
  const align = hAlign === 'l' ? 'left' : 'center';
  const x = hAlign === 'l' ? pad : w / 2;

  ctx.save();
  // Long titles shrink to fit the width.
  if (t.title) {
    ctx.font = `700 ${titleSize}px ${font}, serif`;
    const tw = ctx.measureText(t.title).width;
    if (tw > w - 2 * pad) titleSize = Math.floor(titleSize * (w - 2 * pad) / tw);
  }
  const y = v === 'b' ? h - pad - (t.sub ? subSize * 2.2 : 0) : h / 2 - (t.sub ? subSize : 0);

  // Soft scrim in the theme's background colour keeps the title legible over
  // busy, labelled maps.
  const bg = theme.bg[theme.bg.length - 1];
  if (v === 'b') {
    const g = ctx.createLinearGradient(0, y - titleSize * 2.2, 0, h);
    g.addColorStop(0, withAlpha(bg, 0));
    g.addColorStop(0.55, withAlpha(bg, 0.55));
    g.addColorStop(1, withAlpha(bg, 0.8));
    ctx.fillStyle = g;
    ctx.fillRect(0, y - titleSize * 2.2, w, h);
  } else {
    const r = Math.max(titleSize * 4, base * 0.3);
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, r);
    g.addColorStop(0, withAlpha(bg, 0.7));
    g.addColorStop(1, withAlpha(bg, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.shadowColor = isDark(theme.bg[0]) ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)';
  ctx.shadowBlur = titleSize * 0.25;
  ctx.fillStyle = color;

  if (t.title) {
    ctx.font = `700 ${titleSize}px ${font}, serif`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = font === 'Manrope' ? '0.02em' : '0px';
    ctx.fillText(t.title, x, y);
  }

  if (t.sub) {
    const sy = y + subSize * 1.9;
    ctx.shadowBlur = subSize * 0.4;
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, base * 0.0016);
    const lineW = Math.min(w - 2 * pad, base * 0.21);
    const lx0 = align === 'left' ? x : x - lineW / 2;
    ctx.beginPath();
    ctx.moveTo(lx0, y + subSize * 0.7);
    ctx.lineTo(lx0 + lineW, y + subSize * 0.7);
    ctx.stroke();
    ctx.restore();

    ctx.font = `500 ${subSize}px Manrope, sans-serif`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0.28em';
    ctx.globalAlpha = 0.92;
    ctx.fillText(t.sub.toUpperCase(), x, sy);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  }
  ctx.restore();
}

function formatCoords(c) {
  const ns = c.lat >= 0 ? 'N' : 'S', ew = c.lng >= 0 ? 'E' : 'W';
  return `${Math.abs(c.lat).toFixed(4)}° ${ns}   ${Math.abs(c.lng).toFixed(4)}° ${ew}`;
}

async function ensurePlaceName() {
  if (state.placeName) return;
  try {
    const c = state.map.getCenter();
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${c.lat}&lon=${c.lng}&zoom=12`;
    const res = await fetch(url, { headers: { 'Accept-Language': navigator.language || 'en' } });
    const j = await res.json();
    const a = j.address || {};
    state.placeName = a.city || a.town || a.village || a.suburb || a.county || a.state || (j.name || '');
  } catch (_) { /* offline etc. */ }
}

async function setTextPos(pos) {
  state.text.pos = pos;
  setSeg('#seg-text', pos);
  $('#text-fields').hidden = pos === 'none';
  drawOverlay();
  if (pos !== 'none' && !state.text.title) {
    await ensurePlaceName();
    // The user may have typed a title while the lookup was in flight.
    if (state.text.title) return;
    state.text.title = state.placeName;
    $('#txt-title').value = state.text.title;
    drawOverlay();
  }
}

/* ==================================================================
   SEARCH (Nominatim geocoding)
================================================================== */
let searchTimer = null;
function onSearchInput() {
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
  const name = r.display_name.split(',')[0];
  $('#search-input').value = name;
  state.placeName = name;
  state.text.title = name;
  $('#txt-title').value = name;
  if (r.boundingbox) {
    const [s, n, w, e] = r.boundingbox.map(Number);
    state.map.fitBounds([[w, s], [e, n]], { maxZoom: 15, padding: 40, duration: 900 });
  } else {
    state.map.flyTo({ center: [+r.lon, +r.lat], zoom: 14 });
  }
  drawOverlay();
}

/* ==================================================================
   EXPORT — re-render the framed view off-screen at full resolution
================================================================== */
async function download() {
  if (state.exporting || !state.map) return;
  state.exporting = true;
  const btn = $('#download-btn');
  btn.disabled = true;
  btn.querySelector('.label').textContent = 'Rendering…';

  const { w, h } = state.size;
  const map = state.map, f = state.frame;
  // Perspective depends on the viewport height, so a tilted view is rendered
  // at the full map size and cropped; a flat view only needs the frame.
  const pitched = map.getPitch() > 0.5;
  const cont = map.getContainer();
  const vw = pitched ? cont.clientWidth : f.w, vh = pitched ? cont.clientHeight : f.h;
  const ratio = w / f.w;

  const host = document.createElement('div');
  host.style.cssText = `position:fixed;left:-100000px;top:0;width:${vw}px;height:${vh}px;pointer-events:none;`;
  document.body.appendChild(host);
  let exp;
  try {
    exp = new maplibregl.Map({
      container: host, style: map.getStyle(),
      center: map.getCenter(), zoom: map.getZoom(), bearing: map.getBearing(), pitch: map.getPitch(),
      pixelRatio: ratio, maxCanvasSize: [16384, 16384],
      canvasContextAttributes: { antialias: true, preserveDrawingBuffer: true },
      interactive: false, attributionControl: false, fadeDuration: 0,
    });
    await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('timeout')), 45000);
      exp.once('idle', () => { clearTimeout(t); resolve(); });
    });

    const pr = exp.getPixelRatio();
    const out = document.createElement('canvas');
    out.width = w; out.height = h;
    const ctx = out.getContext('2d');
    paintBackground(ctx, w, h, THEMES[state.theme]);
    const ox = pitched ? f.x : 0, oy = pitched ? f.y : 0;
    ctx.drawImage(exp.getCanvas(), ox * pr, oy * pr, f.w * pr, f.h * pr, 0, 0, w, h);
    paintOverlay(ctx, w, h);

    const blob = await new Promise((r) => out.toBlob(r, 'image/png'));
    const name = (state.text.title || state.placeName || 'cartogram')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cartogram';
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${name}-${THEMES[state.theme].name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${w}x${h}.png`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast(pr < ratio * 0.98
      ? `Saved — your graphics card capped it at ${Math.round(f.w * pr)} px wide, so it was upscaled.`
      : 'Saved ✓', pr < ratio * 0.98);
  } catch (err) {
    console.error(err);
    toast('Export failed — the map tiles may still be loading. Try again in a moment.', true);
  } finally {
    if (exp) exp.remove();
    host.remove();
    state.exporting = false;
    btn.disabled = false;
    btn.querySelector('.label').textContent = 'Download wallpaper';
  }
}

/* ==================================================================
   THEME SWATCHES
================================================================== */
function buildThemeGrid() {
  const groups = { detailed: $('#theme-grid-detailed'), art: $('#theme-grid-art') };
  Object.entries(THEMES).forEach(([key, theme]) => {
    const btn = document.createElement('button');
    btn.className = 'theme-swatch' + (key === state.theme ? ' active' : '');
    btn.dataset.theme = key;
    btn.title = theme.name;
    const c = document.createElement('canvas');
    c.width = 120; c.height = 75;
    drawSwatch(c.getContext('2d'), theme);
    btn.appendChild(c);
    const label = document.createElement('span');
    label.className = 'tname'; label.textContent = theme.name;
    btn.appendChild(label);
    btn.onclick = () => selectTheme(key);
    groups[theme.kind].appendChild(btn);
  });
}

/* miniature schematic map so the vibe reads at a glance */
function drawSwatch(ctx, theme) {
  const w = 120, h = 75;
  const g = ctx.createLinearGradient(0, 0, w, h);
  const bg = theme.bg.length > 1 ? theme.bg : [theme.bg[0], theme.bg[0]];
  bg.forEach((c, i) => g.addColorStop(i / (bg.length - 1), c));
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = theme.green;
  ctx.beginPath(); ctx.ellipse(22, 60, 22, 12, -0.3, 0, 7); ctx.fill();
  ctx.fillStyle = theme.water;
  ctx.beginPath(); ctx.ellipse(96, 58, 34, 24, 0.4, 0, 7); ctx.fill();
  ctx.lineCap = 'round';
  const lines = [
    [2, [8, 12, 112, 30]], [2, [30, 4, 44, 70]], [2, [70, 6, 88, 68]],
    [1, [4, 40, 116, 52]], [0, [8, 24, 60, 60]], [0, [50, 10, 110, 46]],
  ];
  const detailed = theme.kind === 'detailed';
  lines.forEach(([tier, [x0, y0, x1, y1]]) => {
    const lw = [3.2, 2.2, 1.3][tier];
    const seg = () => { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); };
    if (detailed && theme.casing) { ctx.strokeStyle = theme.casing; ctx.lineWidth = lw + 1.6; seg(); }
    if (theme.glow > 0) {
      ctx.strokeStyle = theme.roads[tier]; ctx.globalAlpha = 0.5;
      ctx.lineWidth = lw + 2; ctx.shadowColor = theme.roads[tier]; ctx.shadowBlur = 5; seg();
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    }
    ctx.strokeStyle = theme.roads[tier]; ctx.lineWidth = lw; seg();
  });
  if (detailed) {
    // a couple of tiny "labels"
    ctx.fillStyle = theme.label || theme.text; ctx.globalAlpha = 0.75;
    ctx.fillRect(14, 30, 22, 3); ctx.fillRect(74, 18, 16, 3);
    ctx.globalAlpha = 1;
  }
}

function selectTheme(key) {
  state.theme = key;
  $$('.theme-swatch').forEach((s) => s.classList.toggle('active', s.dataset.theme === key));
  // Each theme brings its own label density; the switch stays editable.
  state.labels = THEMES[key].labels;
  setSeg('#seg-labels', state.labels);
  applyStyle();
}

/* ==================================================================
   UI GLUE
================================================================== */
function setSeg(sel, value) {
  $$(sel + ' button').forEach((b) => {
    b.classList.toggle('active', b.dataset.v === value);
    b.setAttribute('aria-pressed', String(b.dataset.v === value));
  });
}
function bindSeg(sel, fn) {
  $$(sel + ' button').forEach((b) => { b.onclick = () => fn(b.dataset.v); });
}

function screenSize() {
  const dpr = window.devicePixelRatio || 1;
  const w = Math.round(screen.width * dpr), h = Math.round(screen.height * dpr);
  return w >= 640 && h >= 640 ? `${w}x${h}` : null;
}

function buildResolutionSelect() {
  const sel = $('#opt-res');
  const mine = screenSize();
  const opts = mine ? [[mine, `This screen · ${mine.replace('x', ' × ')}`], ...RESOLUTIONS] : RESOLUTIONS;
  sel.innerHTML = opts.map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
  sel.value = mine || '2560x1440';
  setSize(sel.value);
}
function setSize(v) {
  const [w, h] = v.split('x').map(Number);
  state.size = { w, h };
  layoutFrame();
}

function bindUI() {
  $('#search-input').oninput = onSearchInput;
  $('#search-form').onsubmit = (e) => { e.preventDefault(); const q = $('#search-input').value.trim(); if (q) runSearch(q); };
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search')) $('#search-results').hidden = true;
  });

  bindSeg('#seg-labels', (v) => { state.labels = v; setSeg('#seg-labels', v); applyStyle(); });
  $('#opt-buildings').onchange = (e) => { state.buildings = e.target.checked; applyStyle(); };
  $('#opt-tilt').onchange = (e) => {
    state.tilt = e.target.checked;
    applyStyle();
    state.map.easeTo({ pitch: state.tilt ? 55 : 0, duration: 700 });
    if (state.tilt && state.map.getZoom() < 14.5) toast('Zoom in close to see 3D buildings rise.');
  };

  $('#opt-res').onchange = (e) => setSize(e.target.value);
  bindSeg('#seg-text', setTextPos);
  bindSeg('#seg-font', (v) => { state.text.font = v; setSeg('#seg-font', v); drawOverlay(); });
  $('#txt-title').oninput = (e) => { state.text.title = e.target.value; drawOverlay(); };
  $('#txt-sub').oninput = (e) => { state.text.sub = e.target.value; state.text.subAuto = !e.target.value; drawOverlay(); };

  $('#download-btn').onclick = download;
  window.addEventListener('resize', () => { paintBackdrop(); drawOverlay(); });
}

/* ==================================================================
   TOAST / HELPERS
================================================================== */
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
  }, isErr ? 4800 : 2400);
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ==================================================================
   BOOT
================================================================== */
(async () => {
  try { buildThemeGrid(); } catch (e) { console.error(e); }
  try { bindUI(); } catch (e) { console.error(e); }
  try {
    await initMap();
    buildResolutionSelect();
    state.text.sub = formatCoords(state.map.getCenter());
    $('#txt-sub').value = state.text.sub;
  } catch (e) {
    console.error(e);
    toast('The map failed to load. Check your connection and reload.', true);
  }
  // Canvas text needs the web fonts; redraw once they're in.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawOverlay);
})();
