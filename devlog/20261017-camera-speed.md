# Give the camera some pace

**October 17, 2026**

The spline tour was moving, but its 110-second loop still felt too slow. Added a camera-only `speed` multiplier to URL options, the embed configurator and parent-page controls. The default is now 4: roughly 28 seconds around the route. Speed 1 preserves the earlier pace; 6 makes a loop in about 18 seconds. Values are bounded to 0.25–12.

Speed also scales automatic orbit. It leaves the animated life and day/night cycle alone. Camera following tightens with speed to avoid excessive lag, while banking remains bounded below four degrees. Manual takeover, 12-second idle resumption and reduced-motion behavior remain intact.
