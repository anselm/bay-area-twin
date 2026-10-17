# The camera becomes a visitor

**October 17, 2026 · Retrospective reconstruction**

An orbit option existed, but simply opening the scene still felt too passive. The request was to begin in motion, let a visitor take over, then continue afterward. A camera could also carry a little energy: banking as if it were turning through a place.

The default is now a 110-second closed, centripetal spline tour. It moves through an overview, SF, the Bay Bridge and East Bay edge, Marin woodland, Golden Gate, coast and seabed, then returns through the living layers. A separate smooth target path directs attention without abrupt cuts.

Bank follows changes in the flight-path tangent, with damping and a cap below four degrees. It is a visual suggestion of turning forces, not a flight-dynamics simulation. The route stays outside the separated layer volume and leaves more room on narrow embeds.

Mouse or touch interaction suspends the tour immediately. After 12 seconds idle, the camera blends back from the visitor's view to the paused route. Explicit orbit/static choices remain available, and reduced-motion preferences still start playback paused.

Checks sampled 1,001 points around the route: positions and targets stayed finite, the loop closed, camera height stayed above 76 scene units, and target distance above 126. Browser checks confirmed automatic startup, manual takeover, idle resumption and banking. A startup edge case briefly allowed a negative frame delta; clamping elapsed time fixed the invalid initial tour phase.

Implementation anchors: `3fbe81d` (default spline tour and banking), `98dbf53` (startup timing correction).
