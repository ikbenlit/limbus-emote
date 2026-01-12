# Functioneel Ontwerp (FO) — EmotiMotion

**Projectnaam:** EmotiMotion - Gesture-Based Emotion Visualizer
**Versie:** v1.1
**Datum:** 11-01-2026
**Auteur:** Colin Lit
**Laatste update:** Technische analyse en particle-text upgrade

---

## 1. Doel en relatie met het PRD

**Doel van dit document:**
Dit FO beschrijft *hoe* EmotiMotion functioneel werkt vanuit gebruikersperspectief. Het PRD definieert het *wat en waarom* (LinkedIn demo, GGZ-showcase), dit document beschrijft *hoe de gebruiker interacteert* met de gesture-based emotion visualizer.

**Scope:**
- Single-page webapp voor gesture-to-particle visualisatie
- 3 emoties: Woede, Verdriet, Rust/Kalmte
- Realtime hand tracking via webcam
- **Particle-text rendering** voor emotie feedback
- Demo-ready voor screen recording

**Buiten scope:**
Dashboard, sessie-opslag, authenticatie, meer dan 3 emoties, catch/scatter physics modes.

---

## 2. Technische Stack

### Gekozen Stack: Vanilla JS + Vite

| Component | Technologie | Motivatie |
|-----------|-------------|-----------|
| **Build tool** | Vite | Snelle dev server, ES modules, hot reload |
| **3D/Particles** | Three.js | GPU-accelerated particle rendering |
| **Hand tracking** | @mediapipe/tasks-vision | GestureRecognizer voor landmarks + fist/open detection |
| **Styling** | Vanilla CSS | Minimale UI, geen framework overhead nodig |

**Waarom geen framework (React/Svelte/SvelteKit):**
- Single page app (geen routing)
- Geen backend/API nodig
- Performance-kritisch (60fps target)
- Three.js render loop draait buiten elk framework om
- Elke abstractielaag kost fps

**Development dependencies:**
| Tool | Doel |
|------|------|
| stats.js | FPS monitoring tijdens development |
| lil-gui | Live parameter tuning voor thresholds |

---

## 3. Overzicht van de belangrijkste onderdelen

| # | Onderdeel | Beschrijving |
|---|-----------|--------------|
| 1 | **Webcam Permission Screen** | Eerste scherm: toestemming vragen voor camera |
| 2 | **Main Canvas** | Fullscreen particle visualisatie (Three.js) |
| 3 | **Hand Tracking Overlay** | Silhouette van gedetecteerde hand(en) |
| 4 | **Particle-Text Emotie Label** | Emotie als particle-formatie (vervangt DOM label) |
| 5 | **Calibration Feedback** | Visuele feedback tijdens tracking setup |

---

## 4. Userstories

### Primaire gebruiker: Demo-recorder (Colin)

| ID | Rol | Doel / Actie | Verwachte waarde | Prioriteit |
|----|-----|--------------|------------------|------------|
| US-01 | Demo-recorder | App openen in browser | Direct kunnen starten | Hoog |
| US-02 | Demo-recorder | Webcam toegang verlenen | Hand tracking activeert | Hoog |
| US-03 | Demo-recorder | Hand bewegen voor camera | Particles reageren realtime | Hoog |
| US-04 | Demo-recorder | Snelle hakbeweging maken (vuist) | Rode particles + particle-text "Woede" | Hoog |
| US-05 | Demo-recorder | Langzame neerwaartse beweging | Blauwe particles + particle-text "Verdriet" | Hoog |
| US-06 | Demo-recorder | Vloeiende circulaire beweging | Groene particles + particle-text "Kalmte" | Hoog |
| US-07 | Demo-recorder | Screen recording maken (60fps) | Vloeiende opname zonder lag | Hoog |

### Secundaire gebruiker: LinkedIn kijker (passief)

| ID | Rol | Doel / Actie | Verwachte waarde | Prioriteit |
|----|-----|--------------|------------------|------------|
| US-08 | Kijker | Video bekijken | Begrijpt concept binnen 10 sec | Middel |
| US-09 | Kijker | Emotie-verschil zien | Duidelijk onderscheid tussen 3 states | Middel |

---

## 5. Functionele werking per onderdeel

### 5.1 Webcam Permission Screen

**Trigger:** Gebruiker opent de app URL.

**Systeemgedrag:**
- Browser vraagt webcam toestemming (native dialog)
- App toont instructie: "Sta cameratoegang toe om te beginnen"
- Loading indicator tijdens initialisatie MediaPipe

**States:**
| State | Weergave |
|-------|----------|
| Wachten op toestemming | Instructietekst + camera icoon |
| Toestemming verleend | Fade naar Main Canvas |
| Toestemming geweigerd | Foutmelding + retry knop |
| MediaPipe laden | Loading spinner + "Model laden..." |

**Acceptatiecriteria:**
- [ ] Toestemming flow werkt in Chrome, Safari, Firefox
- [ ] Geen crash bij weigering
- [ ] Duidelijke feedback tijdens laden

---

### 5.2 Main Canvas (Particle Visualisatie)

**Trigger:** Webcam actief + MediaPipe geladen.

**Systeemgedrag:**
- Three.js canvas vult volledig scherm (fullscreen)
- Particles spawnen rondom handpositie
- Particle gedrag verandert op basis van gedetecteerde emotie
- Achtergrond: zwart (#0A0A0A) voor contrast in video

**Particle Specificaties per Emotie:**

| Emotie | Count | Kleuren | Motion | Lifetime | Size |
|--------|-------|---------|--------|----------|------|
| **Woede** | 5000 | #FF0000 → #FF6600 | Explosief radiaal | 0.5-1.5s | 0.05-0.15 |
| **Verdriet** | 3000 | #0044FF → #6600FF | Langzaam dalend (gravity) | 2-4s | 0.03-0.08 |
| **Kalmte** | 4000 | #00FF88 → #0088FF | Sine wave flow | 3-5s | 0.02-0.06 |
| **Neutraal** | 1000 | #FFFFFF (30% opacity) | Subtiele drift | 1-2s | 0.02-0.04 |

**Particle Rendering Techniek:**
- `THREE.Points` met `BufferGeometry`
- `Float32Array` voor positions, colors, sizes
- Particle pooling (hergebruik, geen create/destroy)
- Additive blending voor glow effect

**Performance eisen:**
- Minimum 30 fps op MacBook Air M1
- Target 60 fps
- Maximum 5000 particles actief tegelijk
- GPU-accelerated rendering

**Acceptatiecriteria:**
- [ ] Particles reageren binnen 100ms op handbeweging
- [ ] Kleurovergang is vloeiend (gradient)
- [ ] Geen zichtbare lag bij emotie-switch
- [ ] Glow effect zichtbaar op particles

---

### 5.3 Hand Tracking Overlay

**Trigger:** MediaPipe detecteert hand(en).

**Systeemgedrag:**
- Semi-transparante silhouette van handpositie
- Verbindingslijnen tussen 21 landmarks
- Volgt hand in realtime
- Vervaagt wanneer hand uit beeld is

**Visuele specs:**
| Element | Stijl |
|---------|-------|
| Landmark dots | Kleine dots, wit, 50% opacity |
| Verbindingslijnen | Wit, 30% opacity, 1px |
| Tracking lost | Fade out over 0.5s |

**Rendering:** Three.js `Line` en `Points` in dezelfde scene (geen aparte canvas)

**Acceptatiecriteria:**
- [ ] Overlay aligned correct met echte handpositie
- [ ] Geen webcam feed zichtbaar (privacy)
- [ ] Werkt met 1 én 2 handen

---

### 5.4 Particle-Text Emotie Label (NIEUW)

**Trigger:** Emotie-detectie algoritme bepaalt state.

**Concept:**
In plaats van een DOM tekst-label wordt de emotie getoond als **particles die zich formeren tot het woord**. Dit creëert een visueel memorabele "wow" factor voor de LinkedIn demo.

**Technische werking:**
```
1. Render tekst naar offscreen canvas (hidden)
2. Sample pixel data van de tekst
3. Genereer particle target-posities waar pixels aanwezig zijn
4. Animeer particles van huidige positie naar target-posities
5. Bij emotie-wissel: morph naar nieuwe tekst
```

**Text Sampling Specificaties:**
| Parameter | Waarde |
|-----------|--------|
| Font | Bold, sans-serif (Inter/SF Pro) |
| Sample rate | Elke 4-6 pixels |
| Canvas size | 512x128 (off-screen) |
| Threshold | Alpha > 128 |

**Weergave per emotie:**
| Emotie | Tekst | Particle kleur | Animatie |
|--------|-------|----------------|----------|
| Woede | "WOEDE" | #FF3333 + glow | Trillend/vibrerend |
| Verdriet | "VERDRIET" | #6666FF + glow | Langzaam dalend |
| Kalmte | "KALMTE" | #33FF99 + glow | Zacht pulsend |
| Neutraal | (geen tekst) | - | Particles driften vrij |

**Positie:** Gecentreerd in beeld, boven de hand

**Hysteresis:**
- Emotie moet 500ms consistent zijn voor tekst-switch
- Voorkomt flikkeren bij grensgevallen
- Smooth morph-transitie tussen woorden (particles herpositioneren)

**Acceptatiecriteria:**
- [ ] Tekst is duidelijk leesbaar als particle-formatie
- [ ] Geen flicker bij snelle bewegingen
- [ ] Smooth morph-animatie tussen emoties
- [ ] Glow effect op text-particles

---

### 5.5 Calibration Feedback (eerste gebruik)

**Trigger:** Eerste keer dat hand in beeld komt.

**Systeemgedrag:**
- Kort instructiebericht: "Beweeg je hand langzaam"
- Systeem calibreert baseline velocity
- Verdwijnt na 3 seconden of eerste gesture

---

## 6. Systeemarchitectuur

### 6.1 Module Overzicht

```
┌─────────────────────────────────────────────────────────────────┐
│                           main.js                                │
│                    (Bootstrap & Render Loop)                     │
└─────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│   webcam.js   │      │  renderer.js  │      │    ui.js      │
│  (Camera I/O) │      │ (Three.js)    │      │ (DOM states)  │
└───────────────┘      └───────────────┘      └───────────────┘
        │                       │
        ▼                       ▼
┌───────────────┐      ┌───────────────────────────────────────┐
│ handTracker.js│      │            Render Components           │
│  (MediaPipe)  │      ├───────────────┬───────────────────────┤
└───────────────┘      │particleSystem │    handOverlay.js     │
        │              │     .js       │                       │
        ▼              └───────────────┴───────────────────────┘
┌───────────────┐               │
│motionAnalyzer │               ▼
│     .js       │      ┌───────────────┐
└───────────────┘      │ particleText  │
        │              │     .js       │
        ▼              └───────────────┘
┌───────────────┐               │
│emotionDetector│               ▼
│     .js       │      ┌───────────────┐
└───────────────┘      │ textSampler   │
                       │     .js       │
                       └───────────────┘
```

### 6.2 Data Flow

```
Webcam → MediaPipe → Hand Data → Motion Analyzer → Emotion Detector
                                                          │
                                                          ▼
                        ┌─────────────────────────────────────────┐
                        │              Render Loop                 │
                        ├─────────────────────────────────────────┤
                        │  1. particleSystem.update(emotion)      │
                        │  2. particleText.update(emotion)        │
                        │  3. handOverlay.update(landmarks)       │
                        │  4. renderer.render()                   │
                        └─────────────────────────────────────────┘
```

### 6.3 File Structuur

```
emotimotion/
├── index.html              ← Entry point, canvas container
├── style.css               ← Minimal styling, loading states
│
├── src/
│   ├── main.js             ← Bootstrap, render loop, orchestration
│   ├── config.js           ← Alle constants, thresholds, kleuren
│   │
│   ├── webcam.js           ← Camera access, permission handling
│   ├── handTracker.js      ← MediaPipe GestureRecognizer setup
│   ├── motionAnalyzer.js   ← Velocity, jerk, direction, pattern
│   ├── emotionDetector.js  ← State machine, hysteresis logic
│   │
│   ├── renderer.js         ← Three.js scene, camera, render setup
│   ├── particleSystem.js   ← Particle pool, emotion behaviors
│   ├── particleText.js     ← Text-to-particle morphing
│   ├── textSampler.js      ← Canvas text → particle positions
│   ├── handOverlay.js      ← Hand silhouette rendering
│   │
│   └── ui.js               ← Loading screen, permission UI
│
├── package.json
└── vite.config.js
```

### 6.4 Module Verantwoordelijkheden

| Module | Input | Output | Verantwoordelijkheid |
|--------|-------|--------|---------------------|
| `webcam.js` | User permission | Video stream | Camera toegang, error handling |
| `handTracker.js` | Video frame | Landmarks, gesture | MediaPipe GestureRecognizer |
| `motionAnalyzer.js` | Landmarks history | Velocity, jerk, pattern | Bewegingsanalyse |
| `emotionDetector.js` | Motion data, gesture | Emotion state | State machine + hysteresis |
| `renderer.js` | Scene objects | Frame | Three.js setup en render |
| `particleSystem.js` | Emotion, palm position | Updated particles | Particle physics per emotie |
| `particleText.js` | Emotion label | Text particles | Tekst als particle formatie |
| `textSampler.js` | Text string | Particle positions | Canvas sampling |
| `handOverlay.js` | Landmarks | Lines/dots | Hand visualisatie |
| `ui.js` | App state | DOM updates | Loading, errors, hints |
| `config.js` | - | Constants | Alle tweakbare waarden |

---

## 7. Gesture-Emotie Detectie

### 7.1 Input Parameters

| Parameter | Hoe gemeten | Bron |
|-----------|-------------|------|
| **Velocity** | Δ palm center position / Δ time | Landmark 9 (middle finger base) |
| **Direction** | Genormaliseerde bewegingsvector | Δ position |
| **Hand pose** | Open/Closed fist | MediaPipe GestureRecognizer |
| **Jerk** | Δ velocity / Δ time (vloeiendheid) | Berekend |
| **Pattern** | Circulair vs lineair score | Trajectory buffer (30 frames) |

### 7.2 Motion Analyzer Output

```javascript
{
  velocity: 0.08,                    // normalized units/frame
  direction: { x: 0.2, y: -0.5 },   // movement vector
  jerk: 0.03,                        // smoothness indicator
  pattern: "circular",               // "circular" | "linear" | "static"
  palmCenter: { x: 0.5, y: 0.4 }    // normalized screen position
}
```

### 7.3 Emotie Mapping Logic

```
┌──────────────────────────────────────────────────────────────┐
│                    EMOTIE DETECTIE                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  IF velocity > 0.08                                          │
│     AND gesture == "Closed_Fist"                             │
│     AND jerk > 0.05                                          │
│  THEN → WOEDE                                                │
│                                                              │
│  ELSE IF velocity < 0.02                                     │
│     AND direction.y < -0.03                                  │
│  THEN → VERDRIET                                             │
│                                                              │
│  ELSE IF velocity BETWEEN 0.02 AND 0.05                      │
│     AND jerk < 0.01                                          │
│     AND pattern == "circular"                                │
│  THEN → KALMTE                                               │
│                                                              │
│  ELSE → NEUTRAAL                                             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 7.4 Threshold Waarden

| Parameter | Lage waarde | Hoge waarde | Eenheid |
|-----------|-------------|-------------|---------|
| Velocity | < 0.02 | > 0.08 | normalized/frame |
| Jerk | < 0.01 | > 0.05 | normalized/frame² |
| Direction.y | - | < -0.03 | Δy per frame |
| Hysteresis delay | - | 500 | ms |

**Belangrijk:** Deze waarden worden gecalibreerd tijdens development met lil-gui.

---

## 8. Particle System Configuratie

### 8.1 Emotion Presets

```javascript
const EMOTION_CONFIG = {
  woede: {
    particleCount: 5000,
    colors: {
      primary: '#FF0000',
      secondary: '#FF6600'
    },
    motion: {
      type: 'explosive',
      speed: { min: 0.1, max: 0.3 },
      spread: Math.PI * 2,        // 360° spread
      gravity: 0
    },
    appearance: {
      size: { min: 0.05, max: 0.15 },
      lifetime: { min: 0.5, max: 1.5 },
      glow: 1.5
    },
    text: {
      content: 'WOEDE',
      animation: 'vibrate'
    }
  },

  verdriet: {
    particleCount: 3000,
    colors: {
      primary: '#0044FF',
      secondary: '#6600FF'
    },
    motion: {
      type: 'falling',
      speed: { min: 0.02, max: 0.05 },
      spread: Math.PI * 0.3,      // narrow downward cone
      gravity: 0.01
    },
    appearance: {
      size: { min: 0.03, max: 0.08 },
      lifetime: { min: 2, max: 4 },
      glow: 1.0
    },
    text: {
      content: 'VERDRIET',
      animation: 'drip'
    }
  },

  kalmte: {
    particleCount: 4000,
    colors: {
      primary: '#00FF88',
      secondary: '#0088FF'
    },
    motion: {
      type: 'wave',
      speed: { min: 0.03, max: 0.06 },
      waveAmplitude: 0.1,
      waveFrequency: 2
    },
    appearance: {
      size: { min: 0.02, max: 0.06 },
      lifetime: { min: 3, max: 5 },
      glow: 1.2
    },
    text: {
      content: 'KALMTE',
      animation: 'pulse'
    }
  },

  neutraal: {
    particleCount: 1000,
    colors: {
      primary: '#FFFFFF',
      secondary: '#CCCCCC'
    },
    motion: {
      type: 'drift',
      speed: { min: 0.01, max: 0.02 },
      randomness: 0.5
    },
    appearance: {
      size: { min: 0.02, max: 0.04 },
      lifetime: { min: 1, max: 2 },
      glow: 0.5,
      opacity: 0.3
    },
    text: {
      content: null,
      animation: null
    }
  }
};
```

### 8.2 Particle Text Sampling

```javascript
const TEXT_SAMPLE_CONFIG = {
  canvasWidth: 512,
  canvasHeight: 128,
  font: 'bold 80px "Inter", "SF Pro", sans-serif',
  sampleRate: 5,              // sample elke 5 pixels
  alphaThreshold: 128,        // pixel moet > 50% opacity zijn
  particleScale: 0.01         // canvas coords → world coords
};
```

---

## 9. UI Overzicht

### 9.1 Schermindeling

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                                                             │
│                    ╔═══════════════════╗                    │
│                    ║      WOEDE        ║  ← Particle text   │
│                    ╚═══════════════════╝                    │
│                                                             │
│              ┌─────────────────────┐                        │
│              │   * * * * * * *     │                        │
│              │  *  PARTICLES   *   │                        │
│              │   * * * * * * *     │                        │
│              │        ✋           │  ← Hand overlay        │
│              │   (hand silhouette) │                        │
│              │                     │                        │
│              └─────────────────────┘                        │
│                                                             │
│                                                             │
│  [FPS: 60]                                                  │
└─────────────────────────────────────────────────────────────┘
     ↑
  Debug only (dev mode)
```

### 9.2 Kleurenpalet

| Gebruik | Kleur | Hex |
|---------|-------|-----|
| Achtergrond | Zwart | #0A0A0A |
| Woede particles | Rood-oranje gradient | #FF0000 → #FF6600 |
| Verdriet particles | Blauw-paars gradient | #0044FF → #6600FF |
| Kalmte particles | Groen-cyaan gradient | #00FF88 → #0088FF |
| Neutraal particles | Wit (dim) | #FFFFFF @ 30% |
| Hand overlay | Wit | #FFFFFF @ 30-50% |

---

## 10. User Flow

### Flow 1: Demo Recording (primair)

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Open URL  │───▶│  Toestemming│───▶│  Calibratie │───▶│    Demo     │
│             │    │   webcam    │    │   (3 sec)   │    │   actief    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                               │
                         ┌─────────────────────────────────────┘
                         ▼
              ┌──────────────────────┐
              │  Gebruiker beweegt   │
              │  hand → particles    │
              │  reageren + emotie   │
              │  particle-text       │
              │  verschijnt          │
              └──────────────────────┘
```

### Flow 2: Emotie Transitie

```
NEUTRAAL                    EMOTIE GEDETECTEERD              EMOTIE ACTIEF
    │                              │                              │
    │  Hand beweegt                │  500ms consistent            │
    │  velocity > threshold        │  (hysteresis)                │
    ▼                              ▼                              ▼
┌─────────┐                  ┌─────────┐                    ┌─────────┐
│ Drift   │ ──────────────▶  │ Detect  │ ────────────────▶  │ Woede/  │
│particles│                  │ emotion │                    │Verdriet/│
│         │                  │         │                    │ Kalmte  │
└─────────┘                  └─────────┘                    └─────────┘
                                                                 │
                                                                 │
                             ┌───────────────────────────────────┘
                             ▼
                       ┌───────────┐
                       │ Particles │
                       │ morph to  │
                       │ text form │
                       └───────────┘
```

---

## 11. Edge Cases & Error Handling

| Situatie | Systeemgedrag | Gebruikersfeedback |
|----------|---------------|-------------------|
| Hand uit beeld | Particles faden uit, text dissolves | Hand overlay verdwijnt |
| Slechte belichting | Tracking minder accuraat | (geen expliciete melding) |
| 2 handen in beeld | Beide handen tracken | Particles volgen dominante hand |
| Geen hand gedetecteerd >5s | Subtiele hint tonen | "Beweeg je hand in beeld" |
| Browser niet ondersteund | Foutmelding | "Gebruik Chrome of Safari" |
| MediaPipe laadt niet | Retry mechanisme | Loading + retry knop |
| WebGL niet beschikbaar | Foutmelding | "WebGL vereist" |

---

## 12. Performance Requirements

| Metric | Target | Minimum | Hoe gemeten |
|--------|--------|---------|-------------|
| Frame rate | 60 fps | 30 fps | stats.js |
| Latency (gesture → visual) | < 50ms | < 100ms | Timestamp delta |
| MediaPipe inference | < 30ms | < 50ms | Performance API |
| Particle update | < 5ms | < 10ms | Performance API |
| Memory usage | < 200MB | < 300MB | DevTools |
| Initial load time | < 3s | < 5s | Performance API |

---

## 13. Development Tools

### 13.1 Debug Panel (alleen in dev mode)

```javascript
// Beschikbaar via lil-gui in development
{
  // Thresholds
  velocityHigh: 0.08,
  velocityLow: 0.02,
  jerkThreshold: 0.05,
  hysteresisDelay: 500,

  // Particle settings
  particleCount: 5000,
  particleSize: 0.1,
  glowIntensity: 1.5,

  // Debug toggles
  showFPS: true,
  showLandmarks: true,
  forceEmotion: 'none'  // 'woede' | 'verdriet' | 'kalmte' | 'none'
}
```

### 13.2 FPS Monitor

Stats.js panel linksboven tijdens development voor realtime performance monitoring.

---

## 14. Niet-functionele eisen

### Browser Support
- Chrome 90+ (primary)
- Safari 15+ (MacOS)
- Firefox 90+
- IE11 (niet ondersteund)

### Device Support
- Desktop/laptop met webcam
- Minimum 720p webcam resolutie
- WebGL 2.0 support vereist

### Privacy
- Geen video opslag
- Geen data naar server
- Alle processing lokaal in browser
- Geen webcam feed zichtbaar in UI
- Geen analytics/tracking

---

## 15. Acceptatiecriteria Checklist

### Core Functionaliteit
- [ ] Webcam permission flow werkt
- [ ] MediaPipe laadt en tracked handen
- [ ] Hand overlay toont silhouette
- [ ] Particles spawnen rond hand
- [ ] 3 emoties worden correct gedetecteerd
- [ ] Particle-text toont emotie label
- [ ] Smooth transitions tussen emoties

### Performance
- [ ] 30+ fps op target device
- [ ] < 100ms gesture response
- [ ] Geen memory leaks
- [ ] < 5s initial load

### Demo Ready
- [ ] Screen recording @ 60fps mogelijk
- [ ] Geen UI bugs zichtbaar
- [ ] Visueel indrukwekkend voor LinkedIn

---

## 16. Bijlagen & Referenties

**Gerelateerde documenten:**
- [PRD EmotiMotion v0.9](./emotimotion-prd.md)

**Externe bronnen:**
- [MediaPipe Gesture Recognizer](https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer)
- [Three.js Points Documentation](https://threejs.org/docs/#api/en/objects/Points)
- Inspiratie: X post met MediaPipe + Three.js particle text demo

---

*FO Sign-off: Colin Lit - 11 januari 2026*
*Versie 1.1 - Technische stack update en particle-text feature*
