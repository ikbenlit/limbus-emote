/**
 * Webcam - Camera access and permission handling
 */

import { logger } from '../utils/logger.js';

export class Webcam {
  constructor() {
    this.video = null;
    this.stream = null;
    this.state = 'idle'; // idle | requesting | active | denied | error
    this.error = null;
  }

  /**
   * Request camera access and initialize video element
   * @returns {Promise<HTMLVideoElement>}
   */
  async start() {
    if (this.state === 'active' && this.video) {
      return this.video;
    }

    this.state = 'requesting';
    this.error = null;

    try {
      // Request camera access
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: false
      });

      // Create video element
      this.video = document.createElement('video');
      this.video.srcObject = this.stream;
      this.video.setAttribute('playsinline', ''); // Required for iOS
      this.video.setAttribute('autoplay', '');
      this.video.muted = true;
      this.video.id = 'webcam-video';

      // Style video as fullscreen background (mirrored)
      this.video.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        object-fit: cover;
        transform: scaleX(-1);
        z-index: 0;
      `;

      // Add to DOM as background (inside #app, before canvas)
      const app = document.getElementById('app');
      const canvas = document.getElementById('canvas');
      if (app && canvas) {
        app.insertBefore(this.video, canvas);
      } else {
        document.body.prepend(this.video);
      }

      // Wait for video to be ready
      await new Promise((resolve, reject) => {
        this.video.onloadedmetadata = () => {
          this.video.play()
            .then(resolve)
            .catch(reject);
        };
        this.video.onerror = () => reject(new Error('Video element error'));
      });

      // Wait for actual video data
      await this._waitForVideoReady();

      this.state = 'active';
      logger.info(`Webcam active: ${this.video.videoWidth}x${this.video.videoHeight}`);

      return this.video;

    } catch (err) {
      this._handleError(err);
      throw err;
    }
  }

  /**
   * Wait until video has actual frame data
   * @private
   */
  _waitForVideoReady() {
    return new Promise((resolve) => {
      const checkReady = () => {
        if (this.video.readyState >= 3) { // HAVE_FUTURE_DATA
          resolve();
        } else {
          requestAnimationFrame(checkReady);
        }
      };
      checkReady();
    });
  }

  /**
   * Handle errors and set appropriate state
   * @private
   */
  _handleError(err) {
    logger.error('Webcam error:', err);

    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      this.state = 'denied';
      this.error = 'Camera toegang geweigerd. Sta camera toe in je browser instellingen.';
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      this.state = 'error';
      this.error = 'Geen camera gevonden. Sluit een webcam aan.';
    } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      this.state = 'error';
      this.error = 'Camera is in gebruik door een andere applicatie.';
    } else if (err.name === 'OverconstrainedError') {
      this.state = 'error';
      this.error = 'Camera ondersteunt de gevraagde resolutie niet.';
    } else {
      this.state = 'error';
      this.error = `Camera fout: ${err.message || 'Onbekende fout'}`;
    }
  }

  /**
   * Stop camera stream
   */
  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
      });
      this.stream = null;
    }

    if (this.video) {
      this.video.srcObject = null;
      if (this.video.parentNode) {
        this.video.parentNode.removeChild(this.video);
      }
      this.video = null;
    }

    this.state = 'idle';
    this.error = null;
  }

  /**
   * Check if camera is ready for use
   */
  get isReady() {
    return this.state === 'active' &&
           this.video &&
           this.video.readyState >= 3;
  }

  /**
   * Get video dimensions
   */
  get dimensions() {
    if (!this.video) return { width: 0, height: 0 };
    return {
      width: this.video.videoWidth,
      height: this.video.videoHeight
    };
  }

  /**
   * Check if browser supports getUserMedia
   */
  static isSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }
}
