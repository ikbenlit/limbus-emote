/**
 * HandMotionState - Per-hand motion tracking state
 *
 * DRY: This class is reused for both left and right hands.
 * SOC: Only handles motion physics, not emotion detection.
 */

export class HandMotionState {
  constructor(config) {
    this.config = config;

    // Trajectory buffer for pattern detection
    this.trajectoryBuffer = [];
    this.bufferSize = config.trajectoryBufferSize || 30;

    // Previous frame data
    this.prevPosition = null;
    this.prevVelocity = { x: 0, y: 0, magnitude: 0 };

    // Current motion state
    this.velocity = { x: 0, y: 0, magnitude: 0 };
    this.jerk = 0;
    this.direction = { x: 0, y: 0 };
    this.circularScore = 0;

    // Smoothing factor for EMA
    this.alpha = config.smoothingAlpha || 0.3;
  }

  /**
   * Update config-driven parameters
   * @param {Object} config
   */
  updateConfig(config = this.config) {
    this.config = config;
    this.bufferSize = config.trajectoryBufferSize || this.bufferSize;
    this.alpha = config.smoothingAlpha ?? this.alpha;
  }

  /**
   * Update motion state with new palm position
   * @param {Object} palmCenter - {x, y} normalized coordinates (0-1)
   * @param {number} deltaTime - Time since last frame in seconds
   * @returns {Object} Current motion state
   */
  update(palmCenter, deltaTime) {
    if (!palmCenter || deltaTime <= 0) {
      return this.getState();
    }

    // Add to trajectory buffer
    this._addToBuffer(palmCenter);

    // Calculate velocity if we have previous position
    if (this.prevPosition) {
      this._calculateVelocity(palmCenter, deltaTime);
      this._calculateJerk(deltaTime);
      this._calculateDirection();
      this._calculateCircularScore();
    }

    // Store for next frame
    this.prevPosition = { ...palmCenter };
    this.prevVelocity = { ...this.velocity };

    return this.getState();
  }

  /**
   * Add position to trajectory buffer
   * @private
   */
  _addToBuffer(position) {
    this.trajectoryBuffer.push({
      x: position.x,
      y: position.y,
      time: performance.now()
    });

    // Keep buffer at max size
    while (this.trajectoryBuffer.length > this.bufferSize) {
      this.trajectoryBuffer.shift();
    }
  }

  /**
   * Calculate velocity with EMA smoothing
   * @private
   */
  _calculateVelocity(currentPos, deltaTime) {
    // Raw velocity
    const rawVx = (currentPos.x - this.prevPosition.x) / deltaTime;
    const rawVy = (currentPos.y - this.prevPosition.y) / deltaTime;

    // Apply EMA smoothing: new = alpha * raw + (1 - alpha) * old
    this.velocity.x = this.alpha * rawVx + (1 - this.alpha) * this.prevVelocity.x;
    this.velocity.y = this.alpha * rawVy + (1 - this.alpha) * this.prevVelocity.y;
    this.velocity.magnitude = Math.sqrt(
      this.velocity.x * this.velocity.x +
      this.velocity.y * this.velocity.y
    );
  }

  /**
   * Calculate jerk (rate of velocity change)
   * High jerk = abrupt/shaky movement
   * Low jerk = smooth movement
   * @private
   */
  _calculateJerk(deltaTime) {
    if (deltaTime <= 0) {
      this.jerk = 0;
      return;
    }

    // Jerk is the rate of change of velocity
    const dvx = this.velocity.x - this.prevVelocity.x;
    const dvy = this.velocity.y - this.prevVelocity.y;
    const jerkMagnitude = Math.sqrt(dvx * dvx + dvy * dvy) / deltaTime;

    // Apply EMA smoothing to jerk as well
    this.jerk = this.alpha * jerkMagnitude + (1 - this.alpha) * this.jerk;
  }

  /**
   * Calculate normalized direction vector
   * @private
   */
  _calculateDirection() {
    const mag = this.velocity.magnitude;
    if (mag > 0.001) {
      this.direction.x = this.velocity.x / mag;
      this.direction.y = this.velocity.y / mag;
    } else {
      this.direction.x = 0;
      this.direction.y = 0;
    }
  }

  /**
   * Calculate circular pattern score
   * Uses trajectory buffer to detect circular motion
   * @private
   */
  _calculateCircularScore() {
    const buffer = this.trajectoryBuffer;

    // Need at least 10 points to detect pattern
    if (buffer.length < 10) {
      this.circularScore = 0;
      return;
    }

    // Calculate centroid
    let cx = 0, cy = 0;
    for (const point of buffer) {
      cx += point.x;
      cy += point.y;
    }
    cx /= buffer.length;
    cy /= buffer.length;

    // Calculate average distance from centroid and variance
    let totalDist = 0;
    const distances = [];
    for (const point of buffer) {
      const dist = Math.sqrt(
        (point.x - cx) * (point.x - cx) +
        (point.y - cy) * (point.y - cy)
      );
      distances.push(dist);
      totalDist += dist;
    }
    const avgDist = totalDist / buffer.length;

    // Calculate variance of distances
    // Low variance = points stay same distance from center = circular
    let variance = 0;
    for (const dist of distances) {
      variance += (dist - avgDist) * (dist - avgDist);
    }
    variance /= buffer.length;

    // Calculate angular movement (are we going around the center?)
    let totalAngle = 0;
    for (let i = 1; i < buffer.length; i++) {
      const prev = buffer[i - 1];
      const curr = buffer[i];

      // Angle from centroid to each point
      const angle1 = Math.atan2(prev.y - cy, prev.x - cx);
      const angle2 = Math.atan2(curr.y - cy, curr.x - cx);

      // Angular difference
      let dAngle = angle2 - angle1;
      // Normalize to -PI to PI
      while (dAngle > Math.PI) dAngle -= 2 * Math.PI;
      while (dAngle < -Math.PI) dAngle += 2 * Math.PI;

      totalAngle += Math.abs(dAngle);
    }

    // Score based on:
    // 1. Low variance in distance from center (consistent radius)
    // 2. High total angular movement (going around)
    // 3. Reasonable average distance (not just staying in place)

    const radiusConsistency = avgDist > 0.01 ? Math.exp(-variance / (avgDist * avgDist)) : 0;
    const angularProgress = Math.min(totalAngle / Math.PI, 1); // Normalize to 0-1
    const hasMovement = avgDist > 0.02 ? 1 : avgDist / 0.02;

    this.circularScore = radiusConsistency * angularProgress * hasMovement;
  }

  /**
   * Get current motion state
   * @returns {Object} Motion state
   */
  getState() {
    return {
      velocity: { ...this.velocity },
      jerk: this.jerk,
      direction: { ...this.direction },
      circularScore: this.circularScore,
      trajectoryLength: this.trajectoryBuffer.length
    };
  }

  /**
   * Check if movement is primarily downward (for verdriet)
   * @returns {boolean}
   */
  isMovingDown() {
    return this.direction.y < (this.config.downwardThreshold || -0.5) &&
           this.velocity.magnitude > 0.01;
  }

  /**
   * Check if movement is circular (for kalmte)
   * @returns {boolean}
   */
  isCircular() {
    return this.circularScore > (this.config.circularThreshold || 0.6);
  }

  /**
   * Reset state (e.g., when hand is lost)
   */
  reset() {
    this.trajectoryBuffer = [];
    this.prevPosition = null;
    this.prevVelocity = { x: 0, y: 0, magnitude: 0 };
    this.velocity = { x: 0, y: 0, magnitude: 0 };
    this.jerk = 0;
    this.direction = { x: 0, y: 0 };
    this.circularScore = 0;
  }
}
