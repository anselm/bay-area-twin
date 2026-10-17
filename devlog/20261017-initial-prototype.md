# Initial prototype

**October 17, 2026 · Retrospective reconstruction**

The starting image was a volume of separated layers that could rotate and assemble: geology and seabed; wind, sunlight and currents; living systems; then buildings, plumbing, wires, people and movement. San Francisco Bay offered a recognizable place where those systems cross.

The visual direction became luminous and wireframe-like, wide enough to sit above an article. The separation mattered: it made the idea readable before anyone touched a slider. Annotations could tie the abstraction back to familiar places. Constant motion would keep it from feeling like a stack of maps.

We chose Three.js with WebGL2 and vendored dependencies. Raw WebGPU was considered, but there was no measured need to take on that additional implementation work. Merged geometry and batched points were a useful starting point.

The shared terrain uses a NOAA elevation/bathymetry snapshot. Buildings, streets and street trees initially came from bounded historical SF samples. Other systems began as designed illustrations. The layers share coordinates and can be brought together; their separation and vertical exaggeration are explanatory devices.

The important boundary: this is a visual explanation of a digital twin's component systems. It does not yet couple observations to validated predictive models or operational feedback. Beautiful motion must not imply those capabilities.

Implementation anchor: `e334030` (first published prototype).
