export const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20], [0, 17]
];

export const HAND_OFFSETS = { Left: 0, Right: 155 };
export const isMobileDevice = window.matchMedia('(max-width: 700px)').matches || navigator.maxTouchPoints > 1;
export const isLowPowerDevice = isMobileDevice && (navigator.hardwareConcurrency || 4) <= 6;

export const PERFORMANCE = isLowPowerDevice
  ? { cameraWidth: 480, cameraHeight: 360, maxNumHands: 1, modelComplexity: 0, processInterval: 1000 / 12, trailLength: 2, particleLimit: 24, pixelRatio: 1 }
  : isMobileDevice
    ? { cameraWidth: 960, cameraHeight: 540, maxNumHands: 2, modelComplexity: 0, processInterval: 1000 / 24, trailLength: 5, particleLimit: 120, pixelRatio: 1.25 }
    : { cameraWidth: 1280, cameraHeight: 720, maxNumHands: 2, modelComplexity: 1, processInterval: 1000 / 30, trailLength: 7, particleLimit: 240, pixelRatio: 2 };

export const TRAIL_LENGTH = PERFORMANCE.trailLength;
export const RAINBOW_SATURATION = 100;
export const RAINBOW_LIGHTNESS = 64;
export const MAX_PARTICLES = PERFORMANCE.particleLimit;
