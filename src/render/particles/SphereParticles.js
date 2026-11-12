/**
 * SphereParticles - Energy ball effect for open right hand
 * Features:
 * - Inner particles (volume fill)
 * - Outer shell particles (sphere surface)
 * - Aura ring (pulsing outer glow)
 * - Wobble motion for organic feel
 */

import * as THREE from 'three';
import { initParticleAttributes, markAttributesDirty } from '../../utils/bufferHelpers.js';

export class SphereParticles {
  constructor(config) {
    this.config = config;

    // Particle counts
    const shellCount = config.shell?.enabled ? (config.shell.particles || 2000) : 0;
    const auraCount = config.aura?.enabled ? (config.aura.particles || 300) : 0;
    this.maxParticles = (config.maxCount || 2500) + shellCount + auraCount;
    this.coreCount = config.maxCount || 2500;
    this.shellCount = shellCount;
    this.auraCount = auraCount;

    // Particle data
    this.particles = [];
    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);
    this.sizes = new Float32Array(this.maxParticles);
    this.opacities = new Float32Array(this.maxParticles);

    // Three.js objects
    this.geometry = null;
    this.material = null;
    this.points = null;

    // State
    this.isVisible = false;
    this.opacity = 0;
    this.time = 0;
    this.centerPos = { x: 0, y: 0 };
    
    // Formation animation state
    this.formationProgress = 0;
    this.formationDuration = config.formationDuration || 0.6; // Seconds to form
  }

  /**
   * Initialize Three.js objects
   */
  init() {
    const radius = this.config.radius || 0.35;
    const innerRadius = this.config.innerRadius || 0.15;
    const primaryColor = new THREE.Color(this.config.colors?.primary || 0xFFD700);
    const secondaryColor = new THREE.Color(this.config.colors?.secondary || 0xFFA500);
    const auraColor = new THREE.Color(this.config.colors?.aura || 0xFFAA00);

    // Generate all particles
    this._generateParticles(radius, innerRadius, primaryColor, secondaryColor, auraColor);

    // Create geometry
    this.geometry = new THREE.BufferGeometry();
    initParticleAttributes(this.geometry, this.positions, this.colors, this.sizes, this.opacities);

    // Custom ShaderMaterial for glowing particles
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

          gl_PointSize = size * uPixelRatio * 350.0;
        }
      `,
      fragmentShader: `
        precision mediump float;

        varying vec3 vColor;
        varying float vOpacity;

        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center) * 2.0;

          // Intense glow with soft falloff
          float alpha = 1.0 - smoothstep(0.3, 1.0, dist);
          float glow = exp(-dist * 2.0) * 1.2;

          if (alpha < 0.01) discard;

          // Boost color intensity
          vec3 boostedColor = vColor * (1.0 + glow * 0.8);
          gl_FragColor = vec4(boostedColor, alpha * vOpacity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    this.points.renderOrder = 90;

    return this;
  }

  /**
   * Generate all particle types
   * @private
   */
  _generateParticles(radius, innerRadius, primaryColor, secondaryColor, auraColor) {
    const particleSize = this.config.particleSize || 0.018;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    // 1. INNER PARTICLES (volume fill) - 30% of core
    const innerCount = Math.floor(this.coreCount * 0.3);
    for (let i = 0; i < innerCount; i++) {
      // Random position within sphere volume
      const r = innerRadius * Math.cbrt(Math.random()); // Cube root for uniform volume distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const tx = Math.sin(phi) * Math.cos(theta) * r;
      const ty = Math.sin(phi) * Math.sin(theta) * r;
      const tz = Math.cos(phi) * r;

      // Brighter color for inner particles
      const brightness = 0.8 + Math.random() * 0.4;

      this.particles.push({
        type: 'inner',
        tx, ty, tz,
        phase: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        phaseZ: Math.random() * Math.PI * 2,
        r: Math.min(1, primaryColor.r * brightness),
        g: Math.min(1, primaryColor.g * brightness),
        b: Math.min(1, primaryColor.b * brightness),
        size: particleSize * (0.6 + Math.random() * 0.5),
        baseOpacity: 0.7 + Math.random() * 0.3
      });
    }

    // 2. SHELL PARTICLES (sphere surface) - 70% of core
    const shellCount = this.coreCount - innerCount;
    for (let i = 0; i < shellCount; i++) {
      // Fibonacci sphere distribution for even surface coverage
      const y = 1 - (i / (shellCount - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = goldenAngle * i;

      const tx = Math.cos(theta) * radiusAtY * radius;
      const ty = y * radius;
      const tz = Math.sin(theta) * radiusAtY * radius;

      // Color gradient based on position
      const colorMix = (y + 1) / 2;
      const r = primaryColor.r * colorMix + secondaryColor.r * (1 - colorMix);
      const g = primaryColor.g * colorMix + secondaryColor.g * (1 - colorMix);
      const b = primaryColor.b * colorMix + secondaryColor.b * (1 - colorMix);

      this.particles.push({
        type: 'shell',
        tx, ty, tz,
        phase: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        phaseZ: Math.random() * Math.PI * 2,
        r, g, b,
        size: particleSize * (0.8 + Math.random() * 0.4),
        baseOpacity: 0.85 + Math.random() * 0.15
      });
    }

    // 3. EDGE PARTICLES (tight outer shell - strakke buitenrand)
    if (this.config.shell?.enabled) {
      const shellThickness = this.config.shell.thickness || 0.04;
      const shellBrightness = this.config.shell.brightness || 1.5;

      for (let i = 0; i < this.shellCount; i++) {
        // Fibonacci sphere for perfect distribution on exact radius
        const y = 1 - (i / (this.shellCount - 1)) * 2;
        const radiusAtY = Math.sqrt(1 - y * y);
        const theta = goldenAngle * i * 1.1; // Slight offset from fill particles

        // Position exactly on radius with very small variation
        const edgeRadius = radius + (Math.random() - 0.5) * shellThickness;
        const tx = Math.cos(theta) * radiusAtY * edgeRadius;
        const ty = y * edgeRadius;
        const tz = Math.sin(theta) * radiusAtY * edgeRadius;

        // Bright edge color
        const brightness = shellBrightness * (0.9 + Math.random() * 0.2);

        this.particles.push({
          type: 'edge',
          tx, ty, tz,
          phase: Math.random() * Math.PI * 2,
          phaseY: Math.random() * Math.PI * 2,
          phaseZ: Math.random() * Math.PI * 2,
          r: Math.min(1, primaryColor.r * brightness),
          g: Math.min(1, primaryColor.g * brightness),
          b: Math.min(1, primaryColor.b * brightness),
          size: particleSize * (0.7 + Math.random() * 0.3), // Smaller, tighter
          baseOpacity: 0.95 + Math.random() * 0.05 // Very opaque for sharp edge
        });
      }
    }

    // 4. AURA PARTICLES (outer glowing ring)
    if (this.config.aura?.enabled) {
      const auraThickness = this.config.aura.thickness || 0.06;
      const auraOpacity = this.config.aura.opacity || 0.6;

      for (let i = 0; i < this.auraCount; i++) {
        // Position on outer edge with some variation
        const auraRadius = radius + auraThickness * (0.5 + Math.random() * 0.5);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        const tx = Math.sin(phi) * Math.cos(theta) * auraRadius;
        const ty = Math.sin(phi) * Math.sin(theta) * auraRadius;
        const tz = Math.cos(phi) * auraRadius;

        this.particles.push({
          type: 'aura',
          tx, ty, tz,
          phase: Math.random() * Math.PI * 2,
          phaseY: Math.random() * Math.PI * 2,
          phaseZ: Math.random() * Math.PI * 2,
          r: auraColor.r,
          g: auraColor.g,
          b: auraColor.b,
          size: particleSize * (1.2 + Math.random() * 0.8), // Larger for aura
          baseOpacity: auraOpacity * (0.5 + Math.random() * 0.5)
        });
      }
    }

    // Initialize buffers (off-screen)
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const i3 = i * 3;
      this.positions[i3] = -9999;
      this.positions[i3 + 1] = -9999;
      this.positions[i3 + 2] = -9999;
      this.colors[i3] = p.r;
      this.colors[i3 + 1] = p.g;
      this.colors[i3 + 2] = p.b;
      this.sizes[i] = 0;
      this.opacities[i] = 0;
    }
  }

  /**
   * Get the Three.js points object
   */
  getMesh() {
    return this.points;
  }

  /**
   * Show the sphere at position
   */
  show(centerPos) {
    const wasVisible = this.isVisible;
    
    if (centerPos) {
      this.centerPos.x = centerPos.x;
      this.centerPos.y = centerPos.y;
    }
    
    // Reset formation when first showing
    if (!wasVisible) {
      this.formationProgress = 0;
      this._initStartPositions();
    }
    
    this.isVisible = true;
  }
  
  /**
   * Initialize random start positions for formation animation
   */
  _initStartPositions() {
    const spreadRadius = this.config.formationSpread || 1.5; // How far particles start
    
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      
      // Random starting position in a larger sphere around center
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = spreadRadius * (0.3 + Math.random() * 0.7);
      
      p.sx = Math.sin(phi) * Math.cos(theta) * r;
      p.sy = Math.sin(phi) * Math.sin(theta) * r;
      p.sz = Math.cos(phi) * r * 0.1; // Flatten Z like the target
      
      // Random delay for staggered formation (0 to 0.4 of duration)
      p.formationDelay = Math.random() * 0.4;
    }
  }

  /**
   * Hide the sphere
   */
  hide() {
    this.isVisible = false;
  }

  /**
   * Check if sphere is currently active
   */
  isActive() {
    return this.isVisible || this.opacity > 0;
  }

  /**
   * Update particles
   */
  update(deltaTime, centerPos) {
    this.time += deltaTime;

    // Update center position (met float offset boven de hand)
    const floatOffset = this.config.floatOffset || 0;
    if (centerPos) {
      this.centerPos.x = centerPos.x;
      this.centerPos.y = centerPos.y + floatOffset;
    }

    // Fade in/out
    const fadeInDuration = this.config.fadeInDuration || 0.4;
    const fadeOutDuration = this.config.fadeOutDuration || 0.25;

    if (this.isVisible) {
      this.opacity = Math.min(1, this.opacity + deltaTime / fadeInDuration);
      // Progress formation animation
      this.formationProgress = Math.min(1, this.formationProgress + deltaTime / this.formationDuration);
    } else {
      this.opacity = Math.max(0, this.opacity - deltaTime / fadeOutDuration);
    }

    // Skip update if fully invisible
    if (this.opacity <= 0) {
      return;
    }

    // Wobble parameters
    const wobbleSpeed = this.config.wobble?.speed || 3;
    const wobbleAmplitude = this.config.wobble?.amplitude || 0.025;
    const auraPulseSpeed = this.config.aura?.pulseSpeed || 2;

    // Update each particle
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Type-specific wobble
      let wobbleX, wobbleY, wobbleZ;
      let sizeMultiplier = 1;
      let opacityMultiplier = 1;

      if (p.type === 'inner') {
        // Inner particles: more chaotic movement
        wobbleX = Math.sin(this.time * wobbleSpeed * 1.5 + p.phase) * wobbleAmplitude * 1.5;
        wobbleY = Math.cos(this.time * wobbleSpeed * 1.8 + p.phaseY) * wobbleAmplitude * 1.5;
        wobbleZ = Math.sin(this.time * wobbleSpeed * 1.2 + p.phaseZ) * wobbleAmplitude * 1.5;
        // Twinkle effect
        sizeMultiplier = 0.8 + Math.sin(this.time * 4 + p.phase) * 0.3;
      } else if (p.type === 'aura') {
        // Aura particles: pulsing outward
        const pulse = Math.sin(this.time * auraPulseSpeed + p.phase) * 0.5 + 0.5;
        wobbleX = Math.sin(this.time * wobbleSpeed * 0.7 + p.phase) * wobbleAmplitude * 2 * pulse;
        wobbleY = Math.cos(this.time * wobbleSpeed * 0.5 + p.phaseY) * wobbleAmplitude * 2 * pulse;
        wobbleZ = Math.sin(this.time * wobbleSpeed * 0.6 + p.phaseZ) * wobbleAmplitude * 2 * pulse;
        // Pulsing opacity and size
        opacityMultiplier = 0.6 + pulse * 0.4;
        sizeMultiplier = 0.8 + pulse * 0.4;
      } else {
        // Shell particles: gentle wobble
        wobbleX = Math.sin(this.time * wobbleSpeed + p.phase) * wobbleAmplitude;
        wobbleY = Math.cos(this.time * wobbleSpeed * 1.3 + p.phaseY) * wobbleAmplitude;
        wobbleZ = Math.sin(this.time * wobbleSpeed * 0.7 + p.phaseZ) * wobbleAmplitude;
        // Subtle size pulse
        sizeMultiplier = 1 + Math.sin(this.time * 2 + p.phase) * 0.1;
      }

      // Calculate formation progress for this particle (with individual delay)
      const particleDelay = p.formationDelay || 0;
      const adjustedProgress = Math.max(0, (this.formationProgress - particleDelay) / (1 - particleDelay));
      // Smooth easing function (ease out cubic)
      const t = 1 - Math.pow(1 - Math.min(1, adjustedProgress), 3);
      
      // Interpolate from start to target position
      const sx = p.sx || 0;
      const sy = p.sy || 0;
      const sz = p.sz || 0;
      const currentX = sx + (p.tx - sx) * t;
      const currentY = sy + (p.ty - sy) * t;
      const currentZ = sz + (p.tz * 0.1 - sz) * t;
      
      // Position = center + interpolated position + wobble
      const i3 = i * 3;
      this.positions[i3] = this.centerPos.x + currentX + wobbleX * t;
      this.positions[i3 + 1] = this.centerPos.y + currentY + wobbleY * t;
      this.positions[i3 + 2] = currentZ + wobbleZ * t;

      // Size and opacity (scale with formation progress)
      const formationOpacity = Math.min(1, t * 1.5); // Fade in as particle approaches target
      this.sizes[i] = p.size * sizeMultiplier * (0.3 + t * 0.7); // Start smaller, grow to full size
      this.opacities[i] = this.opacity * p.baseOpacity * opacityMultiplier * formationOpacity;
    }

    // Mark buffers dirty
    markAttributesDirty(this.geometry);
  }

  /**
   * Cleanup resources
   */
  /**
   * Get statistics
   */
  getStats() {
    // All particles are active when visible
    const active = this.isVisible ? this.maxParticles : 0;
    return { active, max: this.maxParticles };
  }

  dispose() {
    if (this.geometry) this.geometry.dispose();
    if (this.material) this.material.dispose();
  }
}
