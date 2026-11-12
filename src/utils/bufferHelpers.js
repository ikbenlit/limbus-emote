/**
 * Buffer helper utilities for Three.js particle systems
 * Reduces repetition in buffer attribute setup and updates
 */

import * as THREE from 'three';

/**
 * Initialize standard particle attributes on a BufferGeometry
 * @param {THREE.BufferGeometry} geometry - The geometry to setup
 * @param {Float32Array} positions - Position buffer (xyz * count)
 * @param {Float32Array} colors - Color buffer (rgb * count)
 * @param {Float32Array} sizes - Size buffer (count)
 * @param {Float32Array} opacities - Opacity buffer (count)
 */
export function initParticleAttributes(geometry, positions, colors, sizes, opacities) {
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
}

/**
 * Mark all particle attributes as needing GPU update
 * @param {THREE.BufferGeometry} geometry - The geometry to mark dirty
 */
export function markAttributesDirty(geometry) {
  geometry.attributes.position.needsUpdate = true;
  geometry.attributes.color.needsUpdate = true;
  geometry.attributes.size.needsUpdate = true;
  geometry.attributes.opacity.needsUpdate = true;
}

/**
 * Write a vec3 (x, y, z) to a Float32Array at the given index
 * @param {Float32Array} array - Target array
 * @param {number} index - Particle index (will be multiplied by 3)
 * @param {number} x - X component
 * @param {number} y - Y component
 * @param {number} z - Z component
 */
export function setVec3(array, index, x, y, z) {
  const i3 = index * 3;
  array[i3] = x;
  array[i3 + 1] = y;
  array[i3 + 2] = z;
}
