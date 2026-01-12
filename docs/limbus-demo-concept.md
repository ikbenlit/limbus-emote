# 🎬 Limbus Demo Concept

**Datum:** 12 januari 2025  
**Status:** Brainstorm → Ready to build

---

## 🎯 Positionering

### De Hook
> "Gesture + particles = niet nieuw. Dit bouwen in één avond = 2026."

### Sentiment
- Speels, experimenteel, geen grote claims
- "Gewoon aan het spelen met AI tools"
- Toegankelijkheid van AI in 2026 benadrukken
- Impliciete GGZ-hint via emotie-voorbeelden (niet expliciet claimen)

### Doelgroep
- LinkedIn: developers, AI-geïnteresseerden, GGZ-innovators
- Laat hen zelf de connectie maken naar toepassingen

---

## 🕹️ Interactie Design

### Rechterhand = BOODSCHAP kiezen

#### Cijfer-gebaren (tekst)

| Gebaar | Tekst | Visueel |
|--------|-------|---------|
| ☝️ 1 vinger | "POWER" | Rood/oranje particles, energie, pulserend |
| ✌️ 2 vingers | "FLOW" | Blauw/paars particles, vloeiend, beweging |
| 🤟 3 vingers | "CALM" | Groen/turquoise particles, zacht, rustgevend |

#### Emotie-gebaren

| Gebaar | Tekst | Kleur | Detectie |
|--------|-------|-------|----------|
| ✊ Vuist | "WOEDE" | Rood (#FF3300 → #FF6600) | `isClosedFist` |
| 🖐️ Open hand (stil) | "RUST" | Groen (#00FF88 → #0088FF) | `isOpenPalm` + lage velocity |
| 👋 Open hand + beweging | "BLIJ" | Geel/goud (#FFD700 → #FFA500) | `isOpenPalm` + hoge velocity |

### Linkerhand = INTERACTIE met tekst

| Gebaar | Actie | Effect |
|--------|-------|--------|
| ✊→🖐️ Vuist openen | **Explode** | Woord explodeert spectaculair in particles |
| 🖐️→✊ Hand sluiten | **Catch/Implode** | Particles worden naar vuist gezogen |

### Nice-to-have (v2)

| Gebaar | Actie | Effect |
|--------|-------|--------|
| ☝️ Wijsvinger | **Swipe** | Door tekst vegen, letters wijken uit |

---

## 📽️ Demo Flow (60 seconden)

| Tijd | Wat gebeurt er |
|------|----------------|
| 0:00-0:05 | **Intro** - Hand komt in beeld |
| 0:05-0:12 | **POWER** - ☝️ 1 vinger → tekst "POWER" verschijnt, rode pulserende particles |
| 0:12-0:18 | **FLOW** - ✌️ 2 vingers → tekst morpht naar "FLOW", blauwe vloeiende particles |
| 0:18-0:24 | **CALM** - 🤟 3 vingers → tekst morpht naar "CALM", groene zachte particles |
| 0:24-0:32 | **WOEDE** - ✊ Vuist → tekst "WOEDE", rode agressieve particles |
| 0:32-0:38 | **EXPLODE** - Linkerhand: vuist → open, "WOEDE" explodeert spectaculair |
| 0:38-0:44 | **RUST** - 🖐️ Open hand stil → tekst "RUST", groene kalmerende particles |
| 0:44-0:50 | **BLIJ** - 👋 Open hand + beweging → tekst "BLIJ", gele sparkle particles |
| 0:50-0:56 | **CATCH** - Linkerhand: open → vuist, particles imploderen naar vuist |
| 0:56-1:00 | **Outro** - "MediaPipe + Three.js + één avond" |

---

## 📝 LinkedIn Post (concept)

```
Gesture + particles = niet nieuw.
Dit bouwen in één avond = 2026.

Gewoon aan het spelen met MediaPipe...
En toen: wat als woorden zichtbaar worden?

☝️ 1 vinger → POWER
✌️ 2 vingers → FLOW  
🤟 3 vingers → CALM
✊ Vuist → WOEDE → explodeert
🖐️ Open hand → RUST → vloeit
👋 Zwaaien → BLIJ → sparkles
🤏 Vangen → particles volgen je

Geen product. Geen pitch. Gewoon bouwen.

Maar stiekem denk ik:
→ Kinderen die niet kunnen uitleggen wat ze voelen
→ Interactieve installaties  
→ Of gewoon een hele toffe screensaver

Tech: MediaPipe + Three.js + een avond

Wat zou jij ermee doen?

#AI #WebDev #JustBuild #CreativeCoding
```

---

## 🛠️ Technische Aanpak

### Gesture Detectie

```javascript
// Rechterhand - cijfers
if (fingerCount(rightHand) === 1) → "POWER"
if (fingerCount(rightHand) === 2) → "FLOW"
if (fingerCount(rightHand) === 3) → "CALM"

// Rechterhand - emoties
if (isClosedFist(rightHand)) → "WOEDE"
if (isOpenPalm(rightHand) && velocity < LOW_THRESHOLD) → "RUST"
if (isOpenPalm(rightHand) && velocity > HIGH_THRESHOLD) → "BLIJ"

// Linkerhand - interacties
if (wasClosedFist && isOpenPalm(leftHand)) → triggerExplode()
if (wasOpenPalm && isClosedFist(leftHand)) → triggerImplode()
```

### Kleurenpalet

| Emotie/Tekst | Primair | Secundair | Particle stijl |
|--------------|---------|-----------|----------------|
| POWER | #FF3300 | #FF6600 | Energie, pulserend |
| FLOW | #0044FF | #6600FF | Vloeiend, golvend |
| CALM | #00FF88 | #0088FF | Zacht, zwevend |
| WOEDE | #FF3300 | #FF6600 | Agressief, explosief |
| RUST | #00FF88 | #0088FF | Kalm, langzaam |
| BLIJ | #FFD700 | #FFA500 | Sparkles, fireworks |

### Benodigde Componenten

| Component | Status | Actie |
|-----------|--------|-------|
| Vinger telling | 🔨 Bouwen | Landmarks analyseren |
| Velocity detectie | ✅ Bestaat | Gebruiken voor RUST vs BLIJ |
| Vuist/palm detectie | ✅ Bestaat | Gebruiken |
| Text particles | ✅ Bestaat | Uitbreiden met explode/implode |
| Explode effect | ⚠️ Fusion bestaat | Aanpassen voor text |
| Implode/catch | ⚠️ Magnet bestaat | Aanpassen voor text |
| Twee-hand rollen | 🔨 Bouwen | Rechts=source, Links=interact |
| Sparkle effect (BLIJ) | 🔨 Bouwen | Nieuwe particle stijl |

### Visuele Verbeteringen (demo-ready)

- [ ] Bloom/glow post-processing
- [ ] Grotere, duidelijkere particles
- [ ] Vignette achtergrond
- [ ] Smooth transitions tussen states
- [ ] Hand indicator mooier maken (of weghalen)

---

## ✅ Definition of Done

### Minimum voor demo

- [ ] Rechterhand cijfers: 1/2/3 vingers → POWER/FLOW/CALM
- [ ] Rechterhand emoties: vuist → WOEDE, open stil → RUST, open beweging → BLIJ
- [ ] Linkerhand: explode en implode werken
- [ ] Visueel spectaculair genoeg voor video
- [ ] 60fps, geen lag
- [ ] Screen recording gemaakt

### Nice to have

- [ ] Vinger swipe interactie
- [ ] Post-processing effects
- [ ] Hosted versie op ikbenlit.nl

---

*Laatst bijgewerkt: 12 januari 2025*
