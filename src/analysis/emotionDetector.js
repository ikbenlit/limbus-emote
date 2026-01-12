/**
 * EmotionDetector - Per-hand emotion state machine with hysteresis
 *
 * SOC: Only determines emotions from motion data.
 *      Does NOT handle rendering or particle spawning.
 *
 * Detection rules (from emotie-gebaren.md):
 * - BOOS (angry):      velocity > 0.08, horizontal, high jerk
 * - VERDRIETIG (sad):  velocity < 0.03, downward, low jerk
 * - KALM (calm):       medium velocity, circular pattern, low jerk
 * - BLIJ (happy):      velocity > 0.05, upward, medium jerk
 * - BANG (scared):     variable velocity, trembling, high frequency jerk
 * - NEUTRAAL:          default / no clear pattern
 */

export class EmotionDetector {
  constructor(config) {
    this.config = config;

    // Per-hand emotion state
    this.handStates = new Map();

    // Default thresholds
    this.velocityLow = 0.02;
    this.velocityMedium = 0.05;
    this.velocityHigh = 0.08;
    this.jerkLow = 0.01;
    this.jerkHigh = 0.05;
    this.circularThreshold = 0.6;
    this.downwardThreshold = -0.5;
    this.hysteresisDelay = 500; // ms
    this.transitionDuration = 300; // ms

    this.updateConfig(config);
  }

  /**
   * Create initial state for a hand
   * @private
   */
  _createHandState() {
    return {
      current: 'neutraal',
      pending: null,
      pendingSince: 0,
      confidence: 1,
      transitionProgress: 0,
      previousEmotion: 'neutraal'
    };
  }

  /**
   * Update emotion for a specific hand
   * @param {string} handId - 'left' or 'right'
   * @param {Object} motionState - Motion state from MotionAnalyzer
   * @param {Object} gesture - Gesture info from HandTracker (optional)
   * @returns {Object} Current emotion state for this hand
   */
  update(handId, motionState, gesture = null) {
    // Get or create state for this hand
    let state = this.handStates.get(handId);
    if (!state) {
      state = this._createHandState();
      this.handStates.set(handId, state);
    }

    if (!motionState) {
      return state;
    }

    // Detect emotion from motion
    const detected = this._detectEmotion(motionState, gesture);

    // Apply hysteresis
    this._applyHysteresis(state, detected);

    return state;
  }

  /**
   * Detect emotion based on motion patterns
   * @private
   */
  _detectEmotion(motionState, gesture) {
    const { velocity, jerk, direction, circularScore } = motionState;
    const speed = velocity.magnitude;

    // Check for gestures first (demo mapping overrides motion-based detection)
    if (gesture) {
      if (gesture.isClosedFist) {
        return { emotion: 'woede', confidence: 0.95 };
      }
      if (gesture.isOpenPalm) {
        if (speed < this.velocityLow) {
          return { emotion: 'rust', confidence: 0.85 };
        }
        if (speed > this.velocityHigh) {
          return { emotion: 'blij', confidence: 0.85 };
        }
      }
      if (gesture.isOpenPalm && circularScore > this.circularThreshold * 0.5) {
        return { emotion: 'kalmte', confidence: 0.8 };
      }
    }

    // Motion-based detection

    // WOEDE (angry): Fast, horizontal, high jerk
    if (speed > this.velocityHigh && jerk > this.jerkHigh) {
      const isHorizontal = Math.abs(direction.x) > Math.abs(direction.y);
      if (isHorizontal) {
        return { emotion: 'woede', confidence: 0.85 };
      }
    }

    // VERDRIETIG (sad): Slow, downward movement
    if (speed < this.velocityLow && speed > 0.005) {
      if (direction.y > 0.5) {
        // Positive Y = downward
        return { emotion: 'verdriet', confidence: 0.8 };
      }
    }

    // KALMTE (calm): Circular pattern, low jerk
    if (circularScore > this.circularThreshold && jerk < this.jerkLow) {
      return { emotion: 'kalmte', confidence: 0.9 };
    }

    // BANG (scared): Trembling (high jerk frequency, low displacement)
    if (jerk > this.jerkHigh && speed < this.velocityMedium) {
      return { emotion: 'bang', confidence: 0.7 };
    }

    // Very slow or no movement = neutraal
    if (speed < 0.005) {
      return { emotion: 'neutraal', confidence: 0.5 };
    }

    // Default: keep current or neutral
    return { emotion: null, confidence: 0 };
  }

  /**
   * Apply hysteresis to prevent emotion flickering
   * Emotion must be detected consistently for hysteresisDelay ms
   * @private
   */
  _applyHysteresis(state, detected) {
    const now = performance.now();
    const hysteresisDelay = this.hysteresisDelay;

    // No clear emotion detected
    if (!detected.emotion || detected.confidence < 0.5) {
      // Decay pending emotion after a while
      if (state.pending && now - state.pendingSince > hysteresisDelay * 2) {
        state.pending = null;
      }
      return;
    }

    // Same as current emotion - reset pending
    if (detected.emotion === state.current) {
      state.pending = null;
      state.confidence = detected.confidence;
      return;
    }

    // Different emotion detected
    if (detected.emotion !== state.pending) {
      // Start pending new emotion
      state.pending = detected.emotion;
      state.pendingSince = now;
      return;
    }

    // Same pending emotion - check if delay passed
    if (now - state.pendingSince >= hysteresisDelay) {
      // Confirm emotion change
      state.previousEmotion = state.current;
      state.current = state.pending;
      state.pending = null;
      state.confidence = detected.confidence;
      state.transitionProgress = 0;
    }
  }

  /**
   * Update transition progress for smooth visual transitions
   * @param {string} handId - 'left' or 'right'
   * @param {number} deltaTime - Time in seconds
   */
  updateTransition(handId, deltaTime) {
    const state = this.handStates.get(handId);
    if (!state) return;

    if (state.transitionProgress < 1) {
      state.transitionProgress += (deltaTime * 1000) / this.transitionDuration;
      state.transitionProgress = Math.min(state.transitionProgress, 1);
    }
  }

  /**
   * Update thresholds from config (supports nested { motion, emotion } shape)
   * @param {Object} config
   */
  updateConfig(config = this.config) {
    const motion = config.motion || config;
    const emotion = config.emotion || config;

    this.velocityLow = motion.velocityLow ?? this.velocityLow;
    this.velocityMedium = motion.velocityMedium ?? this.velocityMedium;
    this.velocityHigh = motion.velocityHigh ?? this.velocityHigh;
    this.jerkLow = motion.jerkLow ?? this.jerkLow;
    this.jerkHigh = motion.jerkHigh ?? this.jerkHigh;
    this.circularThreshold = motion.circularThreshold ?? this.circularThreshold;
    this.downwardThreshold = motion.downwardThreshold ?? this.downwardThreshold;
    this.hysteresisDelay = emotion.hysteresisDelay ?? this.hysteresisDelay;
    this.transitionDuration = emotion.transitionDuration ?? this.transitionDuration;
  }

  /**
   * Get emotion state for a specific hand
   * @param {string} handId - 'left' or 'right'
   * @returns {Object|null}
   */
  getState(handId) {
    return this.handStates.get(handId) || null;
  }

  /**
   * Get current emotion for a hand (convenience method)
   * @param {string} handId - 'left' or 'right'
   * @returns {string}
   */
  getEmotion(handId) {
    const state = this.handStates.get(handId);
    return state ? state.current : 'neutraal';
  }

  /**
   * Get emotions for both hands
   * @returns {Object} { left: emotion, right: emotion }
   */
  getAllEmotions() {
    return {
      left: this.getEmotion('left'),
      right: this.getEmotion('right')
    };
  }

  /**
   * Check if both hands have the same emotion (for amplification)
   * @returns {Object|null} { emotion, confidence } or null if different
   */
  getMatchingEmotion() {
    const leftState = this.handStates.get('left');
    const rightState = this.handStates.get('right');

    if (!leftState || !rightState) {
      return null;
    }

    if (leftState.current === rightState.current &&
        leftState.current !== 'neutraal') {
      return {
        emotion: leftState.current,
        confidence: Math.min(leftState.confidence, rightState.confidence)
      };
    }

    return null;
  }

  /**
   * Reset state for a specific hand
   * @param {string} handId - 'left' or 'right'
   */
  resetHand(handId) {
    const state = this.handStates.get(handId);
    if (state) {
      state.current = 'neutraal';
      state.pending = null;
      state.confidence = 1;
      state.transitionProgress = 1;
    }
  }

  /**
   * Reset all hands
   */
  reset() {
    for (const state of this.handStates.values()) {
      state.current = 'neutraal';
      state.pending = null;
      state.confidence = 1;
      state.transitionProgress = 1;
    }
  }

  /**
   * Remove a hand from tracking
   * @param {string} handId - 'left' or 'right'
   */
  removeHand(handId) {
    this.handStates.delete(handId);
  }
}
