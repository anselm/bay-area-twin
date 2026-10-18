# Location event display API

A temporary, geocoded pulse and plain-text title in the built layer. No feed, geocoder, polling, storage, camera hijack or demonstration alerts run by default. A caller supplies the content independently of the scene's illustrative clock.

## Embedded widget

The widget sends `{type: 'bay-layers:ready', bounds: [...]}` to its immediate parent when the city layer is ready. Register the listener before assigning the iframe URL; validate both `event.source === frame.contentWindow` and `event.origin === 'https://anselm.github.io'` before enabling your event producer. Calls before readiness are rejected. The message carries only public region bounds; it is not a delivery receipt for individual events.

Try **Show example location event** in [the embed configurator](https://anselm.github.io/bay-area-twin/embed.html). It is explicitly labeled example content and only appears when clicked.

```js
const frame = document.querySelector('iframe');
frame.contentWindow.postMessage({
  type: 'bay-layers:event',
  event: {
    longitude: -122.4034,
    latitude: 37.7952,
    title: 'Example: neighborhood walking tour',
    duration: 9,             // seconds on screen, clamped to 2–30; default 8
    color: '#9ef3db'          // optional six-digit hex
  }
}, 'https://anselm.github.io');
```

Only the immediate embedding parent can send messages. Add `parentOrigin=https%3A%2F%2Fyour-wiki.example` to the iframe URL to restrict accepted messages to that exact origin. Always specify the recipient origin in `postMessage`, rather than `*`.

## Direct integration

```js
const accepted = window.bayLayers.showEvent({
  longitude: -122.478, latitude: 37.820,
  title: 'Example: bridge history walk', duration: 10
});
```

Returns `true` if accepted, `false` if geography is not ready, coordinates/title are invalid, or the point is outside the current region. Bounds: longitude −122.65 to −122.27; latitude 37.67 to 37.95. Both coordinates must be finite numbers. Titles are trimmed, limited to 140 characters and assigned as text, never HTML. Colors accept only `#RRGGBB`. At most 12 events remain active; a new event replaces the oldest when full. No URL or HTML field is rendered.

Titles track the geographic point while the camera moves; labels behind the camera or outside the viewport are hidden. Selecting another layer dims/hides the built-layer effects. Markers follow layer separation. Effects expire after visible rendering time even if playback is paused; hidden/offscreen tabs suspend this lifetime. Reduced-motion users get a static ring with gentle fade rather than an expanding pulse. Expiration disposes marker geometry/material and removes the label; the shared renderer continues normally.

This effect is decorative context, not guaranteed notification delivery. Put source, real event date/time, attribution and a readable event list or link in the host page. Do not confuse the simulated scene clock with event time. Batch/rate-limit external input; avoid flooding the visual display. No synthetic events are silently labeled as actual city activity.
