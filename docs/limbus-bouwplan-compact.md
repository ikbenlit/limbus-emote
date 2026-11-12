# Mission Control - Compact Bouwplan Limbus

Projectnaam: Limbus - Gesture-Based Emotion Visualizer
Versie: v1.1 (geintegreerd met demo concept)
Datum: 2026-01-12
Auteur: Colin Lit

---

## 1. Doel en Positionering

### De Hook
> "Gesture + particles = niet nieuw. Dit bouwen in één avond = 2026."

### Sentiment
- Speels, experimenteel, geen grote claims
- "Gewoon aan het spelen met AI tools"
- Toegankelijkheid van AI in 2026 benadrukken
- Impliciete GGZ-hint via emotie-voorbeelden (niet expliciet claimen)

### Doelgroep
- LinkedIn: developers, AI-geinteresseerden, GGZ-innovators
- Laat hen zelf de connectie maken naar toepassingen

### Output
Demo die handgebaren realtime vertaalt naar woorden + emotionele particle visuals voor een LinkedIn showcase (60-90s screen recording).

---

## 2. Uitgangspunten

### 2.1 Technische stack
- Frontend: Vite + Vanilla JS (ES modules)
- Rendering: Three.js
- Hand tracking: MediaPipe GestureRecognizer
- Package manager: pnpm
- Hosting: optioneel Vercel

### 2.2 Projectkaders
- Target: MacBook webcam, Chrome primair
- Geen backend, alles client-side
- Demo output: 60-90s screen recording

### 2.3 Programmeer uitgangspunten
- DRY: configuratie in `src/config.js`, utils in `src/utils/`
- SOC: `capture/`, `analysis/`, `render/` gescheiden; `src/main.js` alleen orchestratie
- KISS: alleen features die in de demo zichtbaar zijn
- YAGNI: geen extra emotie-scenario's, persistence, of multi-user

---

## 3. Interactie Design

### Rechterhand = BOODSCHAP kiezen

#### Cijfer-gebaren (tekst)

| Gebaar | Tekst | Visueel | Detectie |
|--------|-------|---------|----------|
| 1 vinger | "POWER" | Rood/oranje particles, energie, pulserend | `fingerCount === 1` |
| 2 vingers | "FLOW" | Blauw/paars particles, vloeiend, beweging | `fingerCount === 2` |
| 3 vingers | "CALM" | Groen/turquoise particles, zacht, rustgevend | `fingerCount === 3` |

#### Emotie-gebaren

| Gebaar | Tekst | Kleur | Detectie |
|--------|-------|-------|----------|
| Vuist | "WOEDE" | Rood (#FF3300 -> #FF6600) | `isClosedFist` |
| Open hand (stil) | "RUST" | Groen (#00FF88 -> #0088FF) | `isOpenPalm` + lage velocity |
| Open hand + beweging | "BLIJ" | Geel/goud (#FFD700 -> #FFA500) | `isOpenPalm` + hoge velocity |

### Linkerhand = INTERACTIE met tekst

| Gebaar | Actie | Effect |
|--------|-------|--------|
| Vuist -> open | **Explode** | Woord explodeert spectaculair in particles |
| Open -> vuist | **Catch/Implode** | Particles worden naar vuist gezogen |

### Kleurenpalet

| Emotie/Tekst | Primair | Secundair | Particle stijl |
|--------------|---------|-----------|----------------|
| POWER | #FF3300 | #FF6600 | Energie, pulserend |
| FLOW | #0044FF | #6600FF | Vloeiend, golvend |
| CALM | #00FF88 | #0088FF | Zacht, zwevend |
| WOEDE | #FF3300 | #FF6600 | Agressief, explosief |
| RUST | #00FF88 | #0088FF | Kalm, langzaam |
| BLIJ | #FFD700 | #FFA500 | Sparkles, fireworks |

---

## 4. Demo Flow (60 seconden)

| Tijd | Scene | Actie |
|------|-------|-------|
| 0:00-0:05 | **Intro** | Hand komt in beeld |
| 0:05-0:12 | **POWER** | 1 vinger -> tekst "POWER" verschijnt, rode pulserende particles |
| 0:12-0:18 | **FLOW** | 2 vingers -> tekst morpht naar "FLOW", blauwe vloeiende particles |
| 0:18-0:24 | **CALM** | 3 vingers -> tekst morpht naar "CALM", groene zachte particles |
| 0:24-0:32 | **WOEDE** | Vuist -> tekst "WOEDE", rode agressieve particles |
| 0:32-0:38 | **EXPLODE** | Linkerhand: vuist -> open, "WOEDE" explodeert spectaculair |
| 0:38-0:44 | **RUST** | Open hand stil -> tekst "RUST", groene kalmerende particles |
| 0:44-0:50 | **BLIJ** | Open hand + beweging -> tekst "BLIJ", gele sparkle particles |
| 0:50-0:56 | **CATCH** | Linkerhand: open -> vuist, particles imploderen naar vuist |
| 0:56-1:00 | **Outro** | "MediaPipe + Three.js + een avond" |

---

## 5. Epics en Stories Overzicht

| Epic ID | Titel | Doel | Status | Stories |
|---------|-------|------|--------|---------|
| E0 | Opschonen en baseline | repo en entrypoints strak | Done | 3 |
| E1 | Demo interacties en mapping | gebaren -> woorden/acties | Done | 6 |
| E2 | Demo polish en tuning | visuele impact en stabiliteit | In Progress | 5 |
| E3 | QA en demo readiness | performance en cross-browser | To Do | 3 |
| E4 | Demo output | opname en presentatie | To Do | 3 |

---

## 6. Epics en Stories (detail)

### Epic 0 - Opschonen en baseline

| Story ID | Beschrijving | Acceptatiecriteria | Status |
|----------|--------------|-------------------|--------|
| E0.S1 | Duidelijke entrypoints | Alleen `index.html` -> `src/main.js` is actief | Done |
| E0.S2 | Repo hygiene | `.gitignore` dekt `node_modules/`, `dist/`, `.DS_Store` | Done |
| E0.S3 | Debug output | Logs achter debug flag of beperkt tot init-errors | Done |

### Epic 1 - Demo interacties en mapping

| Story ID | Beschrijving | Acceptatiecriteria | Status |
|----------|--------------|-------------------|--------|
| E1.S1 | Vinger-telling (rechterhand) | 1/2/3 vingers -> POWER/FLOW/CALM | Done |
| E1.S2 | Emotie-mapping (rechterhand) | Vuist=WOEDE, open stil=RUST, open beweging=BLIJ | Done |
| E1.S3 | Linkerhand explode/implode | Vuist->open = explode, open->vuist = catch/implode | Done |
| E1.S4 | Tekstlabels uitbreiden | POWER/FLOW/CALM/WOEDE/RUST/BLIJ | Done |
| E1.S5 | Sparkle effect (BLIJ) | Visueel andere particle stijl | Done |
| E1.S6 | Demo flow in code | Volgorde matcht 60s flow | Done |

### Epic 2 - Demo polish en tuning

| Story ID | Beschrijving | Acceptatiecriteria | Status |
|----------|--------------|-------------------|--------|
| E2.S1 | Fusie feedback | Fusion heeft duidelijke visuele accent | Done |
| E2.S2 | Live tuning | lil-gui panel voor thresholds actief | Done |
| E2.S3 | Performance monitor | stats.js toont fps in dev | Done |
| E2.S4 | Thresholds tunen | two-hand en emotie thresholds voelen stabiel | In Progress |
| E2.S5 | Visuele polish | grotere particles, vignette/bloom, hand indicator tweaks | To Do |

**Visuele polish checklist (E2.S5):**
- [ ] Bloom/glow post-processing
- [ ] Grotere, duidelijkere particles
- [ ] Vignette achtergrond
- [ ] Smooth transitions tussen states
- [ ] Hand indicator mooier maken (of weghalen)

### Epic 3 - QA en demo readiness

| Story ID | Beschrijving | Acceptatiecriteria | Status |
|----------|--------------|-------------------|--------|
| E3.S1 | Smoke test | 1 hand en 2 hand flows werken | To Do |
| E3.S2 | Performance test | 60 fps (1 hand) en 30+ fps (2 handen) | To Do |
| E3.S3 | Cross-browser | Chrome en Safari getest | To Do |

### Epic 4 - Demo output

| Story ID | Beschrijving | Acceptatiecriteria | Status |
|----------|--------------|-------------------|--------|
| E4.S1 | Recording setup | lighting, camera angle, 60 fps recording | To Do |
| E4.S2 | Takes opnemen | volg demo flow (sectie 4) | To Do |
| E4.S3 | Edit en CTA | 60-90s edit + thumbnail + post tekst | To Do |

---

## 7. Technische Referentie

### Gesture Detectie (pseudocode)

```javascript
// Rechterhand - cijfers
if (fingerCount(rightHand) === 1) -> "POWER"
if (fingerCount(rightHand) === 2) -> "FLOW"
if (fingerCount(rightHand) === 3) -> "CALM"

// Rechterhand - emoties
if (isClosedFist(rightHand)) -> "WOEDE"
if (isOpenPalm(rightHand) && velocity < LOW_THRESHOLD) -> "RUST"
if (isOpenPalm(rightHand) && velocity > HIGH_THRESHOLD) -> "BLIJ"

// Linkerhand - interacties
if (wasClosedFist && isOpenPalm(leftHand)) -> triggerExplode()
if (wasOpenPalm && isClosedFist(leftHand)) -> triggerImplode()
```

### Component Status

| Component | Status | Notities |
|-----------|--------|----------|
| Vinger telling | Done | Landmarks analyseren |
| Velocity detectie | Done | Gebruikt voor RUST vs BLIJ |
| Vuist/palm detectie | Done | Bestaand |
| Text particles | Done | Uitgebreid met explode/implode |
| Explode effect | Done | Aangepast voor text |
| Implode/catch | Done | Aangepast voor text |
| Twee-hand rollen | Done | Rechts=source, Links=interact |
| Sparkle effect (BLIJ) | Done | Nieuwe particle stijl |

---

## 8. Kwaliteit en Testplan

### Manual checklist
- [ ] Webcam permissions werken
- [ ] 1 hand gestures: POWER, FLOW, CALM, WOEDE, RUST, BLIJ
- [ ] 2 hand interacties: explode, implode
- [ ] Emotie switching is stabiel (geen flicker)
- [ ] Fusion trigger werkt

### Performance targets
- 60 fps (1 hand), 30+ fps (2 handen)
- 5 min run zonder memory growth
- MediaPipe inference onder 50 ms

### Pre-demo checklist
- [ ] Debug tools uit
- [ ] Build via `pnpm run build`
- [ ] Test in Chrome en Safari

---

## 9. LinkedIn Post (concept)

```
Gesture + particles = niet nieuw.
Dit bouwen in een avond = 2026.

Gewoon aan het spelen met MediaPipe...
En toen: wat als woorden zichtbaar worden?

1 vinger -> POWER
2 vingers -> FLOW
3 vingers -> CALM
Vuist -> WOEDE -> explodeert
Open hand -> RUST -> vloeit
Zwaaien -> BLIJ -> sparkles
Vangen -> particles volgen je

Geen product. Geen pitch. Gewoon bouwen.

Maar stiekem denk ik:
-> Kinderen die niet kunnen uitleggen wat ze voelen
-> Interactieve installaties
-> Of gewoon een hele toffe screensaver

Tech: MediaPipe + Three.js + een avond

Wat zou jij ermee doen?

#AI #WebDev #JustBuild #CreativeCoding
```

---

## 10. Definition of Done

### Minimum voor demo
- [x] Rechterhand cijfers: 1/2/3 vingers -> POWER/FLOW/CALM
- [x] Rechterhand emoties: vuist -> WOEDE, open stil -> RUST, open beweging -> BLIJ
- [x] Linkerhand: explode en implode werken
- [ ] Visueel spectaculair genoeg voor video
- [ ] 60fps, geen lag
- [ ] Screen recording gemaakt

### Nice to have (v2)
- [ ] Vinger swipe interactie
- [ ] Post-processing effects
- [ ] Hosted versie op ikbenlit.nl

---

*Laatst bijgewerkt: 12 januari 2026*
