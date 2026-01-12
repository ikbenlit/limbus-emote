/**
 * TwoHandController - Orchestrates two-hand interaction
 *
 * SOC: Only determines interaction mode and provides state.
 *      Does NOT handle particles or rendering.
 *
 * Interaction modes:
 * - solo: Only one hand visible
 * - createAndCatch: Right creates, left catches (different emotions OK)
 * - amplify: Both hands same emotion = enhanced effect
 * - fusion: Hands close together = explosion trigger
 */

export class TwoHandController {
  constructor(config) {
    this.config = config;

    // Hand positions (world coordinates)
    this.leftPos = null;
    this.rightPos = null;

    // Fusion state
    this.fusionPending = false;
    this.fusionStartTime = 0;
    this.lastFusionTime = 0;

    // Current interaction state
    this.mode = 'solo';
    this.isAmplified = false;
  }

  /**
   * Update controller with current hand states
   * @param {Object} hands - { left: { pos, emotion }, right: { pos, emotion } }
   * @returns {Object} Interaction state
   */
  update(hands) {
    const now = performance.now();

    // Update positions
    this.leftPos = hands.left?.pos || null;
    this.rightPos = hands.right?.pos || null;

    // Determine mode
    const hasLeft = this.leftPos !== null;
    const hasRight = this.rightPos !== null;

    if (!hasLeft && !hasRight) {
      return this._createState('none');
    }

    if (!hasLeft || !hasRight) {
      return this._createState('solo', {
        activeHand: hasRight ? 'right' : 'left',
        activePos: hasRight ? this.rightPos : this.leftPos,
        activeEmotion: hasRight ? hands.right?.emotion : hands.left?.emotion
      });
    }

    // Both hands present
    const distance = this._calculateDistance();
    const emotionsMatch = hands.left?.emotion === hands.right?.emotion &&
                          hands.left?.emotion !== 'neutraal';

    // Check for fusion
    const fusionState = this._checkFusion(distance, now);
    if (fusionState.triggered) {
      return this._createState('fusion', {
        fusionPos: this._getMidpoint(),
        leftEmotion: hands.left?.emotion,
        rightEmotion: hands.right?.emotion,
        emotionsMatch
      });
    }

    // Check for amplification (same emotion)
    if (emotionsMatch) {
      this.isAmplified = true;
      return this._createState('amplify', {
        sourcePos: this.rightPos,
        magnetPos: this.leftPos,
        emotion: hands.left?.emotion,
        distance
      });
    }

    // Default: create and catch
    this.isAmplified = false;
    return this._createState('createAndCatch', {
      sourcePos: this.rightPos,
      magnetPos: this.leftPos,
      sourceEmotion: hands.right?.emotion,
      magnetEmotion: hands.left?.emotion,
      distance
    });
  }

  /**
   * Calculate distance between hands
   * @private
   */
  _calculateDistance() {
    if (!this.leftPos || !this.rightPos) {
      return Infinity;
    }

    const dx = this.rightPos.x - this.leftPos.x;
    const dy = this.rightPos.y - this.leftPos.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get midpoint between hands (for fusion center)
   * @private
   */
  _getMidpoint() {
    if (!this.leftPos || !this.rightPos) {
      return { x: 0, y: 0 };
    }

    return {
      x: (this.leftPos.x + this.rightPos.x) / 2,
      y: (this.leftPos.y + this.rightPos.y) / 2
    };
  }

  /**
   * Check if fusion should trigger
   * @private
   */
  _checkFusion(distance, now) {
    const { fusionDistance, fusionHoldTime, fusionCooldown } = this.config;

    // Check cooldown
    if (now - this.lastFusionTime < fusionCooldown) {
      return { triggered: false, progress: 0 };
    }

    // Check distance
    if (distance > fusionDistance) {
      this.fusionPending = false;
      return { triggered: false, progress: 0 };
    }

    // Start or continue fusion timer
    if (!this.fusionPending) {
      this.fusionPending = true;
      this.fusionStartTime = now;
    }

    const elapsed = now - this.fusionStartTime;
    const progress = Math.min(elapsed / fusionHoldTime, 1);

    if (elapsed >= fusionHoldTime) {
      // Fusion triggered!
      this.fusionPending = false;
      this.lastFusionTime = now;
      return { triggered: true, progress: 1 };
    }

    return { triggered: false, progress };
  }

  /**
   * Create standardized state object
   * @private
   */
  _createState(mode, data = {}) {
    this.mode = mode;

    return {
      mode,
      leftPos: this.leftPos,
      rightPos: this.rightPos,
      ...data
    };
  }

  /**
   * Get source position (right hand for particle creation)
   */
  getSourcePos() {
    return this.rightPos;
  }

  /**
   * Get magnet position (left hand for catching)
   */
  getMagnetPos() {
    return this.leftPos;
  }

  /**
   * Check if in two-hand mode
   */
  isTwoHandMode() {
    return this.mode === 'createAndCatch' ||
           this.mode === 'amplify' ||
           this.mode === 'fusion';
  }

  /**
   * Check if currently amplifying
   */
  isAmplifying() {
    return this.mode === 'amplify';
  }

  /**
   * Reset controller state
   */
  reset() {
    this.leftPos = null;
    this.rightPos = null;
    this.fusionPending = false;
    this.mode = 'solo';
    this.isAmplified = false;
  }
}
