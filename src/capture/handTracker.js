/**
 * HandTracker - MediaPipe GestureRecognizer wrapper
 * Detects hand landmarks and gestures from video frames
 */

import {
  GestureRecognizer,
  FilesetResolver
} from '@mediapipe/tasks-vision';
import { logger } from '../utils/logger.js';
import {
  getFingerStates,
  getFingerCount,
  getPalmCenter,
  getFingerSpread
} from '../utils/handPose.js';

export class HandTracker {
  constructor(config) {
    this.config = config;
    this.gestureRecognizer = null;
    this.lastDetectionTime = 0;
    this.minDetectionInterval = 1000 / (config.detectionFPS || 30); // Throttle to 30fps
    this.isReady = false;
  }

  /**
   * Initialize MediaPipe GestureRecognizer
   */
  async init() {
    logger.info('HandTracker: Loading MediaPipe model...');

    try {
      // Load MediaPipe vision WASM (local files for offline support)
      const vision = await FilesetResolver.forVisionTasks(
        '/mediapipe/wasm'
      );

      // Create GestureRecognizer
      this.gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: this.config.modelPath,
          delegate: 'GPU' // Use GPU acceleration if available
        },
        runningMode: 'VIDEO',
        numHands: this.config.numHands || 2,
        minHandDetectionConfidence: this.config.minHandDetectionConfidence || 0.5,
        minHandPresenceConfidence: this.config.minHandPresenceConfidence || 0.5,
        minTrackingConfidence: this.config.minTrackingConfidence || 0.5
      });

      this.isReady = true;
      logger.info('HandTracker: Model loaded successfully');

      return this;

    } catch (err) {
      logger.error('HandTracker: Failed to load model', err);
      throw new Error(`Hand tracking model kon niet laden: ${err.message}`);
    }
  }

  /**
   * Detect hands in video frame
   * @param {HTMLVideoElement} video - Video element to process
   * @returns {HandResult[] | null} - Array of hand results or null if throttled
   */
  detect(video) {
    if (!this.isReady || !this.gestureRecognizer) {
      return null;
    }

    // Throttle detection to save CPU
    const now = performance.now();
    if (now - this.lastDetectionTime < this.minDetectionInterval) {
      return null; // Skip this frame
    }
    this.lastDetectionTime = now;

    // Run detection
    const results = this.gestureRecognizer.recognizeForVideo(video, now);

    // No hands detected
    if (!results.landmarks || results.landmarks.length === 0) {
      return [];
    }

    // Process results into cleaner format
    return this._processResults(results);
  }

  /**
   * Process raw MediaPipe results into cleaner format
   * @private
   */
  _processResults(results) {
    const hands = [];

    for (let i = 0; i < results.landmarks.length; i++) {
      const landmarks = results.landmarks[i];
      const worldLandmarks = results.worldLandmarks?.[i] || null;
      const rawHandedness = results.handednesses?.[i]?.[0] || null;
      const handednessLabel = rawHandedness?.categoryName || (i === 0 ? 'Right' : 'Left');
      const gesture = results.gestures?.[i]?.[0] || null;
      const fingerStates = getFingerStates(landmarks, handednessLabel);
      const fingerCount = getFingerCount(landmarks, handednessLabel);

      // Fallback gesture detection based on finger states
      const isClosedFistByFingers = fingerCount <= 1; // 0 or 1 finger (thumb may stick out)
      const isOpenPalmByFingers = fingerCount >= 4;   // 4 or 5 fingers extended

      // Use MediaPipe gesture if available, otherwise fallback to finger-based detection
      const isClosedFist = gesture?.categoryName === 'Closed_Fist' ||
                           (!gesture && isClosedFistByFingers);
      const isOpenPalm = gesture?.categoryName === 'Open_Palm' ||
                         (!gesture && isOpenPalmByFingers);

      hands.push({
        // 21 normalized landmarks (x, y, z in 0-1 range)
        landmarks: landmarks.map(lm => ({
          x: lm.x,
          y: lm.y,
          z: lm.z
        })),

        // World landmarks (real-world 3D coordinates in meters)
        worldLandmarks: worldLandmarks ? worldLandmarks.map(lm => ({
          x: lm.x,
          y: lm.y,
          z: lm.z
        })) : null,

        // Hand type
        handedness: {
          label: handednessLabel, // 'Left' or 'Right'
          confidence: rawHandedness?.score ?? 0
        },

        // Detected gesture
        gesture: gesture ? {
          name: gesture.categoryName, // 'Closed_Fist', 'Open_Palm', etc.
          confidence: gesture.score
        } : null,
        fingerStates,
        fingerCount,

        // Computed properties
        isLeftHand: handednessLabel === 'Left',
        isRightHand: handednessLabel === 'Right',
        isClosedFist,
        isOpenPalm
      });
    }

    return hands;
  }

  /**
   * Get palm center from landmarks (delegated to handPose utils)
   * @deprecated Use getPalmCenter from utils/handPose.js instead
   */
  static getPalmCenter(landmarks) {
    return getPalmCenter(landmarks);
  }

  /**
   * Calculate finger spread (delegated to handPose utils)
   * @deprecated Use getFingerSpread from utils/handPose.js instead
   */
  static getFingerSpread(landmarks) {
    return getFingerSpread(landmarks);
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.gestureRecognizer) {
      this.gestureRecognizer.close();
      this.gestureRecognizer = null;
    }
    this.isReady = false;
  }
}

/**
 * Landmark indices reference:
 * 0: WRIST
 * 1-4: THUMB (CMC, MCP, IP, TIP)
 * 5-8: INDEX (MCP, PIP, DIP, TIP)
 * 9-12: MIDDLE (MCP, PIP, DIP, TIP)
 * 13-16: RING (MCP, PIP, DIP, TIP)
 * 17-20: PINKY (MCP, PIP, DIP, TIP)
 */
