/**
 * TextParticles - Text-to-particle morphing system
 * Particles morph to form emotion text labels
 */

import * as THREE from 'three';
import { TextSampler } from '../../utils/TextSampler.js';
import { easeOutCubic } from '../../utils/easing.js';

export class TextParticles {
  constructor(config) {
    this.config = config;
    this.textSampler = new TextSampler(config);

    // Particle data
    this.maxParticles = config.maxCount || 2000;
    this.particles = [];
    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);
    this.sizes = new Float32Array(this.maxParticles);
    this.opacities = new Float32Array(this.maxParticles);

    // Three.js objects
    this.geometry = null;
    this.material = null;
    this.mesh = null;

    // State
    this.currentEmotion = null;
    this.currentText = null;
    this.targetPositions = [];
    this.centerPos = { x: 0, y: 0 };
    this.morphProgress = 0;
    this.isVisible = false;
    this.opacity = 0;
    this.time = 0;
    this.effect = {
      mode: 'none', // none | explode | implode
      age: 0,
      duration: 0,
      target: null,
      drag: 0.94
    };
  }

  /**
   * Initialize Three.js objects
   */
  init() {
    // Initialize particle data
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        x: 0, y: 0, z: 0,           // Current position
        tx: 0, ty: 0,               // Target position (relative to center)
        ox: 0, oy: 0,               // Original position before morph
        vx: 0, vy: 0,               // Effect velocities
        r: 1, g: 1, b: 1,           // Color
        size: 0.02,
        active: false
      });
      this.sizes[i] = 0;
      this.opacities[i] = 0;
    }

    // Create geometry
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
    this.geometry.setAttribute('opacity', new THREE.BufferAttribute(this.opacities, 1));

    // Material
    this.material = new THREE.PointsMaterial({
      size: 0.025,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;

    return this;
  }

  /**
   * Get the Three.js points object
   */
  getMesh() {
    return this.points;
  }

  /**
   * Set the current emotion and morph to its text
   */
  setEmotion(emotion, color) {
    const labels = this.config.labels;
    const newText = labels[emotion];

    // Skip if no text for this emotion or same as current
    if (!newText || newText === this.currentText) {
      if (!newText && this.currentText) {
        // Fade out if switching to emotion with no text
        this.fadeOut();
      }
      return;
    }

    this.currentEmotion = emotion;
    this.currentText = newText;

    // Sample new text positions
    this.targetPositions = this.textSampler.sample(newText);

    // Initialize particles for this text
    this._initParticlesForText(color);

    // Start morph animation
    this.morphProgress = 0;
    this.isVisible = true;
  }

  /**
   * Initialize particles to morph to text positions
   * @private
   */
  _initParticlesForText(color) {
    const numPositions = Math.min(this.targetPositions.length, this.maxParticles);

    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];

      if (i < numPositions) {
        const target = this.targetPositions[i];

        // Start from random position around center if not already active
        if (!p.active) {
          p.x = this.centerPos.x + (Math.random() - 0.5) * 0.5;
          p.y = this.centerPos.y + (Math.random() - 0.5) * 0.5;
        }

        p.ox = p.x;
        p.oy = p.y;
        p.tx = target.x;
        p.ty = target.y;
        p.r = color.r;
        p.g = color.g;
        p.b = color.b;
        p.size = 0.015 + Math.random() * 0.01;
        p.active = true;
      } else {
        p.active = false;
      }
    }
  }

  /**
   * Update particles
   */
  update(deltaTime, centerPosition, hasHand) {
    this.time += deltaTime;

    // Update center position
    if (hasHand && centerPosition) {
      this.centerPos.x = centerPosition.x + (this.config.positionOffset?.x || 0);
      this.centerPos.y = centerPosition.y + (this.config.positionOffset?.y || 0);
    }

    if (this.effect.mode !== 'none') {
      this._updateEffect(deltaTime);
      return;
    }

    // Update visibility/opacity
    if (this.isVisible && hasHand) {
      this.opacity = Math.min(1, this.opacity + deltaTime * 3);
    } else {
      this.opacity = Math.max(0, this.opacity - deltaTime * 2);
      if (this.opacity <= 0) {
        this.isVisible = false;
      }
    }

    // Update morph progress
    const morphDuration = this.config.morphDuration || 0.5;
    if (this.morphProgress < 1) {
      this.morphProgress = Math.min(1, this.morphProgress + deltaTime / morphDuration);
    }

    // Get animation type for current emotion
    const animation = this.config.animations?.[this.currentEmotion] || 'none';

    // Update each particle
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];

      if (!p.active) {
        this.sizes[i] = 0;
        this.opacities[i] = 0;
        continue;
      }

      // Eased morph progress
      const t = easeOutCubic(this.morphProgress);

      // Calculate target world position
      const targetX = this.centerPos.x + p.tx;
      const targetY = this.centerPos.y + p.ty;

      // Interpolate from original to target
      p.x = p.ox + (targetX - p.ox) * t;
      p.y = p.oy + (targetY - p.oy) * t;

      // Apply animation based on emotion
      const animOffset = this._getAnimationOffset(animation, i, this.time);
      p.x += animOffset.x;
      p.y += animOffset.y;

      // Sync to buffers
      const i3 = i * 3;
      this.positions[i3] = p.x;
      this.positions[i3 + 1] = p.y;
      this.positions[i3 + 2] = 0.2; // In front of particles

      this.colors[i3] = p.r;
      this.colors[i3 + 1] = p.g;
      this.colors[i3 + 2] = p.b;

      this.sizes[i] = p.size;
      this.opacities[i] = this.opacity;
    }

    // Mark buffers for update
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
    this.geometry.attributes.opacity.needsUpdate = true;

    // Update material opacity
    this.material.opacity = this.opacity;
  }

  /**
   * Trigger explode effect (left-hand open)
   * @param {Object} center - Optional world position {x, y}
   */
  triggerExplode(center = null) {
    if (!this.currentText || !this.isVisible) return;

    const explodeConfig = this.config.explode || {};
    const duration = explodeConfig.duration || 0.8;
    const speed = explodeConfig.speed || 0.8;
    const drag = explodeConfig.drag || 0.94;
    const origin = center || { x: this.centerPos.x, y: this.centerPos.y };

    this.effect.mode = 'explode';
    this.effect.age = 0;
    this.effect.duration = duration;
    this.effect.drag = drag;
    this.effect.target = origin;

    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (!p.active) continue;

      const angle = Math.random() * Math.PI * 2;
      const velocity = speed * (0.6 + Math.random() * 0.6);
      p.vx = Math.cos(angle) * velocity;
      p.vy = Math.sin(angle) * velocity;
      p.ox = p.x;
      p.oy = p.y;
    }
  }

  /**
   * Trigger implode/catch effect (left-hand close)
   * @param {Object} target - World position {x, y}
   */
  triggerImplode(target) {
    if (!target || !this.currentText || !this.isVisible) return;

    const implodeConfig = this.config.implode || {};
    const duration = implodeConfig.duration || 0.5;

    this.effect.mode = 'implode';
    this.effect.age = 0;
    this.effect.duration = duration;
    this.effect.target = { x: target.x, y: target.y };

    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (!p.active) continue;
      p.ox = p.x;
      p.oy = p.y;
    }
  }

  /**
   * Get animation offset based on type
   * @private
   */
  _getAnimationOffset(type, particleIndex, time) {
    const seed = particleIndex * 0.1;

    switch (type) {
      case 'vibrate':
        // Woede: aggressive shaking
        return {
          x: Math.sin(time * 30 + seed) * 0.008,
          y: Math.cos(time * 25 + seed) * 0.008
        };

      case 'drip':
        // Verdriet: slow downward drip
        const dripPhase = (time * 0.5 + seed) % 1;
        return {
          x: Math.sin(time * 2 + seed) * 0.002,
          y: -dripPhase * 0.02
        };

      case 'pulse':
        // Kalmte: gentle breathing pulse
        const pulse = Math.sin(time * 2 + seed * 0.5) * 0.5 + 0.5;
        return {
          x: Math.cos(seed * 10) * pulse * 0.005,
          y: Math.sin(seed * 10) * pulse * 0.005
        };

      case 'flow':
        // Flow: smooth horizontal wave
        return {
          x: Math.sin(time * 3 + seed) * 0.006,
          y: Math.cos(time * 2.4 + seed) * 0.003
        };

      case 'sparkle':
        // Blij: quick twinkle
        return {
          x: Math.sin(time * 18 + seed * 2) * 0.006,
          y: Math.cos(time * 16 + seed * 2) * 0.006
        };

      default:
        return { x: 0, y: 0 };
    }
  }

  /**
   * Fade out text particles
   */
  fadeOut() {
    this.isVisible = false;
    this.currentText = null;
  }

  /**
   * Clear all particles
   */
  clear() {
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles[i].active = false;
      this.sizes[i] = 0;
      this.opacities[i] = 0;
    }
    this.currentText = null;
    this.isVisible = false;
    this.opacity = 0;
    this.effect.mode = 'none';
  }

  /**
   * Cleanup
   */
  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }

  _updateEffect(deltaTime) {
    this.effect.age += deltaTime;
    const progress = Math.min(this.effect.age / this.effect.duration, 1);
    const eased = easeOutCubic(progress);
    const fade = 1 - progress;

    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (!p.active) {
        this.sizes[i] = 0;
        this.opacities[i] = 0;
        continue;
      }

      if (this.effect.mode === 'explode') {
        p.vx *= this.effect.drag;
        p.vy *= this.effect.drag;
        p.x += p.vx * deltaTime;
        p.y += p.vy * deltaTime;
      } else if (this.effect.mode === 'implode') {
        p.x = p.ox + (this.effect.target.x - p.ox) * eased;
        p.y = p.oy + (this.effect.target.y - p.oy) * eased;
      }

      const i3 = i * 3;
      this.positions[i3] = p.x;
      this.positions[i3 + 1] = p.y;
      this.positions[i3 + 2] = 0.2;

      this.colors[i3] = p.r;
      this.colors[i3 + 1] = p.g;
      this.colors[i3 + 2] = p.b;

      this.sizes[i] = p.size;
      this.opacities[i] = fade;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
    this.geometry.attributes.opacity.needsUpdate = true;
    this.material.opacity = fade;

    if (progress >= 1) {
      this.clear();
    }
  }
}
