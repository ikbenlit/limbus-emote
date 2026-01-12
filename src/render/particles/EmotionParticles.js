/**
 * EmotionParticles - Emotion-specific particle behaviors
 *
 * Supports two-hand interaction:
 * - Magnet: Left hand attracts particles
 * - Amplify: Same emotion = bigger, more particles
 * - Fusion: Explosion burst when hands meet
 */

import * as THREE from 'three';
import { ParticlePool } from './ParticlePool.js';
import { hexToRgb } from '../../utils/math.js';
import { easeOutCubic } from '../../utils/easing.js';
import { applyMagnetForce, applyExplosionForce } from '../../utils/physics.js';

export class EmotionParticles {
  constructor(config) {
    this.config = config;
    this.pool = new ParticlePool(config.maxCount || 10000);
    this.currentEmotion = 'neutraal';
    this.spawnAccumulator = 0;
    this.group = new THREE.Group();
    this.particleMesh = this.pool.getMesh();
    this.group.add(this.particleMesh);

    // Two-hand state
    this.magnetPos = null;
    this.magnetConfig = null;
    this.amplifyMultiplier = 1;
    this.amplifyScale = 1;

    // Fusion visual feedback
    this.fusionPulse = {
      active: false,
      age: 0,
      duration: 0.6
    };
    this.fusionRing = this._createFusionRing();
    this.fusionFlash = this._createFusionFlash();
    this.group.add(this.fusionRing);
    this.group.add(this.fusionFlash);
  }

  get mesh() {
    return this.group;
  }

  /**
   * Set the current emotion
   */
  setEmotion(emotion) {
    if (this.currentEmotion !== emotion) {
      this.currentEmotion = emotion;
    }
  }

  /**
   * Set magnet position for two-hand mode
   * @param {Object|null} pos - { x, y } or null to disable
   * @param {Object} config - Magnet config from CONFIG.twoHand
   */
  setMagnet(pos, config) {
    this.magnetPos = pos;
    this.magnetConfig = config;
  }

  /**
   * Set amplification for same-emotion mode
   * @param {boolean} enabled - Whether to amplify
   * @param {number} multiplier - Spawn rate multiplier
   * @param {number} scale - Size multiplier
   */
  setAmplify(enabled, multiplier = 1.5, scale = 1.3) {
    this.amplifyMultiplier = enabled ? multiplier : 1;
    this.amplifyScale = enabled ? scale : 1;
  }

  /**
   * Update particles - spawn new ones and update existing
   */
  update(deltaTime, palmPosition, hasHand) {
    const emotionConfig = this.config[this.currentEmotion];
    if (!emotionConfig) return;

    // Spawn new particles if hand is detected
    if (hasHand && palmPosition) {
      // Apply amplification multiplier to spawn rate
      const spawnRate = emotionConfig.count * this.amplifyMultiplier;
      this.spawnAccumulator += spawnRate * deltaTime * 0.5;
      const toSpawn = Math.floor(this.spawnAccumulator);
      this.spawnAccumulator -= toSpawn;

      if (toSpawn > 0) {
        this._spawnForEmotion(toSpawn, palmPosition, emotionConfig);
      }
    }

    // Update all particles with emotion-specific behavior + magnet
    this.pool.update(deltaTime, (particle, dt) => {
      this._updateParticle(particle, dt, emotionConfig);

      // Apply magnet force if active
      if (this.magnetPos && this.magnetConfig) {
        applyMagnetForce(particle, this.magnetPos, this.magnetConfig);
      }
    });

    this._updateFusionPulse(deltaTime);
  }

  /**
   * Spawn particles with emotion-specific initialization
   */
  _spawnForEmotion(count, palmPos, config) {
    const { colors, motion, appearance } = config;

    this.pool.spawn(count, (p) => {
      // Random angle for spawn direction
      const angle = Math.random() * Math.PI * 2;
      const spread = motion.spread || Math.PI * 2;
      const spawnAngle = angle * (spread / (Math.PI * 2));

      // Spawn position with slight offset from palm
      const spawnRadius = 0.05 + Math.random() * 0.05;
      p.x = palmPos.x + Math.cos(spawnAngle) * spawnRadius;
      p.y = palmPos.y + Math.sin(spawnAngle) * spawnRadius;
      p.z = 0;

      // Initial velocity based on motion type
      const speed = motion.speed.min + Math.random() * (motion.speed.max - motion.speed.min);

      switch (motion.type) {
        case 'explosive':
          // Outward explosion
          p.vx = Math.cos(spawnAngle) * speed;
          p.vy = Math.sin(spawnAngle) * speed;
          break;

        case 'falling':
          // Mostly downward with slight horizontal spread
          p.vx = (Math.random() - 0.5) * speed * 0.3;
          p.vy = -speed;
          break;

        case 'wave':
          // Circular/wave pattern
          p.vx = Math.cos(spawnAngle) * speed * 0.5;
          p.vy = Math.sin(spawnAngle) * speed * 0.5;
          // Store initial angle for wave motion
          p.wavePhase = Math.random() * Math.PI * 2;
          break;

        case 'sparkle':
          // Light drift with twinkle
          p.vx = (Math.random() - 0.5) * speed;
          p.vy = (Math.random() - 0.5) * speed;
          p.twinkleOffset = Math.random() * Math.PI * 2;
          p.twinkleSpeed = motion.flickerSpeed || 8;
          p.twinkleDepth = motion.flickerDepth || 0.6;
          p.jitter = motion.jitter || 0.004;
          break;

        case 'drift':
        default:
          // Gentle random drift
          p.vx = (Math.random() - 0.5) * speed;
          p.vy = (Math.random() - 0.5) * speed;
          break;
      }
      p.vz = 0;

      // Color - interpolate between primary and secondary
      const colorMix = Math.random();
      const primary = hexToRgb(colors.primary);
      const secondary = hexToRgb(colors.secondary);
      p.r = primary.r + (secondary.r - primary.r) * colorMix;
      p.g = primary.g + (secondary.g - primary.g) * colorMix;
      p.b = primary.b + (secondary.b - primary.b) * colorMix;

      // Size and lifetime (apply amplify scale)
      const baseSize = appearance.size.min + Math.random() * (appearance.size.max - appearance.size.min);
      p.baseSize = baseSize * this.amplifyScale;
      p.baseOpacity = appearance.opacity;
      p.size = p.baseSize;
      p.opacity = p.baseOpacity;
      p.lifetime = appearance.lifetime.min + Math.random() * (appearance.lifetime.max - appearance.lifetime.min);

      // Store config reference for update
      p.motionType = motion.type;
      p.gravity = motion.gravity || 0;
      p.turbulence = motion.turbulence || 0;
      p.waveAmplitude = motion.waveAmplitude || 0;
      p.waveFrequency = motion.waveFrequency || 0;
    });
  }

  /**
   * Update a single particle based on its motion type
   */
  _updateParticle(particle, dt, config) {
    // Apply velocity
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;

    // Apply gravity
    if (particle.gravity) {
      particle.vy -= particle.gravity * dt;
    }

    // Apply turbulence
    if (particle.turbulence) {
      particle.vx += (Math.random() - 0.5) * particle.turbulence;
      particle.vy += (Math.random() - 0.5) * particle.turbulence;
    }

    // Motion type specific updates
    switch (particle.motionType) {
      case 'explosive':
        // Slow down over time
        particle.vx *= 0.98;
        particle.vy *= 0.98;
        break;

      case 'falling':
        // Add slight wobble
        particle.vx += Math.sin(particle.age * 10) * 0.001;
        break;

      case 'wave':
        // Sinusoidal wave motion
        if (particle.waveAmplitude && particle.waveFrequency) {
          const wave = Math.sin(particle.age * particle.waveFrequency * Math.PI * 2 + particle.wavePhase);
          particle.x += wave * particle.waveAmplitude * dt;
        }
        // Gentle slowdown
        particle.vx *= 0.995;
        particle.vy *= 0.995;
        break;

      case 'drift':
        // Random direction changes
        if (Math.random() < 0.02) {
          particle.vx += (Math.random() - 0.5) * 0.01;
          particle.vy += (Math.random() - 0.5) * 0.01;
        }
        break;

      case 'sparkle':
        // Twinkle size and opacity
        {
          const flicker = 0.5 + 0.5 * Math.sin(particle.age * (particle.twinkleSpeed || 8) + (particle.twinkleOffset || 0));
          const depth = particle.twinkleDepth || 0.6;
          const jitter = particle.jitter || 0.004;
          particle.size = particle.baseSize * (1 - depth * 0.5 + flicker * depth);
          particle.opacity = particle.baseOpacity * (0.4 + flicker * 0.6);
          particle.vx += (Math.random() - 0.5) * jitter;
          particle.vy += (Math.random() - 0.5) * jitter;
        }
        break;
    }
  }

  /**
   * Trigger fusion explosion at a point
   * @param {Object} center - Explosion center { x, y }
   * @param {Object} fusionConfig - Fusion config from CONFIG.twoHand
   * @param {string} emotion - Emotion for particle colors
   */
  triggerFusion(center, fusionConfig, emotion = null) {
    const emotionConfig = this.config[emotion || this.currentEmotion];
    if (!emotionConfig) return;

    const { colors, appearance } = emotionConfig;
    const count = fusionConfig.fusionParticleCount || 500;
    const speed = fusionConfig.fusionSpeed || 0.4;

    this.pool.spawn(count, (p) => {
      // All particles spawn from fusion center
      p.x = center.x + (Math.random() - 0.5) * 0.05;
      p.y = center.y + (Math.random() - 0.5) * 0.05;
      p.z = 0;

      // Explode outward in all directions
      const angle = Math.random() * Math.PI * 2;
      const velocity = speed * (0.5 + Math.random() * 0.5);
      p.vx = Math.cos(angle) * velocity;
      p.vy = Math.sin(angle) * velocity;
      p.vz = 0;

      // Bright colors
      const primary = hexToRgb(colors.primary);
      const secondary = hexToRgb(colors.secondary);
      const colorMix = Math.random();
      p.r = primary.r + (secondary.r - primary.r) * colorMix;
      p.g = primary.g + (secondary.g - primary.g) * colorMix;
      p.b = primary.b + (secondary.b - primary.b) * colorMix;

      // Larger particles for fusion
      const baseSize = appearance.size.max * 1.5;
      p.size = baseSize * (0.5 + Math.random() * 0.5);
      p.opacity = 1.0;
      p.lifetime = fusionConfig.fusionDuration || 0.8;

      // Explosive motion type
      p.motionType = 'explosive';
      p.gravity = 0;
      p.turbulence = 0.01;
    });

    // Also push existing particles away from fusion center
    this.pool.forEach((particle) => {
      applyExplosionForce(particle, center, speed * 0.5, 0.5);
    });

    this._startFusionPulse(center, colors.primary, fusionConfig);
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      emotion: this.currentEmotion,
      ...this.pool.getStats()
    };
  }

  /**
   * Clear all particles
   */
  clear() {
    this.pool.clear();
  }

  /**
   * Cleanup
   */
  dispose() {
    this.pool.dispose();
    this.fusionRing.geometry.dispose();
    this.fusionRing.material.dispose();
    this.fusionFlash.geometry.dispose();
    this.fusionFlash.material.dispose();
  }

  _createFusionRing() {
    const geometry = new THREE.RingGeometry(0.05, 0.09, 48);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.visible = false;
    mesh.renderOrder = 5;
    return mesh;
  }

  _createFusionFlash() {
    const geometry = new THREE.CircleGeometry(0.06, 40);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.visible = false;
    mesh.renderOrder = 6;
    return mesh;
  }

  _startFusionPulse(center, colorHex, fusionConfig) {
    const duration = Math.max(0.35, Math.min(fusionConfig?.fusionDuration || 0.6, 1.2));
    this.fusionPulse.active = true;
    this.fusionPulse.age = 0;
    this.fusionPulse.duration = duration;

    this.fusionRing.material.color.setHex(colorHex);
    this.fusionFlash.material.color.setHex(colorHex);
    this.fusionRing.position.set(center.x, center.y, 0.02);
    this.fusionFlash.position.set(center.x, center.y, 0.02);
    this.fusionRing.scale.set(0.6, 0.6, 1);
    this.fusionFlash.scale.set(0.4, 0.4, 1);
    this.fusionRing.material.opacity = 0.9;
    this.fusionFlash.material.opacity = 0.7;
    this.fusionRing.visible = true;
    this.fusionFlash.visible = true;
  }

  _updateFusionPulse(deltaTime) {
    if (!this.fusionPulse.active) return;

    this.fusionPulse.age += deltaTime;
    const t = Math.min(this.fusionPulse.age / this.fusionPulse.duration, 1);
    const eased = easeOutCubic(t);
    const ringScale = 0.6 + eased * 3.2;
    const flashScale = 0.4 + eased * 1.4;
    const fade = 1 - t;

    this.fusionRing.scale.set(ringScale, ringScale, 1);
    this.fusionFlash.scale.set(flashScale, flashScale, 1);
    this.fusionRing.material.opacity = 0.9 * fade;
    this.fusionFlash.material.opacity = 0.6 * fade;

    if (t >= 1) {
      this.fusionPulse.active = false;
      this.fusionRing.visible = false;
      this.fusionFlash.visible = false;
    }
  }
}
