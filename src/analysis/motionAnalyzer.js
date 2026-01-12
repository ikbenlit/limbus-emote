/**
 * MotionAnalyzer - Per-hand motion tracking coordinator
 *
 * SOC: Only calculates motion physics (velocity, jerk, patterns).
 *      Does NOT determine emotions - that's EmotionDetector's job.
 *
 * DRY: Uses HandMotionState class for each hand, no duplicate logic.
 */

import { HandMotionState } from './HandMotionState.js';

export class MotionAnalyzer {
  constructor(config) {
    this.config = config;

    // Per-hand motion state (DRY: same class for both hands)
    this.handStates = new Map();

    // Palm center landmark indices
    this.palmLandmarks = config.palmLandmarks || [0, 5, 9, 13, 17];
  }

  /**
   * Update config and propagate to existing hand states
   * @param {Object} config
   */
  updateConfig(config = this.config) {
    this.config = config;
    this.palmLandmarks = config.palmLandmarks || this.palmLandmarks;
    for (const state of this.handStates.values()) {
      state.updateConfig(config);
    }
  }

  /**
   * Update motion state for a hand
   * @param {string} handId - 'left' or 'right'
   * @param {Array} landmarks - 21 normalized landmarks from MediaPipe
   * @param {number} deltaTime - Time since last frame in seconds
   * @returns {Object} Motion state for this hand
   */
  update(handId, landmarks, deltaTime) {
    // Get or create state for this hand
    let state = this.handStates.get(handId);
    if (!state) {
      state = new HandMotionState(this.config);
      this.handStates.set(handId, state);
    }

    // Calculate palm center from landmarks
    const palmCenter = this._calculatePalmCenter(landmarks);

    // Update motion state
    return state.update(palmCenter, deltaTime);
  }

  /**
   * Calculate palm center from MediaPipe landmarks
   * Uses landmarks 0 (wrist), 5, 9, 13, 17 (finger bases)
   * @private
   */
  _calculatePalmCenter(landmarks) {
    if (!landmarks || landmarks.length < 21) {
      return null;
    }

    let x = 0, y = 0;
    for (const idx of this.palmLandmarks) {
      const lm = landmarks[idx];
      if (lm) {
        x += lm.x;
        y += lm.y;
      }
    }

    const count = this.palmLandmarks.length;
    return {
      x: x / count,
      y: y / count
    };
  }

  /**
   * Get motion state for a specific hand
   * @param {string} handId - 'left' or 'right'
   * @returns {Object|null} Motion state or null if hand not tracked
   */
  getState(handId) {
    const state = this.handStates.get(handId);
    return state ? state.getState() : null;
  }

  /**
   * Get states for all tracked hands
   * @returns {Object} { left: state, right: state }
   */
  getAllStates() {
    return {
      left: this.getState('left'),
      right: this.getState('right')
    };
  }

  /**
   * Calculate distance between two hands
   * Useful for fusion detection
   * @returns {number|null} Distance or null if both hands not present
   */
  getHandDistance() {
    const leftState = this.handStates.get('left');
    const rightState = this.handStates.get('right');

    if (!leftState?.prevPosition || !rightState?.prevPosition) {
      return null;
    }

    const dx = leftState.prevPosition.x - rightState.prevPosition.x;
    const dy = leftState.prevPosition.y - rightState.prevPosition.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Check if hands are approaching each other
   * @returns {boolean}
   */
  areHandsApproaching() {
    const leftState = this.handStates.get('left');
    const rightState = this.handStates.get('right');

    if (!leftState || !rightState) {
      return false;
    }

    // Check if left is moving right and right is moving left
    const leftMovingRight = leftState.velocity.x > 0.01;
    const rightMovingLeft = rightState.velocity.x < -0.01;

    return leftMovingRight && rightMovingLeft;
  }

  /**
   * Reset state for a specific hand
   * @param {string} handId - 'left' or 'right'
   */
  resetHand(handId) {
    const state = this.handStates.get(handId);
    if (state) {
      state.reset();
    }
  }

  /**
   * Reset all hand states
   */
  reset() {
    for (const state of this.handStates.values()) {
      state.reset();
    }
  }

  /**
   * Remove a hand from tracking (when hand is lost)
   * @param {string} handId - 'left' or 'right'
   */
  removeHand(handId) {
    const state = this.handStates.get(handId);
    if (state) {
      state.reset();
      this.handStates.delete(handId);
    }
  }
}
