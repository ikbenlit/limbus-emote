/**
 * SixSevenOverlay - 6-7 meme gesture overlay
 * Shows "6" above left hand and "7" above right hand
 * when both hands are open palm
 */

export class SixSevenOverlay {
  constructor() {
    this.container = null;
    this.leftLabel = null;
    this.rightLabel = null;
    this.isVisible = false;
  }

  init() {
    // Create container
    this.container = document.createElement('div');
    this.container.className = 'six-seven-overlay';
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 100;
    `;

    // Create left label (6)
    this.leftLabel = this._createLabel('6');
    this.container.appendChild(this.leftLabel);

    // Create right label (7)
    this.rightLabel = this._createLabel('7');
    this.container.appendChild(this.rightLabel);

    document.body.appendChild(this.container);
    this.hide();

    return this;
  }

  _createLabel(text) {
    const label = document.createElement('div');
    label.textContent = text;
    label.style.cssText = `
      position: absolute;
      font-family: 'Arial Black', 'Impact', sans-serif;
      font-size: 120px;
      font-weight: 900;
      color: #fff;
      text-shadow:
        0 0 20px rgba(255, 255, 255, 0.8),
        0 0 40px rgba(100, 200, 255, 0.6),
        0 0 60px rgba(100, 200, 255, 0.4),
        4px 4px 0 rgba(0, 0, 0, 0.3);
      transform: translate(-50%, -100%);
      transition: opacity 0.15s ease-out;
      opacity: 0;
      user-select: none;
    `;
    return label;
  }

  /**
   * Update overlay with hand positions
   * @param {Object} sixSevenState - { active, leftPos, rightPos }
   * @param {Object} renderer - Renderer for world-to-screen conversion
   */
  update(sixSevenState, renderer) {
    if (!sixSevenState.active) {
      this.hide();
      return;
    }

    const { leftPos, rightPos } = sixSevenState;

    if (leftPos && rightPos) {
      // Convert world positions to screen coordinates
      // Note: MediaPipe handedness is from camera perspective, so we swap
      // to match user's view (mirrored webcam)
      const leftScreen = renderer.worldToScreen(leftPos.x, leftPos.y);
      const rightScreen = renderer.worldToScreen(rightPos.x, rightPos.y);

      // Position labels above hands (offset upward)
      const offsetY = 60; // pixels above hand

      // "6" boven de rechterhand van de gebruiker (MediaPipe "left"), "7" boven de linkerhand van de gebruiker (MediaPipe "right")
      this.leftLabel.style.left = `${leftScreen.x}px`;
      this.leftLabel.style.top = `${leftScreen.y - offsetY}px`;

      this.rightLabel.style.left = `${rightScreen.x}px`;
      this.rightLabel.style.top = `${rightScreen.y - offsetY}px`;

      this.show();
    } else {
      this.hide();
    }
  }

  show() {
    if (!this.isVisible) {
      this.isVisible = true;
      this.leftLabel.style.opacity = '1';
      this.rightLabel.style.opacity = '1';
    }
  }

  hide() {
    if (this.isVisible) {
      this.isVisible = false;
      this.leftLabel.style.opacity = '0';
      this.rightLabel.style.opacity = '0';
    }
  }

  dispose() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
