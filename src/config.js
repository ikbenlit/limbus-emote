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
    modelPath: '/mediapipe/gesture_recognizer.task',
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
    // Finger gesture kleuren (voor TextParticles)
    '1finger': {
      count: 0,
      colors: { primary: 0xFF0000, secondary: 0xFF6600 },  // BOOS: Rood/Oranje
      motion: { type: 'drift', speed: { min: 0, max: 0 }, spread: 0, gravity: 0, turbulence: 0 },
      appearance: { size: { min: 0, max: 0 }, lifetime: { min: 0, max: 0 }, glow: 0, opacity: 0 }
    },
    '2finger': {
      count: 0,
      colors: { primary: 0xFFD700, secondary: 0xFFA500 },  // BLIJ: Goud/Oranje
      motion: { type: 'drift', speed: { min: 0, max: 0 }, spread: 0, gravity: 0, turbulence: 0 },
      appearance: { size: { min: 0, max: 0 }, lifetime: { min: 0, max: 0 }, glow: 0, opacity: 0 }
    },
    '3finger': {
      count: 0,
      colors: { primary: 0x8B00FF, secondary: 0x4B0082 },  // BANG: Paars/Indigo
      motion: { type: 'drift', speed: { min: 0, max: 0 }, spread: 0, gravity: 0, turbulence: 0 },
      appearance: { size: { min: 0, max: 0 }, lifetime: { min: 0, max: 0 }, glow: 0, opacity: 0 }
    },
    '4finger': {
      count: 0,
      colors: { primary: 0x00FF88, secondary: 0x00CC66 },  // HALLO: Groen
      motion: { type: 'drift', speed: { min: 0, max: 0 }, spread: 0, gravity: 0, turbulence: 0 },
      appearance: { size: { min: 0, max: 0 }, lifetime: { min: 0, max: 0 }, glow: 0, opacity: 0 }
    },
    rust: {
      count: 3200,
      colors: {
        primary: 0xB87333,    // Copper/warm brown
        secondary: 0xD4A574   // Sandy beige
      },
      motion: {
        type: 'drift',
        speed: { min: 0.008, max: 0.02 },
        spread: Math.PI * 0.5,
        gravity: -0.002,      // Gentle upward float
        turbulence: 0.003,
        randomness: 0.3
      },
      appearance: {
        size: { min: 0.025, max: 0.055 },
        lifetime: { min: 4, max: 6 },
        glow: 0.9,
        opacity: 0.7
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
    },
    sixSeven: {
      count: 2000,
      colors: {
        primary: 0xFFFFFF,
        secondary: 0x00CCFF
      },
      appearance: {
        size: { min: 0.02, max: 0.04 },
        glow: 1.5,
        opacity: 1.0
      }
    }
  },

  // ============================================
  // Text Particles
  // ============================================
  textParticles: {
    maxCount: 10000,            // Aantal particles
    canvasSize: [800, 300],    // Sampling canvas grootte
    font: 'bold 160px "Courier New", monospace',  // Large readable font
    sampleRate: 3,             // Every 3rd pixel for LED look
    alphaThreshold: 164,       // Rand scherpte
    particleScale: 0.006,      // Adjusted for canvas size
    morphDuration: 0.3,        // Slightly slower morph for cleaner transitions
    positionOffset: { x: 0, y: 0 }, // Centered (no offset)
    centerScreen: true,        // Position at screen center, not hand

    // Hand repel settings (left hand pushes particles away)
    repel: {
      enabled: true,
      radius: 0.4,      // Distance within which particles react
      strength: 2,     // How hard particles are pushed away
    },

    // Text per gesture/emotion
    labels: {
      // Finger gesture labels (descriptive identifiers)
      '1finger': 'BOOS',
      '2finger': 'BLIJ',
      '3finger': 'BANG',
      '4finger': 'HALLO',

      // Motion-based emotion labels
      woede: 'WOEDE',
      rust: 'RUST',
      blij: 'BLIJ',
      bang: 'BANG',
      kalmte: 'KALMTE',
      verdriet: 'VERDRIET',
      neutraal: null           // No text for neutral
    },

    // Animation per gesture/emotion
    animations: {
      // Finger gestures: static (no animation for clarity)
      '1finger': 'static',
      '2finger': 'static',
      '3finger': 'static',
      '4finger': 'pulse',

      // Motion emotions: animated
      woede: 'vibrate',
      rust: 'pulse',
      blij: 'sparkle',
      bang: 'vibrate',
      kalmte: 'pulse',
      verdriet: 'drip'
    },

    // Left-hand interactions
    explode: {
      type: 'random',         // 'random' | 'shockwave'
      duration: 1.5,          // Langer zichtbaar
      speed: 4,               // Hogere snelheid voor volledig scherm
      drag: 0.98,             // Minder weerstand = verder reiken
      sizeVariation: 5,       // Groot verschil: tiny dots tot grote bollen
    },
    implode: {
      type: 'swarm',          // 'swarm' | 'spiral' | 'vacuum'
      duration: 0.6,
    }
  },

  // ============================================
  // Sphere Particles (Right Hand Fist)
  // ============================================
  sphereParticles: {
    maxCount: 8000,         // Meer particles voor dichtere look
    radius: 0.55,           // Grote sphere (iets kleiner)
    innerRadius: 0.40,      // Particles meer naar buiten (minder vulling)
    formationDuration: 0.5, // Seconden voor volledige formatie
    formationSpread: 1.2,   // Startafstand particles (groter = verder weg)
    floatOffset: 0.0,       // Centered op de hand
    colors: {
      primary: 0xFFD700,    // Goud
      secondary: 0xFFA500,  // Oranje
      aura: 0xFFAA00        // Aura kleur
    },
    wobble: {
      speed: 2,
      amplitude: 0.02
    },
    particleSize: 0.018,    // Kleinere particles voor strakke look
    shell: {
      enabled: true,
      particles: 3000,      // Veel particles op de rand
      thickness: 0.04,      // Dunne, strakke rand
      brightness: 1.5       // Extra helder
    },
    aura: {
      enabled: true,
      particles: 800,       // Meer aura particles
      thickness: 0.06,      // Dunnere aura ring
      opacity: 0.9,         // Feller
      pulseSpeed: 2.0
    },
    fadeInDuration: 0.25,
    fadeOutDuration: 0.15
  },

  // ============================================
  // Hand Overlay
  // ============================================
  handOverlay: {
    enabled: false,            // Disable hand overlay
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
  },

  // ============================================
  // Audio (Whoosh sound effects)
  // ============================================
  audio: {
    enabled: true,
    volume: 0.5,
    minInterval: 150,  // ms between sounds (prevents spam)
    velocityThreshold: 0.04,  // Minimum velocity to trigger whoosh
    sounds: {
      whoosh: '/sounds/812688__audiopapkin__sound-design-elements-whoosh-sfx-051.wav'
    }
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
  Object.freeze(CONFIG.audio);
}
