# 🗺️ Cartogram — Map Wallpaper Builder

Frame **any place on Earth**, pick a style, and download it as a crisp,
full‑resolution desktop or phone wallpaper. The map you see *is* the preview:
what's inside the frame is exactly what you get, just rendered at 4K.

**100% client‑side, no API keys.** No backend, no build step. It runs entirely
in the browser and is hosted for free on GitHub Pages.

![Cartogram](docs/preview.png)

## ✨ Features

- **Live, detailed OpenStreetMap** — streets, names, transit, parks, water and
  building footprints, from free vector tiles by [OpenFreeMap](https://openfreemap.org).
- **17 styles in two families**
  - *Detailed* (Street, Night, Paper, Fiord) — full map look with labels, POIs
    and road casings.
  - *Artistic* (Midnight, Copper, Rosé Gold, Platinum, Crimson, Emerald,
    Sapphire, Neon, Sunset, Forest, Blueprint, Toner, Ivory, Vintage) — clean
    line‑work with glow, gradients and a soft vignette.
- **Labels: Off / Places / All**, a **Buildings** switch, and **3D tilt** with
  real extruded buildings (zoom in close; right‑drag to rotate).
- **Wallpaper sizes** — your own screen (auto‑detected), 1080p, 1440p, 4K,
  MacBook 16:10, ultrawide, iPhone and Android. The frame on the map locks to
  the chosen shape.
- **Optional title** — corner, bottom or centered, serif or sans, with the
  place name and coordinates filled in for you.
- **One‑click PNG download** at full resolution.

## 🚀 How it works

1. [MapLibre GL JS](https://maplibre.org) draws OpenFreeMap's vector tiles
   (OpenStreetMap data in the [OpenMapTiles](https://openmaptiles.org) schema).
2. Every style is generated in `app.js` from one base style — a vendored
   snapshot of OpenFreeMap's *Liberty* (`vendor/styles/liberty.json`) —
   recoloured layer by layer from a small palette.
3. On **Download**, the framed view is re‑rendered off‑screen at the target
   resolution (same centre, zoom, rotation and tilt, higher pixel ratio), then
   composited with the background gradient, title and attribution, and saved as
   a PNG.

## 🧑‍💻 Run locally

No dependencies. Serve the folder with any static server (ES modules and the
map tiles need `http://`, not `file://`):

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## 🌐 Deploy on GitHub Pages

This repo ships a workflow at `.github/workflows/pages.yml` that publishes the
site on every push to the default branch (or `main`/`master`).

1. In the repo, go to **Settings → Pages → Build and deployment** and set
   **Source** to **GitHub Actions**.
2. Push — the site publishes automatically.

## 📜 Attribution

Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright)
contributors. Tiles by [OpenFreeMap](https://openfreemap.org) ·
© [OpenMapTiles](https://openmaptiles.org). Geocoding by
[Photon](https://github.com/komoot/photon), using OpenStreetMap data.
Exported wallpapers carry a small credit line in the corner, as the tile and
data licences require.

## Location search and service limits

Type a city, street, or landmark, then press **Enter** or the **Search** button.
Choose a result to move the map and fill the title. Typing never sends a
geocoding request. Results are native buttons for keyboard selection; the
status text announces loading, no matches, and failures. You can always drag
the map and enter a title yourself if geocoding is unavailable.

Both search and title reverse lookup use the same Photon client. It serializes
requests, spaces network starts by at least 1.1 seconds within a page, shares
identical in-flight lookups, and caches successful responses (including no
matches) for 24 hours in a maximum of 50 browser-storage entries. Cache keys
include endpoint and language. Storage failure falls back to memory. Requests
time out after 10 seconds; HTTP/network failures are not cached. HTTP 429/503
responses apply `Retry-After` (seconds or date), with a minimum 60-second
cooldown. There are no automatic retries. Edited or dismissed queries cannot
show stale results or errors.

### Why Photon instead of public Nominatim

The [OSMF policy](https://operations.osmfoundation.org/policies/nominatim/)
forbids client autocomplete and limits **all users of an application combined**
to one request per second. Browser timers, local storage, and cross-tab locks
cannot enforce a limit across unrelated visitors. GitHub Pages is static and
cannot run a shared limiter. Cartogram therefore sends **no requests to public
Nominatim**, including reverse lookups, and never falls back to it.

The [Photon demo policy](https://github.com/komoot/photon#demo-server) allows
reasonable project use. It provides no availability guarantee and may throttle
or ban extensive use. This choice suits modest interactive traffic, not an
unlimited geocoding workload. Local pacing reduces traffic; it is **not** a
promise of an application-wide limit. If aggregate traffic grows or throttling
persists, use a managed Photon-compatible service or your own Photon instance.
Enable CORS for the Pages origin on that endpoint.

Set `endpoint` in `geocoding-config.json` to an HTTPS Photon-compatible base URL
(including any path prefix). The browser loads this configuration on the first
lookup with `cache: 'no-store'`; updating it requires no JavaScript changes.
Already open pages use their loaded endpoint until reloaded. Public Nominatim
is explicitly rejected as an endpoint. Do not put secret API keys in this
public configuration.

Retaining public Nominatim would instead require a deployed shared proxy with
one global request queue, an application-wide one-request-per-second ceiling
across search and reverse lookup, shared caching, identifying headers,
attribution, and a switchable upstream. A separate limiter per visitor or per
server instance would not meet that requirement. No such backend is deployed
by this change.

### Search tests

With Node.js 22.7+ (no installed packages):

```bash
node --test tests/*.test.mjs
```

Tests mock geocoding traffic and cover explicit submission, duplicate requests,
stale responses, selection, Photon extents, cache persistence/expiry/bounds,
timeouts, provider failures, and cooldown handling. They do not call a public
geocoding service.

[MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js) is vendored under
its BSD‑3‑Clause licence (`vendor/maplibre/LICENSE.txt`).
