/**
 * Centralized emotion color utilities
 * Colors zijn geconfigureerd in config.js (particles section)
 * Dit bestand biedt helper functies om die kleuren op te halen
 */

import { hexToRgb } from './math.js';
import { CONFIG } from '../config.js';

/**
 * Get color object for an emotion/gesture from config
 * @param {string} emotion - Emotion or gesture name (e.g., 'woede', '1finger')
 * @returns {object} Color object with hex (primary), secondary, and rgb
 */
function getColorFromConfig(emotion) {
  const particleConfig = CONFIG.particles[emotion];

  if (particleConfig?.colors) {
    const hex = particleConfig.colors.primary;
    const secondary = particleConfig.colors.secondary;
    return {
      hex,
      secondary,
      get rgb() { return hexToRgb(hex); }
    };
  }

  // Fallback: wit
  return {
    hex: 0xFFFFFF,
    secondary: 0xCCCCCC,
    get rgb() { return hexToRgb(0xFFFFFF); }
  };
}

/**
 * Get color for an emotion/gesture
 * @param {string} emotion - Emotion or gesture name
 * @returns {object} Color object with hex, secondary, and rgb
 */
export function getEmotionColor(emotion) {
  return getColorFromConfig(emotion);
}

/**
 * Get normalized RGB for an emotion (for shaders/particles)
 * @param {string} emotion - Emotion or gesture name
 * @returns {{r: number, g: number, b: number}} Normalized RGB
 */
export function getEmotionRgb(emotion) {
  return getColorFromConfig(emotion).rgb;
}

/**
 * Get hex color for an emotion (for Three.js materials)
 * @param {string} emotion - Emotion or gesture name
 * @returns {number} Hex color value
 */
export function getEmotionHex(emotion) {
  return getColorFromConfig(emotion).hex;
}
