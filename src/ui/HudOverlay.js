/**
 * HudOverlay - Sci-Fi style HUD for Limbus
 * Shows system status, particle count, and hand gesture states
 */

export class HudOverlay {
  constructor() {
    this.container = null;
    
    // System status elements (top-left)
    this.systemStatus = null;
    this.statusValue = null;
    this.particleCount = null;
    this.fpsValue = null;
    
    // Left hand elements (bottom-left)
    this.leftPanel = null;
    this.leftMode = null;
    
    // Right hand elements (bottom-right)
    this.rightPanel = null;
    this.rightMode = null;
    
    this.isVisible = true;
  }

  /**
   * Initialize HUD - create DOM elements
   */
  init() {
    // Create main container
    this.container = document.createElement('div');
    this.container.className = 'hud-overlay';
    
    // Create System Status panel (top-left)
    this._createSystemPanel();
    
    // Create Left Hand panel (bottom-left)
    this._createLeftPanel();
    
    // Create Right Hand panel (bottom-right)
    this._createRightPanel();
    
    document.body.appendChild(this.container);
    
    return this;
  }

  /**
   * Create system status panel (top-left)
   * @private
   */
  _createSystemPanel() {
    const panel = document.createElement('div');
    panel.className = 'hud-panel hud-system';
    
    panel.innerHTML = `
      <div class="hud-label">SYSTEM STATUS</div>
      <div class="hud-value hud-status">OFFLINE</div>
      <div class="hud-spacer"></div>
      <div class="hud-label">PARTICLES</div>
      <div class="hud-value hud-particles"><span class="hud-number">0</span> <span class="hud-unit">UNITS</span></div>
      <div class="hud-spacer"></div>
      <div class="hud-row">
        <span class="hud-label-inline">FPS:</span>
        <span class="hud-value-inline hud-fps">60</span>
      </div>
    `;
    
    this.container.appendChild(panel);
    
    // Store references
    this.statusValue = panel.querySelector('.hud-status');
    this.particleCount = panel.querySelector('.hud-number');
    this.fpsValue = panel.querySelector('.hud-fps');
  }

  /**
   * Create left hand panel (bottom-left)
   * @private
   */
  _createLeftPanel() {
    const panel = document.createElement('div');
    panel.className = 'hud-panel hud-left-hand';
    
    panel.innerHTML = `
      <div class="hud-label">LEFT HAND [COMMAND]</div>
      <div class="hud-mode">MODE: <span class="hud-mode-value">STANDBY</span></div>
      <div class="hud-subtitle">GESTURE CONTROL</div>
    `;
    
    this.container.appendChild(panel);
    this.leftPanel = panel;
    this.leftMode = panel.querySelector('.hud-mode-value');
  }

  /**
   * Create right hand panel (bottom-right)
   * @private
   */
  _createRightPanel() {
    const panel = document.createElement('div');
    panel.className = 'hud-panel hud-right-hand';
    
    panel.innerHTML = `
      <div class="hud-label">RIGHT HAND [SOURCE]</div>
      <div class="hud-mode">MODE: <span class="hud-mode-value">STANDBY</span></div>
      <div class="hud-subtitle">EMOTION FIELD</div>
    `;
    
    this.container.appendChild(panel);
    this.rightPanel = panel;
    this.rightMode = panel.querySelector('.hud-mode-value');
  }

  /**
   * Update HUD with current stats
   * @param {Object} stats - Current status data
   * @param {number} stats.handsDetected - Number of hands detected
   * @param {number} stats.particleCount - Active particle count
   * @param {number} stats.fps - Current FPS
   * @param {string} stats.leftMode - Left hand mode (STANDBY, CATCH, EXPLODE, IMPLODE)
   * @param {string} stats.rightMode - Right hand mode (STANDBY, BOOS, BLIJ, BANG, SPHERE)
   */
  update(stats) {
    // System status
    if (stats.handsDetected !== undefined) {
      const isOnline = stats.handsDetected > 0;
      this.statusValue.textContent = isOnline ? 'ONLINE' : 'OFFLINE';
      this.statusValue.classList.toggle('online', isOnline);
      this.statusValue.classList.toggle('offline', !isOnline);
    }
    
    // Particle count
    if (stats.particleCount !== undefined) {
      this.particleCount.textContent = stats.particleCount.toLocaleString();
    }
    
    // FPS
    if (stats.fps !== undefined) {
      this.fpsValue.textContent = Math.round(stats.fps);
    }
    
    // Left hand mode
    if (stats.leftMode !== undefined) {
      this.leftMode.textContent = stats.leftMode;
      this._updateModeClass(this.leftMode, stats.leftMode);
    }
    
    // Right hand mode
    if (stats.rightMode !== undefined) {
      this.rightMode.textContent = stats.rightMode;
      this._updateModeClass(this.rightMode, stats.rightMode);
    }
    
    // Panel visibility based on hand detection
    if (stats.leftDetected !== undefined) {
      this.leftPanel.classList.toggle('active', stats.leftDetected);
    }
    if (stats.rightDetected !== undefined) {
      this.rightPanel.classList.toggle('active', stats.rightDetected);
    }
  }

  /**
   * Update mode element class based on value
   * @private
   */
  _updateModeClass(element, mode) {
    // Remove all mode classes
    element.classList.remove('mode-standby', 'mode-active', 'mode-action');
    
    // Add appropriate class
    if (mode === 'STANDBY' || mode === 'IDLE') {
      element.classList.add('mode-standby');
    } else if (mode === 'EXPLODE' || mode === 'IMPLODE' || mode === 'CATCH') {
      element.classList.add('mode-action');
    } else {
      element.classList.add('mode-active');
    }
  }

  /**
   * Show the HUD
   */
  show() {
    this.isVisible = true;
    this.container.style.display = 'block';
  }

  /**
   * Hide the HUD
   */
  hide() {
    this.isVisible = false;
    this.container.style.display = 'none';
  }

  /**
   * Cleanup
   */
  dispose() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
