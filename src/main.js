import './style.css';
import { profile } from './profile-data.js';
import { HAND_OFFSETS, PERFORMANCE, MAX_PARTICLES } from './config/performance.js';
import { createLandmarkSmoother } from './tracking/smoothing.js';
import { loadHandTracker } from './tracking/mediapipe.js';
import { createEffectsRenderer } from './rendering/effects.js';
import { createCameraController } from './camera/camera.js';
import { friendlyCameraError } from './camera/permissions.js';

const videoEl = document.getElementById('video');
const canvasEl = document.getElementById('overlay');
const ctx = canvasEl.getContext('2d', { alpha: true });
const statusEl = document.getElementById('status');
const cameraToggle = document.getElementById('camera-toggle');
const retryButton = document.getElementById('retry-button');
const cameraLaunch = document.getElementById('camera-launch');
const landingEl = document.getElementById('landing');
const landingStatusEl = document.getElementById('landing-status');
const themeToggle = document.getElementById('theme-toggle');

function getInitialTheme() {
  try {
    return localStorage.getItem('growhand-theme') || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  } catch {
    return 'dark';
  }
}

function setTheme(theme) {
  const isLight = theme === 'light';
  document.documentElement.dataset.theme = isLight ? 'light' : 'dark';
  if (!themeToggle) return;
  themeToggle.setAttribute('aria-pressed', String(isLight));
  themeToggle.setAttribute('aria-label', `Switch to ${isLight ? 'dark' : 'light'} mode`);
  themeToggle.querySelector('.theme-icon').textContent = isLight ? '☾' : '☼';
  themeToggle.querySelector('.theme-label').textContent = isLight ? 'Dark mode' : 'Light mode';
}

setTheme(getInitialTheme());
themeToggle?.addEventListener('click', () => {
  const nextTheme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  setTheme(nextTheme);
  try { localStorage.setItem('growhand-theme', nextTheme); } catch { /* Storage can be disabled in private browsing. */ }
});

const previewCanvas = document.getElementById('preview-canvas');
const previewToggle = document.getElementById('preview-toggle');
const previewStatus = document.getElementById('preview-status');
let previewPaused = false;
let previewPointer = { x: 0, y: 0 };
let previewSize = { width: 0, height: 0, dpr: 0 };
let previewFilter = 'spectrum';

function drawPreview(timestamp = 0) {
  if (!previewCanvas || document.hidden) return;
  const rect = previewCanvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (previewSize.width !== rect.width || previewSize.height !== rect.height || previewSize.dpr !== dpr) {
    previewCanvas.width = Math.round(rect.width * dpr);
    previewCanvas.height = Math.round(rect.height * dpr);
    previewSize = { width: rect.width, height: rect.height, dpr };
  }
  const previewCtx = previewCanvas.getContext('2d');
  previewCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  previewCtx.clearRect(0, 0, rect.width, rect.height);
  const scale = Math.min(rect.width, rect.height) * 0.36;
  const cx = rect.width * 0.52 + Math.sin(timestamp * 0.0012) * rect.width * 0.025 + previewPointer.x * 12;
  const cy = rect.height * 0.52 + previewPointer.y * 8;
  const landmarks = [[0, .28], [-.24, .12], [-.38, -.08], [-.48, -.34], [-.54, -.57], [-.43, -.67], [-.32, -.39], [-.17, -.68], [-.06, -.9], [.05, -1.02], [.15, -.96], [.12, -.67], [.3, -.83], [.42, -.91], [.51, -.82], [.46, -.59], [.32, -.45], [.42, -.51], [.55, -.55], [.63, -.45], [.6, -.25]].map(([x, y], i) => ({ x: cx + x * scale, y: cy + y * scale + Math.sin(timestamp * .002 + i) * 2.5 }));
  const connections = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [8, 9], [0, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14], [14, 15], [0, 17], [17, 18], [18, 19], [19, 20], [0, 5]];
  previewCtx.globalCompositeOperation = 'lighter';
  if (previewFilter === 'pulse') {
    previewCtx.beginPath(); previewCtx.arc(cx, cy, scale * (1.02 + Math.sin(timestamp * .004) * .12), 0, Math.PI * 2);
    previewCtx.strokeStyle = 'rgba(169, 255, 86, 0.22)'; previewCtx.shadowColor = '#a9ff56'; previewCtx.shadowBlur = 20; previewCtx.lineWidth = 2; previewCtx.stroke();
  }
  if (previewFilter === 'matrix') {
    previewCtx.globalAlpha = 0.2; previewCtx.strokeStyle = '#57ff9a'; previewCtx.lineWidth = 1;
    for (let x = 16; x < rect.width; x += 24) { previewCtx.beginPath(); previewCtx.moveTo(x, 0); previewCtx.lineTo(x, rect.height); previewCtx.stroke(); }
    previewCtx.globalAlpha = 1;
  }
  connections.forEach(([a, b], index) => {
    previewCtx.beginPath(); previewCtx.moveTo(landmarks[a].x, landmarks[a].y); previewCtx.lineTo(landmarks[b].x, landmarks[b].y);
    const hue = previewFilter === 'matrix' ? 145 : previewFilter === 'pulse' ? 85 : (timestamp * .04 + index * 25) % 360;
    previewCtx.strokeStyle = `hsl(${hue} 100% 65%)`; previewCtx.shadowColor = previewFilter === 'matrix' ? '#57ff9a' : '#00e5ff'; previewCtx.shadowBlur = previewFilter === 'pulse' ? 20 : 12; previewCtx.lineWidth = previewFilter === 'pulse' ? 3.2 : 2.2; previewCtx.stroke();
  });
  landmarks.forEach((point, index) => { previewCtx.beginPath(); previewCtx.fillStyle = '#f6ffff'; previewCtx.shadowColor = `hsl(${previewFilter === 'matrix' ? 145 : previewFilter === 'pulse' ? 85 : (timestamp * .04 + index * 25) % 360} 100% 65%)`; previewCtx.shadowBlur = previewFilter === 'pulse' ? 22 : 14; previewCtx.arc(point.x, point.y, index % 4 === 0 ? 4 : 2.7, 0, Math.PI * 2); previewCtx.fill(); });
  for (let index = 0; index < 12; index += 1) {
    const angle = timestamp * 0.001 + index * 0.52;
    const radius = scale * (1.12 + (index % 3) * 0.08);
    const particleX = cx + Math.cos(angle) * radius;
    const particleY = cy + Math.sin(angle) * radius * 0.72;
    previewCtx.globalAlpha = 0.25 + (Math.sin(angle * 1.7) + 1) * 0.2;
    previewCtx.fillStyle = `hsl(${previewFilter === 'matrix' ? 145 : previewFilter === 'pulse' ? 85 : (timestamp * .04 + index * 32) % 360} 100% 70%)`;
    previewCtx.beginPath(); previewCtx.arc(particleX, particleY, index % 3 === 0 ? 2.4 : 1.2, 0, Math.PI * 2); previewCtx.fill();
  }
  previewCtx.globalAlpha = 1;
  if (!previewPaused) requestAnimationFrame(drawPreview);
}

if (previewCanvas) requestAnimationFrame(drawPreview);
document.addEventListener('visibilitychange', () => { if (!document.hidden && !previewPaused) requestAnimationFrame(drawPreview); });
previewCanvas?.addEventListener('pointermove', (event) => {
  const rect = previewCanvas.getBoundingClientRect();
  previewPointer = { x: (event.clientX - rect.left) / rect.width - 0.5, y: (event.clientY - rect.top) / rect.height - 0.5 };
});
previewCanvas?.addEventListener('pointerleave', () => { previewPointer = { x: 0, y: 0 }; });
previewToggle?.addEventListener('click', () => {
  previewPaused = !previewPaused;
  previewToggle.setAttribute('aria-pressed', String(!previewPaused));
  previewToggle.setAttribute('aria-label', `${previewPaused ? 'Play' : 'Pause'} Camera Studio preview`);
  if (previewStatus) previewStatus.textContent = previewPaused ? 'PREVIEW PAUSED · TAP TO PLAY' : 'LIVE PREVIEW · TAP TO PAUSE';
  if (!previewPaused) requestAnimationFrame(drawPreview);
});

document.querySelectorAll('[data-preview-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    previewFilter = button.dataset.previewFilter;
    document.querySelectorAll('[data-preview-filter]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
  });
});

const contactForm = document.getElementById('contact-form');
contactForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const submitButton = document.getElementById('contact-submit');
  const formData = new FormData(contactForm);
  const subject = `${formData.get('service')} inquiry from ${formData.get('name')}`;
  const body = `Name: ${formData.get('name')}\nEmail: ${formData.get('email')}\nService: ${formData.get('service')}\n\n${formData.get('message')}`;
  window.location.href = `mailto:lakmalsujith25@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const status = document.getElementById('contact-form-status');
  submitButton?.classList.add('is-sending');
  if (submitButton) submitButton.disabled = true;
  if (status) status.textContent = 'Opening your email app…';
  window.setTimeout(() => {
    submitButton?.classList.remove('is-sending');
    submitButton?.classList.add('is-sent');
    if (status) status.textContent = 'Inquiry ready — complete the email to send it.';
  }, 700);
});

function renderProfile() {
  document.querySelectorAll('[data-profile="name"]').forEach((element) => { element.textContent = profile.name; });
  document.querySelectorAll('[data-profile="bio"]').forEach((element) => { element.textContent = profile.bio; });
  document.querySelectorAll('[data-profile="sinhalaBio"]').forEach((element) => { element.textContent = profile.sinhalaBio; });
  document.querySelectorAll('[data-profile="role"]').forEach((element) => { element.textContent = profile.role; });
  const tagsEl = document.querySelector('[data-profile-list="tags"]');
  if (tagsEl) tagsEl.replaceChildren(...profile.tags.map((tag) => { const element = document.createElement('span'); element.textContent = tag; return element; }));
  profile.focus.forEach((item, index) => {
    const title = document.querySelector(`[data-profile-focus="${index}-title"]`);
    const detail = document.querySelector(`[data-profile-focus="${index}-detail"]`);
    if (title) title.textContent = item.title;
    if (detail) detail.textContent = item.detail;
  });
  const syncedAt = document.querySelector('[data-profile="syncedAt"]');
  if (syncedAt && profile.syncedAt) syncedAt.textContent = `SYNCED · ${new Date(profile.syncedAt).toLocaleDateString('en-GB')}`;
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.dataset.state = isError ? 'error' : 'normal';
  if (landingStatusEl) landingStatusEl.textContent = message;
  if (landingStatusEl) landingStatusEl.dataset.state = isError ? 'error' : 'normal';
}

renderProfile();

let cameraActive = false;
let hands;
let modelReady = false;
const smoother = createLandmarkSmoother();
const effects = createEffectsRenderer(ctx);

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, PERFORMANCE.pixelRatio);
  canvasEl.width = Math.round(window.innerWidth * dpr);
  canvasEl.height = Math.round(window.innerHeight * dpr);
  canvasEl.style.width = `${window.innerWidth}px`;
  canvasEl.style.height = `${window.innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function getDisplayPoint(lm) {
  const vw = videoEl.videoWidth || 1280;
  const vh = videoEl.videoHeight || 720;
  const cw = window.innerWidth;
  const ch = window.innerHeight;
  const scale = Math.max(cw / vw, ch / vh);
  const renderedW = vw * scale;
  const renderedH = vh * scale;
  return { x: lm.x * renderedW + (cw - renderedW) / 2, y: lm.y * renderedH + (ch - renderedH) / 2, z: lm.z || 0 };
}

function onResults(results) {
  const now = performance.now();
  const handsFound = results.multiHandLandmarks?.length || 0;
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  effects.drawParticles(16);
  if (!cameraActive) return;
  if (!handsFound) {
    effects.clear();
    setStatus('No hands detected');
    return;
  }
  setStatus(`Tracking ${handsFound} hand${handsFound > 1 ? 's' : ''}`);
  const activeLabels = new Set();
  results.multiHandLandmarks.forEach((landmarks, i) => {
    const label = results.multiHandedness?.[i]?.label || `Hand${i}`;
    activeLabels.add(label);
    const handOffset = HAND_OFFSETS[label] ?? i * 155;
    const points = smoother.smoothLandmarks(label, landmarks).map(getDisplayPoint);
    effects.drawMotionTrails(label, points, now, handOffset);
    effects.drawRainbowConnections(points, now, handOffset);
    effects.drawRainbowJoints(points, now, handOffset);
  });
  for (const label of smoother.keys()) {
    if (!activeLabels.has(label)) { smoother.delete(label); effects.deleteTrail(label); }
  }
}

const camera = createCameraController({
  videoEl, cameraToggle, cameraLaunch, retryButton, landingEl, setStatus,
  modelReady: () => modelReady,
  getHands: () => hands,
  setCameraActive: (value) => { cameraActive = value; },
  getCameraActive: () => cameraActive,
  onStop: () => { smoother.clear(); effects.clear(); ctx.clearRect(0, 0, window.innerWidth, window.innerHeight); }
});

window.addEventListener('resize', resizeCanvas, { passive: true });
resizeCanvas();
cameraToggle.addEventListener('click', () => (cameraActive ? camera.stopCamera() : camera.startCamera()));
cameraLaunch.addEventListener('click', () => (cameraActive ? camera.stopCamera() : camera.startCamera()));
retryButton.addEventListener('click', camera.startCamera);
window.addEventListener('beforeunload', camera.stopCamera);

loadHandTracker({ maxNumHands: PERFORMANCE.maxNumHands, modelComplexity: PERFORMANCE.modelComplexity, onResults }).then((tracker) => {
  hands = tracker;
  modelReady = true;
  cameraToggle.disabled = false;
  cameraLaunch.disabled = false;
  setStatus('Ready — start the camera when you are ready.');
}).catch((error) => {
  modelReady = false;
  cameraToggle.disabled = true;
  cameraLaunch.disabled = true;
  retryButton.hidden = false;
  setStatus('The hand tracking model could not load. Check your connection and retry.', true);
  console.error(error);
});

export { MAX_PARTICLES, friendlyCameraError };
