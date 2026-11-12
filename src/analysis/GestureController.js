/**
 * GestureController - Centralized gesture handling
 *
 * Responsibilities:
 * - Left hand state machine (explode/implode triggers)
 * - Right hand label detection (power/flow/calm)
 * - Two-hand coordination (wraps TwoHandController)
 */

import { TwoHandController } from './TwoHandController.js';
import { logger } from '../utils/logger.js';

export class GestureController {
  constructor(config, callbacks = {}) {
    this.config = config;
    this.twoHandController = new TwoHandController(config.twoHand);

    // Left hand gesture state machine
    this.leftGestureState = null; // 'closed' | 'open' | null

    // Callbacks for effects
    this.onExplode = callbacks.onExplode || (() => {});
    this.onImplode = callbacks.onImplode || (() => {});
  }

  /**
   * Update gesture controller with current hand data
   * @param {Array} hands - Array of detected hands with handId, fingerStates, isClosedFist, isOpenPalm
   * @param {Object} handStates - { left: { pos, emotion }, right: { pos, emotion } }
   * @returns {Object} Combined gesture state
   */
  update(hands, handStates) {
    // 1. Update two-hand controller
    const twoHandState = this.twoHandController.update(handStates);

    // 2. Handle left hand gestures (explode/implode)
    const leftHand = hands.find(h => h.handId === 'left');
    if (leftHand) {
      this._handleLeftGesture(leftHand, handStates.left?.pos);
    } else {
      this.leftGestureState = null;
    }

    // 3. Get right hand label (finger combinations)
    const rightHand = hands.find(h => h.handId === this.config.twoHand.sourceHand);
    const rightLabel = this._getRightHandLabel(rightHand);

    // 4. Check if right hand is closed fist (for sphere effect)
    const isRightHandFist = this._isRightHandFist(rightHand);

    // 5. Check for 6-7 meme gesture (both hands open palm)
    const sixSevenState = this._checkSixSeven(leftHand, rightHand, handStates);

    return {
      ...twoHandState,
      rightLabel,
      isRightHandFist,
      leftGestureState: this.leftGestureState,
      sixSeven: sixSevenState
    };
  }

  /**
   * Check for 6-7 meme gesture: both hands open palm
   * @private
   */
  _checkSixSeven(leftHand, rightHand, handStates) {
    if (!leftHand || !rightHand) {
      return { active: false };
    }

    const leftOpen = Boolean(leftHand.isOpenPalm) || (leftHand.fingerCount || 0) >= 4;
    const rightOpen = Boolean(rightHand.isOpenPalm) || (rightHand.fingerCount || 0) >= 4;

    if (leftOpen && rightOpen) {
      return {
        active: true,
        leftPos: handStates.left?.pos || null,
        rightPos: handStates.right?.pos || null
      };
    }

    return { active: false };
  }

  /**
   * Check if right hand is closed fist
   * Used for sphere effect - easier to detect than open palm
   * @private
   */
  _isRightHandFist(hand) {
    if (!hand) return false;

    // Use MediaPipe's closed fist detection OR low finger count
    const isClosedFist = Boolean(hand.isClosedFist);
    const lowFingerCount = (hand.fingerCount || 5) <= 1;

    return isClosedFist || lowFingerCount;
  }

  /**
   * Handle left hand gesture state transitions
   * Triggers explode when: closed → open
   * Triggers implode when: open → closed
   * @private
   */
  _handleLeftGesture(hand, pos) {
    const isClosed = Boolean(hand.isClosedFist);
    const isOpen = Boolean(hand.isOpenPalm);

    // Detect state transitions
    if (this.leftGestureState === 'closed' && isOpen) {
      this.onExplode();
    } else if (this.leftGestureState === 'open' && isClosed && pos) {
      this.onImplode(pos);
    }

    // Update state
    if (isClosed) {
      this.leftGestureState = 'closed';
    } else if (isOpen) {
      this.leftGestureState = 'open';
    }
  }

  /**
   * Detect right hand finger combinations for labels
   * 1 finger (index) → '1finger'
   * 2 fingers (index + middle) → '2finger'
   * 3 fingers (index + middle + ring) → '3finger'
   * 4 fingers (index + middle + ring + pinky, NO thumb) → '4finger'
   * 5 fingers (all including thumb) → null (open palm for sphere)
   * @private
   */
  _getRightHandLabel(hand) {
    if (!hand) {
      return null;
    }

    const states = hand.fingerStates || {};

    // Check specific finger combinations
    const thumb = states.thumb;
    const index = states.index;
    const middle = states.middle;
    const ring = states.ring;
    const pinky = states.pinky;

    // Debug logging
    if (this.config.debug?.enabled && Math.random() < 0.05) {
      logger.debug('fingerStates:', { thumb, index, middle, ring, pinky, count: hand.fingerCount });
    }

    // 1 finger: only index up (middle, ring, pinky down)
    if (index && !middle && !ring && !pinky) {
      return '1finger';
    }
    // 2 fingers: index + middle up (ring, pinky down)
    if (index && middle && !ring && !pinky) {
      return '2finger';
    }
    // 3 fingers: index + middle + ring up (pinky down)
    if (index && middle && ring && !pinky) {
      return '3finger';
    }
    // 4 fingers: index + middle + ring + pinky up, but thumb DOWN (otherwise it's open palm)
    if (index && middle && ring && pinky && !thumb) {
      return '4finger';
    }

    return null;
  }

  /**
   * Get current right hand label (for external access)
   * @param {Object} hand - Hand object with fingerStates
   */
  getRightHandLabel(hand) {
    return this._getRightHandLabel(hand);
  }

  /**
   * Reset controller state
   */
  reset() {
    this.leftGestureState = null;
    this.twoHandController.reset();
  }
}
