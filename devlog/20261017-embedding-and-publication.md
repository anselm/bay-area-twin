# A widget for the wiki

**October 17, 2026 · Retrospective reconstruction**

The destination became clearer: this would be an animated backdrop for a digital-twins wiki, with controls mostly out of sight. An iframe keeps the renderer, styles and saved geographic assets together while the article remains a separate page.

We published the ordinary repository at `anselm/bay-area-twin` and configured GitHub Pages to serve `dist/`. The repository includes agent-facing embedding notes and a Pages workflow. A fresh clone needs no geographic download to run the saved scene. A 10-second backdrop GIF and an MP4 provide promotional media; they are recordings, not replacements for the widget.

Embedding revealed two separate problems. The initial decorative wrapper deliberately disabled pointer events, preventing model control. Backdrop mode now permits interaction by default, with an explicit passive option. A parent page still needs to allow pointer events and avoid covering the entire iframe with article content.

Transparency needed more than a clear WebGL canvas. Chrome could paint a dark backing because the child declared a dark color scheme. Transparent mode now clears the HTML background, vignette and fog, and uses a normal color scheme. A six-digit background color can instead match the host page, including distance fog.

The embed configurator previews these choices and generates markup. A small parent-message API supports pause, camera mode, background, interaction, layer separation, focus and reset. Messages come only from the immediate parent, with an optional origin restriction. No arbitrary script execution or data-source configuration is exposed.

Implementation anchors: `827ef20` (public release and media), `088e637` (embed controls), `90760b7` (interactive primary example).
