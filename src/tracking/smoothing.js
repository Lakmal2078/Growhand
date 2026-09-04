export function createLandmarkSmoother(alpha = 0.36) {
  const smoothedHands = new Map();

  function smoothLandmarks(label, landmarks) {
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

  return {
    smoothLandmarks,
    delete(label) { smoothedHands.delete(label); },
    clear() { smoothedHands.clear(); },
    keys() { return smoothedHands.keys(); }
  };
}
