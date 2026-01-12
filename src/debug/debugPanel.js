import { GUI } from 'lil-gui';
import { CONFIG } from '../config.js';

export const initDebugPanel = ({ motionAnalyzer, emotionDetector } = {}) => {
  if (!CONFIG.debug?.enabled) return null;

  const gui = new GUI({ title: 'Limbus Debug' });
  const live = {
    hands: 0,
    rightEmotion: 'neutraal',
    rightVelocity: 0,
    rightJerk: 0,
    rightCircular: 0,
    leftEmotion: 'neutraal',
    leftVelocity: 0,
    leftJerk: 0,
    leftCircular: 0
  };

  const syncMotion = () => {
    motionAnalyzer?.updateConfig(CONFIG.motion);
    emotionDetector?.updateConfig(CONFIG);
  };

  const syncEmotion = () => {
    emotionDetector?.updateConfig(CONFIG);
  };

  const motion = gui.addFolder('Motion');
  motion.add(CONFIG.motion, 'velocityLow', 0.005, 0.08, 0.001).onChange(syncMotion);
  motion.add(CONFIG.motion, 'velocityMedium', 0.01, 0.12, 0.001).onChange(syncMotion);
  motion.add(CONFIG.motion, 'velocityHigh', 0.02, 0.2, 0.001).onChange(syncMotion);
  motion.add(CONFIG.motion, 'jerkLow', 0.001, 0.05, 0.001).onChange(syncMotion);
  motion.add(CONFIG.motion, 'jerkHigh', 0.01, 0.2, 0.001).onChange(syncMotion);
  motion.add(CONFIG.motion, 'circularThreshold', 0.2, 1, 0.01).onChange(syncMotion);
  motion.add(CONFIG.motion, 'smoothingAlpha', 0.05, 0.95, 0.01).onChange(syncMotion);
  motion.add(CONFIG.motion, 'trajectoryBufferSize', 10, 60, 1).onChange(syncMotion);

  const emotion = gui.addFolder('Emotion');
  emotion.add(CONFIG.emotion, 'hysteresisDelay', 100, 1000, 10).onChange(syncEmotion);
  emotion.add(CONFIG.emotion, 'transitionDuration', 100, 800, 10).onChange(syncEmotion);

  const twoHand = gui.addFolder('Two-Hand');
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

  const debug = gui.addFolder('Debug');
  debug.add(CONFIG.debug, 'enabled');
  debug.add(CONFIG.debug, 'logEmotionChanges');

  const liveFolder = gui.addFolder('Live');
  liveFolder.add(live, 'hands').listen();
  liveFolder.add(live, 'rightEmotion').listen();
  liveFolder.add(live, 'rightVelocity').listen();
  liveFolder.add(live, 'rightJerk').listen();
  liveFolder.add(live, 'rightCircular').listen();
  liveFolder.add(live, 'leftEmotion').listen();
  liveFolder.add(live, 'leftVelocity').listen();
  liveFolder.add(live, 'leftJerk').listen();
  liveFolder.add(live, 'leftCircular').listen();
  liveFolder.open();

  return {
    gui,
    updateLiveStats: (stats) => {
      Object.assign(live, stats);
    },
    destroy: () => gui.destroy()
  };
};
