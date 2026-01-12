/**
 * Limbus Configuration
 * All constants, thresholds, and settings in one place
 */

const isDev = Boolean(import.meta.env?.DEV);

export const CONFIG = {
  // ============================================
  // MediaPipe Settings
  // ============================================
  mediapipe: {
    modelPath: 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
    runningMode: 'VIDEO',
    numHands: 2,
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5
  },

  // ============================================
  // Motion Detection Thresholds
  // ============================================
  motion: {
    // Velocity thresholds (normalized units/frame)
    velocityLow: 0.018,      // Below = slow/static
    velocityMedium: 0.055,   // Medium range for kalmte
    velocityHigh: 0.09,      // Above = fast (woede)

    // Jerk thresholds (smoothness indicator)
    jerkLow: 0.012,          // Below = smooth movement
    jerkHigh: 0.06,          // Above = abrupt movement

    // Direction thresholds
    downwardThreshold: -0.03, // Y direction for verdriet

    // Pattern detection
    circularThreshold: 0.55,  // Score above = circular pattern
    trajectoryBufferSize: 34, // Frames to analyze for patterns

    // Smoothing
    smoothingAlpha: 0.25,     // EMA smoothing factor (0-1)

    // Palm center landmarks (wrist + finger bases)
    palmLandmarks: [0, 5, 9, 13, 17]
  },

  // ============================================
  // Emotion State Machine
  // ============================================
  emotion: {
    hysteresisDelay: 500,       // ms before confirming emotion change
    transitionDuration: 300,    // ms for visual transition
    noGestureTimeout: 1000,     // ms before returning to neutral
    confidenceThreshold: 0.7    // Minimum confidence to trigger
  },

  // ============================================
  // Two-Hand Interaction (Creëren & Vangen)
  // ============================================
  twoHand: {
    // Role assignment
    sourceHand: 'right',         // Creates particles
    magnetHand: 'left',          // Catches particles

    // Magnet physics
    magnetRadius: 0.45,          // Attraction range (world units)
    magnetStrength: 2.3,         // Pull force multiplier
    magnetFalloff: 'inverse',    // 'linear' | 'inverse' | 'exponential'

    // Fusion trigger
    fusionDistance: 0.13,        // Hands this close = fusion
    fusionHoldTime: 280,         // ms hands must stay close
    fusionCooldown: 1000,        // ms before next fusion possible

    // Amplification (same emotion on both hands)
    amplifyMultiplier: 1.6,      // Particle count multiplier
    amplifyScale: 1.35,          // Particle size multiplier

    // Fusion explosion
    fusionParticleCount: 600,    // Extra burst particles
    fusionSpeed: 0.45,           // Explosion velocity
    fusionDuration: 0.9          // Seconds for fusion effect
  },

  // ============================================
  // Particle System
  // ============================================
  particles: {
    maxCount: 10000,
    spawnRate: 100,            // Particles per second

    // Emotion-specific configurations
    woede: {
      count: 5000,
      colors: {
        primary: 0xFF0000,
        secondary: 0xFF6600
      },
      motion: {
        type: 'explosive',
        speed: { min: 0.1, max: 0.3 },
        spread: Math.PI * 2,   // 360° spread
        gravity: 0,
        turbulence: 0.02
      },
      appearance: {
        size: { min: 0.05, max: 0.15 },
        lifetime: { min: 0.5, max: 1.5 },
        glow: 1.5,
        opacity: 1.0
      }
    },

    verdriet: {
      count: 3000,
      colors: {
        primary: 0x0044FF,
        secondary: 0x6600FF
      },
      motion: {
        type: 'falling',
        speed: { min: 0.02, max: 0.05 },
        spread: Math.PI * 0.3, // Narrow downward cone
        gravity: 0.01,
        turbulence: 0.005
      },
      appearance: {
        size: { min: 0.03, max: 0.08 },
        lifetime: { min: 2, max: 4 },
        glow: 1.0,
        opacity: 0.9
      }
    },

    kalmte: {
      count: 4000,
      colors: {
        primary: 0x00FF88,
        secondary: 0x0088FF
      },
      motion: {
        type: 'wave',
        speed: { min: 0.03, max: 0.06 },
        waveAmplitude: 0.1,
        waveFrequency: 2,
        gravity: 0,
        turbulence: 0
      },
      appearance: {
        size: { min: 0.02, max: 0.06 },
        lifetime: { min: 3, max: 5 },
        glow: 1.2,
        opacity: 0.85
      }
    },
    power: {
      count: 4500,
      colors: {
        primary: 0xFF3300,
        secondary: 0xFF6600
      },
      motion: {
        type: 'explosive',
        speed: { min: 0.08, max: 0.22 },
        spread: Math.PI * 2,
        gravity: 0,
        turbulence: 0.02
      },
      appearance: {
        size: { min: 0.04, max: 0.12 },
        lifetime: { min: 0.7, max: 1.4 },
        glow: 1.4,
        opacity: 1.0
      }
    },
    flow: {
      count: 3800,
      colors: {
        primary: 0x0044FF,
        secondary: 0x6600FF
      },
      motion: {
        type: 'wave',
        speed: { min: 0.025, max: 0.055 },
        waveAmplitude: 0.12,
        waveFrequency: 2.4,
        gravity: 0,
        turbulence: 0.005
      },
      appearance: {
        size: { min: 0.025, max: 0.06 },
        lifetime: { min: 2.2, max: 3.8 },
        glow: 1.1,
        opacity: 0.9
      }
    },
    calm: {
      count: 3600,
      colors: {
        primary: 0x00FF88,
        secondary: 0x0088FF
      },
      motion: {
        type: 'wave',
        speed: { min: 0.02, max: 0.05 },
        waveAmplitude: 0.08,
        waveFrequency: 1.6,
        gravity: 0,
        turbulence: 0
      },
      appearance: {
        size: { min: 0.02, max: 0.05 },
        lifetime: { min: 3, max: 5 },
        glow: 1.1,
        opacity: 0.85
      }
    },
    rust: {
      count: 3500,
      colors: {
        primary: 0x00FF88,
        secondary: 0x0088FF
      },
      motion: {
        type: 'wave',
        speed: { min: 0.02, max: 0.05 },
        waveAmplitude: 0.08,
        waveFrequency: 1.6,
        gravity: 0,
        turbulence: 0
      },
      appearance: {
        size: { min: 0.02, max: 0.05 },
        lifetime: { min: 3, max: 5 },
        glow: 1.1,
        opacity: 0.85
      }
    },
    blij: {
      count: 3500,
      colors: {
        primary: 0xFFD700,
        secondary: 0xFFA500
      },
      motion: {
        type: 'sparkle',
        speed: { min: 0.01, max: 0.04 },
        spread: Math.PI * 2,
        gravity: 0,
        turbulence: 0.015,
        flickerSpeed: 8,
        flickerDepth: 0.7,
        jitter: 0.004
      },
      appearance: {
        size: { min: 0.018, max: 0.045 },
        lifetime: { min: 1.3, max: 2.2 },
        glow: 1.4,
        opacity: 0.95
      }
    },

    neutraal: {
      count: 1000,
      colors: {
        primary: 0xFFFFFF,
        secondary: 0xCCCCCC
      },
      motion: {
        type: 'drift',
        speed: { min: 0.01, max: 0.02 },
        spread: Math.PI * 2,
        gravity: 0,
        turbulence: 0.01,
        randomness: 0.5
      },
      appearance: {
        size: { min: 0.02, max: 0.04 },
        lifetime: { min: 1, max: 2 },
        glow: 0.5,
        opacity: 0.3
      }
    }
  },

  // ============================================
  // Text Particles
  // ============================================
  textParticles: {
    maxCount: 2000,
    canvasSize: [512, 128],
    font: 'bold 80px Inter, system-ui, sans-serif',
    sampleRate: 5,             // Sample every N pixels
    alphaThreshold: 128,       // Pixel must be > 50% opacity
    particleScale: 0.005,      // Canvas coords → world coords
    morphDuration: 0.5,        // Seconds to morph to new text
    positionOffset: { x: 0, y: 0.4 }, // Position above hand

    // Text per emotion
    labels: {
      power: 'POWER',
      flow: 'FLOW',
      calm: 'CALM',
      woede: 'WOEDE',
      rust: 'RUST',
      blij: 'BLIJ',
      neutraal: null           // No text for neutral
    },

    // Animation per emotion
    animations: {
      power: 'vibrate',
      flow: 'flow',
      calm: 'pulse',
      woede: 'vibrate',
      rust: 'pulse',
      blij: 'sparkle'
    },

    // Left-hand interactions
    explode: {
      duration: 0.8,
      speed: 0.8,
      drag: 0.94
    },
    implode: {
      duration: 0.5
    }
  },

  // ============================================
  // Hand Overlay
  // ============================================
  handOverlay: {
    dotSize: 0.015,
    dotColor: 0xFFFFFF,
    lineWidth: 1,
    lineColor: 0xFFFFFF,
    opacity: 0.4,
    fadeOutDuration: 0.5,      // Seconds to fade when tracking lost

    // MediaPipe hand connections
    connections: [
      [0, 1], [1, 2], [2, 3], [3, 4],           // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8],           // Index
      [0, 9], [9, 10], [10, 11], [11, 12],      // Middle
      [0, 13], [13, 14], [14, 15], [15, 16],    // Ring
      [0, 17], [17, 18], [18, 19], [19, 20],    // Pinky
      [5, 9], [9, 13], [13, 17]                 // Palm
    ]
  },

  // ============================================
  // Renderer (Three.js)
  // ============================================
  render: {
    clearColor: 0x0A0A0A,
    pixelRatioMax: 2,
    frustumSize: 2,
    cameraZ: 5
  },

  // ============================================
  // Performance
  // ============================================
  performance: {
    targetFPS: 60,
    minFPS: 30,
    mediapipeThrottleFPS: 30,  // Run inference at this rate
    adaptiveQuality: true,     // Auto-reduce particles if FPS drops
    qualityStep: 0.1           // Amount to adjust quality
  },

  // ============================================
  // Debug (development only)
  // ============================================
  debug: {
    enabled: isDev,
    showFPS: isDev,
    showLandmarks: isDev,
    forceEmotion: null,        // 'woede' | 'verdriet' | 'kalmte' | null
    logEmotionChanges: false
  }
};

// Freeze config to prevent accidental modifications (skip in dev for live tuning)
if (!isDev) {
  Object.freeze(CONFIG);
  Object.freeze(CONFIG.mediapipe);
  Object.freeze(CONFIG.motion);
  Object.freeze(CONFIG.emotion);
  Object.freeze(CONFIG.twoHand);
  Object.freeze(CONFIG.particles);
  Object.freeze(CONFIG.textParticles);
  Object.freeze(CONFIG.handOverlay);
  Object.freeze(CONFIG.render);
  Object.freeze(CONFIG.performance);
  Object.freeze(CONFIG.debug);
}
