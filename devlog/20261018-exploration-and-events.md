# Landscape exploration and externally supplied happenings

October 18, 2026

The close bridge circuit became intense and repetitive. Halved the camera speed default from 4 to 2 and made broad observation stations the default: 14 seconds lingering and at least 22 seconds transitioning (longer journeys get proportionally more time) at speed 2, using smooth acceleration/deceleration and a varying deterministic itinerary. Targets remain separate from camera position. Retained the authored bridge flight under `camera=tour`, now about 55 seconds by default, and preserved manual takeover/idle resume.

Added sparse illustrative red beacons to tall sampled buildings and modeled bridge towers. FAA obstacle data offers coordinates, heights and lighting metadata, but does not justify claiming surveyed lamp locations; this pass intentionally uses artistic placement and records that distinction.

Added an external location-event API: plain title, coordinates, bounded duration/color, temporary ring/label, capped active count and disposal. No event collection or synthetic feed. Added docs for integration, a dozen practical use cases and the work required to support another region. Predictive use requires appropriate data, validation and uncertainty; the map alone is not an impact model.

Validation: syntax checks passed. A 24-minute simulated exploration visited all eight stations with finite positions, nonzero gaze distance and bounded target-path speed (7.55 scene units/second at default speed). Event checks covered invalid coordinates/titles, pre-ready rejection, text-only titles, the 12-event cap, expiry and scene/DOM cleanup. Browser preview confirmed default mode/speed, 30 illustrative beacons and a parent-triggered sample event.
