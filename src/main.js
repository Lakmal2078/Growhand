import './style.css';
import { profile } from './profile-data.js';

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

function renderProfile() {
  document.querySelectorAll('[data-profile="name"]').forEach((element) => { element.textContent = profile.name; });
  document.querySelectorAll('[data-profile="bio"]').forEach((element) => { element.textContent = profile.bio; });
  document.querySelectorAll('[data-profile="sinhalaBio"]').forEach((element) => { element.textContent = profile.sinhalaBio; });
  document.querySelectorAll('[data-profile="role"]').forEach((element) => { element.textContent = profile.role; });
  const tagsEl = document.querySelector('[data-profile-list="tags"]');
  if (tagsEl) tagsEl.replaceChildren(...profile.tags.map((tag) => {
    const element = document.createElement('span');
    element.textContent = tag;
    return element;
  }));
  profile.focus.forEach((item, index) => {
    const title = document.querySelector(`[data-profile-focus="${index}-title"]`);
    const detail = document.querySelector(`[data-profile-focus="${index}-detail"]`);
    if (title) title.textContent = item.title;
    if (detail) detail.textContent = item.detail;
  });
  const syncedAt = document.querySelector('[data-profile="syncedAt"]');
  if (syncedAt && profile.syncedAt) syncedAt.textContent = `SYNCED · ${new Date(profile.syncedAt).toLocaleDateString('en-GB')}`;
}

renderProfile();

async function loadGitHubProjects() {
  const grid = document.getElementById('github-project-grid');
  if (!grid) return;
  try {
    const response = await fetch('https://api.github.com/users/Lakmal2078/repos?sort=updated&per_page=8', { headers: { Accept: 'application/vnd.github+json' } });
    if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);
    const repositories = (await response.json()).filter((repo) => !repo.fork).slice(0, 6);
    if (!repositories.length) throw new Error('No public repositories found');
    grid.replaceChildren(...repositories.map((repo, index) => {
      const card = document.createElement('article');
      card.className = 'project-card';
      card.innerHTML = `<div class="project-meta"><span>REPOSITORY / ${String(index + 1).padStart(2, '0')}</span><span>${repo.language || 'OPEN SOURCE'}</span></div><h3></h3><p></p><div class="project-tags"><span>${repo.stargazers_count} ★</span><span>${repo.forks_count} FORKS</span></div><a target="_blank" rel="noreferrer">View on GitHub <span>↗</span></a>`;
      card.querySelector('h3').textContent = repo.name;
      card.querySelector('p').textContent = repo.description || 'An open-source experiment from the Growhand workspace.';
      card.querySelector('a').href = repo.html_url;
      return card;
    }));
  } catch (error) {
    grid.replaceChildren();
    const message = document.createElement('p');
    message.className = 'loading-copy';
    message.textContent = 'GitHub projects are unavailable right now. Explore all repositories ↗';
    grid.append(message);
    console.warn('Could not load GitHub repositories', error);
  }
}

loadGitHubProjects();

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20], [0, 17]
];

const HAND_OFFSETS = { Left: 0, Right: 155 };
const isMobileDevice = window.matchMedia('(max-width: 700px)').matches || navigator.maxTouchPoints > 1;
const isLowPowerDevice = isMobileDevice && (navigator.hardwareConcurrency || 4) <= 6;
const PERFORMANCE = isLowPowerDevice
  ? { cameraWidth: 480, cameraHeight: 360, maxNumHands: 1, modelComplexity: 0, processInterval: 1000 / 12, trailLength: 2, particleLimit: 24, pixelRatio: 1 }
  : isMobileDevice
    ? { cameraWidth: 960, cameraHeight: 540, maxNumHands: 2, modelComplexity: 0, processInterval: 1000 / 24, trailLength: 5, particleLimit: 120, pixelRatio: 1.25 }
    : { cameraWidth: 1280, cameraHeight: 720, maxNumHands: 2, modelComplexity: 1, processInterval: 1000 / 30, trailLength: 7, particleLimit: 240, pixelRatio: 2 };
const TRAIL_LENGTH = PERFORMANCE.trailLength;
const RAINBOW_SATURATION = 100;
const RAINBOW_LIGHTNESS = 64;

export const MAX_PARTICLES = PERFORMANCE.particleLimit;
const smoothedHands = new Map();
const trailHistory = new Map();
const particles = [];
let lastFrameTime = performance.now();
let lastProcessTime = 0;
let lastStatusTime = 0;
let fps = 0;
let hands;
let cameraActive = false;
let frameRequest = 0;
let modelReady = false;

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.dataset.state = isError ? 'error' : 'normal';
  if (landingStatusEl) landingStatusEl.textContent = message;
  if (landingStatusEl) landingStatusEl.dataset.state = isError ? 'error' : 'normal';
}

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, PERFORMANCE.pixelRatio);
  canvasEl.width = Math.round(window.innerWidth * dpr);
  canvasEl.height = Math.round(window.innerHeight * dpr);
  canvasEl.style.width = `${window.innerWidth}px`;
  canvasEl.style.height = `${window.innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener('resize', resizeCanvas, { passive: true });
resizeCanvas();

function getDisplayPoint(lm) {
  const vw = videoEl.videoWidth || 1280;
  const vh = videoEl.videoHeight || 720;
  const cw = window.innerWidth;
  const ch = window.innerHeight;
  const scale = Math.max(cw / vw, ch / vh);
  const renderedW = vw * scale;
  const renderedH = vh * scale;
  return {
    x: lm.x * renderedW + (cw - renderedW) / 2,
    y: lm.y * renderedH + (ch - renderedH) / 2,
    z: lm.z || 0
  };
}

function smoothLandmarks(label, landmarks) {
  const alpha = 0.36;
  const old = smoothedHands.get(label);
  if (!old || old.length !== landmarks.length) {
    const fresh = landmarks.map((p) => ({ x: p.x, y: p.y, z: p.z || 0 }));
    smoothedHands.set(label, fresh);
    return fresh;
  }
  const next = landmarks.map((p, i) => ({
    x: old[i].x + (p.x - old[i].x) * alpha,
    y: old[i].y + (p.y - old[i].y) * alpha,
    z: old[i].z + ((p.z || 0) - old[i].z) * alpha
  }));
  smoothedHands.set(label, next);
  return next;
}

function rainbowColor(index, time, handOffset = 0, alpha = 1) {
  const hue = (time * 0.045 + index * 27 + handOffset) % 360;
  return `hsla(${hue}, ${RAINBOW_SATURATION}%, ${RAINBOW_LIGHTNESS}%, ${alpha})`;
}

function addParticle(p, color) {
  if (particles.length >= MAX_PARTICLES) particles.splice(0, particles.length - MAX_PARTICLES + 1);
  particles.push({
    x: p.x,
    y: p.y,
    vx: (Math.random() - 0.5) * 0.035,
    vy: (Math.random() - 0.5) * 0.035,
    color,
    life: 1,
    size: 1.5 + Math.random() * 2.5
  });
}

function drawMotionTrails(label, points, time, handOffset) {
  const history = trailHistory.get(label) || [];
  history.unshift(points.map((point) => ({ ...point })));
  history.splice(TRAIL_LENGTH);
  trailHistory.set(label, history);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  history.slice(1).forEach((frame, frameIndex) => {
    const alpha = 0.22 * (1 - frameIndex / history.length);
    HAND_CONNECTIONS.forEach(([a, b], connectionIndex) => {
      const p1 = frame[a];
      const p2 = frame[b];
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = rainbowColor(connectionIndex + frameIndex, time - frameIndex * 80, handOffset, alpha);
      ctx.shadowColor = rainbowColor(connectionIndex, time, handOffset, alpha);
      ctx.shadowBlur = 12;
      ctx.lineWidth = Math.max(1, 4 - frameIndex * 0.45);
      ctx.stroke();
    });
  });
  ctx.restore();
}

function drawRainbowConnections(points, time, handOffset) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const pulse = 0.88 + Math.sin(time * 0.004) * 0.12;
  HAND_CONNECTIONS.forEach(([a, b], connectionIndex) => {
    const p1 = points[a];
    const p2 = points[b];
    const colorA = rainbowColor(connectionIndex, time, handOffset);
    const colorB = rainbowColor(connectionIndex + 2, time + 450, handOffset);
    const gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
    gradient.addColorStop(0, colorA);
    gradient.addColorStop(0.5, colorB);
    gradient.addColorStop(1, rainbowColor(connectionIndex + 4, time + 900, handOffset));
    const glowLayers = isLowPowerDevice
      ? [{ width: 4, blur: 5, alpha: 0.92 }]
      : isMobileDevice
        ? [{ width: 12, blur: 18, alpha: 0.16 }, { width: 5, blur: 8, alpha: 0.86 }]
      : [{ width: 18, blur: 32, alpha: 0.12 }, { width: 9, blur: 18, alpha: 0.3 }, { width: 4, blur: 8, alpha: 0.9 }];
    for (const layer of glowLayers) {
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = gradient;
      ctx.shadowColor = colorA;
      ctx.shadowBlur = layer.blur;
      ctx.lineWidth = layer.width;
      ctx.globalAlpha = layer.alpha * pulse;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = '#fff8ff';
    ctx.shadowColor = colorB;
    ctx.shadowBlur = 8;
    ctx.lineWidth = 1.2;
    ctx.globalAlpha = 0.9;
    ctx.stroke();
  });
  ctx.restore();
}

function drawRainbowJoints(points, time, handOffset) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const pulse = 1 + Math.sin(time * 0.006) * 0.08;
  points.forEach((p, index) => {
    const color = rainbowColor(index, time, handOffset);
    const radius = [0, 4, 8, 12, 16, 20].includes(index) ? 5.4 : 3.6;
    if (!isLowPowerDevice) {
      const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 25 * pulse);
      halo.addColorStop(0, rainbowColor(index, time, handOffset, 0.95));
      halo.addColorStop(0.22, rainbowColor(index + 2, time, handOffset, 0.72));
      halo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = halo;
      ctx.globalAlpha = 0.78;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 25 * pulse, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = color;
      ctx.shadowBlur = isLowPowerDevice ? 3 : isMobileDevice ? 8 : 16;
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fill();
    if (!isLowPowerDevice && (index === 8 || index === 4)) addParticle(p, color);
  });
  ctx.restore();
}

function drawParticles(delta) {
  if (isLowPowerDevice) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const particle = particles[i];
    particle.life -= delta * 0.0018;
    particle.x += particle.vx * delta;
    particle.y += particle.vy * delta;
    particle.size *= 0.994;
    if (particle.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    ctx.globalAlpha = particle.life * 0.65;
    ctx.fillStyle = particle.color;
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function onResults(results) {
  const now = performance.now();
  const delta = Math.min(now - lastFrameTime, 100);
  fps = fps * 0.9 + (1000 / Math.max(delta, 1)) * 0.1;
  lastFrameTime = now;
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  drawParticles(delta);
  if (!cameraActive) return;
  const handsFound = results.multiHandLandmarks?.length || 0;
  if (!handsFound) {
    trailHistory.clear();
    setStatus('No hands detected');
    return;
  }
  if (now - lastStatusTime >= 500) {
    setStatus(`Tracking ${handsFound} hand${handsFound > 1 ? 's' : ''} · ${Math.round(fps)} FPS`);
    lastStatusTime = now;
  }
  const activeLabels = new Set();
  results.multiHandLandmarks.forEach((landmarks, i) => {
    const label = results.multiHandedness?.[i]?.label || `Hand${i}`;
    activeLabels.add(label);
    const handOffset = HAND_OFFSETS[label] ?? i * 155;
    const points = smoothLandmarks(label, landmarks).map(getDisplayPoint);
    drawMotionTrails(label, points, now, handOffset);
    drawRainbowConnections(points, now, handOffset);
    drawRainbowJoints(points, now, handOffset);
  });
  for (const label of smoothedHands.keys()) {
    if (!activeLabels.has(label)) {
      smoothedHands.delete(label);
      trailHistory.delete(label);
    }
  }
}

function friendlyCameraError(error) {
  if (!window.isSecureContext) return 'Camera access requires HTTPS or localhost. Open http://localhost:5173 in Chrome and retry.';
  if (!navigator.mediaDevices?.getUserMedia) return 'This browser does not support camera access. Use the latest Chrome and retry.';
  if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') {
    return 'Camera permission was denied or blocked. In Chrome, set Site settings → Camera → Allow; on Android also check Settings → Apps → Chrome → Permissions → Camera, then retry.';
  }
  if (error?.name === 'NotFoundError') return 'No camera was found. Connect a camera and retry.';
  if (error?.name === 'NotReadableError') return 'The camera is busy in another app. Close it and retry.';
  if (error?.name === 'OverconstrainedError') return 'The selected camera settings are not supported. Retry with the default camera settings.';
  return 'Unable to start the camera. Check permissions and retry.';
}

function stopCamera() {
  cameraActive = false;
  landingEl.classList.remove('is-live', 'is-starting');
  if (frameRequest) cancelAnimationFrame(frameRequest);
  frameRequest = 0;
  videoEl.srcObject?.getTracks().forEach((track) => track.stop());
  videoEl.srcObject = null;
  smoothedHands.clear();
  trailHistory.clear();
  particles.length = 0;
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  cameraToggle.textContent = 'Start camera';
  setStatus(modelReady ? 'Camera stopped' : 'Loading hand tracker…');
}

async function processVideoFrame(timestamp = performance.now()) {
  if (!cameraActive || !hands) return;
  if (timestamp - lastProcessTime < PERFORMANCE.processInterval) {
    frameRequest = requestAnimationFrame(processVideoFrame);
    return;
  }
  lastProcessTime = timestamp;
  try {
    await hands.send({ image: videoEl });
  } catch (error) {
    stopCamera();
    retryButton.hidden = false;
    setStatus('Hand tracking stopped unexpectedly. Retry to continue.', true);
    console.error(error);
    return;
  }
  if (cameraActive) frameRequest = requestAnimationFrame(processVideoFrame);
}

async function waitForVideoMetadata() {
  if (videoEl.readyState >= HTMLMediaElement.HAVE_METADATA) return;
  await new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('Timed out while waiting for camera video metadata'));
    }, 5000);
    const cleanup = () => {
      window.clearTimeout(timeout);
      videoEl.removeEventListener('loadedmetadata', onLoadedMetadata);
      videoEl.removeEventListener('error', onVideoError);
    };
    const onLoadedMetadata = () => {
      cleanup();
      resolve();
    };
    const onVideoError = () => {
      cleanup();
      reject(new Error('Camera video could not be loaded'));
    };
    videoEl.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
    videoEl.addEventListener('error', onVideoError, { once: true });
  });
}

async function requestCameraStream() {
  const constraints = {
    video: {
      width: { ideal: PERFORMANCE.cameraWidth },
      height: { ideal: PERFORMANCE.cameraHeight },
      facingMode: { ideal: 'user' }
    },
    audio: false
  };
  try {
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (error) {
    if (error?.name !== 'OverconstrainedError') throw error;
    return navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  }
}

async function startCamera() {
  if (!modelReady || cameraActive) return;
  cameraToggle.disabled = true;
  cameraLaunch.disabled = true;
  retryButton.hidden = true;
  landingEl.classList.add('is-starting');
  setStatus('Requesting camera permission…');
  let stream;
  try {
    if (!window.isSecureContext) throw new Error('Insecure camera context');
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera API unavailable');
    stream = await requestCameraStream();
    videoEl.srcObject = stream;
    await waitForVideoMetadata();
    await videoEl.play();
    cameraActive = true;
    landingEl.classList.remove('is-starting');
    landingEl.classList.add('is-live');
    cameraToggle.textContent = 'Stop camera';
    setStatus('Camera started — show your hands!');
    frameRequest = requestAnimationFrame(processVideoFrame);
  } catch (error) {
    stream?.getTracks().forEach((track) => track.stop());
    videoEl.srcObject = null;
    cameraActive = false;
    landingEl.classList.remove('is-live', 'is-starting');
    retryButton.hidden = false;
    const errorName = error?.name ? ` [${error.name}]` : '';
    setStatus(`${friendlyCameraError(error)}${errorName}`, true);
    console.error(error);
  } finally {
    cameraToggle.disabled = false;
    cameraLaunch.disabled = false;
  }
}

async function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.crossOrigin = 'anonymous';
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

async function loadModel() {
  await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
  await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
  hands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
  hands.setOptions({ maxNumHands: PERFORMANCE.maxNumHands, modelComplexity: PERFORMANCE.modelComplexity, minDetectionConfidence: 0.62, minTrackingConfidence: 0.68 });
  hands.onResults(onResults);
  modelReady = true;
  cameraToggle.disabled = false;
  cameraLaunch.disabled = false;
  setStatus('Ready — start the camera when you are ready.');
}

cameraToggle.addEventListener('click', () => (cameraActive ? stopCamera() : startCamera()));
cameraLaunch.addEventListener('click', () => (cameraActive ? stopCamera() : startCamera()));
retryButton.addEventListener('click', startCamera);
window.addEventListener('beforeunload', stopCamera);

loadModel().catch((error) => {
  modelReady = false;
  cameraToggle.disabled = true;
  cameraLaunch.disabled = true;
  retryButton.hidden = false;
  setStatus('The hand tracking model could not load. Check your connection and retry.', true);
  retryButton.addEventListener('click', () => window.location.reload(), { once: true });
  console.error(error);
});

export { addParticle, particles, friendlyCameraError };
