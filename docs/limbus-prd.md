# 📄 PRD – Limbus

**Project:** Limbus - Gesture-Based Emotion Visualizer  
**Type:** Prototype/Demo (LinkedIn content)  
**Versie:** v0.9  
**Datum:** 11 januari 2026  
**Auteur:** Colin Lit  

---

## 🎯 Doelstelling

**Een werkend prototype voor LinkedIn demo** dat in 60-90 seconden laat zien:
*"Emoties visualiseren via handgebaren – potentie voor GGZ/therapie"*

### Waarom
- Toon technical capabilities (MediaPipe + Three.js)
- Genereer inbound interesse van GGZ-sector
- Content piece voor portfolio/pitches
- Geen product bouwen, maar mogelijkheden demonstreren

### Success = 
- LinkedIn post met 50+ likes, 10+ comments, 2+ leads
- Herbruikbaar in Pinkroccade/client demos
- Opname-ready binnen 2 dagen

---

## 👥 Doelgroep

**LinkedIn publiek:**
- GGZ-professionals & innovators
- AI consultants & developers
- Potentiële klanten (instellingen, Pinkroccade)
- Tech community (viral potential)

**Niet:** Eindgebruikers/patiënten (die zien alleen de demo video)

---

## ✅ MVP Scope

### Wat WEL

**1. Hand Tracking**
- MediaPipe Hands integration
- Real-time tracking (1-2 handen)
- Smooth performance (30+ fps)

**2. Drie Emoties** (genoeg voor demo impact)

| Emotie | Gesture | Visualisatie | Kleur |
|--------|---------|--------------|-------|
| **Boos/Woede** | Snelle, hakkende beweging | Explosieve, chaotische particles | Rood |
| **Verdriet** | Langzame, neerwaartse beweging | Zwaar dalende particles | Blauw/Paars |
| **Rust/Kalmte** | Vloeiende, circulaire beweging | Harmonieuze golven | Groen |

**3. Clean UI**
- Fullscreen particle canvas
- Hand silhouette overlay (toon tracking)
- Emotie label (welke emotie actief is)
- Minimale UI (niet afleidend)

**4. Screen Recording Friendly**
- 60fps rendering
- Geen webcam feed in beeld (privacy)
- Duidelijke visuele feedback

### Wat NIET

❌ Dashboard/therapeut view  
❌ Sessie opslag/database  
❌ Meer dan 3 emoties  
❌ Audio feedback  
❌ Login/authenticatie  
❌ EPD integratie (alleen claimen in post)  
❌ Data export functionaliteit  

---

## 🎬 Demo Flow (60 seconden video)

```
0:00-0:10  Hook
           "Wat als patiënten hun emoties kunnen tonen zonder woorden?"
           → Logo + tagline

0:10-0:25  Demo 1: Boos
           → Snelle handbeweging
           → Rode explosieve particles
           → Label: "Woede"

0:25-0:40  Demo 2: Verdriet  
           → Langzame beweging naar beneden
           → Blauwe dalende particles
           → Label: "Verdriet"

0:40-0:55  Demo 3: Rust
           → Vloeiende circulaire beweging
           → Groene golvende particles
           → Label: "Kalmte"

0:55-1:00  CTA
           "Gebouwd met MediaPipe + Three.js"
           "Mogelijkheden voor GGZ? → ikbenlit.nl"
```

---

## 💬 LinkedIn Post (Concept)

```markdown
🖐️ Wat als je emoties kon tonen zonder woorden?

Ik bouwde Limbus – een gesture visualizer die 
handgebaren vertaalt naar emotionele expressie.

Waarom dit interessant is voor de GGZ:
→ Trauma-patiënten die moeilijk verbaliseren
→ Kinderen/jeugdzorg (alternatieve communicatie)  
→ Autisme spectrum (non-verbale expressie)

Tech stack:
→ MediaPipe Hands (real-time tracking)
→ Three.js (particle engine)
→ Gebouwd in 2 dagen

Dit is geen product (yet), maar een exploration 
van wat mogelijk is.

Zie jij toepassingen? 👇

#AI #GGZ #Innovation #HealthTech #WebDev

[VIDEO DEMO]
```

**Post timing:** Dinsdag of woensdag, 09:00 uur

---

## 🛠 Tech Stack

**Frontend:**
- SvelteKit (single page app)
- Three.js (particle rendering)
- MediaPipe Hands (@mediapipe/tasks-vision)
- Tailwind CSS

**Hosting:**
- Firebase Hosting of Vercel
- Domain: ikbenlit.nl/Limbus (optional)

**Development:**
- Vite
- Lokale development (geen backend)

---

## 📋 User Flow

### Prototype Usage
1. Open app in browser
2. Allow webcam access
3. Beweeg handen voor camera
4. Zie particles reageren op beweging
5. Emotie wordt herkend en getoond

### Demo Recording Flow
1. Setup goede belichting
2. Open app fullscreen
3. Start screen recording (60fps)
4. Demonstreer 3 emoties
5. Record multiple takes
6. Edit beste shots samen

---

## ⚠️ Risico's & Mitigatie

| Risico | Impact | Mitigatie |
|--------|--------|-----------|
| Hand tracking faalt bij opname | Hoog | Test setup vooraf, backup lighting, multiple takes |
| Performance issues (laggy) | Middel | Limiteer particles tot 5k, test op MacBook |
| Video kwaliteit niet goed | Middel | 60fps opname, edit in DaVinci/iMovie |
| LinkedIn post flopt | Laag | Prime time posting, seed met netwerk |
| Webcam privacy concerns | Laag | Geen opslag, duidelijk in post vermelden |

---

## 📊 Success Criteria

### Demo Kwaliteit
✅ Smooth 30+ fps performance  
✅ Duidelijk onderscheid tussen 3 emoties  
✅ Screen recording ziet er professioneel uit  
✅ Geen crashes tijdens demo  

### LinkedIn Impact
✅ 50+ likes  
✅ 10+ betekenisvolle comments  
✅ 2+ DM's van potentiële klanten  
✅ 3+ shares  

### Business Value
✅ Herbruikbaar in pitch decks  
✅ Portfolio piece voor ikbenlit.nl  
✅ Minimaal 1 lead conversation  

---

## 🚀 Roadmap

### v0.9 - Demo Prototype (deze week)
- Hand tracking + 3 emoties
- Clean UI
- Demo video opname

### v1.0 - Public Demo (optioneel)
- Online speelbaar op ikbenlit.nl/Limbus
- "Try it yourself" functionaliteit
- 5-7 emoties

### v2.0 - Pilot Ready (bij interesse)
- Therapeut dashboard
- Sessie data export
- EPD integratie prep

---

## 📦 Deliverables

**Week 1:**
- [ ] Werkende prototype (lokaal)
- [ ] Screen recording (60-90 sec)
- [ ] LinkedIn post + video
- [ ] (Optional) Hosted demo link

**Week 2 (bij interesse):**
- [ ] Blog post: "How I built Limbus"
- [ ] Landing page met meer info
- [ ] Extended demo met meer emoties

---

## 🎨 Visual Specs

### Emotie Mappings (Detail)

**BOOS/WOEDE**
```
Trigger: Hand velocity > threshold + closing fist
Particles: 
  - Count: 5000
  - Color: #FF0000 → #FF6600 gradient
  - Motion: Explosive radial burst
  - Size: 0.05-0.15
  - Lifetime: 0.5-1.5s
```

**VERDRIET**
```
Trigger: Hand velocity < threshold + downward motion
Particles:
  - Count: 3000
  - Color: #0044FF → #6600FF gradient
  - Motion: Slow downward drift (gravity)
  - Size: 0.03-0.08
  - Lifetime: 2-4s
```

**RUST/KALMTE**
```
Trigger: Smooth circular motion + moderate velocity
Particles:
  - Count: 4000
  - Color: #00FF88 → #0088FF gradient
  - Motion: Sine wave flow
  - Size: 0.02-0.06
  - Lifetime: 3-5s
```

---

## 🧪 Testing Checklist

**Pre-recording:**
- [ ] Webcam access werkt smooth
- [ ] Lighting setup getest
- [ ] Hand tracking accuraat
- [ ] Alle 3 emoties triggerbaar
- [ ] No lag/stutter

**Recording:**
- [ ] Multiple takes per emotie
- [ ] Different angles/speeds
- [ ] Transitions tussen emoties
- [ ] B-roll (close-ups, wide shots)

**Post:**
- [ ] Video edited & exported
- [ ] Thumbnail image
- [ ] LinkedIn text finalized
- [ ] Tags/mentions prepped

---

## 💡 Vervolg Opties

**Als post viral gaat:**
- V2 met meer emoties + audio
- Blog series over build process
- Open source de code

**Als er klant interesse komt:**
- Demo meeting bij GGZ-instelling
- Pilot met Talar/andere psychiater
- Upgrade naar therapist tool

**Als het flopt:**
- Lessons learned doc
- Code hergebruiken voor ander project
- Portfolio piece blijft staan

---

## 📝 Next Actions

**Vandaag (dag 1):**
1. Approve PRD
2. Setup project (SvelteKit + deps)
3. Basic hand tracking werkend

**Morgen (dag 2):**
1. Implement 3 emotie mappings
2. Polish UI/visuals
3. Test & debug

**Overmorgen (dag 3):**
1. Setup recording environment
2. Record demo video
3. Edit & finalize
4. Schedule LinkedIn post

**Let's build! 🚀**

---

*PRD Sign-off: Colin Lit - 11 jan 2026*
