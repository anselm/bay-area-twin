# Bay Layers contributor notes

Read README.md, especially “Notes for agents embedding this widget”, before integration. Deployable files live in dist/. Preserve relative paths so GitHub Pages project URLs work. Keep data snapshots static at runtime, preserve source provenance, distinguish mapped from illustrative elements, and do not add credentials. Do not remove prepared assets from Git. Raw scripts/cache files stay ignored. Run npm run check for code edits. The included Pages workflow publishes dist/ on main.

Maintain `devlog/` for meaningful decisions and changes, using filenames such as `YYYYMMDD-short-topic.md`. Keep entries brief: motivation, choice, tradeoff, outcome and relevant evidence. Update the chronological index. Mark reconstructed entries as retrospective rather than inventing contemporaneous notes.
