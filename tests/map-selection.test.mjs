import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { normalizeFeatures } from '../geocoding.js';

// Run the actual app selection function with a map double. No WebGL or tiles
// are needed to verify Photon adapter -> camera -> title integration.
const app = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const selection = app.slice(app.indexOf('function selectSearch(r)'), app.indexOf('/* ==================================================================\n   EXPORT'));
function setup() {
  const elements = new Map();
  const fit = [], fly = [];
  const state = { text: {}, map: { fitBounds: (...args) => fit.push(args), flyTo: (...args) => fly.push(args) } };
  let overlays = 0;
  const context = vm.createContext({ state, $: selector => {
    if (!elements.has(selector)) elements.set(selector, {});
    return elements.get(selector);
  }, drawOverlay: () => overlays++ });
  vm.runInContext(selection, context);
  return { state, elements, fit, fly, context, overlays: () => overlays };
}

test('city selection fits its extent and fills location, title, and overlay', () => {
  const s = setup();
  s.context.result = normalizeFeatures([{ geometry: { type: 'Point', coordinates: [-92, 30] },
    properties: { name: 'Lafayette', extent: [-92.1, 30.3, -91.9, 30.1] } }])[0];
  vm.runInContext('selectSearch(result)', s.context);
  assert.equal(JSON.stringify(s.fit[0][0]), JSON.stringify([[-92.1, 30.1], [-91.9, 30.3]]));
  assert.equal(s.fit[0][1].maxZoom, 15);
  assert.equal(s.state.placeName, 'Lafayette');
  assert.equal(s.state.text.title, 'Lafayette');
  assert.equal(s.elements.get('#txt-title').value, 'Lafayette');
  assert.equal(s.overlays(), 1);
});

test('landmark without extent flies to correct longitude and latitude', () => {
  const s = setup();
  s.context.result = normalizeFeatures([{ geometry: { type: 'Point', coordinates: [2.2945, 48.8584] },
    properties: { name: 'Eiffel Tower' } }])[0];
  vm.runInContext('selectSearch(result)', s.context);
  assert.equal(JSON.stringify(s.fly[0][0].center), JSON.stringify([2.2945, 48.8584]));
  assert.equal(s.fly[0][0].zoom, 14);
  assert.equal(s.fit.length, 0);
});
