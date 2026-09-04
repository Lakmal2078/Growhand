import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

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
  assert.match(html, /id="retry-button"/);
});

test('rainbow rendering and motion trails are wired', () => {
  assert.match(source, /rainbowColor/);
  assert.match(source, /createLinearGradient/);
  assert.match(source, /drawMotionTrails/);
  assert.match(source, /trailLength: 7/);
  assert.match(source, /trailLength: 4/);
});

test('particle growth is bounded', () => {
  assert.match(source, /particleLimit: 240/);
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
