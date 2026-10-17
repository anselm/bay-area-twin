# Life and regional coverage

**October 17, 2026 · Retrospective reconstruction**

The first requests for more life were concrete: cars crossing the bridges and moving through streets; BART below the water; a few sailboats; an occasional whale. Timing could be expressive rather than literal. Soft marine fog and gradual building lights followed the same approach: movement as color, with sources distinguishing illustration from observation.

The seabed then became too visually substantial. A rectangular elevation grid gave the ocean a uniform density that competed with the other layers. We reduced the grid and its ocean opacity, softened the block walls, and let contours and shorelines carry more of the geography.

Streams were a better kind of detail. Anselm's Water Atlas used EPA NHDPlus, but its large-river filter returned nothing within this slice. Retaining smaller mapped streams produced 75 stream features, shown as brighter cyan channels. They include intermittent channels; they are not current flow measurements.

Marin's living layer exposed another imbalance. SF had mapped street trees, while Marin had only a sparse procedural forest sketch. We replaced the northern sketch with historical Marin vegetation classifications and LiDAR-derived mean stand heights. About 33,000 display patches distinguish woodland, shrub and herbaceous cover. A dot represents a sampled vegetation patch, not a surveyed tree.

The built layer also needed regional consistency. Public Overpass attempts failed; an Esri-hosted OpenStreetMap mirror supplied a saved snapshot instead. The rendered scene gained 6,592 sampled regional footprints and a broader road network, with major roads brighter than local streets. Missing heights use an illustrative two-storey default.

Coverage remains framed and partial. The terrain reaches only the western edge of Oakland and Berkeley. Consistency inside the frame is a useful improvement; it is not full Bay Area coverage.

Implementation anchors: `c3ab53a` (lighter earth layer and streams), `6aef7ab` (regional vegetation, roads and buildings).
