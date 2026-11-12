/**
 * TextParticles - Text-to-particle morphing system
 * Particles morph to form emotion text labels
 */

import * as THREE from 'three';
import { TextSampler } from '../../utils/TextSampler.js';
import { easeOutCubic } from '../../utils/easing.js';
import { logger } from '../../utils/logger.js';
import { initParticleAttributes, markAttributesDirty, setVec3 } from '../../utils/bufferHelpers.js';

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
      mode: 'none', // none | explode | implode | reform
      age: 0,
      duration: 0,
      target: null,
      drag: 0.94
    };

    // Hand repel position (left hand pushes particles away)
    this.repelPos = null;
  }

  /**
   * Create a circular particle texture
   * @private
   */
  _createCircleTexture(size = 64) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Create radial gradient for LED-style hard circles
    const center = size / 2;
    const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.6, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.85, 'rgba(255, 255, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
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
    initParticleAttributes(this.geometry, this.positions, this.colors, this.sizes, this.opacities);

    // Custom ShaderMaterial for per-particle sizes
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: `
        uniform float uPixelRatio;

        attribute vec3 color;
        attribute float size;
        attribute float opacity;

        varying vec3 vColor;
        varying float vOpacity;

        void main() {
          vColor = color;
          vOpacity = opacity;

          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Size in screen pixels, scaled by pixel ratio
          gl_PointSize = size * uPixelRatio * 350.0;
        }
      `,
      fragmentShader: `
        precision mediump float;

        varying vec3 vColor;
        varying float vOpacity;

        void main() {
          // Distance from center of point (0 = center, 1 = edge)
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center) * 2.0;

          // Soft circle with glow
          float alpha = 1.0 - smoothstep(0.5, 1.0, dist);

          // Discard fully transparent pixels
          if (alpha < 0.01) discard;

          gl_FragColor = vec4(vColor, alpha * vOpacity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    this.points.renderOrder = 100; // Render on top of other particles

    return this;
  }

  /**
   * Get the Three.js points object
   */
  getMesh() {
    return this.points;
  }

  /**
   * Set the repel position (left hand pushes particles away)
   * @param {Object|null} pos - { x, y } in world coordinates, or null to disable
   */
  setRepelPos(pos) {
    this.repelPos = pos;
  }

  /**
   * Set the current emotion and morph to its text
   */
  setEmotion(emotion, color) {
    const labels = this.config.labels;
    const newText = labels[emotion];

    logger.debug('TextParticles.setEmotion:', { emotion, newText, currentText: this.currentText, hasColor: !!color });

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
          // Scatter from edges for dramatic entrance
          const angle = Math.random() * Math.PI * 2;
          const dist = 0.8 + Math.random() * 0.4;
          p.x = Math.cos(angle) * dist;
          p.y = Math.sin(angle) * dist;
        }

        p.ox = p.x;
        p.oy = p.y;
        p.tx = target.x;
        p.ty = target.y;
        // CYBERPUNK: Maximum neon glow!
        p.r = Math.min(1, color.r * 2.0);  // Boost to max brightness
        p.g = Math.min(1, color.g * 2.0);
        p.b = Math.min(1, color.b * 2.0);
        p.size = 0.025 + Math.random() * 0.015;  // Basis grootte voor explosie variatie
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
    if (this.config.centerScreen) {
      // Fixed center position for screen-centered text
      this.centerPos.x = 0;
      this.centerPos.y = 0; // Centered on screen
    } else if (hasHand && centerPosition) {
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
        // Move inactive particles off-screen (size attribute ignored with sizeAttenuation: false)
        const i3 = i * 3;
        this.positions[i3] = -9999;
        this.positions[i3 + 1] = -9999;
        this.positions[i3 + 2] = -9999;
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

      // Apply repel force from left hand
      if (this.repelPos && this.config.repel?.enabled) {
        const dx = p.x - this.repelPos.x;
        const dy = p.y - this.repelPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const radius = this.config.repel.radius;

        if (dist < radius && dist > 0.001) {
          // Calculate repel force (stronger when closer)
          const force = (1 - dist / radius) * this.config.repel.strength;
          const angle = Math.atan2(dy, dx);

          // Push particle away from hand
          p.x += Math.cos(angle) * force * 0.1;
          p.y += Math.sin(angle) * force * 0.1;
        }
      }

      // Sync to buffers
      const i3 = i * 3;
      this.positions[i3] = p.x;
      this.positions[i3 + 1] = p.y;
      this.positions[i3 + 2] = 0.5;

      // Use emotion color
      this.colors[i3] = p.r;
      this.colors[i3 + 1] = p.g;
      this.colors[i3 + 2] = p.b;

      this.sizes[i] = p.size;
      this.opacities[i] = this.opacity;
    }

    // Mark buffers for update
    markAttributesDirty(this.geometry);
  }

  /**
   * Trigger explode effect (left-hand open)
   * Supports types: 'random' (default), 'shockwave'
   * @param {Object} center - Optional world position {x, y}
   */
  triggerExplode(center = null) {
    if (!this.currentText || !this.isVisible) return;

    const explodeConfig = this.config.explode || {};
    const duration = explodeConfig.duration || 0.8;
    const speed = explodeConfig.speed || 0.8;
    const drag = explodeConfig.drag || 0.94;
    const sizeVariation = explodeConfig.sizeVariation || 2;
    const type = explodeConfig.type || 'random';
    const origin = center || { x: this.centerPos.x, y: this.centerPos.y };

    this.effect.mode = 'explode';
    this.effect.type = type;
    this.effect.age = 0;
    this.effect.duration = duration;
    this.effect.drag = drag;
    this.effect.target = origin;
    this.effect.shockwaveSpeed = explodeConfig.shockwaveSpeed || 1.5;

    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (!p.active) continue;

      p.ox = p.x;
      p.oy = p.y;

      if (type === 'shockwave') {
        // SHOCKWAVE: particles wachten op de golf, dan weggeduwd
        const dx = p.x - origin.x;
        const dy = p.y - origin.y;
        p.distFromCenter = Math.sqrt(dx * dx + dy * dy);
        p.angleFromCenter = Math.atan2(dy, dx);
        p.shockwaveHit = false;
        p.vx = 0;
        p.vy = 0;
      } else {
        // RANDOM: standaard willekeurige richting
        const angle = Math.random() * Math.PI * 2;
        const velocity = speed * (0.6 + Math.random() * 0.6);
        p.vx = Math.cos(angle) * velocity;
        p.vy = Math.sin(angle) * velocity;
      }

      // Willekeurige grootte tijdens explosie voor "atoms" effect
      // Betere spreiding: meer grote particles, gevarieerde sizes
      const sizeRandom = Math.random();
      if (sizeRandom < 0.15) {
        // 15% heel groot (3x)
        p.explodeSize = p.size * 3;
      } else if (sizeRandom < 0.35) {
        // 20% groot (2x)
        p.explodeSize = p.size * 2;
      } else if (sizeRandom < 0.55) {
        // 20% medium groot (1.5x)
        p.explodeSize = p.size * 1.5;
      } else if (sizeRandom < 0.75) {
        // 20% normaal
        p.explodeSize = p.size;
      } else if (sizeRandom < 0.90) {
        // 15% klein (0.6x)
        p.explodeSize = p.size * 0.6;
      } else {
        // 10% heel klein (0.3x)
        p.explodeSize = p.size * 0.3;
      }
    }
  }

  /**
   * Trigger implode/catch effect (left-hand close)
   * Supports types: 'spiral', 'vacuum', 'swarm'
   * @param {Object} target - World position {x, y}
   */
  triggerImplode(target) {
    if (!target || !this.currentText || !this.isVisible) return;

    // Check of we mid-explode zijn (voor size preservation)
    const wasExploding = this.effect.mode === 'explode';

    const implodeConfig = this.config.implode || {};
    const duration = implodeConfig.duration || 0.5;
    const spiralStrength = implodeConfig.spiralStrength || 3;
    const type = implodeConfig.type || 'swarm';
    const snapPoint = implodeConfig.snapPoint || 0.7;

    this.effect.mode = 'implode';
    this.effect.type = type;
    this.effect.age = 0;
    this.effect.duration = duration;
    this.effect.target = { x: target.x, y: target.y };
    this.effect.spiralStrength = spiralStrength;
    this.effect.snapPoint = snapPoint;

    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (!p.active) continue;

      // Gebruik huidige positie als startpunt (NIET overschrijven als mid-effect)
      p.ox = p.x;
      p.oy = p.y;

      // Calculate initial angle and distance from target
      const dx = p.x - target.x;
      const dy = p.y - target.y;
      p.implodeAngle = Math.atan2(dy, dx);
      p.implodeRadius = Math.sqrt(dx * dx + dy * dy);

      // Size handling: preserve explode variation or use normal size
      if (wasExploding && p.explodeSize) {
        p.implodeSize = p.explodeSize;  // Preserve explode variation
      } else {
        // Direct implode from text - use normal size
        p.explodeSize = null;
        p.implodeSize = p.size;
      }

      if (type === 'swarm') {
        // SWARM: elke particle heeft eigen gedrag
        p.swarmSpeed = 0.7 + Math.random() * 0.6;      // Snelheid variatie
        p.swarmWobble = Math.random() * Math.PI * 2;   // Fase voor wobble
        p.swarmCurve = (Math.random() - 0.5) * 2;      // Curve richting (-1 tot 1)
        p.swarmDelay = Math.random() * 0.2;            // Start delay
      } else if (type === 'vacuum') {
        p.wobblePhase = Math.random() * Math.PI * 2;
        p.wobbleSpeed = 10 + Math.random() * 10;
      } else {
        p.implodeDelay = Math.random() * 0.3;
      }
    }
  }

  /**
   * Trigger toSphere effect - text particles swarm to hand to form sphere
   * Called when transitioning from finger label to open palm
   * Can interrupt any active text effect (explode/implode/reform)
   * @param {Object} target - World position {x, y} of hand
   */
  triggerToSphere(target) {
    if (!target || !this.currentText) return;

    // Prevent duplicate calls
    if (this.effect.mode === 'toSphere') return;

    this.effect.mode = 'toSphere';
    this.effect.age = 0;
    this.effect.duration = 0.35;  // Fast swarm
    this.effect.target = { x: target.x, y: target.y };

    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (!p.active) continue;

      p.ox = p.x;
      p.oy = p.y;

      // Calculate angle and distance from target
      const dx = p.x - target.x;
      const dy = p.y - target.y;
      p.implodeAngle = Math.atan2(dy, dx);
      p.implodeRadius = Math.sqrt(dx * dx + dy * dy);

      // Reset size variations for uniform sphere
      p.explodeSize = null;
      p.implodeSize = null;

      // Fast swarm parameters
      p.swarmSpeed = 1.2 + Math.random() * 0.6;     // Faster than normal
      p.swarmWobble = Math.random() * Math.PI * 2;
      p.swarmCurve = (Math.random() - 0.5) * 1.5;   // Tighter curves
      p.swarmDelay = Math.random() * 0.1;           // Less delay
    }
  }

  /**
   * Get animation offset based on type
   * @private
   */
  _getAnimationOffset(type, particleIndex, time) {
    const seed = particleIndex * 0.1;

    switch (type) {
      case 'static':
        // No animation - crystal clear text
        return { x: 0, y: 0 };

      case 'vibrate':
        // POWER/WOEDE: subtle glitch effect (readable)
        return {
          x: Math.sin(time * 30 + seed) * 0.004 + (Math.random() > 0.98 ? (Math.random() - 0.5) * 0.015 : 0),
          y: Math.cos(time * 25 + seed) * 0.004
        };

      case 'drip':
        // Verdriet: gentle drip effect
        const dripPhase = (time * 0.5 + seed) % 1;
        return {
          x: Math.sin(time * 2 + seed) * 0.002,
          y: -dripPhase * 0.015
        };

      case 'pulse':
        // CALM/Kalmte: gentle breathing pulse
        const pulse = Math.sin(time * 2 + seed * 0.5) * 0.5 + 0.5;
        return {
          x: Math.cos(seed * 10) * pulse * 0.003,
          y: Math.sin(seed * 10) * pulse * 0.003 + Math.sin(time * 1.2) * 0.002
        };

      case 'flow':
        // FLOW: gentle wave motion
        return {
          x: Math.sin(time * 3 + seed) * 0.005,
          y: Math.cos(time * 2.5 + seed) * 0.003
        };

      case 'sparkle':
        // Blij: subtle sparkle
        return {
          x: Math.sin(time * 15 + seed * 2) * 0.004,
          y: Math.cos(time * 12 + seed * 2) * 0.004
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
   * Check if text particles are currently active (visible or in effect)
   */
  isActive() {
    return this.isVisible || this.opacity > 0 || this.effect.mode !== 'none';
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
   * Get statistics
   */
  getStats() {
    let active = 0;
    for (let i = 0; i < this.maxParticles; i++) {
      if (this.particles[i].active) active++;
    }
    return { active, max: this.maxParticles };
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
        // Move inactive particles off-screen
        const i3 = i * 3;
        this.positions[i3] = -9999;
        this.positions[i3 + 1] = -9999;
        this.positions[i3 + 2] = -9999;
        this.sizes[i] = 0;
        this.opacities[i] = 0;
        continue;
      }

      if (this.effect.mode === 'explode') {
        if (this.effect.type === 'shockwave') {
          // SHOCKWAVE: expanding ring pushes particles outward
          const shockwaveRadius = progress * this.effect.shockwaveSpeed;

          if (!p.shockwaveHit && p.distFromCenter <= shockwaveRadius) {
            // Shockwave has reached this particle - give it velocity
            p.shockwaveHit = true;
            const speed = this.config.explode?.speed || 0.8;
            const pushStrength = speed * (1.2 - p.distFromCenter * 0.5);
            p.vx = Math.cos(p.angleFromCenter) * pushStrength;
            p.vy = Math.sin(p.angleFromCenter) * pushStrength;
          }

          // Apply velocity with drag
          p.vx *= this.effect.drag;
          p.vy *= this.effect.drag;
          p.x += p.vx * deltaTime;
          p.y += p.vy * deltaTime;
        } else {
          // RANDOM: standard random explosion
          p.vx *= this.effect.drag;
          p.vy *= this.effect.drag;
          p.x += p.vx * deltaTime;
          p.y += p.vy * deltaTime;
        }
      } else if (this.effect.mode === 'implode') {
        if (this.effect.type === 'swarm') {
          // SWARM: organische beweging naar target, als een zwerm
          const delayedProgress = Math.max(0, progress - p.swarmDelay) / (1 - p.swarmDelay);
          const t = Math.min(1, delayedProgress * p.swarmSpeed);

          // Ease-in-out voor natuurlijke beweging
          const eased = t < 0.5
            ? 2 * t * t
            : 1 - Math.pow(-2 * t + 2, 2) / 2;

          // Wobble die afneemt naarmate particle dichterbij komt
          const wobbleStrength = (1 - eased) * 0.08;
          const wobbleX = Math.sin(this.time * 8 + p.swarmWobble) * wobbleStrength;
          const wobbleY = Math.cos(this.time * 6 + p.swarmWobble * 1.3) * wobbleStrength;

          // Curve: particles maken een boog naar het doel
          const curveOffset = Math.sin(eased * Math.PI) * p.swarmCurve * 0.15;
          const perpX = -Math.sin(p.implodeAngle) * curveOffset;
          const perpY = Math.cos(p.implodeAngle) * curveOffset;

          // Interpoleer naar target met curve en wobble
          p.x = p.ox + (this.effect.target.x - p.ox) * eased + perpX + wobbleX;
          p.y = p.oy + (this.effect.target.y - p.oy) * eased + perpY + wobbleY;

          // Lichte size variatie tijdens beweging (behoud explodeSize als die er is)
          const baseSize = p.explodeSize || p.size;
          p.implodeSize = baseSize * (0.8 + Math.sin(this.time * 10 + p.swarmWobble) * 0.2);

        } else if (this.effect.type === 'vacuum') {
          // VACUUM SNAP: slow pull with tension, then sudden snap
          const snapPoint = this.effect.snapPoint;
          const baseSize = p.explodeSize || p.size;  // Behoud explode variatie

          if (progress < snapPoint) {
            const tensionProgress = progress / snapPoint;
            const wobble = Math.sin(this.time * p.wobbleSpeed + p.wobblePhase) * 0.02 * (1 - tensionProgress);
            const driftAmount = tensionProgress * 0.2;
            p.x = p.ox + (this.effect.target.x - p.ox) * driftAmount + wobble;
            p.y = p.oy + (this.effect.target.y - p.oy) * driftAmount + wobble;
            p.implodeSize = baseSize;
          } else {
            const snapProgress = (progress - snapPoint) / (1 - snapPoint);
            const easeIn = snapProgress * snapProgress * snapProgress * snapProgress;
            const startX = p.ox + (this.effect.target.x - p.ox) * 0.2;
            const startY = p.oy + (this.effect.target.y - p.oy) * 0.2;
            p.x = startX + (this.effect.target.x - startX) * easeIn;
            p.y = startY + (this.effect.target.y - startY) * easeIn;
            p.implodeSize = baseSize * (1 - easeIn * 0.9);
          }

        } else {
          // SPIRAL (Black Hole): spiral inward with acceleration
          const delayedProgress = Math.max(0, progress - (p.implodeDelay || 0)) / (1 - (p.implodeDelay || 0));
          const clampedProgress = Math.min(1, delayedProgress);
          const easeIn = clampedProgress * clampedProgress * clampedProgress;
          const baseSize = p.explodeSize || p.size;  // Behoud explode variatie

          const currentRadius = p.implodeRadius * (1 - easeIn);
          const spiralRotation = easeIn * this.effect.spiralStrength * Math.PI;
          const currentAngle = p.implodeAngle + spiralRotation;

          p.x = this.effect.target.x + Math.cos(currentAngle) * currentRadius;
          p.y = this.effect.target.y + Math.sin(currentAngle) * currentRadius;
          p.implodeSize = baseSize * (1 - easeIn * 0.8);
        }
      } else if (this.effect.mode === 'toSphere') {
        // TOSPHERE: fast swarm naar hand voor sphere formation
        const delayedProgress = Math.max(0, progress - p.swarmDelay) / (1 - p.swarmDelay);
        const t = Math.min(1, delayedProgress * p.swarmSpeed);

        // Fast ease-in voor snelle convergentie
        const eased = t * t * t;

        // Wobble die snel afneemt
        const wobbleStrength = (1 - eased) * 0.05;
        const wobbleX = Math.sin(this.time * 12 + p.swarmWobble) * wobbleStrength;
        const wobbleY = Math.cos(this.time * 10 + p.swarmWobble * 1.3) * wobbleStrength;

        // Tighter curve naar target
        const curveOffset = Math.sin(eased * Math.PI) * p.swarmCurve * 0.1;
        const perpX = -Math.sin(p.implodeAngle) * curveOffset;
        const perpY = Math.cos(p.implodeAngle) * curveOffset;

        // Move toward target
        p.x = p.ox + (this.effect.target.x - p.ox) * eased + perpX + wobbleX;
        p.y = p.oy + (this.effect.target.y - p.oy) * eased + perpY + wobbleY;

        // Shrink particles as they approach
        p.implodeSize = p.size * (1 - eased * 0.7);

      } else if (this.effect.mode === 'reform') {
        // REFORM: particles keren terug naar tekst positie
        const targetX = this.centerPos.x + p.tx;
        const targetY = this.centerPos.y + p.ty;

        // Smooth ease-out beweging naar target
        p.x = p.ox + (targetX - p.ox) * eased;
        p.y = p.oy + (targetY - p.oy) * eased;
      }

      const i3 = i * 3;
      this.positions[i3] = p.x;
      this.positions[i3 + 1] = p.y;
      this.positions[i3 + 2] = 0.5;

      this.colors[i3] = p.r;
      this.colors[i3 + 1] = p.g;
      this.colors[i3 + 2] = p.b;

      // Gebruik effect-specifieke grootte variatie
      this.sizes[i] = p.implodeSize || p.explodeSize || p.size;

      // Opacity: varies by effect mode
      if (this.effect.mode === 'reform') {
        this.opacities[i] = Math.min(1, progress * 2); // Snel fade in
      } else {
        this.opacities[i] = fade;
      }
    }

    markAttributesDirty(this.geometry);

    if (progress >= 1) {
      if (this.effect.mode === 'reform') {
        // Reform klaar - terug naar normale state
        this.effect.mode = 'none';
        this.opacity = 1;
        this.morphProgress = 1;
      } else if (this.effect.mode === 'toSphere') {
        // toSphere klaar - clear text (sphere neemt over)
        this.effect.mode = 'none';
        this.clear();
      } else {
        // Explode/implode klaar - start reform
        this._startReform();
      }
    }
  }

  /**
   * Start reform - particles keren terug naar tekst positie
   * @private
   */
  _startReform() {
    this.effect.mode = 'reform';
    this.effect.age = 0;
    this.effect.duration = this.config.morphDuration || 0.4;

    // Sla huidige posities op als startpunt voor reform
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (!p.active) continue;
      p.ox = p.x;
      p.oy = p.y;
      // Reset effect sizes
      p.explodeSize = null;
      p.implodeSize = null;
    }

    // Herstel opacity
    this.opacity = 0.5;
    this.isVisible = true;
  }
}
