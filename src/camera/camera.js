import { PERFORMANCE } from '../config/performance.js';
import { friendlyCameraError, waitForVideoMetadata } from './permissions.js';

export function createCameraController({ videoEl, cameraToggle, cameraLaunch, retryButton, landingEl, setStatus, modelReady, getHands, setCameraActive, getCameraActive, onStop }) {
  let frameRequest = 0;
  let lastProcessTime = 0;

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

  function stopCamera() {
    setCameraActive(false);
    landingEl.classList.remove('is-live', 'is-starting');
    if (frameRequest) cancelAnimationFrame(frameRequest);
    frameRequest = 0;
    videoEl.srcObject?.getTracks().forEach((track) => track.stop());
    videoEl.srcObject = null;
    onStop?.();
    cameraToggle.textContent = 'Start camera';
    setStatus(modelReady() ? 'Camera stopped' : 'Loading hand tracker…');
  }

async function processVideoFrame(timestamp = performance.now()) {
  if (!getCameraActive() || !getHands()) return;
  if (timestamp - lastProcessTime < PERFORMANCE.processInterval) {
    frameRequest = requestAnimationFrame(processVideoFrame);
    return;
  }
  lastProcessTime = timestamp;
  try {
    const hands = getHands();
    await hands.send({ image: videoEl });  // hands.send is now explicit
  } catch (error) {
      stopCamera();
      retryButton.hidden = false;
      setStatus('Hand tracking stopped unexpectedly. Retry to continue.', true);
      console.error(error);
      return;
    }
    if (getCameraActive()) frameRequest = requestAnimationFrame(processVideoFrame);
  }

  async function startCamera() {
    if (!modelReady() || getCameraActive()) return;
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
      await waitForVideoMetadata(videoEl);
      await videoEl.play();
      setCameraActive(true);
      landingEl.classList.remove('is-starting');
      landingEl.classList.add('is-live');
      cameraToggle.textContent = 'Stop camera';
      setStatus('Camera started — show your hands!');
      frameRequest = requestAnimationFrame(processVideoFrame);
    } catch (error) {
      stream?.getTracks().forEach((track) => track.stop());
      videoEl.srcObject = null;
      setCameraActive(false);
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

  return { startCamera, stopCamera, processVideoFrame, requestCameraStream };
}
