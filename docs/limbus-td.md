# Technisch Ontwerp — Limbus

**Versie:** v1.0
**Datum:** 11 januari 2026
**Type:** Prototype / LinkedIn Demo

---

## 1. Design Filosofie

### 1.1 Core Principes

| Principe | Rationale |
|----------|-----------|
| **Instant feedback** | Elke beweging moet binnen 50ms visuele reactie geven |
| **Emotion amplification** | Particles versterken de emotie, niet alleen tonen |
| **Minimal cognitive load** | Geen UI elementen die afleiden van de experience |
| **Theatrical presence** | Ontworpen voor video-opname, niet voor dagelijks gebruik |

### 1.2 Visuele Hiërarchie

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│     1. PARTICLE TEXT (dominant - emotie feedback)          │
│                    "WOEDE"                                 │
│                                                            │
│     2. PARTICLE FIELD (midground - emotionele sfeer)       │
│              * * * * * * * * * *                           │
│            *   *   *   *   *   *   *                       │
│              * * * * * * * * * *                           │
│                                                            │
│     3. HAND SILHOUETTE (subtle - tracking confirmation)    │
│                    ✋                                       │
│                                                            │
│     4. BACKGROUND (void - focus op content)                │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 2. Systeemarchitectuur

### 2.1 Runtime Modules

```
┌─────────────────────────────────────────────────────────────────────┐
│                              BROWSER                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐        │
│  │   CAPTURE    │     │   ANALYSIS   │     │   RENDER     │        │
│  │   LAYER      │────▶│   LAYER      │────▶│   LAYER      │        │
│  └──────────────┘     └──────────────┘     └──────────────┘        │
│        │                    │                    │                  │
│        ▼                    ▼                    ▼                  │
│  ┌──────────┐        ┌───────────┐        ┌────────────┐           │
│  │ webcam   │        │ motion    │        │ renderer   │           │
│  │ handler  │        │ analyzer  │        │ (Three.js) │           │
│  └──────────┘        └───────────┘        └────────────┘           │
│        │                    │                    │                  │
│        ▼                    ▼                    ▼                  │
│  ┌──────────┐        ┌───────────┐        ┌────────────┐           │
│  │ hand     │        │ emotion   │        │ particle   │           │
│  │ tracker  │        │ state     │        │ systems    │           │
│  │(MediaPipe)│       │ machine   │        │            │           │
│  └──────────┘        └───────────┘        └────────────┘           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 File Structuur

```
limbus/
├── index.html
├── style.css
├── vite.config.js
├── package.json
│
└── src/
    ├── main.js                 # Bootstrap & game loop
    ├── config.js               # Alle constanten
    │
    ├── capture/
    │   ├── webcam.js           # Camera stream management
    │   └── handTracker.js      # MediaPipe wrapper
    │
    ├── analysis/
    │   ├── motionAnalyzer.js   # Velocity, jerk, patterns
    │   └── emotionDetector.js  # State machine + hysteresis
    │
    ├── render/
    │   ├── renderer.js         # Three.js scene setup
    │   ├── particles/
    │   │   ├── ParticlePool.js     # Object pooling
    │   │   ├── EmotionParticles.js # Hoofdparticle systeem
    │   │   └── TextParticles.js    # Tekst-vorming
    │   ├── HandOverlay.js      # Landmark visualisatie
    │   └── shaders/
    │       ├── particle.vert
    │       └── particle.frag
    │
    └── utils/
        ├── math.js             # Vector helpers
        └── easing.js           # Animation curves
```

---

## 3. Data Structuren

### 3.1 Hand Data (van MediaPipe)

```typescript
interface HandLandmarks {
  landmarks: Array<{
    x: number;      // 0-1, normalized screen position
    y: number;      // 0-1, normalized screen position
    z: number;      // depth, relative to wrist
  }>;               // 21 landmarks

  handedness: 'Left' | 'Right';
  gesture: 'Open_Palm' | 'Closed_Fist' | 'None';
}
```

### 3.2 Motion State

```typescript
interface MotionState {
  // Huidige frame
  palmCenter: Vector2;          // Genormaliseerd (0-1)
  velocity: number;             // Snelheid in units/frame
  velocityVector: Vector2;      // Richting + magnitude

  // Derived metrics
  jerk: number;                 // Δvelocity (smoothness indicator)
  direction: Vector2;           // Genormaliseerde bewegingsrichting

  // Pattern detection
  trajectoryBuffer: Vector2[];  // Laatste 30 frames
  patternScore: {
    circular: number;           // 0-1, hoe circulair
    linear: number;             // 0-1, hoe lineair
  };

  // Gesture
  isClosedFist: boolean;
  fingerSpread: number;         // 0-1, hoe open de hand is
}
```

### 3.3 Emotion State Machine

```typescript
interface EmotionState {
  current: Emotion;             // Huidige actieve emotie
  pending: Emotion | null;      // Emotie in hysteresis buffer
  pendingSince: number;         // Timestamp wanneer pending startte
  confidence: number;           // 0-1, detection confidence

  transitionProgress: number;   // 0-1, voor smooth morphing
  previousEmotion: Emotion;     // Voor transition blending
}

type Emotion = 'neutraal' | 'woede' | 'verdriet' | 'kalmte';
```

### 3.4 Particle

```typescript
interface Particle {
  // Position
  position: Vector3;
  velocity: Vector3;

  // Appearance
  color: Color;
  size: number;
  opacity: number;

  // Lifecycle
  age: number;
  lifetime: number;
  alive: boolean;

  // Text morphing (optioneel)
  targetPosition: Vector3 | null;   // Voor text formation
  morphProgress: number;            // 0-1
}
```

---

## 4. Algoritmen

### 4.1 Motion Analysis Pipeline

```
Frame N landmarks
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  1. PALM CENTER EXTRACTION                                │
│     palmCenter = average(landmarks[0, 5, 9, 13, 17])     │
│     (wrist + finger bases voor stabielere tracking)      │
└──────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  2. VELOCITY CALCULATION                                  │
│     velocity = distance(palmCenter[N], palmCenter[N-1])  │
│     velocityVector = palmCenter[N] - palmCenter[N-1]     │
│                                                          │
│     // Smoothing met EMA (Exponential Moving Average)    │
│     smoothedVelocity = α * velocity + (1-α) * prev       │
│     α = 0.3                                              │
└──────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  3. JERK CALCULATION                                      │
│     jerk = abs(velocity[N] - velocity[N-1])              │
│                                                          │
│     Hoge jerk = abrupte beweging (woede indicator)       │
│     Lage jerk = vloeiende beweging (kalmte indicator)    │
└──────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  4. PATTERN DETECTION                                     │
│                                                          │
│     trajectoryBuffer.push(palmCenter)                    │
│     if (trajectoryBuffer.length > 30) buffer.shift()     │
│                                                          │
│     // Circular pattern detection                        │
│     circularScore = calculateCircularity(buffer)         │
│                                                          │
│     // Algorithm: fit circle, measure deviation          │
│     // Hoge score = punten liggen op een cirkel          │
└──────────────────────────────────────────────────────────┘
```

### 4.2 Circular Pattern Detection

```javascript
function calculateCircularity(points) {
  if (points.length < 10) return 0;

  // 1. Bereken centroid
  const centroid = points.reduce((sum, p) => ({
    x: sum.x + p.x,
    y: sum.y + p.y
  }), { x: 0, y: 0 });
  centroid.x /= points.length;
  centroid.y /= points.length;

  // 2. Bereken gemiddelde afstand tot centroid (radius)
  const distances = points.map(p =>
    Math.sqrt((p.x - centroid.x) ** 2 + (p.y - centroid.y) ** 2)
  );
  const avgRadius = distances.reduce((a, b) => a + b) / distances.length;

  // 3. Meet variance in afstand (hoe consistent is de radius?)
  const variance = distances.reduce((sum, d) =>
    sum + (d - avgRadius) ** 2, 0
  ) / distances.length;

  // 4. Check of er progressie is (niet stilstaan)
  const totalDistance = points.reduce((sum, p, i) => {
    if (i === 0) return 0;
    return sum + Math.sqrt(
      (p.x - points[i-1].x) ** 2 +
      (p.y - points[i-1].y) ** 2
    );
  }, 0);

  // 5. Score: lage variance + voldoende beweging = circulair
  const varianceScore = Math.max(0, 1 - variance * 50);
  const movementScore = Math.min(1, totalDistance * 10);

  return varianceScore * movementScore;
}
```

### 4.3 Emotion Detection State Machine

```
                    ┌─────────────────────────────────────┐
                    │                                     │
                    ▼                                     │
              ┌──────────┐                                │
              │ NEUTRAAL │◀────────────────────┐          │
              └──────────┘                     │          │
                    │                          │          │
     ┌──────────────┼──────────────┐           │          │
     │              │              │           │          │
     ▼              ▼              ▼           │          │
┌─────────┐   ┌──────────┐   ┌─────────┐       │          │
│ PENDING │   │ PENDING  │   │ PENDING │       │          │
│ woede   │   │ verdriet │   │ kalmte  │       │          │
└─────────┘   └──────────┘   └─────────┘       │          │
     │              │              │           │          │
     │ 500ms        │ 500ms        │ 500ms     │          │
     │ consistent   │ consistent   │ consistent│          │
     ▼              ▼              ▼           │          │
┌─────────┐   ┌──────────┐   ┌─────────┐       │          │
│  WOEDE  │   │ VERDRIET │   │ KALMTE  │───────┘          │
└─────────┘   └──────────┘   └─────────┘                  │
     │              │              │                      │
     │              │              │    geen gesture      │
     └──────────────┴──────────────┴── for 1000ms ────────┘
```

### 4.4 Detection Logic (Pseudo-code)

```javascript
function detectEmotion(motion, gesture) {
  const { velocity, jerk, direction, patternScore, isClosedFist } = motion;

  // WOEDE: snel + vuist + abrupt
  if (
    velocity > THRESHOLD.velocityHigh &&      // > 0.08
    isClosedFist &&
    jerk > THRESHOLD.jerkHigh                 // > 0.05
  ) {
    return { emotion: 'woede', confidence: calculateConfidence(...) };
  }

  // VERDRIET: langzaam + naar beneden
  if (
    velocity < THRESHOLD.velocityLow &&       // < 0.02
    velocity > 0.005 &&                       // wel beweging
    direction.y < THRESHOLD.downward          // < -0.03 (negatief = omlaag)
  ) {
    return { emotion: 'verdriet', confidence: calculateConfidence(...) };
  }

  // KALMTE: medium snelheid + vloeiend + circulair
  if (
    velocity > THRESHOLD.velocityLow &&
    velocity < THRESHOLD.velocityMedium &&    // 0.02 - 0.05
    jerk < THRESHOLD.jerkLow &&               // < 0.01 (smooth)
    patternScore.circular > 0.6               // duidelijk circulair
  ) {
    return { emotion: 'kalmte', confidence: calculateConfidence(...) };
  }

  return { emotion: 'neutraal', confidence: 1 };
}
```

---

## 5. Particle System Design

### 5.1 Object Pooling

```javascript
class ParticlePool {
  constructor(maxParticles = 10000) {
    // Pre-allocate alle particles
    this.particles = new Array(maxParticles);
    this.positions = new Float32Array(maxParticles * 3);
    this.colors = new Float32Array(maxParticles * 3);
    this.sizes = new Float32Array(maxParticles);

    // Track welke particles actief zijn
    this.activeCount = 0;
    this.freeIndices = [...Array(maxParticles).keys()];

    for (let i = 0; i < maxParticles; i++) {
      this.particles[i] = {
        alive: false,
        index: i,
        // ... rest of particle data
      };
    }
  }

  spawn(count, emitFn) {
    for (let i = 0; i < count && this.freeIndices.length > 0; i++) {
      const index = this.freeIndices.pop();
      const particle = this.particles[index];

      particle.alive = true;
      emitFn(particle);  // Initialize particle

      this.activeCount++;
    }
  }

  update(deltaTime, updateFn) {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p.alive) continue;

      updateFn(p, deltaTime);

      // Check lifetime
      p.age += deltaTime;
      if (p.age >= p.lifetime) {
        p.alive = false;
        this.freeIndices.push(i);
        this.activeCount--;
      }

      // Sync to buffers
      const i3 = i * 3;
      this.positions[i3] = p.position.x;
      this.positions[i3 + 1] = p.position.y;
      this.positions[i3 + 2] = p.position.z;
      this.colors[i3] = p.color.r;
      this.colors[i3 + 1] = p.color.g;
      this.colors[i3 + 2] = p.color.b;
      this.sizes[i] = p.size * (1 - p.age / p.lifetime);
    }
  }
}
```

### 5.2 Emotion Behaviors

```javascript
const EMOTION_BEHAVIORS = {
  woede: {
    emit: (particle, origin) => {
      // Explosive radial burst
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.1 + Math.random() * 0.2;

      particle.position.copy(origin);
      particle.velocity.set(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        (Math.random() - 0.5) * speed
      );
      particle.color.setHex(lerpColor(0xFF0000, 0xFF6600, Math.random()));
      particle.size = 0.05 + Math.random() * 0.1;
      particle.lifetime = 0.5 + Math.random() * 1.0;
    },

    update: (particle, dt) => {
      // Add turbulence
      particle.velocity.x += (Math.random() - 0.5) * 0.02;
      particle.velocity.y += (Math.random() - 0.5) * 0.02;

      // Damping
      particle.velocity.multiplyScalar(0.98);

      // Apply velocity
      particle.position.add(particle.velocity.clone().multiplyScalar(dt));
    }
  },

  verdriet: {
    emit: (particle, origin) => {
      // Narrow downward cone
      const angle = -Math.PI/2 + (Math.random() - 0.5) * 0.6;
      const speed = 0.02 + Math.random() * 0.03;

      particle.position.copy(origin);
      particle.velocity.set(
        Math.cos(angle) * speed * 0.3,
        Math.sin(angle) * speed,
        0
      );
      particle.color.setHex(lerpColor(0x0044FF, 0x6600FF, Math.random()));
      particle.size = 0.03 + Math.random() * 0.05;
      particle.lifetime = 2 + Math.random() * 2;
    },

    update: (particle, dt) => {
      // Gravity
      particle.velocity.y -= 0.001;

      // Slight horizontal drift
      particle.velocity.x += Math.sin(particle.age * 2) * 0.0005;

      particle.position.add(particle.velocity.clone().multiplyScalar(dt));
    }
  },

  kalmte: {
    emit: (particle, origin) => {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.1 + Math.random() * 0.2;

      particle.position.set(
        origin.x + Math.cos(angle) * radius,
        origin.y + Math.sin(angle) * radius,
        origin.z
      );
      particle.velocity.set(0, 0, 0);
      particle.baseAngle = angle;
      particle.radius = radius;
      particle.color.setHex(lerpColor(0x00FF88, 0x0088FF, Math.random()));
      particle.size = 0.02 + Math.random() * 0.04;
      particle.lifetime = 3 + Math.random() * 2;
    },

    update: (particle, dt, origin) => {
      // Sine wave orbital motion
      particle.baseAngle += dt * 0.5;
      const wave = Math.sin(particle.age * 2) * 0.02;

      particle.position.x = origin.x + Math.cos(particle.baseAngle) * (particle.radius + wave);
      particle.position.y = origin.y + Math.sin(particle.baseAngle) * (particle.radius + wave);
    }
  }
};
```

### 5.3 Text Particle System

```javascript
class TextParticles {
  constructor(maxParticles = 2000) {
    this.particles = new ParticlePool(maxParticles);
    this.targetPositions = [];
    this.currentText = '';

    // Hidden canvas voor text sampling
    this.canvas = document.createElement('canvas');
    this.canvas.width = 512;
    this.canvas.height = 128;
    this.ctx = this.canvas.getContext('2d');
  }

  sampleText(text) {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw text
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 80px Inter, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, 256, 64);

    // Sample pixels
    const imageData = this.ctx.getImageData(0, 0, 512, 128);
    const positions = [];

    for (let y = 0; y < 128; y += 5) {
      for (let x = 0; x < 512; x += 5) {
        const i = (y * 512 + x) * 4;
        if (imageData.data[i + 3] > 128) {
          // Convert to world coordinates (centered)
          positions.push({
            x: (x - 256) * 0.005,  // Scale down
            y: (64 - y) * 0.005,   // Flip Y, center
            z: 0
          });
        }
      }
    }

    return positions;
  }

  morphTo(newText, color, duration = 0.5) {
    if (newText === this.currentText) return;

    this.currentText = newText;

    if (!newText) {
      // Dissolve particles
      this.particles.particles.forEach(p => {
        if (p.alive) p.targetPosition = null;
      });
      return;
    }

    this.targetPositions = this.sampleText(newText);

    // Match particles to target positions
    const activeParticles = this.particles.particles.filter(p => p.alive);

    for (let i = 0; i < this.targetPositions.length; i++) {
      if (i < activeParticles.length) {
        // Morph existing particle
        activeParticles[i].targetPosition = this.targetPositions[i];
        activeParticles[i].morphDuration = duration;
        activeParticles[i].morphProgress = 0;
        activeParticles[i].targetColor = color;
      } else {
        // Spawn new particle
        this.particles.spawn(1, (p) => {
          p.position.set(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            0
          );
          p.targetPosition = this.targetPositions[i];
          p.morphDuration = duration;
          p.morphProgress = 0;
          p.color = color;
          p.targetColor = color;
          p.size = 0.015;
          p.lifetime = Infinity;
        });
      }
    }
  }

  update(dt, centerPosition) {
    this.particles.update(dt, (p) => {
      if (p.targetPosition) {
        // Morph towards target
        p.morphProgress = Math.min(1, p.morphProgress + dt / p.morphDuration);
        const t = easeOutQuart(p.morphProgress);

        p.position.x = lerp(p.position.x, centerPosition.x + p.targetPosition.x, t);
        p.position.y = lerp(p.position.y, centerPosition.y + p.targetPosition.y + 0.4, t);
        p.position.z = lerp(p.position.z, p.targetPosition.z, t);
      } else {
        // Drift away
        p.position.x += (Math.random() - 0.5) * 0.01;
        p.position.y += Math.random() * 0.01;
        p.opacity = Math.max(0, p.opacity - dt);
      }
    });
  }
}
```

---

## 6. Shader Design

### 6.1 Particle Vertex Shader

```glsl
// particle.vert
uniform float uTime;
uniform float uPixelRatio;

attribute float aSize;
attribute float aOpacity;

varying vec3 vColor;
varying float vOpacity;

void main() {
  vColor = color;
  vOpacity = aOpacity;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

  // Size attenuation based on distance
  gl_PointSize = aSize * uPixelRatio * (300.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
```

### 6.2 Particle Fragment Shader

```glsl
// particle.frag
varying vec3 vColor;
varying float vOpacity;

void main() {
  // Circular particle with soft edge
  float dist = length(gl_PointCoord - vec2(0.5));
  if (dist > 0.5) discard;

  // Soft glow falloff
  float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
  alpha *= vOpacity;

  // Additive-style glow
  vec3 glow = vColor * (1.0 + alpha * 0.5);

  gl_FragColor = vec4(glow, alpha);
}
```

---

## 7. Three.js Scene Setup

### 7.1 Renderer Configuration

```javascript
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('canvas'),
  antialias: false,        // Niet nodig voor particles
  alpha: false,            // Zwarte achtergrond
  powerPreference: 'high-performance'
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x0A0A0A, 1);

// Blending mode voor glow effect
// (Set on material, not renderer)
```

### 7.2 Camera Setup

```javascript
// Orthographic camera voor 2D-style rendering
const frustumSize = 2;
const aspect = window.innerWidth / window.innerHeight;

const camera = new THREE.OrthographicCamera(
  -frustumSize * aspect / 2,   // left
   frustumSize * aspect / 2,   // right
   frustumSize / 2,            // top
  -frustumSize / 2,            // bottom
  0.1,                         // near
  10                           // far
);

camera.position.z = 5;
```

### 7.3 Scene Composition

```javascript
const scene = new THREE.Scene();

// Layer 1: Emotion particles (background)
const emotionParticles = new EmotionParticles();
scene.add(emotionParticles.mesh);

// Layer 2: Hand overlay (middle)
const handOverlay = new HandOverlay();
scene.add(handOverlay.group);

// Layer 3: Text particles (foreground)
const textParticles = new TextParticles();
scene.add(textParticles.mesh);
```

---

## 8. Performance Optimizations

### 8.1 Strategie

| Techniek | Impact | Implementatie |
|----------|--------|---------------|
| Object pooling | Geen GC pauses | Pre-allocate alle particles |
| BufferGeometry | GPU-efficient | Direct Float32Array updates |
| Frustum culling uit | CPU besparing | `mesh.frustumCulled = false` |
| Shader-based animation | GPU offload | Particle physics in vertex shader |
| RequestAnimationFrame | Smooth 60fps | Native browser timing |
| Throttled MediaPipe | CPU budget | Max 30fps inference |

### 8.2 Performance Budget

```
Per frame (16.67ms @ 60fps):
├── MediaPipe inference: max 8ms (runs at 30fps, so every other frame)
├── Motion analysis:     max 1ms
├── Emotion detection:   max 0.5ms
├── Particle update:     max 3ms
├── Three.js render:     max 4ms
└── Buffer overhead:     max 0.17ms
```

### 8.3 Adaptive Quality

```javascript
class PerformanceMonitor {
  constructor() {
    this.frameTimes = [];
    this.targetFPS = 60;
    this.qualityLevel = 1.0;
  }

  update(deltaTime) {
    this.frameTimes.push(deltaTime);
    if (this.frameTimes.length > 60) this.frameTimes.shift();

    const avgFrameTime = this.frameTimes.reduce((a, b) => a + b) / this.frameTimes.length;
    const currentFPS = 1000 / avgFrameTime;

    // Auto-adjust particle count
    if (currentFPS < 30) {
      this.qualityLevel = Math.max(0.3, this.qualityLevel - 0.1);
    } else if (currentFPS > 55 && this.qualityLevel < 1) {
      this.qualityLevel = Math.min(1.0, this.qualityLevel + 0.05);
    }

    return this.qualityLevel;
  }
}
```

---

## 9. Configuration Constants

```javascript
// config.js
export const CONFIG = {
  // MediaPipe
  mediapipe: {
    modelPath: '/models/gesture_recognizer.task',
    runningMode: 'VIDEO',
    numHands: 2,
    minHandDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  },

  // Motion Detection Thresholds
  motion: {
    velocityLow: 0.02,
    velocityMedium: 0.05,
    velocityHigh: 0.08,
    jerkLow: 0.01,
    jerkHigh: 0.05,
    downwardThreshold: -0.03,
    circularThreshold: 0.6,
    trajectoryBufferSize: 30,
    smoothingAlpha: 0.3
  },

  // Emotion State Machine
  emotion: {
    hysteresisDelay: 500,          // ms
    transitionDuration: 300,       // ms
    noGestureTimeout: 1000,        // ms before returning to neutral
    confidenceThreshold: 0.7
  },

  // Particles
  particles: {
    maxCount: 10000,
    spawnRate: 100,                // per second

    woede: {
      count: 5000,
      colors: [0xFF0000, 0xFF6600],
      sizeRange: [0.05, 0.15],
      lifetimeRange: [0.5, 1.5],
      speed: [0.1, 0.3]
    },
    verdriet: {
      count: 3000,
      colors: [0x0044FF, 0x6600FF],
      sizeRange: [0.03, 0.08],
      lifetimeRange: [2, 4],
      speed: [0.02, 0.05],
      gravity: 0.01
    },
    kalmte: {
      count: 4000,
      colors: [0x00FF88, 0x0088FF],
      sizeRange: [0.02, 0.06],
      lifetimeRange: [3, 5],
      speed: [0.03, 0.06],
      waveAmplitude: 0.1,
      waveFrequency: 2
    },
    neutraal: {
      count: 1000,
      colors: [0xFFFFFF, 0xCCCCCC],
      sizeRange: [0.02, 0.04],
      lifetimeRange: [1, 2],
      opacity: 0.3
    }
  },

  // Text Particles
  textParticles: {
    maxCount: 2000,
    sampleRate: 5,
    canvasSize: [512, 128],
    font: 'bold 80px Inter, sans-serif',
    morphDuration: 0.5,
    positionOffset: { x: 0, y: 0.4 }
  },

  // Hand Overlay
  handOverlay: {
    dotSize: 0.01,
    lineWidth: 1,
    opacity: 0.4,
    fadeOutDuration: 0.5
  },

  // Render
  render: {
    clearColor: 0x0A0A0A,
    pixelRatioMax: 2,
    frustumSize: 2
  }
};
```

---

## 10. Main Loop

```javascript
// main.js
import { CONFIG } from './config.js';
import { Webcam } from './capture/webcam.js';
import { HandTracker } from './capture/handTracker.js';
import { MotionAnalyzer } from './analysis/motionAnalyzer.js';
import { EmotionDetector } from './analysis/emotionDetector.js';
import { Renderer } from './render/renderer.js';
import { EmotionParticles } from './render/particles/EmotionParticles.js';
import { TextParticles } from './render/particles/TextParticles.js';
import { HandOverlay } from './render/HandOverlay.js';

class Limbus {
  async init() {
    // Initialize capture
    this.webcam = new Webcam();
    await this.webcam.start();

    this.handTracker = new HandTracker(CONFIG.mediapipe);
    await this.handTracker.init();

    // Initialize analysis
    this.motionAnalyzer = new MotionAnalyzer(CONFIG.motion);
    this.emotionDetector = new EmotionDetector(CONFIG.emotion);

    // Initialize render
    this.renderer = new Renderer(CONFIG.render);
    this.emotionParticles = new EmotionParticles(CONFIG.particles);
    this.textParticles = new TextParticles(CONFIG.textParticles);
    this.handOverlay = new HandOverlay(CONFIG.handOverlay);

    this.renderer.scene.add(this.emotionParticles.mesh);
    this.renderer.scene.add(this.handOverlay.group);
    this.renderer.scene.add(this.textParticles.mesh);

    // State
    this.lastTime = performance.now();
    this.frameCount = 0;

    // Start loop
    this.loop();
  }

  loop() {
    requestAnimationFrame(() => this.loop());

    const now = performance.now();
    const deltaTime = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // 1. Get hand data (throttled to 30fps internally)
    const handData = this.handTracker.detect(this.webcam.video);

    if (handData) {
      // 2. Analyze motion
      const motionState = this.motionAnalyzer.update(handData);

      // 3. Detect emotion
      const emotionState = this.emotionDetector.update(motionState, handData.gesture);

      // 4. Update visuals
      const palmPosition = this.screenToWorld(motionState.palmCenter);

      this.emotionParticles.update(deltaTime, emotionState, palmPosition);
      this.textParticles.update(deltaTime, emotionState, palmPosition);
      this.handOverlay.update(handData.landmarks, emotionState);
    } else {
      // No hand detected
      this.emotionParticles.fadeOut(deltaTime);
      this.textParticles.fadeOut(deltaTime);
      this.handOverlay.fadeOut(deltaTime);
    }

    // 5. Render
    this.renderer.render();
  }

  screenToWorld(screenPos) {
    // Convert normalized screen coords (0-1) to world coords
    const aspect = window.innerWidth / window.innerHeight;
    return {
      x: (screenPos.x - 0.5) * CONFIG.render.frustumSize * aspect,
      y: (0.5 - screenPos.y) * CONFIG.render.frustumSize,
      z: 0
    };
  }
}

// Bootstrap
new Limbus().init().catch(console.error);
```

---

## 11. Development Tooling

### 11.1 Debug GUI (dev only)

```javascript
import GUI from 'lil-gui';

if (import.meta.env.DEV) {
  const gui = new GUI();

  // Thresholds
  const motionFolder = gui.addFolder('Motion Thresholds');
  motionFolder.add(CONFIG.motion, 'velocityLow', 0, 0.1);
  motionFolder.add(CONFIG.motion, 'velocityHigh', 0, 0.2);
  motionFolder.add(CONFIG.motion, 'jerkHigh', 0, 0.1);

  // Force emotion (for testing)
  const debugFolder = gui.addFolder('Debug');
  debugFolder.add({ forceEmotion: 'none' }, 'forceEmotion',
    ['none', 'woede', 'verdriet', 'kalmte']
  );

  // Particle counts
  const particleFolder = gui.addFolder('Particles');
  particleFolder.add(CONFIG.particles.woede, 'count', 1000, 10000);
}
```

### 11.2 Stats Monitor

```javascript
import Stats from 'stats.js';

if (import.meta.env.DEV) {
  const stats = new Stats();
  stats.showPanel(0); // FPS
  document.body.appendChild(stats.dom);

  // In loop:
  stats.begin();
  // ... render ...
  stats.end();
}
```

---

## 12. Acceptance Tests

### Unit Tests (Vitest)

```javascript
describe('MotionAnalyzer', () => {
  it('should detect high velocity movement', () => {
    const analyzer = new MotionAnalyzer(CONFIG.motion);

    // Simulate rapid movement
    analyzer.update({ palmCenter: { x: 0.5, y: 0.5 } });
    analyzer.update({ palmCenter: { x: 0.7, y: 0.5 } });

    const state = analyzer.getState();
    expect(state.velocity).toBeGreaterThan(CONFIG.motion.velocityHigh);
  });

  it('should detect circular pattern', () => {
    const analyzer = new MotionAnalyzer(CONFIG.motion);

    // Simulate circular motion
    for (let i = 0; i < 30; i++) {
      const angle = (i / 30) * Math.PI * 2;
      analyzer.update({
        palmCenter: {
          x: 0.5 + Math.cos(angle) * 0.1,
          y: 0.5 + Math.sin(angle) * 0.1
        }
      });
    }

    const state = analyzer.getState();
    expect(state.patternScore.circular).toBeGreaterThan(0.6);
  });
});

describe('EmotionDetector', () => {
  it('should require hysteresis before changing state', () => {
    const detector = new EmotionDetector(CONFIG.emotion);

    // Single frame of anger motion shouldn't trigger immediately
    detector.update({ velocity: 0.1, jerk: 0.06 }, 'Closed_Fist');
    expect(detector.getState().current).toBe('neutraal');

    // After 500ms of consistent anger motion
    for (let i = 0; i < 30; i++) { // ~500ms at 60fps
      detector.update({ velocity: 0.1, jerk: 0.06 }, 'Closed_Fist');
    }
    expect(detector.getState().current).toBe('woede');
  });
});
```

---

*Technisch Ontwerp v1.0 — Colin Lit — 11 januari 2026*
