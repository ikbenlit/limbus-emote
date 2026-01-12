/**
 * ParticlePool - Pre-allocated particle pool with object reuse
 * Uses Float32Arrays and BufferGeometry for GPU-efficient rendering
 */

import * as THREE from 'three';
import vertexShader from '../shaders/particle.vert?raw';
import fragmentShader from '../shaders/particle.frag?raw';

export class ParticlePool {
  constructor(maxParticles = 10000) {
    this.maxParticles = maxParticles;

    // Particle state (CPU side)
    this.particles = new Array(maxParticles);

    // GPU buffers (will be synced each frame)
    this.positions = new Float32Array(maxParticles * 3);
    this.colors = new Float32Array(maxParticles * 3);
    this.sizes = new Float32Array(maxParticles);
    this.opacities = new Float32Array(maxParticles);

    // Pool management
    this.activeCount = 0;
    this.freeIndices = [];

    // Three.js objects
    this.geometry = null;
    this.material = null;
    this.mesh = null;

    this._init();
  }

  _init() {
    // Initialize all particles as inactive
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles[i] = {
        alive: false,
        index: i,
        // Position
        x: 0, y: 0, z: 0,
        // Velocity
        vx: 0, vy: 0, vz: 0,
        // Appearance
        r: 1, g: 1, b: 1,
        size: 0.05,
        opacity: 1,
        // Lifecycle
        age: 0,
        lifetime: 1,
        // Target (for morphing)
        tx: 0, ty: 0, tz: 0
      };
      this.freeIndices.push(i);

      // Initialize buffers to zero/hidden
      this.sizes[i] = 0;
      this.opacities[i] = 0;
    }

    // Create BufferGeometry
    this.geometry = new THREE.BufferGeometry();

    this.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.positions, 3)
    );
    this.geometry.setAttribute(
      'color',
      new THREE.BufferAttribute(this.colors, 3)
    );
    this.geometry.setAttribute(
      'size',
      new THREE.BufferAttribute(this.sizes, 1)
    );
    this.geometry.setAttribute(
      'opacity',
      new THREE.BufferAttribute(this.opacities, 1)
    );

    // Custom ShaderMaterial with glow effect
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true
    });

    // Create Points mesh
    this.mesh = new THREE.Points(this.geometry, this.material);
    this.mesh.frustumCulled = false; // Always render
  }

  /**
   * Spawn new particles
   * @param {number} count - Number of particles to spawn
   * @param {Function} emitFn - Function(particle) that initializes particle properties
   * @returns {number} - Actual number spawned (may be less if pool is full)
   */
  spawn(count, emitFn) {
    let spawned = 0;

    for (let i = 0; i < count && this.freeIndices.length > 0; i++) {
      const index = this.freeIndices.pop();
      const particle = this.particles[index];

      // Reset particle
      particle.alive = true;
      particle.age = 0;

      // Let emitFn configure the particle
      emitFn(particle);

      // Immediately sync to buffers
      this._syncParticleToBuffer(particle);

      this.activeCount++;
      spawned++;
    }

    return spawned;
  }

  /**
   * Update all active particles
   * @param {number} deltaTime - Time since last frame in seconds
   * @param {Function} updateFn - Function(particle, deltaTime) that updates particle
   */
  update(deltaTime, updateFn) {
    // Update shader time uniform
    this.material.uniforms.uTime.value += deltaTime;

    for (let i = 0; i < this.maxParticles; i++) {
      const particle = this.particles[i];

      if (!particle.alive) continue;

      // Update age
      particle.age += deltaTime;

      // Check lifetime
      if (particle.age >= particle.lifetime) {
        this._killParticle(particle);
        continue;
      }

      // Let updateFn modify particle
      if (updateFn) {
        updateFn(particle, deltaTime);
      }

      // Sync to GPU buffer
      this._syncParticleToBuffer(particle);
    }

    // Mark buffers as needing update
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
    this.geometry.attributes.opacity.needsUpdate = true;
  }

  /**
   * Sync a single particle's data to GPU buffers
   */
  _syncParticleToBuffer(particle) {
    const i = particle.index;
    const i3 = i * 3;

    // Position
    this.positions[i3] = particle.x;
    this.positions[i3 + 1] = particle.y;
    this.positions[i3 + 2] = particle.z;

    // Color
    this.colors[i3] = particle.r;
    this.colors[i3 + 1] = particle.g;
    this.colors[i3 + 2] = particle.b;

    // Size and opacity (fade out at end of life)
    const lifeRatio = particle.age / particle.lifetime;
    const fadeOut = lifeRatio > 0.7 ? 1 - (lifeRatio - 0.7) / 0.3 : 1;

    this.sizes[i] = particle.size;
    this.opacities[i] = particle.opacity * fadeOut;
  }

  /**
   * Kill a particle and return it to the pool
   */
  _killParticle(particle) {
    particle.alive = false;

    // Hide in buffer
    this.sizes[particle.index] = 0;
    this.opacities[particle.index] = 0;

    // Return to pool
    this.freeIndices.push(particle.index);
    this.activeCount--;
  }

  /**
   * Iterate over all active particles
   * @param {Function} fn - Function(particle) called for each active particle
   */
  forEach(fn) {
    for (let i = 0; i < this.maxParticles; i++) {
      const particle = this.particles[i];
      if (particle.alive) {
        fn(particle);
      }
    }
  }

  /**
   * Kill all particles
   */
  clear() {
    for (let i = 0; i < this.maxParticles; i++) {
      const particle = this.particles[i];
      if (particle.alive) {
        this._killParticle(particle);
      }
    }
  }

  /**
   * Get the Three.js mesh to add to scene
   */
  getMesh() {
    return this.mesh;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      active: this.activeCount,
      available: this.freeIndices.length,
      max: this.maxParticles
    };
  }

  /**
   * Cleanup resources
   */
  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}
