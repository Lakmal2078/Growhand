# Architecture

Growhand is a browser-first portfolio experience with an interactive MediaPipe hand-tracking studio.

## Runtime flow

```text
index.html
   |
   v
src/main.js
   |
   +--> profile-data.js
   +--> browser camera API
   +--> MediaPipe Hands (CDN)
   +--> canvas renderer
   +--> UI / theme / contact interactions
```

## Main responsibilities

- `index.html` — semantic page structure, SEO metadata, Camera Studio markup, forms and navigation.
- `src/main.js` — application orchestration, UI state, camera lifecycle, tracking, rendering and preview behavior.
- `src/profile-data.js` — profile content synchronized from the maintainer's GitHub profile README.
- `src/style.css` — responsive visual system and interaction states.
- `scripts/` — repository automation such as profile synchronization and lightweight linting.
- `tests/` — Node-based regression tests for important application contracts.

## Performance model

The camera pipeline adapts to device capability. Mobile and low-power profiles reduce camera resolution, tracking frequency, particle count, trail length and canvas pixel ratio.

Camera frames remain in the browser. The project does not require an application backend or database for Camera Studio.

## External runtime dependency

MediaPipe browser assets are currently loaded from jsDelivr at runtime. A future production-hardening step may vendor or pin these assets locally to reduce CDN availability and supply-chain risk.
