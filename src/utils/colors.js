/**
 * Centralized emotion color definitions
 * Single source of truth for all emotion-related colors
 */

import { hexToRgb } from './math.js';

/**
 * Emotion color palette
 * Each emotion has:
 * - hex: Primary hex color for Three.js materials
 * - secondary: Secondary hex for gradients/particles
 * - rgb: Normalized RGB (0-1) for shaders/interpolation
 */
export const EMOTION_COLORS = {
  woede: {
    hex: 0xFF3300,
    secondary: 0xFF6600,
    get rgb() { return hexToRgb(this.hex); }
  },
  verdriet: {
    hex: 0x0044FF,
    secondary: 0x6600FF,
    get rgb() { return hexToRgb(this.hex); }
  },
  kalmte: {
    hex: 0x00FF88,
    secondary: 0x0088FF,
    get rgb() { return hexToRgb(this.hex); }
  },
  rust: {
    hex: 0x00FF88,
    secondary: 0x0088FF,
    get rgb() { return hexToRgb(this.hex); }
  },
  power: {
    hex: 0xFF3300,
    secondary: 0xFF6600,
    get rgb() { return hexToRgb(this.hex); }
  },
  flow: {
    hex: 0x0044FF,
    secondary: 0x6600FF,
    get rgb() { return hexToRgb(this.hex); }
  },
  calm: {
    hex: 0x00FF88,
    secondary: 0x0088FF,
    get rgb() { return hexToRgb(this.hex); }
  },
  blij: {
    hex: 0xFFD700,
    secondary: 0xFF69B4,
    get rgb() { return hexToRgb(this.hex); }
  },
  bang: {
    hex: 0x9932CC,
    secondary: 0xFFFFFF,
    get rgb() { return hexToRgb(this.hex); }
  },
  neutraal: {
    hex: 0xFFFFFF,
    secondary: 0xCCCCCC,
    get rgb() { return hexToRgb(this.hex); }
  }
};

/**
 * Get color for an emotion
 * @param {string} emotion - Emotion name
 * @returns {object} Color object with hex, secondary, and rgb
 */
export function getEmotionColor(emotion) {
  return EMOTION_COLORS[emotion] || EMOTION_COLORS.neutraal;
}

/**
 * Get normalized RGB for an emotion (for shaders/particles)
 * @param {string} emotion - Emotion name
 * @returns {{r: number, g: number, b: number}} Normalized RGB
 */
export function getEmotionRgb(emotion) {
  return getEmotionColor(emotion).rgb;
}

/**
 * Get hex color for an emotion (for Three.js materials)
 * @param {string} emotion - Emotion name
 * @returns {number} Hex color value
 */
export function getEmotionHex(emotion) {
  return getEmotionColor(emotion).hex;
}
