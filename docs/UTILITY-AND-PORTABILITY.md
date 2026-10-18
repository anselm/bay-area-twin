# From a luminous landscape to a useful regional tool

October 18, 2026 · Design opportunities, not claims of existing analytical capability.

Bay Layers currently makes relationships visible: terrain, water, life and infrastructure share coordinates, while vertical separation makes each readable. It is an explanatory map with illustrative motion. It does not yet predict downstream effects, measure risk, or constitute an operational digital twin. The useful next step is a specific question, a person who needs an answer, and evidence that supports the answer.

## A dozen grounded uses

| Person and question | Layers and added capability | Evidence / model needed | Useful result and boundary |
| --- | --- | --- | --- |
| A resident: will a proposed tree planting make my walk cooler? | Canopy, streets, buildings, sun; draw a walking route and compare planting scenarios. | Current canopy, building heights, shade calculation, weather and a locally tested thermal-comfort model. | Compare hours of shade and modeled heat exposure along routes. Shade alone is not a temperature prediction; account for tree growth and maintenance. |
| A neighborhood flood group: where would rain gardens intercept runoff? | Terrain, drainage, impervious cover, soils; place interventions and trace catchments. | High-resolution hydrologically conditioned terrain, surveyed drains, infiltration parameters and a calibrated rainfall/runoff model. | Compare runoff volume and flow paths with uncertainty. The current exaggerated relief and medium-resolution streams cannot support parcel flood decisions. |
| A coastal resident: what connects a higher tide to my access road? | Bathymetry, shoreline, roads, tide and coastal defenses; change water levels and show access interruptions. | Datum-aligned elevation, defenses, tide scenarios, drainage and validated inundation treatment. | Identify scenario-dependent access constraints. A simple elevation threshold misses barriers, waves and drainage; it is a screening view only. |
| A transit rider: how does a ferry or BART interruption change access? | Transit, streets, pedestrian links, waterfront; select a disrupted service and destination. | Routable networks, timetables, accessible transfers and explicit disruption assumptions. | Compare reachable destinations and travel times; include wait times and mobility needs. Animated train dots are not this model. |
| A parent or school organizer: which walking route avoids afternoon traffic exposure? | Roads, school locations, traffic, shade, air observations; compare routes and time windows. | Appropriate traffic estimates and a validated exposure model, or clearly labeled measured observations. | Explain competing time, shade and exposure tradeoffs. Do not label a route safe from sparse measurements. Protect children's locations. |
| A watershed volunteer: where could habitat restoration reconnect living systems? | Streams, vegetation, roads and barriers; mark restoration proposals and inspect connectivity. | Current habitat mapping, species-specific movement assumptions, field-verified barriers and expert review. | Rank candidate field visits and show why sites connect. Habitat suitability is species-dependent; suppress sensitive species locations. |
| A planning participant: what changes if this block gets taller? | Buildings, terrain, sun and public space; edit a proposed massing envelope. | Accurate terrain/building geometry, solar geometry and explicit proposal dimensions. | Compare shadow hours at selected public spaces. Wind, heat and energy effects need separate models; geometry does not establish them. |
| A utility planner or community center: who could benefit from a local energy hub? | Roofs, solar exposure, facilities, grid service areas and aggregated demand. | Roof/solar estimates, utility-approved network constraints and privacy-preserving demand data. | Compare candidate locations and modeled energy contributions. Roof potential is not interconnection capacity; do not expose critical network detail. |
| An accessibility advocate: where does a small street intervention reconnect a neighborhood? | Slopes, sidewalks, crossings, stairs, transit stops; remove a barrier or add a crossing. | Surveyed accessibility attributes, pedestrian routing and user-defined mobility constraints. | Compare accessible catchments before/after. Missing curb-ramp data must be visible rather than silently assumed accessible. |
| A park steward: how do dry vegetation and visitor activity overlap? | Vegetation, moisture observations, paths and aggregated visits; inspect time windows. | Dated vegetation/moisture measurements, maintenance records and aggregate activity data. | Prioritize inspections and maintenance discussions. This is not fire-spread forecasting or an emergency-warning system. |
| A resident exploring civic life: what is happening nearby? | Civic events, library programs, public art, park activities or maintenance notices on the built layer. | An external provider with coordinates, attribution, timestamps, expiry and permission to reuse. | Brief location pulses linked by the host page to details. Distinguish real dated information from demonstration content; no police/emergency feed is required. |
| A regional student or journalist: which systems depend on the same crossing? | Bridges, transit, utilities, habitat and watershed context; select a crossing and reveal documented dependencies. | Sourced dependency records and a transparent network model for any scenario. | Explain coupling and compare a specified hypothetical closure. Correlation or shared geography does not establish causal impact. |

## Best first product slices

1. **Civic happenings:** the event display API is implemented. Keep collection, licensing, geocoding, moderation and scheduling in a separate service or host application. Use events to orient readers, not to imply operational monitoring.
2. **A shade walk:** add selectable routes, a time-of-day sun calculation and credible building/canopy geometry. This yields a bounded, understandable answer without claiming to simulate all urban climate.
3. **A watershed story:** select a stream and show its catchment and mapped barriers. Start with observed geography; only add intervention predictions once an appropriate hydrological model has been validated.

For every analytical feature, show the question, scenario assumptions, source dates, spatial resolution, model version and uncertainty. Allow comparison with a baseline. Offer a plain-language result beside the 3D display and a 2D/table alternative. A beautiful camera cannot substitute for a legible answer.

## Can this work anywhere?

**The rendering idea generalizes; this prepared Bay Area scene is not a global map engine.** Terrain, thematic layers, annotations, externally supplied events and observation stations can be reused. At present the bounds, geographic transform, dataset preparation, landmarks, roads, vegetation sources, camera stations and some artistic motion paths are specific to this Bay slice.

A new region currently needs an offline preparation project:

1. Choose a bounded extent and appropriate local projection. The current longitude/latitude-to-rectangle transform is an artistic local approximation; do not stretch it across the globe or across the antimeridian.
2. Acquire licensed elevation/bathymetry and align vertical datums; distinguish missing depth from zero elevation. Hydrography must agree with terrain at the required resolution.
3. Prepare buildings, roads and vegetation with source-specific schemas, missing-height rules, dates and attribution. Municipal data availability varies widely; OpenStreetMap coverage and completeness vary too.
4. Generate packed geometry and levels of detail within explicit download, memory and draw-call budgets. Large regions need spatial tiles and camera-dependent loading; the current whole-region snapshot approach has a finite scale.
5. Supply regional labels, observation stations, landmarks and optional motion sketches. Remove Bay-specific bridges, BART, boats and utility paths unless appropriate.
6. Validate coordinates, scale, coastline, layer alignment, browser performance and accessibility. Retain a source manifest and clearly separate measured, inferred and illustrative features.

A useful refactor would introduce a **region manifest**: bounds/CRS, layer asset URLs, source metadata, landmark definitions and camera stations. Then separate the renderer, data adapters and optional model plugins. An offline region pack would keep deployment simple. Global discovery, streaming and refresh would be a larger product, not a query parameter that works today.

## Aviation lights: observed data versus illustration

The [FAA Daily Digital Obstacle File](https://www.faa.gov/air_traffic/flight_info/aeronav/digital_products/DailyDOF/) provides downloadable obstacle data, including a CSV with decimal coordinates. The [FAA Obstacles Team](https://www.faa.gov/air_traffic/flight_info/aeronav/obst_data/) describes fields for height, lighting, marking and accuracy. This is a promising US source for a prepared regional obstacle layer. It is not a complete census of every rooftop lamp or real-time light status; a listed structure does not establish the exact lamp positions or observed flashing phase.

The current app instead draws **illustrative red beacons** on sampled tall building roofs and simplified bridge towers. Positions, selection and flash phases are artistic. They are unrelated to navigation, outages or verified FAA records. A future importer should preserve obstacle identifiers, lighting codes, source date and accuracy, distinguish lamp geometry inferred from a structure, and avoid presenting this exaggerated scene as an aviation aid.

## Civic events without becoming an aggregator

Possible non-police inputs include library events, park activities, public meetings, exhibitions, street festivals, volunteer restoration, ferry service notices, planned street works and sensor milestones. These are categories to explore, not claims of a verified available feed. The external producer is responsible for geocoding, deduplication, expiry, licensing, attribution and freshness. Avoid precise personal locations or unverified claims.

The widget accepts a title and geographic point, renders a temporary marker in the built layer and then removes it. It does not fetch, store, geocode, rank or verify events, or alter its day/night clock to match them. The host should expose source/time/details accessibly outside the 3D canvas. See [event API](EVENTS.md).
