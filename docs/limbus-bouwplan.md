# 🚀 Mission Control – Bouwplan Limbus

---

**Projectnaam:** Limbus - Gesture-Based Emotion Visualizer
**Versie:** v2.4
**Datum:** 11-01-2026
**Auteur:** Colin Lit

---

## 1. Doel en context

🎯 **Doel:** Een werkend prototype bouwen dat handgebaren vertaalt naar emotionele particle-visualisaties voor een LinkedIn demo.

📘 **Toelichting:** Dit project demonstreert de combinatie van MediaPipe hand tracking en Three.js particle rendering. Het eindproduct is een 60-90 seconden screen recording die de potentie toont voor GGZ/therapie toepassingen. Zie PRD voor volledige context en FO voor functionele specificaties.

> We bouwen een visueel indrukwekkende demo die handgebaren vertaalt naar 3 emoties (woede, verdriet, kalmte) met realtime particle effects. Doel: LinkedIn engagement en lead generation voor GGZ-sector.

---

## 2. Uitgangspunten

🎯 **Doel:** Vaste kaders waarbinnen het project wordt ontwikkeld.

📘 **Toelichting:**

- **Stack:** Vanilla JS + Vite + Three.js + MediaPipe
- **Package manager:** pnpm
- **Tijd:** 2-3 dagen bouwtijd
- **Target device:** MacBook met webcam (720p+)
- **Browser:** Chrome (primary), Safari (secondary)
- **Data:** Geen opslag, alles client-side
- **Hosting:** Optioneel Vercel of Firebase

**Aannames:**
- Goede belichting beschikbaar voor opname
- 60fps screen recording mogelijk (OBS/QuickTime)
- Gebruiker heeft werkende webcam

---

## 3. Fase- en subfase-overzicht

🎯 **Doel:** De bouw opdelen in logische fases met duidelijke volgorde.

📘 **Toelichting:** Status wordt bijgehouden per fase. Gebruik ✅ Gereed, 🔄 In Progress, ⏳ To Do.

| Fase | Titel | Doel | Status | Opmerkingen |
|------|-------|------|--------|-------------|
| 0 | Setup | Project structuur, dependencies | ✅ Gereed | Alle subfases afgerond |
| 1 | Capture | Webcam + MediaPipe hand tracking | ✅ Gereed | 2-hand support aanwezig |
| 2 | Analysis | Motion analyzer + emotion detection | ✅ Gereed | Per-hand motion + emotie detectie met hysteresis |
| 3 | Particles | Three.js scene + particle system | ✅ Gereed | Renderer, pool, shaders werken |
| 4 | Two-Hand | Creëren & Vangen + Versterken | ✅ Gereed | TwoHandController + magnet + fusie |
| 5 | Polish | Text particles, hand overlay, transitions | ✅ Gereed | HandOverlay, TextParticles werken |
| 6 | Tuning | Thresholds calibreren, performance | ⏳ To Do | Wacht op fase 2+4 |
| 7 | Demo | Opname en LinkedIn post | ⏳ To Do | Einddeliverable |

---

## 4. Subfases (uitwerking per fase)

🎯 **Doel:** Complexe fases opdelen in beheersbare subfases.

📘 **Toelichting:** Elke subfase heeft een duidelijk doel en afhankelijkheid.

### Fase 0 — Setup

| Subfase | Doel | Status | Afhankelijkheden | Opmerkingen |
|---------|------|--------|------------------|-------------|
| 0.1 | Vite project initialiseren | ✅ | — | `pnpm create vite` uitgevoerd |
| 0.2 | Dependencies installeren | ✅ | 0.1 | three, mediapipe, lil-gui, stats.js |
| 0.3 | Folder structuur aanmaken | ✅ | 0.1 | src/ met capture/, analysis/, render/ |
| 0.4 | Basic HTML + CSS | ✅ | 0.1 | Fullscreen canvas styling |
| 0.5 | Config.js met constants | ✅ | 0.3 | Alle thresholds en kleuren |

### Fase 1 — Capture Layer

| Subfase | Doel | Status | Afhankelijkheden | Opmerkingen |
|---------|------|--------|------------------|-------------|
| 1.1 | Webcam.js - camera access | ✅ | 0.4 | Permission handling |
| 1.2 | UI states (loading, denied) | ✅ | 1.1 | User feedback |
| 1.3 | HandTracker.js - MediaPipe setup | ✅ | 0.2 | GestureRecognizer |
| 1.4 | Landmark data extractie | ✅ | 1.3 | Normalisatie 0-1 |
| 1.5 | Verify: landmarks in console | ✅ | 1.4 | Test criterium |

### Fase 2 — Analysis Layer ✅ GEREED

> **DRY principe:** Eén `HandMotionState` class voor beide handen, geen duplicatie.
> **SOC principe:** MotionAnalyzer berekent alleen physics, EmotionDetector bepaalt emotie.
>
> ✅ **AFGEROND:** Volledige per-hand motion tracking en emotie detectie geïmplementeerd.

#### 2A. DRY/SOC Cleanup (eerst!)

| Subfase | Doel | Status | Afhankelijkheden | Opmerkingen |
|---------|------|--------|------------------|-------------|
| 2.0a | `hexToRgb()` → utils/math.js | ✅ | - | Verplaatst, EmotionParticles gebruikt import |
| 2.0b | `colors.js` centrale kleurdefinities | ✅ | 2.0a | Nieuw bestand, main.js gebruikt import |
| 2.0c | Import `easeOutCubic` in TextParticles | ✅ | - | Duplicate verwijderd, import toegevoegd |
| 2.0d | Emotie-logica uit main.js verwijderen | ✅ | 2.5 | main.js gebruikt nu EmotionDetector |

**Cleanup details:**
```javascript
// 2.0a: Verplaats naar utils/math.js
export function hexToRgb(hex) {
  return {
    r: ((hex >> 16) & 255) / 255,
    g: ((hex >> 8) & 255) / 255,
    b: (hex & 255) / 255
  };
}

// 2.0b: Nieuw bestand utils/colors.js
import { hexToRgb } from './math.js';
export const EMOTION_COLORS = {
  woede:     { hex: 0xFF3300, ...hexToRgb(0xFF3300) },
  verdriet:  { hex: 0x0044FF, ...hexToRgb(0x0044FF) },
  kalmte:    { hex: 0x00FF88, ...hexToRgb(0x00FF88) },
  blij:      { hex: 0xFFD700, ...hexToRgb(0xFFD700) },
  bang:      { hex: 0x9932CC, ...hexToRgb(0x9932CC) },
  neutraal:  { hex: 0xFFFFFF, ...hexToRgb(0xFFFFFF) }
};
```

#### 2B. Core Analysis Implementation

| Subfase | Doel | Status | Afhankelijkheden | Opmerkingen |
|---------|------|--------|------------------|-------------|
| 2.1 | HandMotionState class | ✅ | 1.4 | 248 regels, trajectory buffer, EMA smoothing |
| 2.2 | MotionAnalyzer refactor | ✅ | 2.1 | 160 regels, Map per hand, palm center |
| 2.3 | Velocity vector (richting) | ✅ | 2.2 | EMA smoothing, magnitude + direction |
| 2.4 | Jerk + circular detection | ✅ | 2.3 | Jerk rate, circularScore via angular movement |
| 2.5 | EmotionDetector per-hand | ✅ | 2.4 | 285 regels, 6 emoties, gesture override |
| 2.6 | Hysteresis per hand | ✅ | 2.5 | 500ms delay, pending state machine |
| 2.7 | Verify: beide emoties in console | ✅ | 2.6 | Debug logging met velocity/jerk |

**HandMotionState class (DRY):**
```javascript
// src/analysis/HandMotionState.js - NIEUW
class HandMotionState {
  constructor() {
    this.trajectoryBuffer = [];  // Laatste 30 frames
    this.prevPosition = null;
    this.velocity = { x: 0, y: 0, magnitude: 0 };
    this.jerk = 0;
    this.circularScore = 0;
  }
  update(palmCenter) { /* ... */ }
}
```

#### 2C. Main.js Cleanup (SOC)

| Subfase | Doel | Status | Afhankelijkheden | Opmerkingen |
|---------|------|--------|------------------|-------------|
| 2.8 | Verwijder EMOTION_COLORS uit main.js | ✅ | 2.0b | Importeert uit colors.js |
| 2.9 | Verwijder gesture→emotie mapping | ✅ | 2.5 | Gebruikt EmotionDetector |
| 2.10 | main.js wordt pure orchestrator | ✅ | 2.8, 2.9 | Alleen imports en orchestratie |

### Fase 3 — Particle System (Basis) ✅ GROTENDEELS GEREED

> **YAGNI principe:** Eerst werkend met één hand, dan pas two-hand uitbreiden.
> **SOC principe:** Particle physics los van spawn-logica.

| Subfase | Doel | Status | Afhankelijkheden | Opmerkingen |
|---------|------|--------|------------------|-------------|
| 3.1 | Renderer.js - Three.js scene | ✅ | 0.4 | 160 regels, volledig werkend |
| 3.2 | ParticlePool.js - object pooling | ✅ | 3.1 | 247 regels, Float32Arrays, 10K max |
| 3.3 | Particle shaders | ✅ | 3.1 | Vert + frag met glow effect |
| 3.4 | EmotionParticles.js - basis spawn | ✅ | 3.2 | 212 regels, werkend |
| 3.5 | Emotion behaviors (4 van 5) | ✅ | 3.4 | Woede/verdriet/kalmte/neutraal (blij/bang ontbreken) |
| 3.6 | Verify: particles volgen hand | ✅ | 3.5 | Werkt via gesture-workaround |

---

### Fase 4 — Two-Hand Interactie (Creëren & Vangen) ✅ GEREED

> **Kernfeature:** Rechterhand = bron (creëert), Linkerhand = magneet (vangt).
> **DRY principe:** Magneet-force als herbruikbare utility functie.
> **SOC principe:** Interactie-logica in aparte module, niet in EmotionParticles.

| Subfase | Doel | Status | Afhankelijkheden | Opmerkingen |
|---------|------|--------|------------------|-------------|
| 4.1 | Config: twoHandInteraction | ✅ | 3.6 | CONFIG.twoHand met alle parameters |
| 4.2 | TwoHandController.js | ✅ | 4.1 | 190 regels, 4 modi: solo/createAndCatch/amplify/fusion |
| 4.3 | Magneet-aantrekking physics | ✅ | 4.2 | utils/physics.js met applyMagnetForce |
| 4.4 | Creëren & Vangen flow | ✅ | 4.3 | main.js orchestreert R→L flow |
| 4.5 | Hand-afstand detectie | ✅ | 4.2 | TwoHandController._calculateDistance() |
| 4.6 | Emotie-matching check | ✅ | 2.5 | TwoHandController detecteert match |
| 4.7 | Versterking effect | ✅ | 4.6 | EmotionParticles.setAmplify(1.5x, 1.3x) |
| 4.8 | Fusie explosie | ✅ | 4.5, 4.6 | EmotionParticles.triggerFusion() |
| 4.9 | Verify: twee-hand flow werkt | ✅ | 4.8 | Build succesvol, debug logging actief |

**TwoHandController (SOC):**
```javascript
// src/analysis/TwoHandController.js
class TwoHandController {
  update(leftHand, rightHand, leftEmotion, rightEmotion) {
    const mode = this._determineMode(leftHand, rightHand);
    // 'createAndCatch' | 'amplify' | 'fusion' | 'solo'

    return {
      mode,
      sourcePos: rightHand?.palmCenter,
      magnetPos: leftHand?.palmCenter,
      amplify: leftEmotion === rightEmotion,
      fusionTrigger: this._checkFusion(leftHand, rightHand)
    };
  }
}
```

**Magneet physics (DRY utility):**
```javascript
// src/utils/physics.js
export function applyMagnetForce(particle, magnetPos, config) {
  const dx = magnetPos.x - particle.x;
  const dy = magnetPos.y - particle.y;
  const dist = Math.sqrt(dx*dx + dy*dy);

  if (dist < config.magnetRadius) {
    const force = config.magnetStrength / (dist + 0.1);
    particle.vx += (dx / dist) * force;
    particle.vy += (dy / dist) * force;
  }
}
```

---

### Fase 5 — Polish ✅ GROTENDEELS GEREED

| Subfase | Doel | Status | Afhankelijkheden | Opmerkingen |
|---------|------|--------|------------------|-------------|
| 5.1 | HandOverlay.js - landmarks | ✅ | 1.4, 3.1 | 181 regels, skeleton visualisatie |
| 5.2 | Hand overlay fade | ✅ | 5.1 | Smooth fade in/out werkt |
| 5.3 | TextSampler.js - text → positions | ✅ | 3.2 | 120 regels, canvas sampling |
| 5.4 | TextParticles.js - morph | ✅ | 5.3 | 305 regels, morph animaties |
| 5.5 | Text animaties per emotie | ✅ | 5.4 | Vibrate/drip/pulse werken |
| 5.6 | Fusie visuele feedback | ⏳ | 4.8 | Wacht op fase 4 |
| 5.7 | Smooth transitions | ✅ | 3.5, 5.4 | easing.js met 6 functies |

### Fase 6 — Tuning & Testing

| Subfase | Doel | Status | Afhankelijkheden | Opmerkingen |
|---------|------|--------|------------------|-------------|
| 6.1 | lil-gui debug panel | ⏳ | 4.9 | Live threshold tuning |
| 6.2 | Two-hand thresholds tunen | ⏳ | 6.1 | magnetStrength, fusionDistance |
| 6.3 | Emotion thresholds tunen | ⏳ | 6.1 | velocity, jerk, circular |
| 6.4 | stats.js FPS monitor | ⏳ | 3.1 | Performance check |
| 6.5 | Performance optimalisatie | ⏳ | 6.4 | Target 60fps met 2 handen |
| 6.6 | Test in Safari | ⏳ | 5.7 | Compatibility |
| 6.7 | Test belichting | ⏳ | 5.7 | Verschillende condities |
| 6.8 | Remove debug tools | ⏳ | 6.5 | Production build |

### Fase 7 — Demo & Launch

| Subfase | Doel | Status | Afhankelijkheden | Opmerkingen |
|---------|------|--------|------------------|-------------|
| 7.1 | Recording setup | ⏳ | 6.8 | Lighting, camera angle |
| 7.2 | Solo-hand takes | ⏳ | 7.1 | Elke emotie apart |
| 7.3 | Two-hand takes | ⏳ | 7.1 | Creëren & Vangen demo |
| 7.4 | Fusie takes | ⏳ | 7.1 | Handen samen = explosie |
| 7.5 | Video editing | ⏳ | 7.2-7.4 | 60-90 sec cut |
| 7.6 | Thumbnail maken | ⏳ | 7.5 | Preview image |
| 7.7 | LinkedIn post tekst | ⏳ | 7.5 | Zie PRD concept |
| 7.8 | Deploy naar Vercel | ⏳ | 6.8 | Optioneel |
| 7.9 | Post publiceren | ⏳ | 7.6, 7.7 | Di/wo 09:00 |

---

## 5. Fasebeschrijving (detail)

🎯 **Doel:** Per fase beschrijven wat er moet gebeuren.

📘 **Toelichting:** Korte opsommingen met concrete taken en AI prompts.

### Fase 0 — Setup ✅

* **Doel:** Werkende development omgeving met correcte structuur.
* **Status:** Afgerond

### Fase 1 — Capture ✅

* **Doel:** Betrouwbare hand tracking met goede error handling.
* **Status:** Afgerond (ondersteunt al 2 handen)

### Fase 2 — Analysis ✅ GEREED

* **Doel:** Per-hand motion tracking en emotie detectie.
* **Geïmplementeerd:**
  - `HandMotionState.js` = 248 regels, trajectory buffer, EMA velocity smoothing, jerk, circularScore
  - `motionAnalyzer.js` = 160 regels, Map per hand, palm center berekening
  - `emotionDetector.js` = 285 regels, 6 emoties, hysteresis state machine (500ms)
  - `main.js` = pure orchestrator, importeert analyzers en colors.js

#### Stap 1: DRY/SOC Cleanup
| Taak | Bestand | Actie |
|------|---------|-------|
| hexToRgb centraliseren | `utils/math.js` | Verplaats uit EmotionParticles.js |
| Kleuren consolideren | `utils/colors.js` | Nieuw bestand, één source of truth |
| Easing import fixen | `TextParticles.js` | Import ipv dupliceren |
| Emotie-logica verplaatsen | `emotionDetector.js` | Uit main.js:200-214 |

#### Stap 2: Core Implementation
| Taak | Bestand | Actie |
|------|---------|-------|
| HandMotionState class | `analysis/HandMotionState.js` | Nieuw bestand |
| Motion berekeningen | `motionAnalyzer.js` | 5 TODO's invullen |
| Emotie state machine | `emotionDetector.js` | 3 TODO's invullen |
| Hysteresis | `emotionDetector.js` | 500ms delay per hand |

#### Stap 3: Main.js Cleanup
| Taak | Regel | Actie |
|------|-------|-------|
| EMOTION_COLORS verwijderen | 20-25 | Import uit colors.js |
| Gesture mapping verwijderen | 200-214 | Gebruik EmotionDetector |
| Pure orchestrator | - | Alleen aanroepen, geen logica |

* **Test criterium:** Console toont beide emoties: `L: kalmte, R: woede`

### Fase 3 — Particles (Basis) ✅ GEREED

* **Doel:** Werkend particle systeem met één hand.
* **Status:** Volledig geïmplementeerd en werkend.
* **Wat werkt:**
  - `renderer.js` - Three.js scene (160 regels)
  - `ParticlePool.js` - Object pooling met 10K max (247 regels)
  - `EmotionParticles.js` - 4 behaviors werkend (212 regels)
  - Shaders - Vertex + fragment met glow effect
* **Nog te doen:** Blij + bang behaviors toevoegen (nu alleen woede/verdriet/kalmte/neutraal)
* **Test criterium:** ✅ Particles volgen hand en veranderen per emotie.

### Fase 4 — Two-Hand (Creëren & Vangen) ✅ GEREED

* **Doel:** Twee-hand interactie met magneet-physics en fusie.
* **Geïmplementeerd:**
  - `TwoHandController.js` = 190 regels, bepaalt interactie-modus
  - `utils/physics.js` = applyMagnetForce + applyExplosionForce utilities
  - `CONFIG.twoHand` = Alle parameters (magnetStrength, fusionDistance, etc.)
  - `EmotionParticles` = setMagnet(), setAmplify(), triggerFusion() methods
* **Interactie modi:**
  | Modus | Conditie | Effect |
  |-------|----------|--------|
  | Solo | Eén hand | Particles rond die hand |
  | Creëer & Vang | Twee handen, andere emotie | R→L particle flow |
  | Versterking | Twee handen, zelfde emotie | 1.5x spawn, 1.3x size |
  | Fusie | Handen < 0.15, 300ms hold | Explosie vanuit midden |
* **Test criterium:** ✅ Build succesvol, debug logging actief.

### Fase 5 — Polish ✅ GROTENDEELS GEREED

* **Doel:** "Wow factor" voor LinkedIn - visueel memorabel.
* **Status:** Meeste componenten zijn volledig werkend.
* **Wat werkt:**
  - `HandOverlay.js` - Skeleton visualisatie met fade (181 regels)
  - `TextParticles.js` - Morph animaties per emotie (305 regels)
  - `TextSampler.js` - Canvas text sampling (120 regels)
  - `easing.js` - 6 easing functies (31 regels)
  - `math.js` - Vector utilities (39 regels)
* **Nog te doen:** Fusie visuele feedback (wacht op fase 4)

### Fase 6 — Tuning

* **Doel:** Perfecte balance tussen responsiveness en stabiliteit.
* **Taken:**
  - Debug panel voor live tuning (twee-hand parameters)
  - Performance monitoring met 2 handen
  - Cross-browser testing
  - Final optimization

### Fase 7 — Demo

* **Doel:** Professionele video voor LinkedIn impact.
* **Nieuw scenario (90 sec):**
  1. Solo emoties tonen (30 sec)
  2. Creëren & Vangen demo (30 sec) - "Vang je gevoelens!"
  3. Fusie explosie als finale (15 sec)
  4. CTA (15 sec)

---

## 6. Kwaliteit & Testplan

🎯 **Doel:** Vastleggen hoe kwaliteit wordt geborgd.

📘 **Toelichting:**

**Functionele tests - Basis:**
- [ ] Webcam permission flow (allow/deny/retry)
- [ ] Hand tracking (1 en 2 handen)
- [ ] Alle 5 emoties triggerable
- [ ] Transitions zonder flicker
- [ ] Geen crashes bij hand in/uit beeld

**Functionele tests - Two-Hand:**
- [ ] Creëren & Vangen: particles stromen R→L
- [ ] Magneet-effect: particles versnellen bij linkerhand
- [ ] Versterking: zelfde emotie = groter effect
- [ ] Fusie: handen samen = explosie
- [ ] Correcte hand-toewijzing (L=magneet, R=bron)

**Performance tests:**
- [ ] 60fps met 1 hand
- [ ] 30+ fps met 2 handen + magneet physics
- [ ] Geen memory growth (5 min test)
- [ ] MediaPipe inference < 50ms

**Browser tests:**
- [ ] Chrome (Mac)
- [ ] Safari (Mac)

---

## 7. Demo & Presentatieplan

🎯 **Doel:** Beschrijven hoe de demo wordt opgenomen en gepresenteerd.

📘 **Toelichting:**

> **Scenario (90 seconden):**
>
> **0:00-0:05 — Hook**
> "Wat als een kind emoties kan laten zien zonder woorden?"
>
> **0:05-0:25 — Solo emoties (rechterhand)**
> - Woede: Snelle hakbeweging → rode explosie
> - Verdriet: Langzame neerwaartse → blauwe druppels
> - Kalmte: Circulaire beweging → groene golven
>
> **0:25-0:50 — Creëren & Vangen (twee handen)**
> - Rechterhand maakt boze beweging (rode particles)
> - Linkerhand "vangt" de particles (magneet-effect)
> - Voice-over: "Vang je gevoelens"
>
> **0:50-1:10 — Versterking & Fusie**
> - Beide handen maken kalme cirkels → MEGA golf
> - Handen naar elkaar → FUSIE explosie
> - Voice-over: "Breng ze samen"
>
> **1:10-1:30 — CTA**
> - Tech stack overlay
> - "Interesse in AI voor therapie? Link in comments"

**Post timing:** Dinsdag of woensdag, 09:00 uur (LinkedIn prime time)

**Recording checklist:**
- [ ] Ring light of window light
- [ ] Neutrale achtergrond
- [ ] 60fps screen recording
- [ ] Solo-hand takes (3x per emotie)
- [ ] Two-hand takes (Creëren & Vangen)
- [ ] Fusie takes (handen samen)

---

## 8. Risico's & Mitigatie

🎯 **Doel:** Risico's vroeg signaleren en voorzien van oplossingen.

📘 **Toelichting:**

| Risico | Impact | Mitigatie |
|--------|--------|-----------|
| Hand tracking faalt bij opname | Hoog | Test lighting vooraf, backup takes |
| Performance issues (< 30fps) met 2 handen | Hoog | Reduce particle count naar 7K, optimize magneet physics |
| Emotie detectie inconsistent | Middel | Tune thresholds met debug panel |
| MediaPipe model laadt niet | Hoog | Error UI, retry mechanisme |
| Magneet-physics te zwak/sterk | Middel | Live tuning via lil-gui |
| Fusie triggert per ongeluk | Middel | Debounce + minimale hold-time (300ms) |
| Hand-toewijzing L/R verkeerd | Middel | Visuele indicator welke hand wat doet |
| Safari compatibility issues | Laag | Test early, Chrome als fallback |
| Video kwaliteit onvoldoende | Middel | 60fps recording, multiple takes |

---

## 9. Evaluatie & Lessons Learned

🎯 **Doel:** Reflecteren op het proces en verbeteringen vastleggen.

📘 **Toelichting:** In te vullen na afronding.

**Wat ging goed:**
-

**Wat kan beter:**
-

**Herbruikbaar voor volgende projecten:**
-

---

## 10. Referenties

🎯 **Doel:** Koppelen aan overige Mission Control documenten.

**Projectdocumenten:**
- PRD — [limbus-prd.md](./limbus-prd.md)
- FO — [limbus-fo.md](./limbus-fo.md)
- TD — [limbus-td.md](./limbus-td.md)

**Technische bronnen:**
- [MediaPipe Gesture Recognizer](https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer)
- [Three.js Documentation](https://threejs.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)

---

## 11. Programmeer Uitgangspunten

🎯 **Doel:** Code-kwaliteit principes specifiek voor dit project.

### DRY (Don't Repeat Yourself)

| Toepassing | Implementatie |
|------------|---------------|
| Per-hand state | `HandMotionState` class hergebruikt voor L+R |
| Magneet physics | `applyMagnetForce()` utility functie |
| Emotie configs | Centrale `config.js` met alle kleuren/thresholds |
| Kleur conversie | `hexToRgb()` in utils/math.js (niet in components) |
| Kleur definities | `EMOTION_COLORS` in utils/colors.js (één source of truth) |
| Easing functies | Import uit utils/easing.js (niet dupliceren) |

### SOC (Separation of Concerns)

| Layer | Verantwoordelijkheid | Mag NIET |
|-------|---------------------|----------|
| `handTracker.js` | Landmarks detecteren | Emoties bepalen |
| `motionAnalyzer.js` | Velocity/jerk berekenen | Particles spawnen |
| `emotionDetector.js` | Emotie state machine | Rendering |
| `TwoHandController.js` | Interactie-modus bepalen | Physics berekenen |
| `EmotionParticles.js` | Particles renderen | Hand tracking |
| `main.js` | **Alleen orchestratie** | Business logic, kleur definities |
| `utils/colors.js` | Kleur definities | Rendering, emotie logica |
| `utils/math.js` | Pure math utilities | State, rendering |

### YAGNI (You Ain't Gonna Need It)

| Niet bouwen | Waarom niet |
|-------------|-------------|
| Meerdere magneten | Eén linkerhand is genoeg |
| Gesture recognition | Bewegingspatronen zijn voldoende |
| Particle trails | Overcomplicatie, niet nodig voor demo |
| Multi-user support | Alleen voor LinkedIn demo |
| Config persistence | Elke sessie tunen is OK |

---

*Bouwplan v2.4 — Colin Lit — 11 januari 2026*

**Versiehistorie:**
| Versie | Datum | Wijziging |
|--------|-------|-----------|
| v1.0 | - | Initieel bouwplan |
| v1.1 | 11-01 | Status updates |
| v2.0 | 11-01 | Two-Hand Creëren & Vangen feature toegevoegd |
| v2.1 | 11-01 | Codebase scan: statussen gecorrigeerd, fase 2 = STUB, fase 3+5 = GEREED |
| v2.2 | 11-01 | DRY/SOC cleanup taken toegevoegd aan fase 2 (2.0a-d, 2.8-2.10) |
| v2.3 | 11-01 | Fase 2 GEREED: HandMotionState, MotionAnalyzer, EmotionDetector, main.js integratie |
| v2.4 | 11-01 | Fase 4 GEREED: TwoHandController, physics.js, magnet/amplify/fusion in EmotionParticles |
