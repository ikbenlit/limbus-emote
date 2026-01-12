/**
 * TextSampler - Converts text to particle positions
 * Uses an offscreen canvas to sample text pixels
 */

export class TextSampler {
  constructor(config) {
    this.config = config;
    this.canvas = null;
    this.ctx = null;
    this.cache = new Map(); // Cache sampled positions per text

    this._init();
  }

  _init() {
    // Create offscreen canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.config.canvasSize[0];
    this.canvas.height = this.config.canvasSize[1];

    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
  }

  /**
   * Sample text and return array of normalized positions
   * @param {string} text - Text to sample
   * @returns {Array<{x: number, y: number}>} - Array of positions (centered at 0,0)
   */
  sample(text) {
    if (!text) return [];

    // Check cache
    if (this.cache.has(text)) {
      return this.cache.get(text);
    }

    const positions = this._sampleText(text);
    this.cache.set(text, positions);

    return positions;
  }

  /**
   * Sample text pixels from canvas
   * @private
   */
  _sampleText(text) {
    const { canvas, ctx, config } = this;
    const { sampleRate, alphaThreshold, particleScale } = config;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Configure text rendering
    ctx.fillStyle = 'white';
    ctx.font = config.font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw text centered
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    // Get pixel data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    // Sample positions
    const positions = [];
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    for (let y = 0; y < canvas.height; y += sampleRate) {
      for (let x = 0; x < canvas.width; x += sampleRate) {
        const idx = (y * canvas.width + x) * 4;
        const alpha = pixels[idx + 3]; // Alpha channel

        if (alpha > alphaThreshold) {
          // Convert to centered, scaled coordinates
          positions.push({
            x: (x - centerX) * particleScale,
            y: (centerY - y) * particleScale // Flip Y for WebGL
          });
        }
      }
    }

    return positions;
  }

  /**
   * Get positions with random offset for variation
   * @param {string} text - Text to sample
   * @param {number} jitter - Amount of random offset (0-1)
   * @returns {Array<{x: number, y: number}>}
   */
  sampleWithJitter(text, jitter = 0.1) {
    const positions = this.sample(text);
    const scale = this.config.particleScale * this.config.sampleRate;

    return positions.map(pos => ({
      x: pos.x + (Math.random() - 0.5) * jitter * scale,
      y: pos.y + (Math.random() - 0.5) * jitter * scale
    }));
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get debug canvas (for visualization)
   */
  getDebugCanvas() {
    return this.canvas;
  }
}
