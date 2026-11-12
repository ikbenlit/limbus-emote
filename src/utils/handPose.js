export const FINGER_TIPS = {
  thumb: 4,
  index: 8,
  middle: 12,
  ring: 16,
  pinky: 20
};

const FINGER_PIPS = {
  thumb: 3,
  index: 6,
  middle: 10,
  ring: 14,
  pinky: 18
};

// Palm landmarks: wrist + finger bases
const PALM_INDICES = [0, 5, 9, 13, 17];

const Y_THRESHOLD = 0.015;
const X_THRESHOLD = 0.05;  // Increased for more reliable thumb detection

export const getFingerStates = (landmarks, handednessLabel = 'Right') => {
  if (!landmarks || landmarks.length < 21) {
    return null;
  }

  const thumbTip = landmarks[FINGER_TIPS.thumb];
  const thumbIp = landmarks[FINGER_PIPS.thumb];
  const isRight = handednessLabel === 'Right';
  const thumbExtended = isRight
    ? thumbTip.x < thumbIp.x - X_THRESHOLD
    : thumbTip.x > thumbIp.x + X_THRESHOLD;

  const isExtended = (tipIndex, pipIndex) => {
    const tip = landmarks[tipIndex];
    const pip = landmarks[pipIndex];
    return tip.y < pip.y - Y_THRESHOLD;
  };

  return {
    thumb: thumbExtended,
    index: isExtended(FINGER_TIPS.index, FINGER_PIPS.index),
    middle: isExtended(FINGER_TIPS.middle, FINGER_PIPS.middle),
    ring: isExtended(FINGER_TIPS.ring, FINGER_PIPS.ring),
    pinky: isExtended(FINGER_TIPS.pinky, FINGER_PIPS.pinky)
  };
};

export const getFingerCount = (landmarks, handednessLabel = 'Right') => {
  const states = getFingerStates(landmarks, handednessLabel);
  if (!states) return 0;
  return Object.values(states).filter(Boolean).length;
};

/**
 * Get palm center from landmarks
 * Uses landmarks 0 (wrist) and finger bases (5, 9, 13, 17)
 * @param {Object[]} landmarks - Array of 21 landmarks
 * @returns {{x: number, y: number, z: number}}
 */
export const getPalmCenter = (landmarks) => {
  let x = 0, y = 0, z = 0;

  for (const idx of PALM_INDICES) {
    x += landmarks[idx].x;
    y += landmarks[idx].y;
    z += landmarks[idx].z;
  }

  return {
    x: x / PALM_INDICES.length,
    y: y / PALM_INDICES.length,
    z: z / PALM_INDICES.length
  };
};

/**
 * Calculate finger spread (how open the hand is)
 * @param {Object[]} landmarks - Array of 21 landmarks
 * @returns {number} - 0 (closed) to 1 (fully open)
 */
export const getFingerSpread = (landmarks) => {
  const fingertips = Object.values(FINGER_TIPS);
  const palmCenter = getPalmCenter(landmarks);

  // Calculate average distance from palm center to fingertips
  let totalDistance = 0;
  for (const idx of fingertips) {
    const dx = landmarks[idx].x - palmCenter.x;
    const dy = landmarks[idx].y - palmCenter.y;
    totalDistance += Math.sqrt(dx * dx + dy * dy);
  }

  const avgDistance = totalDistance / fingertips.length;

  // Normalize to 0-1 range (empirically determined thresholds)
  // Closed fist: ~0.08, Open hand: ~0.25
  return Math.min(1, Math.max(0, (avgDistance - 0.08) / 0.17));
};
