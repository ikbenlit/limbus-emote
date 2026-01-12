const FINGER_TIPS = {
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

const Y_THRESHOLD = 0.015;
const X_THRESHOLD = 0.01;

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
