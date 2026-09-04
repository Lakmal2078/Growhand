import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
const camera = await readFile(new URL('../src/camera/camera.js', import.meta.url), 'utf8');
const permissions = await readFile(new URL('../src/camera/permissions.js', import.meta.url), 'utf8');
const performance = await readFile(new URL('../src/config/performance.js', import.meta.url), 'utf8');
const smoothing = await readFile(new URL('../src/tracking/smoothing.js', import.meta.url), 'utf8');
const mediaPipe = await readFile(new URL('../src/tracking/mediapipe.js', import.meta.url), 'utf8');
const effects = await readFile(new URL('../src/rendering/effects.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const profileData = await readFile(new URL('../src/profile-data.js', import.meta.url), 'utf8');
const syncScript = await readFile(new URL('../scripts/sync-profile.mjs', import.meta.url), 'utf8');
const syncWorkflow = await readFile(new URL('../.github/workflows/sync-profile.yml', import.meta.url), 'utf8');

 test('runtime is modular and camera lifecycle is wired', () => {
  assert.match(source, /style\.css/);
  assert.match(source, /createCameraController/);
  assert.match(source, /createLandmarkSmoother/);
  assert.match(source, /createEffectsRenderer/);
  assert.match(camera, /getUserMedia/);
  assert.match(camera, /waitForVideoMetadata/);
  assert.match(camera, /OverconstrainedError/);
  assert.match(camera, /hands\.send\(\{ image: videoEl \}\)/);
  assert.match(camera, /requestAnimationFrame\(processVideoFrame\)/);
  assert.match(source, /beforeunload/);
  assert.match(html, /id="camera-toggle"/);
  assert.match(html, /id="camera-launch"/);
  assert.match(html, /Lakmal Vidana Gamage/);
  assert.match(html, /id="landing"/);
  assert.match(html, /id="retry-button"/);
});

test('camera permissions provide secure-context and recovery guidance', () => {
  assert.match(permissions, /permission was denied or blocked/);
  assert.match(permissions, /Camera access requires HTTPS or localhost/);
  assert.match(permissions, /No camera was found/);
  assert.match(permissions, /Site settings/);
  assert.match(source, /friendlyCameraError/);
});

test('tracking smoothing is isolated', () => {
  assert.match(smoothing, /createLandmarkSmoother/);
  assert.match(smoothing, /alpha = 0\.36/);
  assert.match(smoothing, /smoothedHands/);
});

test('rainbow rendering, trails and particles are isolated and bounded', () => {
  assert.match(effects, /rainbowColor/);
  assert.match(effects, /createLinearGradient/);
  assert.match(effects, /drawMotionTrails/);
  assert.match(performance, /trailLength: 7/);
  assert.match(performance, /trailLength: 5/);
  assert.match(performance, /trailLength: 2/);
  assert.match(performance, /particleLimit: 240/);
  assert.match(performance, /particleLimit: 24/);
  assert.match(performance, /processInterval: 1000 \/ 12/);
  assert.match(effects, /particles\.length >= MAX_PARTICLES/);
  assert.match(effects, /particles\.splice/);
});

test('MediaPipe loader is isolated from the app orchestrator', () => {
  assert.match(mediaPipe, /camera_utils/);
  assert.match(mediaPipe, /hands\.js/);
  assert.match(mediaPipe, /loadHandTracker/);
  assert.match(source, /loadHandTracker/);
});

test('development server allows same-origin camera access', async () => {
  const viteConfig = await readFile(new URL('../vite.config.js', import.meta.url), 'utf8');
  assert.match(viteConfig, /Permissions-Policy/);
  assert.match(viteConfig, /camera=\(self\)/);
});

test('GitHub profile README is the website profile source of truth', () => {
  assert.match(source, /profile-data\.js/);
  assert.match(html, /data-profile="name"/);
  assert.match(profileData, /export const profile/);
  assert.match(syncScript, /raw\.githubusercontent\.com/);
  assert.match(syncScript, /writeFile/);
  assert.match(syncWorkflow, /workflow_dispatch/);
  assert.match(syncWorkflow, /cron:/);
});

test('dark and light themes are user-selectable and persisted', () => {
  assert.match(html, /id="theme-toggle"/);
  assert.match(source, /growhand-theme/);
  assert.match(source, /prefers-color-scheme: light/);
  assert.match(source, /aria-pressed/);
  assert.match(source, /dataset\.theme/);
});

test('Camera Studio preview is interactive and GitHub is in contact links', () => {
  assert.match(html, /id="preview-toggle"/);
  assert.match(html, /id="preview-canvas"/);
  assert.match(source, /requestAnimationFrame\(drawPreview\)/);
  assert.match(source, /PREVIEW PAUSED/);
  assert.match(html, /href="https:\/\/github\.com\/Lakmal2078"[^>]*>GitHub/);
  assert.doesNotMatch(html.match(/<nav[\s\S]*?<\/nav>/)?.[0] || '', /GitHub|Portfolio/);
});

test('contact form prepares an email inquiry without a backend', () => {
  assert.match(html, /id="contact-form"/);
  assert.match(html, /name="email"/);
  assert.match(html, /name="message"/);
  assert.match(source, /mailto:lakmalsujith25@gmail\.com/);
  assert.match(source, /encodeURIComponent/);
  assert.match(source, /pointermove/);
});

test('preview and form include performance and feedback safeguards', () => {
  assert.match(source, /document\.hidden/);
  assert.match(source, /previewSize/);
  assert.match(source, /visibilitychange/);
  assert.match(source, /is-sending/);
  assert.match(source, /is-sent/);
  assert.match(html, /id="contact-submit"/);
});

test('Camera Studio preview has selectable visual filters', () => {
  assert.match(html, /data-preview-filter="spectrum"/);
  assert.match(html, /data-preview-filter="pulse"/);
  assert.match(html, /data-preview-filter="matrix"/);
  assert.match(source, /previewFilter/);
  assert.match(source, /querySelectorAll\('\[data-preview-filter\]'\)/);
  assert.match(source, /previewFilter === 'pulse'/);
  assert.match(source, /previewFilter === 'matrix'/);
});
