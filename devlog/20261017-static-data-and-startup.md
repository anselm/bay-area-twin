# Static data and startup

**October 17, 2026 · Retrospective reconstruction**

The scene looked promising, but startup felt slow. The useful question was whether each visitor was waiting for public data services. Geographic snapshots were already bundled, but the browser still did expensive geometry preparation before presenting the landscape.

The decision was to make the static workflow explicit and move more work into preparation. Download once, keep provenance, reduce the data, prebuild the city mesh and linework, then serve ordinary files. NOAA and ArcGIS should not be involved when someone opens the widget.

Building triangulation and terrain contours moved into an offline script. Packed, quantized geometry and gzip assets reduced transfer and processing. Lightweight building metadata replaced full footprint parsing at runtime. The terrain appears before city assembly finishes, rather than waiting for every layer.

We also reduced terrain mesh resolution, capped backdrop rendering at 30 fps, limited pixel density, and skipped rendering offscreen or in hidden tabs. The backdrop should earn its place on an article page without consuming unlimited rendering time.

Cached localhost checks showed terrain preparation around a tenth of a second and full assembly within a few tenths in the early optimized version. Those were local setup measurements, not a promise for cold network loads or every device. Later regional additions increased the work again.

Prepared assets belong in Git. Raw download caches do not. Development and deployment should work from a fresh clone without refetching geography.

Implementation anchor: `50c7d54` (static preparation and startup pass, alongside scene additions).
