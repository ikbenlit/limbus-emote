# Mission Control - Compact Bouwplan Limbus

Projectnaam: Limbus - Gesture-Based Emotion Visualizer  
Versie: v1.0  
Datum: 2026-01-12  
Auteur: Colin Lit

## 1. Doel en context
We leveren een demo die handgebaren realtime vertaalt naar woorden + emotionele particle visuals voor een LinkedIn showcase. Dit volgt het demo‑concept (hook: “Gesture + particles = niet nieuw. Dit bouwen in één avond = 2026.”) en de flow in `docs/demo-concept.md`. Context en requirements staan in `docs/limbus-prd.md` en `docs/limbus-fo.md`.

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
- DRY: configuratie in `src/config.js`, utils in `src/utils/`.
- SOC: `capture/`, `analysis/`, `render/` gescheiden; `src/main.js` alleen orchestratie.
- KISS: alleen features die in de demo zichtbaar zijn.
- YAGNI: geen extra emotie-scenario's, persistence, of multi-user.

## 3. Epics en Stories Overzicht
| Epic ID | Titel | Doel | Status | Stories |
| --- | --- | --- | --- | --- |
| E0 | Opschonen en baseline | repo en entrypoints strak | Done | 3 |
| E1 | Demo interacties en mapping | gebaren → woorden/acties | To Do | 6 |
| E2 | Demo polish en tuning | visuele impact en stabiliteit | In Progress | 5 |
| E3 | QA en demo readiness | performance en cross-browser | To Do | 3 |
| E4 | Demo output | opname en presentatie | To Do | 3 |

## 4. Epics en Stories (compact)
### Epic 0 - Opschonen en baseline
| Story ID | Beschrijving | Acceptatiecriteria | Status |
| --- | --- | --- | --- |
| E0.S1 | Duidelijke entrypoints | Alleen `index.html` -> `src/main.js` is actief | Done |
| E0.S2 | Repo hygiene | `.gitignore` dekt `node_modules/`, `dist/`, `.DS_Store` | Done |
| E0.S3 | Debug output | Logs achter debug flag of beperkt tot init-errors | Done |

### Epic 1 - Demo interacties en mapping
| Story ID | Beschrijving | Acceptatiecriteria | Status |
| --- | --- | --- | --- |
| E1.S1 | Vinger‑telling (rechterhand) | 1/2/3 vingers → POWER/FLOW/CALM | Done |
| E1.S2 | Emotie‑mapping (rechterhand) | Vuist=WOEDE, open stil=RUST, open beweging=BLIJ | Done |
| E1.S3 | Linkerhand explode/implode | Vuist→open = explode, open→vuist = catch/implode | Done |
| E1.S4 | Tekstlabels uitbreiden | POWER/FLOW/CALM/WOEDE/RUST/BLIJ | Done |
| E1.S5 | Sparkle effect (BLIJ) | Visueel andere particle stijl | Done |
| E1.S6 | Demo flow in code | Volgorde matcht 60s flow in `docs/demo-concept.md` | Done |

### Epic 2 - Demo polish en tuning
| Story ID | Beschrijving | Acceptatiecriteria | Status |
| --- | --- | --- | --- |
| E2.S1 | Fusie feedback | Fusion heeft duidelijke visuele accent | Done |
| E2.S2 | Live tuning | lil-gui panel voor thresholds actief | Done |
| E2.S3 | Performance monitor | stats.js toont fps in dev | Done |
| E2.S4 | Thresholds tunen | two-hand en emotie thresholds voelen stabiel | In Progress |
| E2.S5 | Visuele polish (optioneel) | grotere particles, vignette/bloom, hand indicator tweaks | To Do |

### Epic 3 - QA en demo readiness
| Story ID | Beschrijving | Acceptatiecriteria | Status |
| --- | --- | --- | --- |
| E3.S1 | Smoke test | 1 hand en 2 hand flows werken | To Do |
| E3.S2 | Performance test | 60 fps (1 hand) en 30+ fps (2 handen) | To Do |
| E3.S3 | Cross-browser | Chrome en Safari getest | To Do |

### Epic 4 - Demo output
| Story ID | Beschrijving | Acceptatiecriteria | Status |
| --- | --- | --- | --- |
| E4.S1 | Recording setup | lighting, camera angle, 60 fps recording | To Do |
| E4.S2 | Takes opnemen | volg demo flow uit `docs/demo-concept.md` | To Do |
| E4.S3 | Edit en CTA | 60-90s edit + thumbnail + post tekst | To Do |

## 5. Kwaliteit en Testplan (kort)
- Manual checklist: webcam permissions, 1 en 2 handen, emotie switching, fusion trigger.
- Performance: 5 min run zonder memory growth, MediaPipe inference onder 50 ms.
- Pre-demo: debug tools uit, build via `pnpm run build`.

## 6. Demo en Presentatie (kort)
Scenario: volg de 60s flow uit `docs/demo-concept.md` (POWER → FLOW → CALM → WOEDE → EXPLODE → RUST → BLIJ → CATCH → outro).

## 7. Opschoonlijst (nu)
- Verifieer of root `main.js` en `style.css` nog nodig zijn; zo niet, verwijderen.
- Voeg `.gitignore` toe voor build output en lokale artifacts.
- Bepaal of `dist/` en `node_modules/` uit de repo mogen.
- Centraliseer debug logging (optioneel `CONFIG.debug`) en voorkom console spam.
