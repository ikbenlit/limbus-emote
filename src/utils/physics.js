/**
 * Physics utilities for particle interactions
 *
 * DRY: Reusable physics functions, not tied to specific particle systems.
 */

/**
 * Apply magnetic attraction force to a particle
 * Modifies particle velocity in-place
 *
 * @param {Object} particle - Particle with x, y, vx, vy properties
 * @param {Object} magnetPos - Magnet position { x, y }
 * @param {Object} config - { magnetRadius, magnetStrength, magnetFalloff }
 * @returns {boolean} True if particle is within magnet radius
 */
export function applyMagnetForce(particle, magnetPos, config) {
  if (!magnetPos) return false;

  const dx = magnetPos.x - particle.x;
  const dy = magnetPos.y - particle.y;
  const distSq = dx * dx + dy * dy;
  const dist = Math.sqrt(distSq);

  // Outside magnet radius
  if (dist > config.magnetRadius) {
    return false;
  }

  // Avoid division by zero
  if (dist < 0.001) {
    return true;
  }

  // Calculate force based on falloff type
  let force;
  const normalizedDist = dist / config.magnetRadius;

  switch (config.magnetFalloff) {
    case 'linear':
      // Force decreases linearly with distance
      force = config.magnetStrength * (1 - normalizedDist);
      break;

    case 'exponential':
      // Force decreases exponentially
      force = config.magnetStrength * Math.exp(-normalizedDist * 3);
      break;

    case 'inverse':
    default:
      // Force follows inverse square (clamped)
      force = config.magnetStrength / (dist * 10 + 0.1);
      break;
  }

  // Apply force as velocity change (normalized direction * force)
  const invDist = 1 / dist;
  particle.vx += dx * invDist * force * 0.016; // Assuming ~60fps
  particle.vy += dy * invDist * force * 0.016;

  return true;
}

/**
 * Apply explosion force from a point
 * Pushes particles away from the center
 *
 * @param {Object} particle - Particle with x, y, vx, vy properties
 * @param {Object} center - Explosion center { x, y }
 * @param {number} strength - Explosion force
 * @param {number} radius - Maximum effect radius
 * @returns {boolean} True if particle was affected
 */
export function applyExplosionForce(particle, center, strength, radius) {
  if (!center) return false;

  const dx = particle.x - center.x;
  const dy = particle.y - center.y;
  const distSq = dx * dx + dy * dy;
  const dist = Math.sqrt(distSq);

  // Outside explosion radius
  if (dist > radius) {
    return false;
  }

  // Avoid division by zero (particles at center get max force)
  if (dist < 0.001) {
    // Random direction for particles at center
    const angle = Math.random() * Math.PI * 2;
    particle.vx += Math.cos(angle) * strength;
    particle.vy += Math.sin(angle) * strength;
    return true;
  }

  // Force decreases with distance
  const normalizedDist = dist / radius;
  const force = strength * (1 - normalizedDist);

  // Apply force away from center
  const invDist = 1 / dist;
  particle.vx += dx * invDist * force;
  particle.vy += dy * invDist * force;

  return true;
}

/**
 * Check if a particle is close enough to be "caught"
 *
 * @param {Object} particle - Particle with x, y properties
 * @param {Object} targetPos - Target position { x, y }
 * @param {number} catchRadius - Distance to consider caught
 * @returns {boolean} True if particle is caught
 */
export function isParticleCaught(particle, targetPos, catchRadius = 0.05) {
  if (!targetPos) return false;

  const dx = targetPos.x - particle.x;
  const dy = targetPos.y - particle.y;
  const distSq = dx * dx + dy * dy;

  return distSq < catchRadius * catchRadius;
}

/**
 * Interpolate between two positions
 *
 * @param {Object} from - Start position { x, y }
 * @param {Object} to - End position { x, y }
 * @param {number} t - Interpolation factor (0-1)
 * @returns {Object} Interpolated position { x, y }
 */
export function lerpPosition(from, to, t) {
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t
  };
}
