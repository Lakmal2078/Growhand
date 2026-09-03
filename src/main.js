import './style.css';

const videoEl = document.getElementById('video');
const canvasEl = document.getElementById('overlay');
const ctx = canvasEl.getContext('2d', { alpha: true });
const statusEl = document.getElementById('status');

const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4], [0,5],[5,6],[6,7],[7,8],
  [5,9],[9,10],[10,11],[11,12], [9,13],[13,14],[14,15],[15,16],
  [13,17],[17,18],[18,19],[19,20], [0,17]
];

const HAND_COLORS = {
  Left:  { line: '#00e5ff', glow: '#00e5ff', accent: '#b9f8ff', dot: '#ffffff' },
  Right: { line: '#ff2fd0', glow: '#ff2fd0', accent: '#ffd0f3', dot: '#ffffff' }
};

const smoothedHands = new Map();
const particles = [];
let lastFrameTime = performance.now();
let fps = 0;
let lastResultsAt = 0;

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
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
    const fresh = landmarks.map(p => ({ x: p.x, y: p.y, z: p.z }));
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

function drawGlowingConnections(points, colors, time) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const pulse = 0.88 + Math.sin(time * 0.004) * 0.12;

  for (const [a, b] of HAND_CONNECTIONS) {
    const p1 = points[a], p2 = points[b];
    for (const layer of [
      { width: 15, blur: 28, alpha: 0.10 },
      { width: 8, blur: 15, alpha: 0.25 },
      { width: 4, blur: 7, alpha: 0.72 }
    ]) {
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = colors.glow;
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = layer.blur;
      ctx.lineWidth = layer.width;
      ctx.globalAlpha = layer.alpha * pulse;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = colors.accent;
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = 5;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.96;
    ctx.stroke();
  }
  ctx.restore();
}

function drawGlowingJoints(points, colors, time) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const pulse = 1 + Math.sin(time * 0.006) * 0.08;
  points.forEach((p, index) => {
    const radius = (index === 0 || index === 4 || index === 8 || index === 12 || index === 16 || index === 20) ? 5.2 : 3.5;
    const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 24 * pulse);
    halo.addColorStop(0, colors.accent);
    halo.addColorStop(0.22, colors.glow + 'cc');
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = halo;
    ctx.globalAlpha = 0.72;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 24 * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = colors.dot;
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = 14;
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fill();

    if (index === 8 || index === 4) {
      particles.push({ x: p.x, y: p.y, color: colors.glow, life: 1, size: 1.5 + Math.random() * 2.5 });
    }
  });
  ctx.restore();
}

function drawParticles(delta) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= delta * 0.0018;
    p.size *= 0.994;
    if (p.life <= 0) { particles.splice(i, 1); continue; }
    ctx.globalAlpha = p.life * 0.65;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function onResults(results) {
  const now = performance.now();
  const delta = Math.min(now - lastFrameTime, 100);
  fps = fps * 0.9 + (1000 / Math.max(delta, 1)) * 0.1;
  lastFrameTime = now;
  lastResultsAt = now;

  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  drawParticles(delta);

  const handsFound = results.multiHandLandmarks?.length || 0;
  if (!handsFound) {
    statusEl.textContent = 'No hands detected';
    return;
  }

  statusEl.textContent = `Tracking ${handsFound} hand${handsFound > 1 ? 's' : ''} · ${Math.round(fps)} FPS`;
  const activeLabels = new Set();
  results.multiHandLandmarks.forEach((landmarks, i) => {
    const label = results.multiHandedness?.[i]?.label || `Hand${i}`;
    activeLabels.add(label);
    const colors = HAND_COLORS[label] || HAND_COLORS.Right;
    const smooth = smoothLandmarks(label, landmarks);
    const points = smooth.map(getDisplayPoint);
    drawGlowingConnections(points, colors, now);
    drawGlowingJoints(points, colors, now);
  });
  for (const label of smoothedHands.keys()) {
    if (!activeLabels.has(label)) smoothedHands.delete(label);
  }
}

async function init() {
  // Load MediaPipe scripts dynamically
  await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
  await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');

  const hands = new Hands({
    locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });
  hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.68,
    minTrackingConfidence: 0.72
  });
  hands.onResults(onResults);

  const camera = new Camera(videoEl, {
    onFrame: async () => { await hands.send({ image: videoEl }); },
    width: 1280,
    height: 720
  });

  camera.start()
    .then(() => { statusEl.textContent = 'Camera started — show your hands!'; })
    .catch(err => {
      statusEl.textContent = 'Camera error: ' + err.message;
      console.error(err);
    });
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.crossOrigin = 'anonymous';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

init().catch(err => {
  statusEl.textContent = 'Failed to load hand tracking model';
  console.error(err);
});
