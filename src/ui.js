/**
 * UI - User interface state management
 * Handles loading, permission, and error states
 */

export class UI {
  constructor() {
    this.overlay = null;
    this.currentState = null;
  }

  /**
   * Initialize UI - find or create overlay element
   */
  init() {
    this.overlay = document.querySelector('.ui-overlay');
    if (!this.overlay) {
      this.overlay = document.createElement('div');
      this.overlay.className = 'ui-overlay';
      document.getElementById('app').appendChild(this.overlay);
    }
    return this;
  }

  /**
   * Show loading state
   * @param {string} message - Loading message to display
   */
  showLoading(message = 'Laden...') {
    this.currentState = 'loading';
    this.overlay.innerHTML = `
      <div class="loading">
        <h1>Limbus</h1>
        <div class="spinner"></div>
        <p>${message}</p>
      </div>
    `;
    this.overlay.style.display = 'flex';
  }

  /**
   * Show permission request state
   */
  showPermissionRequest() {
    this.currentState = 'permission-request';
    this.overlay.innerHTML = `
      <div class="permission-request">
        <h1>Limbus</h1>
        <div class="camera-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </div>
        <p>Camera toegang nodig voor hand tracking</p>
        <p class="hint">Klik op 'Toestaan' in de browser popup</p>
      </div>
    `;
    this.overlay.style.display = 'flex';
  }

  /**
   * Show permission denied state with retry button
   * @param {string} message - Error message
   * @param {Function} onRetry - Callback when retry is clicked
   */
  showPermissionDenied(message, onRetry) {
    this.currentState = 'permission-denied';
    this.overlay.innerHTML = `
      <div class="permission-denied">
        <div class="error-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <h1>Camera niet beschikbaar</h1>
        <p>${message}</p>
        <button class="retry-button">Opnieuw proberen</button>
        <p class="hint">Tip: Controleer je browser instellingen voor camera toegang</p>
      </div>
    `;
    this.overlay.style.display = 'flex';

    // Attach retry handler
    const retryButton = this.overlay.querySelector('.retry-button');
    if (retryButton && onRetry) {
      retryButton.addEventListener('click', onRetry);
    }
  }

  /**
   * Show error state
   * @param {string} message - Error message
   * @param {Function} onRetry - Optional callback for retry
   */
  showError(message, onRetry = null) {
    this.currentState = 'error';
    this.overlay.innerHTML = `
      <div class="error-state">
        <div class="error-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h1>Er ging iets mis</h1>
        <p>${message}</p>
        ${onRetry ? '<button class="retry-button">Opnieuw proberen</button>' : ''}
      </div>
    `;
    this.overlay.style.display = 'flex';

    if (onRetry) {
      const retryButton = this.overlay.querySelector('.retry-button');
      if (retryButton) {
        retryButton.addEventListener('click', onRetry);
      }
    }
  }

  /**
   * Show brief hint message (auto-hides)
   * @param {string} message - Hint message
   * @param {number} duration - Duration in ms
   */
  showHint(message, duration = 3000) {
    // Create hint element if not in error/loading state
    const hint = document.createElement('div');
    hint.className = 'hint-toast';
    hint.textContent = message;
    document.getElementById('app').appendChild(hint);

    // Animate in
    requestAnimationFrame(() => {
      hint.classList.add('visible');
    });

    // Remove after duration
    setTimeout(() => {
      hint.classList.remove('visible');
      setTimeout(() => hint.remove(), 300);
    }, duration);
  }

  /**
   * Hide overlay - show main canvas
   */
  hide() {
    this.currentState = 'hidden';
    this.overlay.style.display = 'none';
    this.overlay.innerHTML = '';
  }

  /**
   * Check if UI is currently showing
   */
  get isVisible() {
    return this.overlay && this.overlay.style.display !== 'none';
  }
}
