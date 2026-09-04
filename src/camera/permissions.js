export function friendlyCameraError(error) {
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

export function waitForVideoMetadata(videoEl, timeoutMs = 5000) {
  if (videoEl.readyState >= HTMLMediaElement.HAVE_METADATA) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('Timed out while waiting for camera video metadata'));
    }, timeoutMs);
    const cleanup = () => {
      window.clearTimeout(timeout);
      videoEl.removeEventListener('loadedmetadata', onLoadedMetadata);
      videoEl.removeEventListener('error', onVideoError);
    };
    const onLoadedMetadata = () => { cleanup(); resolve(); };
    const onVideoError = () => { cleanup(); reject(new Error('Camera video could not be loaded')); };
    videoEl.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
    videoEl.addEventListener('error', onVideoError, { once: true });
  });
}
