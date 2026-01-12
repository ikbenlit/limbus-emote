/**
 * Limbus - Gesture-Based Emotion Visualizer
 * Main entry point and render loop
 */

import './style.css';
import { CONFIG } from './config.js';
import { Webcam } from './capture/webcam.js';
import { HandTracker } from './capture/handTracker.js';
import { UI } from './ui.js';
import { Renderer } from './render/renderer.js';
import { EmotionParticles } from './render/particles/EmotionParticles.js';
import { TextParticles } from './render/particles/TextParticles.js';
import { HandOverlay } from './render/HandOverlay.js';
import { getEmotionRgb, getEmotionHex } from './utils/colors.js';
import { logger } from './utils/logger.js';
import { initDebugPanel } from './debug/debugPanel.js';
import { initPerfMonitor } from './debug/perfMonitor.js';
import * as THREE from 'three';

// Analysis layer
import { MotionAnalyzer } from './analysis/motionAnalyzer.js';
import { EmotionDetector } from './analysis/emotionDetector.js';
import { TwoHandController } from './analysis/TwoHandController.js';

class Limbus {
  constructor() {
    this.webcam = new Webcam();
    this.handTracker = new HandTracker(CONFIG.mediapipe);
    this.renderer = new Renderer(CONFIG.render);
    this.ui = new UI();
    this.emotionParticles = new EmotionParticles(CONFIG.particles);
    this.textParticles = new TextParticles(CONFIG.textParticles);
    this.handOverlay = null; // Initialized after renderer

    // Analysis layer
    this.motionAnalyzer = new MotionAnalyzer(CONFIG.motion || {});
    this.emotionDetector = new EmotionDetector(CONFIG);
    this.twoHandController = new TwoHandController(CONFIG.twoHand);

    // Test object to visualize hand position (can be removed later)
    this.handIndicator = null;

    // Current state (primary hand for particle source)
    this.handPos = { x: 0, y: 0 };
    this.hasHand = false;
    this.currentEmotion = 'neutraal';

    // Multiple hand indicators
    this.handIndicators = new Map();

    this.initialized = false;
    this.lastTime = performance.now();
    this.leftGesture = null;
    this.lastDebugUpdate = 0;
  }

  async init() {
    logger.info('Limbus initializing...', CONFIG);

    // Initialize UI
    this.ui.init();
    this.debugPanel = initDebugPanel({
      motionAnalyzer: this.motionAnalyzer,
      emotionDetector: this.emotionDetector
    });
    this.perfMonitor = initPerfMonitor();

    // Check browser support
    if (!Webcam.isSupported()) {
      this.ui.showError('Je browser ondersteunt geen camera toegang. Gebruik Chrome of Safari.');
      return;
    }

    // Start initialization sequence
    await this.initCapture();
  }

  async initCapture() {
    // Show permission request UI
    this.ui.showPermissionRequest();

    try {
      // Request camera access
      logger.info('Requesting camera access...');
      await this.webcam.start();
      logger.info('Camera started:', this.webcam.dimensions);

      // Camera ready - load hand tracking model
      this.ui.showLoading('Hand tracking model laden...');
      logger.info('Loading hand tracking model...');
      await this.handTracker.init();
      logger.info('Hand tracker ready');

      // Initialize renderer
      this.ui.showLoading('Renderer initialiseren...');
      this.renderer.init('#canvas');

      // Add emotion particles to scene
      this.renderer.add(this.emotionParticles.mesh);

      // Initialize and add hand overlay
      this.handOverlay = new HandOverlay(CONFIG.handOverlay, this.renderer);
      this.handOverlay.init();
      this.renderer.add(this.handOverlay.mesh);

      // Initialize and add text particles
      this.textParticles.init();
      this.renderer.add(this.textParticles.getMesh());

      logger.info('Renderer ready, all systems added');

      // All ready - hide UI and start
      logger.info('All systems ready, starting app...');
      this.ui.hide();
      this.ui.showHint('Beweeg je hand voor de camera', 3000);

      this.initialized = true;
      this.loop();

    } catch (err) {
      logger.error('Capture init failed:', err);

      // Show appropriate error UI
      if (this.webcam.state === 'denied') {
        this.ui.showPermissionDenied(
          this.webcam.error,
          () => this.initCapture() // Retry callback
        );
      } else {
        this.ui.showError(
          this.webcam.error || err.message || 'Kon niet initialiseren',
          () => this.initCapture() // Retry callback
        );
      }
    }
  }

  /**
   * Create a hand indicator (dot + ring) for a specific hand
   * @private
   */
  _createHandIndicator(handId) {
    const group = new THREE.Group();

    // Create a glowing circle to follow the hand
    const geometry = new THREE.CircleGeometry(0.08, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00FF88,
      transparent: true,
      opacity: 0.8
    });
    const dot = new THREE.Mesh(geometry, material);
    group.add(dot);

    // Add a ring around it
    const ringGeometry = new THREE.RingGeometry(0.1, 0.12, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x00FF88,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    group.add(ring);

    this.renderer.add(group);

    return { group, dot, ring };
  }

  /**
   * Update all hand indicators based on detected hands
   * @private
   */
  _updateHandIndicators(handStates, deltaTime) {
    const activeIds = Object.keys(handStates);

    // Update existing indicators and create new ones
    for (const handId of activeIds) {
      if (!this.handIndicators.has(handId)) {
        this.handIndicators.set(handId, this._createHandIndicator(handId));
      }

      const { group, dot, ring } = this.handIndicators.get(handId);
      const state = handStates[handId];

      group.position.x = state.pos.x;
      group.position.y = state.pos.y;
      group.visible = true;

      // Update color based on hand-specific emotion
      const color = getEmotionHex(state.emotion);
      dot.material.color.setHex(color);
      ring.material.color.setHex(color);

      // Animate ring
      ring.rotation.z += deltaTime * 2;
    }

    // Hide inactive indicators
    this.handIndicators.forEach((indicator, id) => {
      if (!handStates[id]) {
        indicator.group.visible = false;
      }
    });
  }

  loop() {
    if (!this.initialized) return;

    requestAnimationFrame(() => this.loop());
    this.perfMonitor?.begin();

    const now = performance.now();
    const deltaTime = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // Check if webcam is ready
    if (!this.webcam.isReady) return;

    // Detect hands
    const hands = this.handTracker.detect(this.webcam.video);

    // Skip if throttled (returns null)
    if (hands === null) {
      // Still render even when throttled
      this.renderer.render();
      return;
    }

    // Process each detected hand through analysis pipeline
    const assignedIds = new Set();
    for (const hand of hands) {
      let handId = hand.handedness?.label?.toLowerCase() || '';
      if (!handId || assignedIds.has(handId)) {
        handId = assignedIds.has('right') ? 'left' : 'right';
      }
      assignedIds.add(handId);

      // Store normalized handId on hand object for later use
      hand.handId = handId;

      // Update motion analysis for this hand
      const motionState = this.motionAnalyzer.update(
        handId,
        hand.landmarks,
        deltaTime
      );

      // Update emotion detection for this hand
      this.emotionDetector.update(handId, motionState, {
        isClosedFist: hand.isClosedFist,
        isOpenPalm: hand.isOpenPalm
      });

      // Update transition for smooth visuals
      this.emotionDetector.updateTransition(handId, deltaTime);
    }

    // Remove hands that are no longer detected
    const activeHandIds = new Set(hands.map(h => h.handId));
    for (const handId of ['left', 'right']) {
      if (!activeHandIds.has(handId)) {
        this.motionAnalyzer.removeHand(handId);
        this.emotionDetector.removeHand(handId);
      }
    }

    // Build hand state for TwoHandController
    const handStates = {};
    const allLandmarks = [];
    for (const hand of hands) {
      const palmCenter = HandTracker.getPalmCenter(hand.landmarks);
      const worldPos = this.renderer.screenToWorld(palmCenter.x, palmCenter.y);
      handStates[hand.handId] = {
        pos: worldPos,
        emotion: this.emotionDetector.getEmotion(hand.handId),
        landmarks: hand.landmarks
      };
      allLandmarks.push(hand.landmarks);
    }

    this._updateLiveStats(hands, now);

    // Left-hand text interactions (explode/implode)
    const leftHand = hands.find(h => h.handId === 'left');
    if (leftHand) {
      this._handleLeftHandGesture(leftHand, handStates.left?.pos || null);
    } else {
      this.leftGesture = null;
    }

    // Update two-hand controller
    const twoHandState = this.twoHandController.update(handStates);

    // Determine source hand (right) for particle spawning
    const sourceHand = hands.find(h => h.handId === CONFIG.twoHand.sourceHand);
    const magnetHand = hands.find(h => h.handId === CONFIG.twoHand.magnetHand);

    // Update magnet and amplification based on mode
    if (twoHandState.mode === 'createAndCatch' || twoHandState.mode === 'amplify') {
      // Set magnet position (left hand catches particles)
      this.emotionParticles.setMagnet(twoHandState.magnetPos, CONFIG.twoHand);

      // Set amplification if emotions match
      const isAmplified = twoHandState.mode === 'amplify';
      this.emotionParticles.setAmplify(
        isAmplified,
        CONFIG.twoHand.amplifyMultiplier,
        CONFIG.twoHand.amplifyScale
      );
    } else {
      // No magnet or amplification in solo/none mode
      this.emotionParticles.setMagnet(null, null);
      this.emotionParticles.setAmplify(false);
    }

    // Handle fusion explosion
    if (twoHandState.mode === 'fusion') {
      const fusionEmotion = twoHandState.emotionsMatch
        ? twoHandState.leftEmotion
        : 'neutraal';
      this.emotionParticles.triggerFusion(
        twoHandState.fusionPos,
        CONFIG.twoHand,
        fusionEmotion
      );
      if (CONFIG.debug.logEmotionChanges) {
        logger.debug('FUSION triggered!', { emotion: fusionEmotion });
      }
    }

    // Use source hand (right) for particle spawning, or any hand in solo mode
    const primaryHand = sourceHand || hands[0];

    if (primaryHand) {
      const palmCenter = HandTracker.getPalmCenter(primaryHand.landmarks);
      const worldPos = this.renderer.screenToWorld(palmCenter.x, palmCenter.y);

      // Store for particle spawning and hand overlay
      this.handPos = worldPos;
      this.hasHand = true;
      this.currentLandmarks = primaryHand.landmarks;

      // Update indicator position
      this.handIndicator.position.x = worldPos.x;
      this.handIndicator.position.y = worldPos.y;
      this.handIndicator.visible = true;

      // Get emotion from detector (motion-based with hysteresis)
      let newEmotion = this.emotionDetector.getEmotion(primaryHand.handId);
      const overrideEmotion = this._getRightHandLabel(primaryHand);
      if (overrideEmotion) {
        newEmotion = overrideEmotion;
      }

      // Update hand indicator color from centralized colors
      this.handIndicator.material.color.setHex(getEmotionHex(newEmotion));

      // Update emotion for particles
      if (newEmotion !== this.currentEmotion) {
        this.currentEmotion = newEmotion;
        this.emotionParticles.setEmotion(newEmotion);
        this.textParticles.setEmotion(newEmotion, getEmotionRgb(newEmotion));
        if (CONFIG.debug.logEmotionChanges) {
          logger.debug('Emotion changed:', newEmotion);
        }
      }

      // Animate ring rotation
      this.handRing.rotation.z += deltaTime * 2;

      // Log occasionally for debugging
      if (CONFIG.debug.enabled && Math.random() < 0.02) {
        const stats = this.emotionParticles.getStats();
        const motionState = this.motionAnalyzer.getState(primaryHand.handId);
        logger.debug('Hand:', {
          mode: twoHandState.mode,
          handId: primaryHand.handId,
          hands: hands.length,
          emotion: this.currentEmotion,
          velocity: motionState?.velocity?.magnitude?.toFixed(3),
          jerk: motionState?.jerk?.toFixed(3),
          particles: stats.active
        });
      }
    } else {
      // No hand detected - hide indicator
      this.handIndicator.visible = false;
      this.hasHand = false;
    }

    // Update emotion particles
    this.emotionParticles.update(deltaTime, this.handPos, this.hasHand);

    // Update hand overlay
    this.handOverlay.update(this.currentLandmarks, this.hasHand);
    this.handOverlay.updateFade(deltaTime);

    // Update text particles
    this.textParticles.update(deltaTime, this.handPos, this.hasHand);

    // Render frame
    this.renderer.render();
    this.perfMonitor?.end();
  }

  _updateLiveStats(hands, now) {
    if (!this.debugPanel?.updateLiveStats || !CONFIG.debug.enabled) {
      return;
    }

    if (now - this.lastDebugUpdate < 100) {
      return;
    }
    this.lastDebugUpdate = now;

    const rightState = this.motionAnalyzer.getState('right');
    const leftState = this.motionAnalyzer.getState('left');

    const toFixed = (value) => Number((value ?? 0).toFixed(3));

    this.debugPanel.updateLiveStats({
      hands: hands.length,
      rightEmotion: this.emotionDetector.getEmotion('right'),
      rightVelocity: toFixed(rightState?.velocity?.magnitude),
      rightJerk: toFixed(rightState?.jerk),
      rightCircular: toFixed(rightState?.circularScore),
      leftEmotion: this.emotionDetector.getEmotion('left'),
      leftVelocity: toFixed(leftState?.velocity?.magnitude),
      leftJerk: toFixed(leftState?.jerk),
      leftCircular: toFixed(leftState?.circularScore)
    });
  }

  /**
   * Cleanup on destroy
   */
  destroy() {
    this.initialized = false;
    this.webcam.stop();
    this.handTracker.destroy();
    this.emotionParticles.dispose();
    this.textParticles.dispose();
    this.handOverlay.dispose();
    this.perfMonitor?.destroy();
    if (this.debugPanel) {
      this.debugPanel.destroy();
    }
  }

  _handleLeftHandGesture(leftHand, leftPos) {
    const isClosed = Boolean(leftHand.isClosedFist);
    const isOpen = Boolean(leftHand.isOpenPalm);

    if (this.leftGesture === 'closed' && isOpen) {
      this.textParticles.triggerExplode();
    } else if (this.leftGesture === 'open' && isClosed && leftPos) {
      this.textParticles.triggerImplode(leftPos);
    }

    if (isClosed) {
      this.leftGesture = 'closed';
    } else if (isOpen) {
      this.leftGesture = 'open';
    }
  }

  _getRightHandLabel(hand) {
    if (!hand || hand.handId !== 'right') {
      return null;
    }

    const count = hand.fingerCount || 0;
    const states = hand.fingerStates || {};

    if (count === 1 && states.index) {
      return 'power';
    }
    if (count === 2 && states.index && states.middle) {
      return 'flow';
    }
    if (count === 3) {
      return 'calm';
    }

    return null;
  }
}

// Bootstrap
const app = new Limbus();
app.init().catch((err) => logger.error('App init failed:', err));

// Cleanup on page unload
window.addEventListener('beforeunload', () => app.destroy());
