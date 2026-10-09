// Typing only invalidates results. Only form submission starts a lookup.
export function bindLocationSearch({ form, input, results, status, geocoder, onSelect,
  createElement = tag => document.createElement(tag) }) {
  const submit = form.querySelector('button[type="submit"]');
  let version = 0, activeQuery = null;
  const clear = () => { results.replaceChildren(); results.hidden = true; };
  const invalidate = () => {
    version++;
    clear();
    status.textContent = '';
    // Allow a new query while the old response finishes; ignore the old result.
    activeQuery = null;
    submit.disabled = false;
    form.setAttribute('aria-busy', 'false');
  };
  input.oninput = invalidate;
  input.onkeydown = event => { if (event.key === 'Escape') invalidate(); };
  form.onsubmit = async event => {
    event.preventDefault();
    const query = input.value.trim().replace(/\s+/g, ' ');
    if (!query) { invalidate(); status.textContent = 'Enter a place to search.'; return; }
    if (activeQuery === query.toLowerCase()) return;
    activeQuery = query.toLowerCase();
    const current = ++version;
    clear();
    submit.disabled = true;
    form.setAttribute('aria-busy', 'true');
    status.textContent = 'Searching…';
    try {
      const list = await geocoder.search(query);
      if (current !== version) return;
      list.forEach(result => {
        const li = createElement('li');
        const button = createElement('button');
        button.type = 'button';
        const name = createElement('b');
        name.textContent = result.name;
        button.append(name, createElement('br'), result.context);
        button.onclick = () => {
          invalidate();
          input.value = result.name;
          onSelect(result);
          status.textContent = `Selected ${result.name}.`;
        };
        li.append(button);
        results.append(li);
      });
      results.hidden = !list.length;
      status.textContent = list.length ? `${list.length} results. Choose a location.`
        : 'No locations found. Try a city, street, or landmark with a region.';
    } catch (error) {
      if (current === version) status.textContent = error.message || 'Location search failed. Please try again.';
    } finally {
      if (current === version) {
        activeQuery = null;
        submit.disabled = false;
        form.setAttribute('aria-busy', 'false');
      }
    }
  };
  // Also invalidates late responses when clicking outside the search.
  return invalidate;
}
