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

Building footprints/heights are simplified from a bounded 20,000-feature San Francisco municipal-source sample served through a public ArcGIS mirror. A spatial sampling step retains 9,983 rendered buildings. They are footprint extrusions, not photogrammetric facades. Other Bay Area cities are not yet represented by building data.

Street centerlines and 8,000 historical street-tree points come through public mirrors of municipal records. These are partial historical snapshots. Regional forest placement, animal tracks, utility routes, vehicle movement, solar changes, wind and currents are illustrative, not live observations or calibrated forecasts. Golden Gate/Bay Bridge and landmark silhouettes are geographically positioned but artistically constructed.

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
