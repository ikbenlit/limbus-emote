# Probleem Analyse: Vingergebaren & Visual Cleanup

## Datum: 14 januari 2026

## 🔍 Kernprobleem

De applicatie heeft momenteel **twee conflicterende systemen** die tegelijk actief zijn:

1. **Motion-based emoties** (beweging van de hand → emotie → particles)
2. **Finger gesture labels** (aantal vingers omhoog → label → text)

Deze twee systemen interfereren met elkaar, waardoor de ervaring rommelig en onduidelijk wordt.

---

## 📊 Huidige Situatie

### Code Flow (main.js, regels 341-351):

```javascript
// Get emotion from detector (motion-based with hysteresis)
let newEmotion = this.emotionDetector.getEmotion(primaryHand.handId);

// PROBLEEM: vingergebaar overschrijft de emotie
if (gestureState.rightLabel) {
  newEmotion = gestureState.rightLabel;  // 'power', 'flow', of 'calm'
}

// Update emotion for particles
if (newEmotion !== this.currentEmotion) {
  this.currentEmotion = newEmotion;
  this.emotionParticles.setEmotion(newEmotion);     // ❌ SPAWNT PARTICLES
  this.textParticles.setEmotion(newEmotion, ...);    // ✅ TOONT TEXT
}
```

### Wat er fout gaat:

#### 1. **Particles spawnen tijdens vingergebaren**
   - Wanneer je 1, 2 of 3 vingers omhoog houdt
   - Worden er particles gegenereerd op je rechterhand
   - Dit is verwarrend want je wil alleen tekst zien

#### 2. **Rommelige visuals**
   - Te veel effecten tegelijk actief
   - Particles + text + hand overlay allemaal door elkaar
   - Onduidelijk wat de focus is

#### 3. **Onduidelijke tekst**
   - De pixelated tekst is soms moeilijk te lezen
   - Te klein of te sparse
   - Animaties maken het nog moeilijker

---

## 🎯 Gewenst Gedrag

### Twee duidelijk gescheiden modes:

#### **Mode 1: Motion Emotion Mode** (standaard)
- Hand beweegt → emotie wordt gedetecteerd
- Particles spawnen op de hand
- **GEEN text particles**
- Focus: beweging en particle effecten

#### **Mode 2: Finger Label Mode** (vingers omhoog)
- 1 vinger = "power" → alleen TEKST, GEEN particles
- 2 vingers = "flow" → alleen TEKST, GEEN particles  
- 3 vingers = "calm" → alleen TEKST, GEEN particles
- Focus: duidelijke, leesbare tekst

---

## 💡 Oplossingsrichting

### Aanpak 1: Mode Switching (AANBEVOLEN)

**Concept:** Schakel tussen twee exclusieve modes

```javascript
// Pseudo-code
if (gestureState.rightLabel) {
  // FINGER LABEL MODE
  mode = 'fingerLabel';
  
  // Particles UITZETTEN
  this.emotionParticles.pause();  // of setEmotion(null)
  
  // Text AANZETTEN met label
  this.textParticles.setEmotion(gestureState.rightLabel, color);
  
} else {
  // MOTION EMOTION MODE
  mode = 'motionEmotion';
  
  // Particles AANZETTEN
  let emotion = this.emotionDetector.getEmotion(primaryHand.handId);
  this.emotionParticles.setEmotion(emotion);
  
  // Text UITZETTEN (of alleen voor bepaalde emoties)
  this.textParticles.fadeOut();
}
```

**Voordelen:**
- ✅ Duidelijke scheiding tussen modes
- ✅ Geen interferentie tussen systemen
- ✅ Cleanere visuals
- ✅ Gebruiker heeft controle via vingers

**Implementatie:**
1. Nieuwe state variabele: `this.visualMode` ('motion' | 'fingerLabel')
2. Conditional logic in update loop
3. Smooth transitions tussen modes

---

### Aanpak 2: Particle Filtering

**Concept:** Particles spawnen alleen voor "echte" emoties, niet voor labels

```javascript
// Definieer welke emoties particles krijgen
const PARTICLE_EMOTIONS = ['woede', 'verdriet', 'kalmte', 'blij', 'bang'];
const LABEL_EMOTIONS = ['power', 'flow', 'calm'];

if (LABEL_EMOTIONS.includes(newEmotion)) {
  // Alleen text, geen particles
  this.emotionParticles.setEmotion('neutraal'); // of pause()
  this.textParticles.setEmotion(newEmotion, color);
} else {
  // Normale emotie: beide systemen
  this.emotionParticles.setEmotion(newEmotion);
  this.textParticles.setEmotion(newEmotion, color);
}
```

**Voordelen:**
- ✅ Simpeler te implementeren
- ✅ Behoudt huidige structuur

**Nadelen:**
- ⚠️ Nog steeds twee systemen actief
- ⚠️ Minder duidelijke scheiding

---

### Aanpak 3: Config-based Control

**Concept:** Configuratie bepaalt per emotie of particles worden getoond

```javascript
// In config.js
CONFIG.particles = {
  woede: { count: 50, enabled: true },
  power: { count: 0, enabled: false },   // ← Label: geen particles
  flow: { count: 0, enabled: false },     // ← Label: geen particles
  calm: { count: 0, enabled: false },     // ← Label: geen particles
  // ...
}
```

**Voordelen:**
- ✅ Flexibel en configureerbaar
- ✅ Geen code changes in main loop

**Nadelen:**
- ⚠️ Vereist config aanpassingen
- ⚠️ Minder expliciet in de code

---

## 🎨 Text Verbetering

Ongeacht welke aanpak, de tekst moet worden verbeterd:

### Huidige problemen:
1. **Te kleine particles** (size: 4)
2. **Te weinig samples** (niet genoeg particles voor letters)
3. **Animaties verminderen leesbaarheid**
4. **Spacing tussen letters onduidelijk**

### Oplossingen:

#### A. Grotere, dichtere text
```javascript
// In TextParticles
this.material = new THREE.PointsMaterial({
  size: 8,  // Was 4, verhoog naar 8-10
  // ...
});
```

#### B. Meer samples per letter
```javascript
// In TextSampler.js
sample(text) {
  // Verhoog sample density
  const pointsPerLetter = 150;  // Was misschien 50-80
  // ...
}
```

#### C. Minder beweging tijdens display
```javascript
// In TextParticles._getAnimationOffset()
case 'pulse':
  // Verminder amplitude voor betere leesbaarheid
  return {
    x: Math.cos(seed * 10) * pulse * 0.005,  // Was 0.012
    y: Math.sin(seed * 10) * pulse * 0.005   // Was 0.012
  };
```

#### D. Font verbetering
```javascript
// In TextSampler
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
ctx.font = 'bold 120px monospace';  // Dikker font
ctx.fillStyle = 'white';
```

---

## 📋 Implementatie Plan

### Fase 1: Mode Switching (Core Fix)
1. ✅ Voeg `visualMode` state toe aan Limbus class
2. ✅ Implementeer mode detection in update loop
3. ✅ Voorwaardelijke particle spawning
4. ✅ Test met vingergebaren

### Fase 2: Text Verbetering
1. ✅ Verhoog particle size (4 → 8)
2. ✅ Verhoog sample density
3. ✅ Verminder animatie amplitude
4. ✅ Test leesbaarheid

### Fase 3: Visual Cleanup
1. ✅ Verwijder onnodige overlays tijdens finger mode
2. ✅ Smooth transitions tussen modes
3. ✅ Optimaliseer kleuren voor contrast

### Fase 4: Testing & Refinement
1. ✅ Test alle vingergebaren (1, 2, 3 vingers)
2. ✅ Test motion emotions
3. ✅ Test transitions tussen modes
4. ✅ Performance check

---

## 🚀 Aanbevolen Implementatie

**Start met Aanpak 1 (Mode Switching)** omdat dit:
- De meest duidelijke scheiding geeft
- Gebruikerservaring verbetert
- Toekomstbestendig is voor verdere features
- Relatief eenvoudig te implementeren

**Combineer met Text Verbetering** voor maximaal effect.

---

## 📝 Code Locaties

### Te wijzigen bestanden:
1. **`src/main.js`** (regels 330-390)
   - Hoofdlogica voor mode switching
   - Voorwaardelijke particle/text updates

2. **`src/render/particles/TextParticles.js`**
   - Material size (regel 73)
   - Animation amplitudes (regels 313-357)

3. **`src/utils/TextSampler.js`**
   - Sample density
   - Font properties

4. **`src/config.js`** (optioneel)
   - Nieuwe config voor text settings
   - Mode switching parameters

---

## ✅ Acceptatiecriteria

De implementatie is succesvol als:

1. ✅ Vingergebaren (1, 2, 3 vingers) tonen **ALLEEN tekst**, geen particles
2. ✅ Normale handbewegingen tonen **ALLEEN particles**, geen tekst (of beperkte tekst)
3. ✅ Tekst is **duidelijk leesbaar** (zoals in de screenshots)
4. ✅ Smooth transitions tussen modes
5. ✅ Performance blijft goed (60 FPS)
6. ✅ Geen visuele rommeligheden meer

---

## 🎯 Verwacht Resultaat

**Voor:** Rommelig, particles + tekst door elkaar, onduidelijk  
**Na:** Clean, duidelijk gescheiden modes, perfecte leesbaarheid
