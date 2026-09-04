import { HAND_CONNECTIONS, isLowPowerDevice, isMobileDevice, MAX_PARTICLES, RAINBOW_LIGHTNESS, RAINBOW_SATURATION, TRAIL_LENGTH } from '../config/performance.js';

export function createEffectsRenderer(ctx) {
  const trailHistory = new Map();
  const particles = [];

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

  return {
    particles,
    clear() { trailHistory.clear(); particles.length = 0; },
    deleteTrail(label) { trailHistory.delete(label); },
    drawMotionTrails,
    drawRainbowConnections,
    drawRainbowJoints,
    drawParticles,
    rainbowColor,
    addParticle
  };
}
