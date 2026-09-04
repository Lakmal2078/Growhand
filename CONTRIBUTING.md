# Contributing to Growhand

Thank you for contributing to Growhand.

## Development

Requirements:

- Node.js 20+
- A modern Chromium, Firefox, or Safari browser
- A secure context (`localhost` or HTTPS) for camera access

Install and run locally:

```bash
npm ci
npm run dev
```

## Before opening a pull request

Run the full validation suite:

```bash
npm run lint
npm test
npm run build
npm audit --audit-level=high
```

## Pull requests

- Keep changes focused and easy to review.
- Preserve camera permission and privacy behavior.
- Add or update tests for behavior changes.
- Avoid committing generated files, secrets, or local environment files.
- Update documentation when architecture or deployment behavior changes.

## Commit style

Prefer concise Conventional Commit-style messages, for example:

- `feat: add gesture interaction`
- `fix: recover from camera permission errors`
- `refactor: separate rendering from camera lifecycle`
- `docs: update deployment guide`
- `chore: update CI`
