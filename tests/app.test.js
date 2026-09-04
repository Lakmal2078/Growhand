import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const profileData = await readFile(new URL('../src/profile-data.js', import.meta.url), 'utf8');
const syncScript = await readFile(new URL('../scripts/sync-profile.mjs', import.meta.url), 'utf8');
const syncWorkflow = await readFile(new URL('../.github/workflows/sync-profile.yml', import.meta.url), 'utf8');

test('camera lifecycle controls are wired', () => {
  assert.match(source, /import ['"]\.\/style\.css['"]/);
  assert.match(source, /getUserMedia/);
  assert.match(source, /window\.isSecureContext/);
  assert.match(source, /waitForVideoMetadata/);
  assert.match(source, /OverconstrainedError/);
  assert.match(source, /cameraActive \? stopCamera\(\) : startCamera\(\)/);
  assert.match(source, /beforeunload/);
  assert.match(source, /hands\.send\(\{ image: videoEl \}\)/);
  assert.match(source, /requestAnimationFrame\(processVideoFrame\)/);
  assert.match(html, /id="camera-toggle"/);
  assert.match(html, /id="camera-launch"/);
  assert.match(html, /Lakmal Vidana Gamage/);
  assert.match(html, /id="landing"/);
  assert.match(html, /id="retry-button"/);
});

test('rainbow rendering and motion trails are wired', () => {
  assert.match(source, /rainbowColor/);
  assert.match(source, /createLinearGradient/);
  assert.match(source, /drawMotionTrails/);
  assert.match(source, /trailLength: 7/);
  assert.match(source, /trailLength: 5/);
  assert.match(source, /trailLength: 2/);
});

test('particle growth is bounded', () => {
  assert.match(source, /particleLimit: 240/);
  assert.match(source, /particleLimit: 24/);
  assert.match(source, /processInterval: 1000 \/ 12/);
  assert.match(source, /particles\.length >= MAX_PARTICLES/);
  assert.match(source, /particles\.splice/);
});

test('camera errors have user-facing recovery guidance', () => {
  assert.match(source, /permission was denied or blocked/);
  assert.match(source, /Camera access requires HTTPS or localhost/);
  assert.match(source, /No camera was found/);
  assert.match(source, /Site settings/);
  assert.match(source, /retry-button/);
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
