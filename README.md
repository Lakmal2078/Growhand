# Growhand

Growhand is a browser-based real-time hand tracker that uses Google MediaPipe Hands and the webcam to render a screenshot-inspired rainbow neon skeleton overlay, motion trails, and fingertip particle effects. Video processing stays in the browser; the application does not include a backend, database, account system, or upload pipeline.

## Requirements

Use a modern browser with webcam support. Camera access is available only from a secure context such as HTTPS or `localhost`. The first visit prompts for camera permission. If permission is denied, use the **Retry** button after enabling camera access in the browser settings.

## Local development

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, typically `http://localhost:5173`—do not use the network IP over plain HTTP because Chrome treats it as an insecure context. Select **Start camera** and allow webcam access. Select **Stop camera** to release the camera and clear the overlay. If the MediaPipe model or camera fails to load, resolve the network or permission issue and select **Retry**.

## Chrome camera troubleshooting

The development and preview servers send `Permissions-Policy: camera=(self)` so the page can request its own camera. If Chrome previously blocked access, select the lock icon beside the address, open **Site settings**, set **Camera** to **Allow**, reload the page, and select **Retry**. For a deployed build, serve the site over HTTPS and preserve an equivalent camera permission policy at the hosting layer.

## Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Create the production bundle in `dist/`. |
| `npm run preview` | Serve the production bundle locally. |
| `npm run lint` | Run the repository’s dependency-free source and DOM contract checks. |
| `npm test` | Run the Node test suite. |

## Architecture

The app has a deliberately small client-only architecture. `index.html` contains the semantic video, canvas, status, and control elements. `src/main.js` owns MediaPipe model loading, camera lifecycle management, landmark smoothing, canvas rendering, error recovery, and particle cleanup. `src/style.css` provides the responsive neon HUD and mobile layout. MediaPipe’s legacy browser scripts are loaded from jsDelivr at runtime.

## Privacy

The webcam stream is requested with `getUserMedia` and is rendered locally. Growhand does not send camera frames to an application server. Camera tracks are explicitly stopped when the user presses **Stop camera** or leaves the page. The third-party MediaPipe assets are fetched from jsDelivr so the model can load in the browser.

## Production notes

Deploy the generated `dist/` directory behind HTTPS. Keep the MediaPipe CDN available, or vendor the model assets if the deployment requires a self-contained build. The renderer uses animated rainbow gradients, short landmark motion trails, and bright fingertip particles to create the reference-inspired effect. The visual particle buffer is capped at 240 particles to prevent unbounded growth during long sessions. On touch devices, Growhand automatically switches to a mobile performance profile: 640–960px camera input, MediaPipe complexity 0, 18–24 tracking updates per second, lower canvas pixel density, shorter trails, fewer glow layers, and a smaller particle cap. This keeps the neon look while reducing heat, battery drain, and frame drops. Browser permission failures, missing cameras, busy cameras, insecure contexts, and model-load failures all produce recovery-oriented status messages.

## Validation

Before opening a pull request, run the following commands:

```bash
npm run lint
npm test
npm run build
npm audit --omit=dev --audit-level=high
```

The automated tests validate the camera-control contract, retry/error guidance, bounded particle behavior, and presence of the rainbow/trail rendering pipeline. Hardware-dependent camera behavior should additionally be checked manually in a secure browser context.

## License

MIT
