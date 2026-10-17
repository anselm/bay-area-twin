# Bay Layers

A wide, luminous, interactive portrait of San Francisco Bay that explains the idea of a digital twin through four shared geographic layers: earth and seabed, natural forces, living systems, and the built world.

## Run

No installation or API key is required. Three.js 0.180.0 and OrbitControls are vendored with the upstream MIT license.

```sh
npm run dev
```

Open http://127.0.0.1:4177. Any ordinary static server can serve `dist/`.

## Explore

- Drag to orbit, scroll/pinch to zoom, right-drag to pan.
- Select a layer to emphasize it; select again to show the full stack.
- Use separation or Bring together to assemble the systems onto shared geography.
- Scrub the day/night cycle or pause motion. Space pauses when focus is outside a control; number keys 1–4 select layers; Escape clears layer focus.
- Behind the layers describes sources and the distinction between mapped and illustrated systems.
- `?backdrop=1` hides the interface and retains motion and place annotations, with a 30 fps cap. `?embed=1` provides a compact interactive header. `embed.html` gives an iframe example.
- Reduced-motion preference starts paused with orbit off; the user can start it explicitly.

## Data and honesty

`dist/assets/sources.json` is the source manifest. The downloaded NOAA F32 elevation/bathymetry grid is real, with historical and mixed-datum sources, resampled to 513×513. The terrain mesh uses 129×129 vertices. Its vertical scale is intentionally exaggerated.

Building footprints/heights are simplified from a bounded 20,000-feature San Francisco municipal-source sample served through a public ArcGIS mirror. A spatial sampling step retains 9,983 rendered buildings. They are footprint extrusions, not photogrammetric facades. A further 6,592 spatially sampled OpenStreetMap footprints cover the visible surrounding land, including western East Bay and Marin communities. Regional height coverage is incomplete; missing heights use a clearly documented two-storey display default.

Street centerlines and 8,000 historical street-tree points come through public mirrors of municipal records. These are partial historical snapshots. SF park vegetation sketches, animal tracks, utility routes, vehicle movement, solar changes, wind and currents are illustrative, not live observations or calibrated forecasts. Golden Gate/Bay Bridge and landmark silhouettes are geographically positioned but artistically constructed.

This is a visual explanation of a twin's component systems, not an operational predictive Bay Area twin. Data provenance remains available within the interface rather than being implied by realistic motion.

## Architecture

- Buildless ES modules, Three.js WebGL2, merged building/line geometries, batched particles, shared coordinates and deterministic procedural sketches.
- All geographic data and geometry are bundled snapshots; no runtime map API, analytics, or external CDN calls. Compressed geometry loads in parallel; the terrain appears before the city finishes assembling. Rendering pauses offscreen and in hidden tabs.
- `dist/main.js`: scene, geographic transforms, render batches, motion and controls.
- `dist/style.css`: wide hero, mobile and compact embed layouts.
- `scripts/fetch-data.py`, `fetch-features.py`, `prepare-data.py`: reproducible bounded data acquisition and reduction, with raw request URLs cached locally. Python with Pillow and NumPy is required only to rebuild data.

Three.js was chosen to keep iteration focused on the composition, data and interaction. It can also support a later WebGPU renderer. Moving this custom GLSL-free scene to the WebGPU/TSL material stack would still require compatibility testing. Raw WebGPU is not currently justified by measured performance needs; it remains an option if compute-heavy model coupling becomes central.

## Useful next passes

1. Broader spatial building coverage and more carefully modeled landmarks.
2. Real regional canopy/landcover instead of forest sketches; current tree data where available.
3. Observed weather and tide snapshots, each with timestamps and uncertainty.
4. A small explicit intervention with a documented model and feedback path.
5. Profiling on target embedded/mobile devices before choosing a WebGPU migration or tiled streaming strategy.

## Life in the layers

The built layer includes brighter moving city headlights, two-way bridge traffic, three quiet sailboats, and a schematic twin-bore BART crossing with moving trains. Selecting the built layer emphasizes the crossing and reveals its label. The living layer includes an occasional whale silhouette and a short surface ripple/spout. These motions are intentionally expressive rather than time-realistic. They pause with the shared playback control. The BART alignment/depth is approximate and animal movement is not tracking data.

## Static data preparation

Visitors fetch only files from this site. NOAA and ArcGIS are contacted only when deliberately refreshing the saved snapshots; development and deployment do not refetch them.

```sh
# Optional: refresh downloaded snapshots (Python, Pillow and NumPy required).
npm run data:fetch
# Reduce the snapshots and prebuild packed city geometry and terrain contours.
npm run data:prepare
# Or rebuild geometry alone from the existing prepared data.
npm run prepare:geometry
```

Commit the prepared `dist/assets/` files with the site. Raw downloads are cached under `scripts/cache/` and excluded from source control. The browser uses gzip assets with native decompression, with uncompressed equivalents for older browsers. Data are historical samples, not live feeds. The backdrop's wind, traffic, fog, animals and day/night cycle are illustrative. Decorative building lights fade with the day/night cycle.

## Hydrography

`python3 scripts/fetch-hydrography.py` saves a bounded EPA WATERS NHDPlus V2 stream snapshot. This reuses the Water Atlas source approach, retaining smaller streams instead of its order ≥ 4 selection. The cyan channels follow the terrain in the earth layer. Medium-resolution mapped channels include intermittent streams and are not live flow measurements. Ocean grid lines and the survey-block walls are deliberately faint to let channels and coastlines carry the geography.

## Regional living and built coverage

`python3 scripts/fetch-vegetation.py` prepares a Marin vegetation grid from the California wildlife agency mirror of the Marin Fine Scale Vegetation Map. Requires Pillow. The 2018 landscape classification and 2019 LiDAR mean stand heights distinguish forest, shrub and herbaceous patches. Dots sample mapped polygons, not individual tree positions. SF street trees remain a separate historical point inventory; SF park sketches remain illustrative.

`python3 scripts/fetch-regional.py` downloads a bounded OpenStreetMap roads/buildings snapshot. Run `npm run prepare:geometry` afterward. Regional footprints outside SF are spatially sampled. Heights use OSM height/levels when present, otherwise an illustrative 6.2m default. Regional roads supplement the SF sample; major routes receive greater brightness. © OpenStreetMap contributors, ODbL 1.0. The frame includes only western Oakland/Berkeley, not those entire cities. Everything remains static at runtime.

## Push to your GitHub repository

The canonical project folder is `/Volumes/summer/projects/2026/bay-layers`. The prepared site is `dist/`; keep that directory and its assets tracked. No installation, data download or build is needed to run the saved scene. Raw data caches and local environment files are ignored. Three.js includes its upstream MIT license. Dataset rights and attribution are separate; see `dist/assets/sources.json`, especially OpenStreetMap's ODbL requirements. This repository does not yet assign a license to the project's own code.

Create an **empty** repository at `https://github.com/anselm/bay-area-twin` (without generated README or license), then:

```sh
cd /Volumes/summer/projects/2026/bay-layers
git status
git add .
git commit -m "Prepare Bay Layers for GitHub" # Only if git status shows changes.
git remote add github git@github.com:anselm/bay-area-twin.git
git push -u github HEAD:main
```

This checkout already has a source publishing remote. Adding a separate `github` remote preserves it. If `github` already exists, inspect it with `git remote -v` before changing it. Use `https://github.com/anselm/bay-area-twin.git` instead of the SSH URL if you prefer HTTPS authentication. Do not force-push over an existing repository. If your local branch is not `main`, the explicit `HEAD:main` still publishes it to GitHub's `main`; future pushes can use `git push github HEAD:main`.

The `.openai/hosting.json` file records the existing private Sites deployment. It contains a site identifier, not a credential; GitHub Pages does not use it. Credential tokens are never stored in the project. Review files before publishing a public repository. Git history may contain earlier source and source manifests, so review history as well as the current tree.

## Enable GitHub Pages

In GitHub repository **Settings → Pages → Build and deployment → Source**, choose **GitHub Actions**. The included `.github/workflows/pages.yml` publishes `dist/` on pushes to `main`; it never contacts NOAA, ArcGIS or Overpass. For the suggested repository, the default project URL will be:

`https://anselm.github.io/bay-area-twin/`

Run the workflow manually from Actions if the first push happened before Pages was enabled. A custom domain can change the resulting URL; GitHub's Pages settings show the actual published address.

## Use as a wiki backdrop

Use the **Pages URL**, not a github.com source link or raw.githubusercontent.com URL. On the wiki page:

```html
<section class="twin-hero">
  <iframe
    class="twin-backdrop"
    src="https://anselm.github.io/bay-area-twin/?backdrop=1"
    title="Animated layered landscape of San Francisco Bay"
    aria-hidden="true"
    tabindex="-1"
  ></iframe>
  <div class="twin-copy"><h1>Digital twins</h1><p>Your article introduction…</p></div>
</section>
<style>
.twin-hero { position: relative; isolation: isolate; min-height: 520px; background: #071019; }
.twin-backdrop { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; pointer-events: none; z-index: -1; }
.twin-copy { position: relative; padding: 4rem; max-width: 40rem; color: white; }
</style>
```

`?backdrop=1` hides controls and retains annotations, uses a 30 fps cap, honors reduced-motion preferences, and pauses rendering when the iframe is offscreen or the tab is hidden. For an interactive widget use the ordinary URL (or `?embed=1` for compact controls), remove `aria-hidden`, `tabindex` and `pointer-events: none`. `?transparent=1` can be combined with backdrop mode to let the host page's background show through.

An iframe isolates the scene's styles and Three.js from the wiki. Updating the Pages deployment updates every embedding page. For a stable article edition, use a separately hosted versioned copy. Alternatively copy `dist/` into your wiki's public assets under `bay-area-twin/` and change the iframe URL to `/bay-area-twin/?backdrop=1`; preserve the folder layout and attribution. No npm package or Git submodule is required.

The reproducible mirror path for refreshing regional data is:

```sh
python3 scripts/fetch-regional-mirror.py
python3 scripts/fetch-roads-mirror.py
python3 scripts/fetch-regional.py
npm run prepare:geometry
```

The source footprint acquisition is a bounded sample (up to 100,000 features per crop), not a complete municipal census. Rendering selects the tallest available footprint in each coarse geographic bin outside SF, retaining 6,592 regional footprints in this snapshot. Roads retain the broader mapped network. The first two commands require network access only during preparation; cached responses are reused. The original Overpass path is retained as a fallback, but overloaded public servers may fail. Rerunning `data:prepare` resets the SF base and source manifest; rerun the regional preparation afterward and preserve the additional source records.
