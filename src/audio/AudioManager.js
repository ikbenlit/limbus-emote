/**
 * AudioManager - Handles whoosh sound effects for hand movements
 * Uses Web Audio API for low-latency, spatially-aware playback
 */
export class AudioManager {
  constructor(config) {
    this.enabled = config.audio?.enabled ?? true;
    this.volume = config.audio?.volume ?? 0.5;
    this.minInterval = config.audio?.minInterval ?? 150;
    this.soundPaths = config.audio?.sounds ?? {};

    this.audioContext = null;
    this.buffers = new Map();
    this.lastPlayTime = 0;
    this.initialized = false;
  }

  /**
   * Initialize audio context and load sounds
   * Must be called after user interaction (autoplay policy)
   */
  async init() {
    if (!this.enabled) return;

    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      await this.loadSounds();
      this.initialized = true;
    } catch (err) {
      console.warn('AudioManager init failed:', err);
      this.enabled = false;
    }
  }

  /**
   * Load all whoosh sound samples into audio buffers
   */
  async loadSounds() {
    const loadPromises = Object.entries(this.soundPaths).map(async ([name, path]) => {
      try {
        const response = await fetch(path);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.buffers.set(name, audioBuffer);
      } catch (err) {
        console.warn(`Failed to load sound: ${name}`, err);
      }
    });

    await Promise.all(loadPromises);
  }

  /**
   * Resume audio context after user interaction (autoplay policy)
   */
  async resume() {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Play a whoosh sound with variable intensity and panning
   * @param {number} intensity - Volume multiplier (0-1), based on velocity
   * @param {number} pan - Stereo position (-1 = left, 1 = right)
   * @param {string} emotion - Current emotion for pitch variation
   */
  playWhoosh(intensity = 0.5, pan = 0, emotion = 'neutraal') {
    if (!this.enabled || !this.initialized || !this.audioContext) return;

    // Throttle: prevent sound spam
    const now = performance.now();
    if (now - this.lastPlayTime < this.minInterval) return;
    this.lastPlayTime = now;

    // Pick random whoosh sound
    const bufferNames = Array.from(this.buffers.keys());
    if (bufferNames.length === 0) return;

    const randomName = bufferNames[Math.floor(Math.random() * bufferNames.length)];
    const buffer = this.buffers.get(randomName);
    if (!buffer) return;

    // Create audio nodes
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    // Gain node for volume control
    const gainNode = this.audioContext.createGain();
    const finalVolume = this.volume * intensity * 0.8; // Scale down to prevent clipping
    gainNode.gain.value = Math.min(1, finalVolume);

    // Stereo panner for spatial positioning
    const panner = this.audioContext.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, pan));

    // Pitch variation based on emotion
    const pitchMap = {
      woede: 0.85,     // Lower pitch for anger
      verdriet: 0.9,   // Slightly low for sadness
      kalmte: 1.15,    // Higher pitch for calm
      blij: 1.2,       // Highest for joy
      rust: 1.1,       // Slightly high for rest
      neutraal: 1.0    // Normal pitch
    };
    source.playbackRate.value = pitchMap[emotion] ?? 1.0;

    // Connect: source -> gain -> panner -> destination
    source.connect(gainNode);
    gainNode.connect(panner);
    panner.connect(this.audioContext.destination);

    // Play
    source.start(0);
  }

  /**
   * Set master volume
   * @param {number} volume - Volume level (0-1)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Enable or disable audio
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Cleanup audio resources
   */
  dispose() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.buffers.clear();
    this.initialized = false;
  }
}
