/**
 * Limbus - Gesture-Based Emotion Visualizer
 * Main entry point and render loop
 */

import './style.css';
import { CONFIG } from './config.js';
import { Webcam } from './capture/webcam.js';
import { HandTracker } from './capture/handTracker.js';
import { UI } from './ui.js';
import { SixSevenOverlay } from './ui/SixSevenOverlay.js';
import { HudOverlay } from './ui/HudOverlay.js';
import { Renderer } from './render/renderer.js';
import { EmotionParticles } from './render/particles/EmotionParticles.js';
import { TextParticles } from './render/particles/TextParticles.js';
import { SphereParticles } from './render/particles/SphereParticles.js';
import { SixSevenParticles } from './render/particles/SixSevenParticles.js';
import { HandOverlay } from './render/HandOverlay.js';
import { getEmotionRgb, getEmotionHex } from './utils/colors.js';
import { getPalmCenter } from './utils/handPose.js';
import { logger } from './utils/logger.js';
import { initDebugPanel } from './debug/debugPanel.js';
import { initPerfMonitor } from './debug/perfMonitor.js';
import * as THREE from 'three';

// Analysis layer
import { MotionAnalyzer } from './analysis/motionAnalyzer.js';
import { EmotionDetector } from './analysis/emotionDetector.js';
import { GestureController } from './analysis/GestureController.js';

// Audio
import { AudioManager } from './audio/AudioManager.js';

class Limbus {
  constructor() {
    this.webcam = new Webcam();
    this.handTracker = new HandTracker(CONFIG.mediapipe);
    this.renderer = new Renderer(CONFIG.render);
    this.ui = new UI();
    this.sixSevenOverlay = new SixSevenOverlay();
    this.hudOverlay = new HudOverlay();
    this.emotionParticles = new EmotionParticles(CONFIG.particles);
    this.textParticles = new TextParticles(CONFIG.textParticles);
    this.sphereParticles = new SphereParticles(CONFIG.sphereParticles);
    this.sixSevenParticles = new SixSevenParticles(CONFIG.particles.sixSeven, CONFIG.textParticles);
    this.handOverlay = null; // Initialized after renderer

    // Analysis layer
    this.motionAnalyzer = new MotionAnalyzer(CONFIG.motion || {});
    this.emotionDetector = new EmotionDetector(CONFIG);
    this.gestureController = new GestureController(CONFIG, {
      onExplode: () => this.textParticles.triggerExplode(),
      onImplode: (target) => this.textParticles.triggerImplode(target)
    });

    // Audio manager for whoosh effects
    this.audioManager = new AudioManager(CONFIG);

    // Test object to visualize hand position (can be removed later)
    this.handIndicator = null;

    // Current state (primary hand for particle source)
    this.handPos = { x: 0, y: 0 };
    this.hasHand = false;
    this.currentEmotion = 'neutraal';
    this.wasFingerLabel = false;  // Track previous state for toSphere transition

    // Multiple hand indicators
    this.handIndicators = new Map();

    this.initialized = false;
    this.lastTime = performance.now();
    this.lastDebugUpdate = 0;

    // FPS tracking for HUD
    this.fpsFrames = 0;
    this.fpsLastTime = performance.now();
    this.currentFps = 60;
  }

  async init() {
    logger.info('Limbus initializing...', CONFIG);

    // Initialize UI
    this.ui.init();
    this.sixSevenOverlay.init();
    this.hudOverlay.init();

    // Debug panels disabled - using new sci-fi HUD instead
    // this.debugPanel = initDebugPanel({
    //   motionAnalyzer: this.motionAnalyzer,
    //   emotionDetector: this.emotionDetector
    // });
    // this.perfMonitor = initPerfMonitor();
    this.debugPanel = null;
    this.perfMonitor = null;

    // Initialize audio (will be resumed on first user interaction)
    await this.audioManager.init();

    // Resume audio context on first click (autoplay policy)
    document.addEventListener('click', () => {
      this.audioManager.resume();
    }, { once: true });

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

      // Initialize and add sphere particles (right hand open palm)
      this.sphereParticles.init();
      this.renderer.add(this.sphereParticles.getMesh());

      // Initialize and add six seven particles
      this.sixSevenParticles.init();
      this.renderer.add(this.sixSevenParticles.getMesh());

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

    // Calculate FPS (update every second)
    this.fpsFrames++;
    if (now - this.fpsLastTime >= 1000) {
      this.currentFps = this.fpsFrames;
      this.fpsFrames = 0;
      this.fpsLastTime = now;
    }

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
      const palmCenter = getPalmCenter(hand.landmarks);
      const worldPos = this.renderer.screenToWorld(palmCenter.x, palmCenter.y);
      handStates[hand.handId] = {
        pos: worldPos,
        emotion: this.emotionDetector.getEmotion(hand.handId),
        landmarks: hand.landmarks
      };
      allLandmarks.push(hand.landmarks);
    }

    this._updateLiveStats(hands, now);

    // Update gesture controller (handles left/right gestures and two-hand interactions)
    const gestureState = this.gestureController.update(hands, handStates);

    // Update 6-7 meme overlay
    const isSixSevenActive = gestureState.sixSeven?.active;
    this.sixSevenParticles.update(
      deltaTime,
      gestureState.sixSeven?.leftPos,
      gestureState.sixSeven?.rightPos,
      isSixSevenActive
    );

    // When 6-7 meme is active, hide all other visuals for a clean look
    if (isSixSevenActive) {
      // Hide/pause all particle systems
      this.emotionParticles.setPaused(true);
      this.textParticles.fadeOut();
      this.sphereParticles.hide();
      this.wasFingerLabel = false;

      // Hide hand overlay immediately (no fade)
      this.handOverlay.mesh.visible = false;

      // Hide HUD during 6-7 meme
      this.hudOverlay.hide();

      // Still update particles (for fade out) but don't spawn new ones
      this.emotionParticles.update(deltaTime, this.handPos, false);
      this.textParticles.update(deltaTime, this.handPos, false);
      this.sphereParticles.update(deltaTime, null);

      // Render and skip the rest of normal particle logic
      this.renderer.render();
      this.perfMonitor?.end();
      return;
    }

    // Show HUD when not in 6-7 mode
    this.hudOverlay.show();

    // Determine source hand (right) for particle spawning
    const sourceHand = hands.find(h => h.handId === CONFIG.twoHand.sourceHand);
    const magnetHand = hands.find(h => h.handId === CONFIG.twoHand.magnetHand);

    // Update magnet and amplification based on mode
    if (gestureState.mode === 'createAndCatch' || gestureState.mode === 'amplify') {
      // Set magnet position (left hand catches particles)
      this.emotionParticles.setMagnet(gestureState.magnetPos, CONFIG.twoHand);

      // Set amplification if emotions match
      const isAmplified = gestureState.mode === 'amplify';
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
    if (gestureState.mode === 'fusion') {
      const fusionEmotion = gestureState.emotionsMatch
        ? gestureState.leftEmotion
        : 'neutraal';
      this.emotionParticles.triggerFusion(
        gestureState.fusionPos,
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
      const palmCenter = getPalmCenter(primaryHand.landmarks);
      const worldPos = this.renderer.screenToWorld(palmCenter.x, palmCenter.y);

      // Store for particle spawning
      this.handPos = worldPos;
      this.hasHand = true;

      // Get emotion from detector (motion-based with hysteresis)
      let newEmotion = this.emotionDetector.getEmotion(primaryHand.handId);
      const isFingerLabel = Boolean(gestureState.rightLabel);

      if (isFingerLabel) {
        newEmotion = gestureState.rightLabel;
      }

      // Update emotion for particles (only when NOT in finger label mode)
      if (newEmotion !== this.currentEmotion) {
        logger.debug('Emotion changing:', this.currentEmotion, '->', newEmotion);
        this.currentEmotion = newEmotion;

        // Particles alleen updaten als GEEN finger label actief
        if (!isFingerLabel) {
          this.emotionParticles.setEmotion(newEmotion);
        }

        // Play whoosh on emotion change
        this.audioManager.playWhoosh(0.7, this.handPos.x, newEmotion);

        if (CONFIG.debug.logEmotionChanges) {
          logger.debug('Emotion changed:', newEmotion);
        }
      }

      // Text ALLEEN bij finger labels (BOOS/BLIJ/BANG)
      if (isFingerLabel) {
        this.textParticles.setEmotion(newEmotion, getEmotionRgb(newEmotion));
        this.sphereParticles.hide();  // No sphere during finger labels
      } else {
        // Not in finger label mode

        // Check for toSphere transition:
        // 1. Coming from finger label (wasFingerLabel) AND making fist → toSphere
        // 2. OR text still active from effect (explode/implode/reform) AND making fist → toSphere
        if (gestureState.isRightHandFist && (this.wasFingerLabel || this.textParticles.isActive())) {
          this.textParticles.triggerToSphere(this.handPos);
        } else if (!this.wasFingerLabel && !this.textParticles.isActive()) {
          // Only fade out if no text was/is active
          this.textParticles.fadeOut();
        }
      }

      // Sphere shows when right hand makes fist (regardless of text state)
      if (gestureState.isRightHandFist && !isFingerLabel) {
        this.sphereParticles.show(this.handPos);
      } else if (!isFingerLabel) {
        this.sphereParticles.hide();
      }

      // Track state for next frame
      this.wasFingerLabel = isFingerLabel;

      // Pauzeer particle spawning tijdens finger mode OF sphere mode OF toSphere effect
      const pauseEmotionParticles = isFingerLabel ||
                                     (gestureState.isRightHandFist && !isFingerLabel) ||
                                     (this.textParticles.effect?.mode === 'toSphere');
      this.emotionParticles.setPaused(pauseEmotionParticles);

      // Log occasionally for debugging
      if (CONFIG.debug.enabled && Math.random() < 0.02) {
        const stats = this.emotionParticles.getStats();
        const motionState = this.motionAnalyzer.getState(primaryHand.handId);
        logger.debug('Hand:', {
          mode: gestureState.mode,
          handId: primaryHand.handId,
          hands: hands.length,
          emotion: this.currentEmotion,
          velocity: motionState?.velocity?.magnitude?.toFixed(3),
          jerk: motionState?.jerk?.toFixed(3),
          particles: stats.active
        });
      }
    } else {
      this.hasHand = false;
      this.wasFingerLabel = false;  // Reset state
      this.sphereParticles.hide();  // Hide sphere when no hand detected
    }

    // Hand indicators disabled (debug visualization)
    // this._updateHandIndicators(handStates, deltaTime);

    // Update emotion particles
    this.emotionParticles.update(deltaTime, this.handPos, this.hasHand);

    // Update hand overlay (pass all landmarks for multi-hand support)
    this.handOverlay.update(allLandmarks, hands.length > 0);
    this.handOverlay.updateFade(deltaTime);

    // Update text particles
    // Pass left hand position for repel effect
    const leftHandPos = handStates['left']?.pos || null;
    this.textParticles.setRepelPos(leftHandPos);
    this.textParticles.update(deltaTime, this.handPos, this.hasHand);

    // Update sphere particles
    const rightHandPos = handStates['right']?.pos || null;
    this.sphereParticles.update(deltaTime, rightHandPos);

    // Update HUD overlay
    this._updateHud(hands, gestureState, handStates);

    // Render frame
    this.renderer.render();
    this.perfMonitor?.end();
  }

  /**
   * Update HUD overlay with current stats
   * @private
   */
  _updateHud(hands, gestureState, handStates) {
    // Determine left hand mode
    let leftMode = 'STANDBY';
    if (handStates['left']) {
      const leftState = gestureState.leftGestureState;
      if (leftState === 'closed') {
        leftMode = 'CATCH';
      } else if (leftState === 'open') {
        leftMode = 'IDLE';
      } else {
        leftMode = 'IDLE';
      }
    }

    // Check for recent explode/implode (would need state tracking for full implementation)
    // For now, show based on gesture state

    // Determine right hand mode
    let rightMode = 'STANDBY';
    if (handStates['right']) {
      if (gestureState.rightLabel) {
        // Finger label active (1finger, 2finger, 3finger, 4finger)
        const labelMap = {
          '1finger': 'BOOS',
          '2finger': 'BLIJ',
          '3finger': 'BANG',
          '4finger': 'HALLO'
        };
        rightMode = labelMap[gestureState.rightLabel] || gestureState.rightLabel.toUpperCase();
      } else if (gestureState.isRightHandFist) {
        rightMode = 'SPHERE';
      } else {
        rightMode = 'IDLE';
      }
    }

    // Get total particle count from all systems
    const emotionStats = this.emotionParticles.getStats();
    const textStats = this.textParticles.getStats();
    const sphereStats = this.sphereParticles.getStats();
    const totalParticles = (emotionStats.active || 0) + (textStats.active || 0) + (sphereStats.active || 0);

    // Update HUD
    this.hudOverlay.update({
      handsDetected: hands.length,
      particleCount: totalParticles,
      fps: this.currentFps,
      leftMode,
      rightMode,
      leftDetected: Boolean(handStates['left']),
      rightDetected: Boolean(handStates['right'])
    });
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
    const rightHand = hands.find(h => h.handId === 'right');
    const rightLabel = rightHand ? this.gestureController.getRightHandLabel(rightHand) : null;

    // Create finger states string for debugging
    const fs = rightHand?.fingerStates || {};
    const fingerStr = [
      fs.thumb ? 'T' : '-',
      fs.index ? 'I' : '-',
      fs.middle ? 'M' : '-',
      fs.ring ? 'R' : '-',
      fs.pinky ? 'P' : '-'
    ].join('');

    const toFixed = (value) => Number((value ?? 0).toFixed(3));

    this.debugPanel.updateLiveStats({
      hands: hands.length,
      rightEmotion: this.emotionDetector.getEmotion('right'),
      rightVelocity: toFixed(rightState?.velocity?.magnitude),
      rightJerk: toFixed(rightState?.jerk),
      rightCircular: toFixed(rightState?.circularScore),
      rightFingerCount: rightHand?.fingerCount ?? 0,
      rightLabel: rightLabel || '-',
      rightFingers: fingerStr,
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
    this.sphereParticles.dispose();
    this.handOverlay.dispose();
    this.sixSevenOverlay.dispose();
    this.hudOverlay.dispose();
    this.audioManager.dispose();
    this.perfMonitor?.destroy();
    if (this.debugPanel) {
      this.debugPanel.destroy();
    }
  }

}

// Bootstrap
const app = new Limbus();
app.init().catch((err) => logger.error('App init failed:', err));

// Cleanup on page unload
window.addEventListener('beforeunload', () => app.destroy());
