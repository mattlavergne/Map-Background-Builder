import test from 'node:test';
import assert from 'node:assert/strict';
import { bindLocationSearch } from '../location-search.js';

class Element {
  children = []; hidden = false; disabled = false; value = ''; textContent = ''; attributes = {};
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  setAttribute(name, value) { this.attributes[name] = value; }
}
function setup(search) {
  const form = new Element(), input = new Element(), results = new Element(), status = new Element(), submit = new Element();
  const calls = [], selected = [];
  form.querySelector = () => submit;
  const dismiss = bindLocationSearch({ form, input, results, status, createElement: () => new Element(),
    geocoder: { search: query => { calls.push(query); return search(query); } }, onSelect: result => selected.push(result) });
  return { form, input, results, status, submit, calls, selected, dismiss,
    search: () => form.onsubmit({ preventDefault() {} }),
    type: value => { input.value = value; input.oninput(); } };
}
const place = { name: 'Lafayette', context: 'Louisiana, United States', lat: 30.22, lon: -92.02 };
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };

test('typing three or more characters never calls the geocoder; blank submit gives guidance', async () => {
  const s = setup(async () => [place]);
  for (const value of ['L', 'La', 'Laf', 'Lafayette']) s.type(value);
  await new Promise(resolve => setTimeout(resolve, 400));
  assert.equal(s.calls.length, 0);
  s.type('  '); await s.search();
  assert.equal(s.calls.length, 0);
  assert.match(s.status.textContent, /Enter a place/);
});

test('Enter/click duplicate submissions make one lookup and show busy state', async () => {
  const gate = deferred();
  const s = setup(() => gate.promise);
  s.type('Lafayette');
  const first = s.search();
  const duplicate = s.search();
  assert.equal(s.calls.length, 1);
  assert.equal(s.submit.disabled, true);
  assert.equal(s.form.attributes['aria-busy'], 'true');
  gate.resolve([place]);
  await Promise.all([first, duplicate]);
  assert.equal(s.submit.disabled, false);
  assert.equal(s.results.hidden, false);
  const button = s.results.children[0].children[0];
  assert.equal(button.type, 'button');
  button.onclick();
  assert.deepEqual(s.selected, [place]);
  assert.equal(s.input.value, 'Lafayette');
  assert.equal(s.results.hidden, true);
});

test('changing query prevents late results from replacing a newer search', async () => {
  const old = deferred(), latest = deferred();
  const s = setup(query => query === 'old' ? old.promise : latest.promise);
  s.type('old'); const a = s.search();
  s.type('new'); const b = s.search();
  old.resolve([place]); await a;
  assert.equal(s.results.hidden, true);
  assert.equal(s.submit.disabled, true);
  latest.resolve([{ ...place, name: 'Paris' }]); await b;
  assert.equal(s.results.children[0].children[0].children[0].textContent, 'Paris');
});

test('clearing, Escape and outside dismissal each invalidate pending responses', async () => {
  for (const dismiss of [s => s.type(''), s => s.input.onkeydown({ key: 'Escape' }), s => s.dismiss()]) {
    const gate = deferred(), s = setup(() => gate.promise);
    s.type('Lafayette'); const task = s.search();
    dismiss(s); gate.resolve([place]); await task;
    assert.equal(s.results.hidden, true);
    assert.equal(s.status.textContent, '');
  }
});

test('empty results and provider errors are visible and do not leave search disabled', async () => {
  let fail = false;
  const s = setup(async () => { if (fail) throw Error('Location search is busy. Please try again later.'); return []; });
  s.type('nowhere'); await s.search();
  assert.match(s.status.textContent, /No locations found/);
  fail = true; await s.search();
  assert.match(s.status.textContent, /busy/);
  assert.equal(s.submit.disabled, false);
});

test('result labels are inserted as text, never interpreted as HTML', async () => {
  const s = setup(async () => [{ ...place, name: '<img src=x onerror=alert(1)>' }]);
  s.type('place'); await s.search();
  assert.equal(s.results.children[0].children[0].children[0].textContent, '<img src=x onerror=alert(1)>');
});
