/**
 * HandTracker - MediaPipe GestureRecognizer wrapper
 * Detects hand landmarks and gestures from video frames
 */

import {
  GestureRecognizer,
  FilesetResolver
} from '@mediapipe/tasks-vision';
import { logger } from '../utils/logger.js';
import { getFingerStates, getFingerCount } from '../utils/handPose.js';

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
      // Load MediaPipe vision WASM
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
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
        isClosedFist: gesture?.categoryName === 'Closed_Fist',
        isOpenPalm: gesture?.categoryName === 'Open_Palm'
      });
    }

    return hands;
  }

  /**
   * Get palm center from landmarks
   * Uses landmarks 0 (wrist) and finger bases (5, 9, 13, 17)
   * @param {Object[]} landmarks - Array of 21 landmarks
   * @returns {{x: number, y: number, z: number}}
   */
  static getPalmCenter(landmarks) {
    const palmIndices = [0, 5, 9, 13, 17];
    let x = 0, y = 0, z = 0;

    for (const idx of palmIndices) {
      x += landmarks[idx].x;
      y += landmarks[idx].y;
      z += landmarks[idx].z;
    }

    return {
      x: x / palmIndices.length,
      y: y / palmIndices.length,
      z: z / palmIndices.length
    };
  }

  /**
   * Calculate finger spread (how open the hand is)
   * @param {Object[]} landmarks - Array of 21 landmarks
   * @returns {number} - 0 (closed) to 1 (fully open)
   */
  static getFingerSpread(landmarks) {
    // Fingertip indices
    const fingertips = [4, 8, 12, 16, 20]; // thumb, index, middle, ring, pinky
    const palmCenter = HandTracker.getPalmCenter(landmarks);

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
