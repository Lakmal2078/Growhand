# Growhand

> A browser-first interactive portfolio experience with real-time MediaPipe hand tracking and a neon visual studio.

[![CI](https://github.com/Lakmal2078/Growhand/actions/workflows/ci.yml/badge.svg)](https://github.com/Lakmal2078/Growhand/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Growhand combines a professional digital portfolio with an interactive Camera Studio. It uses Google MediaPipe Hands and the webcam to render a rainbow neon skeleton, motion trails, and fingertip particle effects. Camera processing is browser-first: the project does not require an application backend, database, account system, or camera-upload pipeline.

## ✨ What it demonstrates

- Real-time browser computer vision with MediaPipe Hands
- Responsive canvas rendering with adaptive performance profiles
- Camera permission, recovery, and lifecycle handling
- Accessible controls, status feedback, and light/dark theme persistence
- SEO/social metadata and structured data for portfolio presentation
- GitHub profile content synchronization
- Automated lint, test, build, and dependency-audit checks

## 🚀 Local development

### Requirements

- Node.js 20+
- A modern browser with camera support
- `localhost` or HTTPS for camera access

```bash
npm ci
npm run dev
```

Open the local Vite URL, typically `http://localhost:5173`, then select **Start camera** and allow camera access. **Stop camera** releases the active media tracks and clears the visual state.

## 🧪 Validation

Run the same checks used by CI:

```bash
npm run lint
npm test
npm run build
npm audit --audit-level=high
```

Hardware-dependent camera behavior should also be checked manually in a secure browser context.

## 📦 Project structure

```text
Growhand/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   ├── workflows/
│   │   ├── ci.yml
│   │   └── sync-profile.yml
│   └── pull_request_template.md
├── docs/
│   ├── architecture.md
│   ├── deployment.md
│   └── privacy.md
├── public/
│   ├── robots.txt
│   └── sitemap.xml
├── scripts/
│   ├── lint.mjs
│   └── sync-profile.mjs
├── src/
│   ├── main.js
│   ├── profile-data.js
│   └── style.css
├── tests/
│   └── app.test.js
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── CONTRIBUTING.md
├── SECURITY.md
├── LICENSE
└── README.md
```

The runtime entry point is intentionally compact at the repository level, while `docs/architecture.md` records the current responsibilities and the path for future module extraction.

## 🧠 Architecture

`index.html` owns semantic structure, SEO metadata, Camera Studio markup, forms, and navigation. `src/main.js` orchestrates the client application, including profile rendering, preview animation, theme state, camera lifecycle, MediaPipe inference, landmark smoothing, canvas rendering, particles, and recovery behavior. `src/style.css` contains the responsive visual system. `src/profile-data.js` is generated profile content.

See the detailed [architecture guide](docs/architecture.md), [deployment guide](docs/deployment.md), and [privacy guide](docs/privacy.md).

## 🔄 GitHub profile sync

The public profile README at [Lakmal2078/Lakmal2078](https://github.com/Lakmal2078/Lakmal2078) is the source of truth for supported landing-page profile content. `scripts/sync-profile.mjs` extracts those sections and generates `src/profile-data.js`.

The existing GitHub Action runs the synchronization daily and can be triggered manually. To run it locally:

```bash
npm run sync:profile
```

Then review the generated data and run the validation suite.

## 🔐 Privacy & security

Camera access is requested only after the user starts Camera Studio. Camera frames are processed in the browser and are not sent to a Growhand application server. Stopping Camera Studio stops the active media tracks.

MediaPipe browser assets are currently loaded from jsDelivr at runtime. A future hardening step may vendor or pin these assets locally for a more self-contained production deployment.

See [SECURITY.md](SECURITY.md) for vulnerability reporting and [docs/privacy.md](docs/privacy.md) for the application privacy model.

## 🌍 Deployment

Build the static production bundle with:

```bash
npm run build
```

Deploy `dist/` behind HTTPS. Preserve an equivalent `Permissions-Policy: camera=(self)` policy at the hosting layer so Camera Studio can request the user's camera.

See [docs/deployment.md](docs/deployment.md) for the production checklist.

## 🤝 Contributing

Keep changes focused, preserve camera/privacy behavior, add regression coverage for behavior changes, and run the validation suite before opening a pull request. See [CONTRIBUTING.md](CONTRIBUTING.md).

## 📄 License

MIT — see [LICENSE](LICENSE).
