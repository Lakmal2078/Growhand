# Architecture

Growhand is a browser-first portfolio experience with an interactive MediaPipe hand-tracking studio.

## Runtime flow

```text
index.html
   |
   v
src/main.js (orchestrator)
   |
   +--> profile-data.js
   +--> config/performance.js
   +--> camera/camera.js ----> camera/permissions.js
   +--> tracking/mediapipe.js
   +--> tracking/smoothing.js
   +--> rendering/effects.js
   +--> UI / theme / contact interactions
```

## Module responsibilities

- `index.html` — semantic page structure, SEO metadata, Camera Studio markup, forms and navigation.
- `src/main.js` — application orchestration, profile rendering, UI state, preview behavior and dependency wiring.
- `src/config/performance.js` — device-adaptive camera, rendering and tracking configuration.
- `src/camera/camera.js` — camera stream lifecycle, video processing loop and recovery behavior.
- `src/camera/permissions.js` — secure-context checks, user-facing camera errors and video metadata readiness.
- `src/tracking/mediapipe.js` — MediaPipe browser asset loading and tracker initialization.
- `src/tracking/smoothing.js` — landmark smoothing state, isolated from DOM and canvas concerns.
- `src/rendering/effects.js` — rainbow skeleton, motion trails and bounded particle rendering.
- `src/profile-data.js` — profile content synchronized from the maintainer's GitHub profile README.
- `src/style.css` — responsive visual system and interaction states.
- `scripts/` — repository automation such as profile synchronization and lightweight linting.
- `tests/` — Node-based regression tests for important application contracts.

## Performance model

The camera pipeline adapts to device capability. Mobile and low-power profiles reduce camera resolution, tracking frequency, particle count, trail length and canvas pixel ratio.

Camera frames remain in the browser. The project does not require an application backend or database for Camera Studio.

## External runtime dependency

MediaPipe browser assets are currently loaded from jsDelivr at runtime. A future production-hardening step may vendor or pin these assets locally to reduce CDN availability and supply-chain risk.
