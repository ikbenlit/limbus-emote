/**
 * HandOverlay - Hand landmark visualization
 * Draws dots at each landmark and lines connecting them
 */

import * as THREE from 'three';

export class HandOverlay {
  constructor(config, renderer) {
    this.config = config;
    this.renderer = renderer;
    this.group = new THREE.Group();

    // Landmark dots
    this.dotGeometry = null;
    this.dotMaterial = null;
    this.dots = null;
    this.dotPositions = null;

    // Connection lines
    this.lineGeometry = null;
    this.lineMaterial = null;
    this.lines = null;
    this.linePositions = null;

    // State
    this.currentOpacity = 0;
    this.targetOpacity = 0;
    this.isVisible = false;
    this.maxHands = 2; // Support up to 2 hands (configurable via CONFIG if needed)
  }

  /**
   * Initialize Three.js objects for overlay
   */
  init() {
    const numLandmarks = 21;
    const numConnections = this.config.connections.length;
    const totalLandmarks = numLandmarks * this.maxHands;
    const totalConnections = numConnections * this.maxHands;

    // Create landmark dots
    this.dotPositions = new Float32Array(totalLandmarks * 3);
    this.dotGeometry = new THREE.BufferGeometry();
    this.dotGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.dotPositions, 3)
    );

    this.dotMaterial = new THREE.PointsMaterial({
      size: this.config.dotSize,
      color: this.config.dotColor,
      transparent: true,
      opacity: 0,
      sizeAttenuation: true,
      depthWrite: false
    });

    this.dots = new THREE.Points(this.dotGeometry, this.dotMaterial);
    this.group.add(this.dots);

    // Create connection lines
    // Each connection needs 2 points (start and end)
    this.linePositions = new Float32Array(totalConnections * 2 * 3);
    this.lineGeometry = new THREE.BufferGeometry();
    this.lineGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.linePositions, 3)
    );

    this.lineMaterial = new THREE.LineBasicMaterial({
      color: this.config.lineColor,
      transparent: true,
      opacity: 0,
      linewidth: this.config.lineWidth,
      depthWrite: false
    });

    this.lines = new THREE.LineSegments(this.lineGeometry, this.lineMaterial);
    this.group.add(this.lines);

    return this;
  }

  /**
   * Get the Three.js group to add to scene
   */
  get mesh() {
    return this.group;
  }

  /**
   * Update overlay with new landmark positions for multiple hands
   * @param {Object[][]} allHandLandmarks - Array of arrays of 21 landmarks
   * @param {boolean} hasAnyHand - Whether any hand is currently detected
   */
  update(allHandLandmarks, hasAnyHand) {
    if (hasAnyHand && allHandLandmarks && allHandLandmarks.length > 0) {
      this.targetOpacity = this.config.opacity;
      this._updatePositions(allHandLandmarks);
    } else {
      this.targetOpacity = 0;
    }
  }

  /**
   * Update opacity (call each frame for smooth fade)
   */
  updateFade(deltaTime) {
    // Smooth fade towards target
    const fadeSpeed = 1 / this.config.fadeOutDuration;

    if (this.currentOpacity < this.targetOpacity) {
      // Fade in (faster)
      this.currentOpacity = Math.min(
        this.targetOpacity,
        this.currentOpacity + deltaTime * fadeSpeed * 3
      );
    } else if (this.currentOpacity > this.targetOpacity) {
      // Fade out
      this.currentOpacity = Math.max(
        this.targetOpacity,
        this.currentOpacity - deltaTime * fadeSpeed
      );
    }

    // Apply opacity to materials
    this.dotMaterial.opacity = this.currentOpacity;
    this.lineMaterial.opacity = this.currentOpacity * 0.6; // Lines slightly more transparent

    // Update visibility
    this.isVisible = this.currentOpacity > 0.01;
    this.group.visible = this.isVisible;
  }

  /**
   * Update landmark and line positions for all detected hands
   * @private
   */
  _updatePositions(allHandLandmarks) {
    // Reset all positions to 0 (off-screen) first
    this.dotPositions.fill(0);
    this.linePositions.fill(0);

    const connections = this.config.connections;

    for (let handIdx = 0; handIdx < Math.min(allHandLandmarks.length, this.maxHands); handIdx++) {
      const landmarks = allHandLandmarks[handIdx];
      if (!landmarks || landmarks.length !== 21) continue;

      const dotOffset = handIdx * 21 * 3;
      const lineOffset = handIdx * connections.length * 2 * 3;

      // Update dot positions
      for (let i = 0; i < 21; i++) {
        const lm = landmarks[i];
        const worldPos = this.renderer.screenToWorld(lm.x, lm.y);

        this.dotPositions[dotOffset + (i * 3)] = worldPos.x;
        this.dotPositions[dotOffset + (i * 3 + 1)] = worldPos.y;
        this.dotPositions[dotOffset + (i * 3 + 2)] = 0.1; // Slightly in front
      }

      // Update line positions
      for (let i = 0; i < connections.length; i++) {
        const [startIdx, endIdx] = connections[i];
        const startLm = landmarks[startIdx];
        const endLm = landmarks[endIdx];

        const startWorld = this.renderer.screenToWorld(startLm.x, startLm.y);
        const endWorld = this.renderer.screenToWorld(endLm.x, endLm.y);

        // Each line segment needs 2 vertices
        const segmentBaseIdx = lineOffset + (i * 6);
        this.linePositions[segmentBaseIdx] = startWorld.x;
        this.linePositions[segmentBaseIdx + 1] = startWorld.y;
        this.linePositions[segmentBaseIdx + 2] = 0.05; // Slightly behind dots

        this.linePositions[segmentBaseIdx + 3] = endWorld.x;
        this.linePositions[segmentBaseIdx + 4] = endWorld.y;
        this.linePositions[segmentBaseIdx + 5] = 0.05;
      }
    }

    this.dotGeometry.attributes.position.needsUpdate = true;
    this.lineGeometry.attributes.position.needsUpdate = true;
  }

  /**
   * Cleanup resources
   */
  dispose() {
    this.dotGeometry.dispose();
    this.dotMaterial.dispose();
    this.lineGeometry.dispose();
    this.lineMaterial.dispose();
  }
}
