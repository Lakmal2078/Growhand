const MEDIAPIPE_CAMERA_VERSION = '0.3.1675466862';
const MEDIAPIPE_HANDS_VERSION = '0.4.1675469240';
const CAMERA_UTILS_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@${MEDIAPIPE_CAMERA_VERSION}/camera_utils.js`;
const HANDS_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/hands@${MEDIAPIPE_HANDS_VERSION}/hands.js`;
const HANDS_ASSET_BASE_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/hands@${MEDIAPIPE_HANDS_VERSION}/`;

export async function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.crossOrigin = 'anonymous';
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

export async function loadHandTracker({ maxNumHands, modelComplexity, onResults }) {
  await loadScript(CAMERA_UTILS_URL);
  await loadScript(HANDS_URL);
  const hands = new Hands({ locateFile: (file) => `${HANDS_ASSET_BASE_URL}${file}` });
  hands.setOptions({ maxNumHands, modelComplexity, minDetectionConfidence: 0.62, minTrackingConfidence: 0.68 });
  hands.onResults(onResults);
  return hands;
}
