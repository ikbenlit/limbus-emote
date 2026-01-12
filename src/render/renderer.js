/**
 * Renderer - Three.js scene setup and render loop
 */

import * as THREE from 'three';
import { logger } from '../utils/logger.js';

export class Renderer {
  constructor(config) {
    this.config = config;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.canvas = null;
  }

  /**
   * Initialize Three.js scene, camera, and renderer
   * @param {HTMLCanvasElement|string} canvas - Canvas element or selector
   */
  init(canvas) {
    // Get canvas element
    if (typeof canvas === 'string') {
      this.canvas = document.querySelector(canvas);
    } else {
      this.canvas = canvas;
    }

    if (!this.canvas) {
      throw new Error('Canvas element not found');
    }

    // Create scene
    this.scene = new THREE.Scene();

    // Create orthographic camera for 2D-style rendering
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = this.config.frustumSize || 2;

    this.camera = new THREE.OrthographicCamera(
      -frustumSize * aspect / 2,   // left
       frustumSize * aspect / 2,   // right
       frustumSize / 2,            // top
      -frustumSize / 2,            // bottom
      0.1,                         // near
      10                           // far
    );
    this.camera.position.z = this.config.cameraZ || 5;

    // Create WebGL renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,            // Not needed for particles
      alpha: true,                 // Transparent for video background
      powerPreference: 'high-performance'
    });

    // Configure renderer
    const pixelRatio = Math.min(window.devicePixelRatio, this.config.pixelRatioMax || 2);
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 0); // Transparent background

    // Handle window resize
    window.addEventListener('resize', () => this.onResize());

    logger.info('Renderer initialized:', {
      size: `${window.innerWidth}x${window.innerHeight}`,
      pixelRatio,
      frustumSize
    });

    return this;
  }

  /**
   * Handle window resize
   */
  onResize() {
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = this.config.frustumSize || 2;

    // Update camera
    this.camera.left = -frustumSize * aspect / 2;
    this.camera.right = frustumSize * aspect / 2;
    this.camera.top = frustumSize / 2;
    this.camera.bottom = -frustumSize / 2;
    this.camera.updateProjectionMatrix();

    // Update renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * Add object to scene
   * @param {THREE.Object3D} object
   */
  add(object) {
    this.scene.add(object);
  }

  /**
   * Remove object from scene
   * @param {THREE.Object3D} object
   */
  remove(object) {
    this.scene.remove(object);
  }

  /**
   * Render the scene
   */
  render() {
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Convert normalized screen coordinates (0-1) to world coordinates
   * @param {number} x - Normalized x (0 = left, 1 = right)
   * @param {number} y - Normalized y (0 = top, 1 = bottom)
   * @returns {{x: number, y: number, z: number}}
   */
  screenToWorld(x, y) {
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = this.config.frustumSize || 2;

    return {
      x: (0.5 - x) * frustumSize * aspect,  // Mirror X for webcam
      y: (0.5 - y) * frustumSize,           // Flip Y (screen Y is inverted)
      z: 0
    };
  }

  /**
   * Get renderer info for debugging
   */
  getInfo() {
    const info = this.renderer.info;
    return {
      geometries: info.memory.geometries,
      textures: info.memory.textures,
      calls: info.render.calls,
      triangles: info.render.triangles,
      points: info.render.points
    };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    window.removeEventListener('resize', this.onResize);

    this.renderer.dispose();
    this.scene.clear();

    this.renderer = null;
    this.scene = null;
    this.camera = null;
  }
}
