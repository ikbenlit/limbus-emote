import { GUI } from 'lil-gui';
import { CONFIG } from '../config.js';

export const initDebugPanel = ({ motionAnalyzer, emotionDetector } = {}) => {
  if (!CONFIG.debug?.enabled) return null;

  // 1. Settings GUI (Top Right, Collapsed by default)
  const settingsGui = new GUI({ title: '⚙️ Settings', container: document.body });
  settingsGui.domElement.classList.add('gui-settings');
  settingsGui.close();

  const syncMotion = () => {
    motionAnalyzer?.updateConfig(CONFIG.motion);
    emotionDetector?.updateConfig(CONFIG);
  };

  const syncEmotion = () => {
    emotionDetector?.updateConfig(CONFIG);
  };

  const motion = settingsGui.addFolder('Motion');
  motion.add(CONFIG.motion, 'velocityLow', 0.005, 0.08, 0.001).onChange(syncMotion);
  motion.add(CONFIG.motion, 'velocityMedium', 0.01, 0.12, 0.001).onChange(syncMotion);
  motion.add(CONFIG.motion, 'velocityHigh', 0.02, 0.2, 0.001).onChange(syncMotion);
  motion.add(CONFIG.motion, 'jerkLow', 0.001, 0.05, 0.001).onChange(syncMotion);
  motion.add(CONFIG.motion, 'jerkHigh', 0.01, 0.2, 0.001).onChange(syncMotion);
  motion.add(CONFIG.motion, 'circularThreshold', 0.2, 1, 0.01).onChange(syncMotion);
  motion.add(CONFIG.motion, 'smoothingAlpha', 0.05, 0.95, 0.01).onChange(syncMotion);
  motion.add(CONFIG.motion, 'trajectoryBufferSize', 10, 60, 1).onChange(syncMotion);

  const emotion = settingsGui.addFolder('Emotion');
  emotion.add(CONFIG.emotion, 'hysteresisDelay', 100, 1000, 10).onChange(syncEmotion);
  emotion.add(CONFIG.emotion, 'transitionDuration', 100, 800, 10).onChange(syncEmotion);

  const twoHand = settingsGui.addFolder('Two-Hand');
  twoHand.add(CONFIG.twoHand, 'magnetRadius', 0.1, 1, 0.01);
  twoHand.add(CONFIG.twoHand, 'magnetStrength', 0, 5, 0.05);
  twoHand.add(CONFIG.twoHand, 'fusionDistance', 0.05, 0.4, 0.005);
  twoHand.add(CONFIG.twoHand, 'fusionHoldTime', 50, 1000, 10);
  twoHand.add(CONFIG.twoHand, 'fusionCooldown', 200, 3000, 50);
  twoHand.add(CONFIG.twoHand, 'amplifyMultiplier', 1, 3, 0.05);
  twoHand.add(CONFIG.twoHand, 'amplifyScale', 1, 2, 0.05);
  twoHand.add(CONFIG.twoHand, 'fusionParticleCount', 100, 2000, 50);
  twoHand.add(CONFIG.twoHand, 'fusionSpeed', 0.1, 1.2, 0.05);
  twoHand.add(CONFIG.twoHand, 'fusionDuration', 0.2, 1.5, 0.05);

  const debug = settingsGui.addFolder('Debug');
  debug.add(CONFIG.debug, 'enabled');
  debug.add(CONFIG.debug, 'logEmotionChanges');

  // 2. Left Hand Stats (Bottom Left)
  const leftGui = new GUI({ title: '👈 Left Hand', container: document.body });
  leftGui.domElement.classList.add('gui-left');
  const leftLive = {
    emotion: 'neutraal',
    velocity: 0,
    jerk: 0,
    circular: 0
  };
  leftGui.add(leftLive, 'emotion').listen();
  leftGui.add(leftLive, 'velocity').listen();
  leftGui.add(leftLive, 'jerk').listen();
  leftGui.add(leftLive, 'circular').listen();

  // 3. Right Hand Stats (Bottom Right)
  const rightGui = new GUI({ title: '👉 Right Hand', container: document.body });
  rightGui.domElement.classList.add('gui-right');
  const rightLive = {
    emotion: 'neutraal',
    velocity: 0,
    jerk: 0,
    circular: 0,
    fingerCount: 0,
    label: '-',
    fingers: '-'
  };
  rightGui.add(rightLive, 'emotion').listen();
  rightGui.add(rightLive, 'velocity').listen();
  rightGui.add(rightLive, 'jerk').listen();
  rightGui.add(rightLive, 'circular').listen();
  rightGui.add(rightLive, 'fingerCount').listen();
  rightGui.add(rightLive, 'label').listen();
  rightGui.add(rightLive, 'fingers').listen();

  return {
    updateLiveStats: (stats) => {
      if (stats.hands !== undefined) {
        // Option to display total hands somewhere if needed
      }
      if (stats.leftEmotion !== undefined) {
        leftLive.emotion = stats.leftEmotion;
        leftLive.velocity = stats.leftVelocity;
        leftLive.jerk = stats.leftJerk;
        leftLive.circular = stats.leftCircular;
      }
      if (stats.rightEmotion !== undefined) {
        rightLive.emotion = stats.rightEmotion;
        rightLive.velocity = stats.rightVelocity;
        rightLive.jerk = stats.rightJerk;
        rightLive.circular = stats.rightCircular;
        rightLive.fingerCount = stats.rightFingerCount ?? 0;
        rightLive.label = stats.rightLabel || '-';
        rightLive.fingers = stats.rightFingers || '-';
      }

      // Auto-hide/show panels based on hand detection
      const hasLeft = stats.leftVelocity !== undefined && stats.leftVelocity !== 0;
      const hasRight = stats.rightVelocity !== undefined && stats.rightVelocity !== 0;

      leftGui.domElement.style.opacity = hasLeft ? '1' : '0.3';
      rightGui.domElement.style.opacity = hasRight ? '1' : '0.3';
    },
    destroy: () => {
      settingsGui.destroy();
      leftGui.destroy();
      rightGui.destroy();
    }
  };
};
