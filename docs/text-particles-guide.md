# Beginnershandleiding: Tekst Particles Aanpassen

## Waar vind je de settings?

Er zijn **2 bestanden** die de tekstweergave bepalen:

### 1. `src/config.js` - Algemene instellingen

```javascript
textParticles: {
  maxCount: 5000,           // Aantal particles
  canvasSize: [512, 200],   // Sampling canvas grootte
  font: 'bold 120px "Courier New", monospace',
  sampleRate: 4,            // Grid dichtheid
  alphaThreshold: 128,      // Rand scherpte
  particleScale: 0.08,      // Tekst grootte op scherm
  morphDuration: 0.4,       // Animatie snelheid
}
```

### 2. `src/render/particles/TextParticles.js` - Particle grootte

```javascript
this.material = new THREE.PointsMaterial({
  size: 18,  // Pixel grootte
  ...
});
```

---

## Wat doet elke setting?

### particleScale - Hoe groot is de tekst op het scherm?

```
Klein  0.02 ──────────────────── 0.15  Groot
```

| Waarde | Effect |
|--------|--------|
| `0.04` | Kleine tekst |
| `0.08` | Medium tekst |
| `0.12` | Grote tekst (kan buiten scherm vallen) |

---

### size (in TextParticles.js) - Hoe groot is elke "LED dot"?

```
Klein  8px ──────────────────── 30px  Groot
```

| Waarde | Effect |
|--------|--------|
| `8` | Kleine puntjes, fijne tekst |
| `18` | Medium LED dots |
| `28` | Grote blokken, retro arcade look |

---

### sampleRate - Hoe dicht staan de dots bij elkaar?

```
Dicht  1 ──────────────────── 6  Ver uit elkaar
```

| Waarde | Effect |
|--------|--------|
| `1` | Elke pixel - vloeiende, gevulde letters |
| `4` | Elke 4e pixel - LED matrix grid |
| `6` | Elke 6e pixel - losse dots, meer ruimte |

**Visueel voorbeeld:**

```
sampleRate: 1        sampleRate: 4
██████████           █ █ █ █ █
██████████           █ █ █ █ █
██████████           █ █ █ █ █
```

---

### alphaThreshold - Hoe scherp zijn de randen?

```
Zacht  30 ──────────────────── 180  Scherp
```

| Waarde | Effect |
|--------|--------|
| `30` | Zachte, fuzzy randen (meer pixels aan randen) |
| `128` | Scherpe, blocky randen |
| `180` | Zeer scherp (kan dunne letters geven) |

---

### maxCount - Hoeveel particles maximaal?

```
Weinig  1000 ──────────────────── 25000  Veel
```

- Meer particles = vollere letters, maar zwaarder voor computer
- Bij `sampleRate: 4` heb je minder particles nodig

---

### canvasSize - Resolutie van de tekst sampling

| Waarde | Effect |
|--------|--------|
| `[512, 200]` | Grof, blocky (LED look) |
| `[1024, 400]` | Fijn, smooth |

- Kleiner canvas + grote font = grovere pixels
- Groter canvas + grote font = meer detail

---

### morphDuration - Hoe snel verandert de tekst?

```
Snel  0.1 ──────────────────── 1.0  Langzaam
```

| Waarde | Effect |
|--------|--------|
| `0.2` | Snelle morph |
| `0.5` | Medium |
| `1.0` | Langzame, dramatische morph |

---

## Voorbeelden: Stijlen

### Stijl 1: LED Matrix

```javascript
// config.js
sampleRate: 4,
alphaThreshold: 128,
particleScale: 0.08,
canvasSize: [512, 200],

// TextParticles.js
size: 18,
```

### Stijl 2: Smooth Neon

```javascript
// config.js
sampleRate: 1,
alphaThreshold: 50,
particleScale: 0.05,
canvasSize: [1024, 400],

// TextParticles.js
size: 10,
```

### Stijl 3: Retro Arcade

```javascript
// config.js
sampleRate: 6,
alphaThreshold: 150,
particleScale: 0.10,
canvasSize: [256, 100],

// TextParticles.js
size: 24,
```

---

## Snel experimenteren

1. Open `src/config.js`
2. Pas **één** waarde aan
3. Save - browser refresht automatisch (met `pnpm dev`)
4. Niet tevreden? Pas aan en herhaal

**Tip:** Begin met `particleScale` en `size` - die hebben het meeste visuele effect!

---

## Hand Interactie (Repel Effect)

De linkerhand kan door de tekst bewegen en particles wegduwen. Dit creëert een interactief "vloeiend" effect.

### Hoe het werkt

1. **Rechterhand**: Houd 1, 2 of 3 vingers omhoog om tekst te tonen
2. **Linkerhand**: Beweeg door de tekst heen
3. Particles wijken uit voor je hand en keren terug wanneer je hand weg is

### Settings in `config.js`

```javascript
textParticles: {
  // ... andere settings ...

  repel: {
    enabled: true,     // Aan/uit
    radius: 0.15,      // Bereik van het effect
    strength: 0.8,     // Hoe hard particles weggeduwd worden
  }
}
```

### repel.radius - Hoe groot is het effect bereik?

```
Klein  0.05 ──────────────────── 0.30  Groot
```

| Waarde | Effect |
|--------|--------|
| `0.08` | Klein bereik - hand moet dichtbij particles zijn |
| `0.15` | Medium bereik (standaard) |
| `0.25` | Groot bereik - particles reageren van verder weg |

### repel.strength - Hoe hard worden particles weggeduwd?

```
Zacht  0.2 ──────────────────── 1.5  Hard
```

| Waarde | Effect |
|--------|--------|
| `0.3` | Subtiel wegduwen |
| `0.8` | Medium kracht (standaard) |
| `1.2` | Sterke afstoting - groot gat in tekst |

### repel.enabled - Aan/uit schakelen

```javascript
repel: {
  enabled: false,  // Zet op false om hand interactie uit te schakelen
}
```

### Voorbeelden

**Subtiel, vloeiend effect:**
```javascript
repel: {
  enabled: true,
  radius: 0.12,
  strength: 0.4,
}
```

**Dramatisch, groot gat:**
```javascript
repel: {
  enabled: true,
  radius: 0.25,
  strength: 1.2,
}
```

---

## Implode & Explode (Vuist Gestures)

Met je linkerhand kun je particles "vangen" en "weggooien" door je vuist te openen en sluiten.

### Hoe het werkt

```
    OPEN HAND              VUIST MAKEN              VUIST OPENEN
         │                      │                        │
         ▼                      ▼                        ▼
    ┌─────────┐           ┌──────────┐            ┌──────────┐
    │ Normaal │  ──────►  │ IMPLODE  │  ───────►  │ EXPLODE  │
    │         │           │          │            │          │
    │  POWER  │           │ Particles│            │ Particles│
    │         │           │ naar     │            │ vliegen  │
    │         │           │ vuist    │            │ weg      │
    └─────────┘           └──────────┘            └──────────┘
```

### De interactie

| Actie | Wat je doet | Effect |
|-------|-------------|--------|
| **Implode** | Open hand → Vuist maken | Particles vliegen naar je vuist |
| **Explode** | Vuist → Hand openen | Particles exploderen alle kanten op |

**Tip:** Het systeem detecteert de *transitie* (verandering), niet de staat. Je moet dus echt van open naar dicht gaan, niet alleen een vuist vasthouden.

### Settings in `config.js`

```javascript
textParticles: {
  // ... andere settings ...

  // Explode effect (vuist openen)
  explode: {
    duration: 0.8,      // Hoe lang het effect duurt (seconden)
    speed: 0.8,         // Hoe snel particles wegvliegen
    drag: 0.94,         // Weerstand (lager = sneller stoppen)
    sizeVariation: 3,   // Grootte variatie voor scatter effect (1-5)
  },

  // Implode effect (vuist maken) - BLACK HOLE
  implode: {
    duration: 0.6,      // Hoe lang de animatie duurt (seconden)
    spiralStrength: 3,  // Hoeveel rotaties in de spiral (1-5)
  }
}
```

### explode.speed - Hoe snel vliegen particles weg?

```
Langzaam  0.3 ──────────────────── 1.5  Snel
```

| Waarde | Effect |
|--------|--------|
| `0.4` | Langzame, zachte explosie |
| `0.8` | Medium snelheid (standaard) |
| `1.2` | Snelle, krachtige explosie |

### explode.duration - Hoe lang duurt de explosie?

```
Kort  0.3 ──────────────────── 1.5  Lang
```

| Waarde | Effect |
|--------|--------|
| `0.4` | Korte explosie, snel terug naar tekst |
| `0.8` | Medium duur (standaard) |
| `1.2` | Lange explosie, particles blijven langer zweven |

### explode.drag - Hoeveel weerstand?

```
Veel weerstand  0.85 ──────────────────── 0.98  Weinig weerstand
```

| Waarde | Effect |
|--------|--------|
| `0.88` | Particles stoppen snel |
| `0.94` | Medium weerstand (standaard) |
| `0.97` | Particles blijven lang doorzweven |

### explode.sizeVariation - Scatter/dispersion effect

Dit geeft de explosie een "atoms in space" look met verschillende groottes:

```
Uniform  1 ──────────────────── 5  Veel variatie
```

| Waarde | Effect |
|--------|--------|
| `1` | Alle particles even groot (geen variatie) |
| `2` | Subtiele variatie |
| `3` | Medium scatter effect (standaard) |
| `5` | Extreme variatie - van tiny dots tot grote bollen |

**Hoe het werkt:**

Bij een explosie krijgt elke particle willekeurig een nieuwe grootte:

```
┌─────────────────────────────────────────────────────────┐
│  20% kans: GROOT  (size × sizeVariation)   ●  "planeten" │
│  30% kans: KLEIN  (size ÷ sizeVariation)   ·  "sterren"  │
│  50% kans: NORMAAL (ongewijzigd)           •  "standaard"│
└─────────────────────────────────────────────────────────┘
```

Dit creëert een organische, verspreide look alsof de tekst uiteenvalt in atomen van verschillende groottes.

### implode.duration - Hoe lang duurt de black hole animatie?

```
Snel  0.3 ──────────────────── 1.2  Langzaam
```

| Waarde | Effect |
|--------|--------|
| `0.3` | Snelle zuig actie |
| `0.6` | Medium (standaard) - dramatisch maar niet te lang |
| `1.0` | Langzame, epische black hole |

### implode.spiralStrength - Hoeveel rotaties in de spiral?

```
Weinig  1 ──────────────────── 5  Veel rotaties
```

| Waarde | Effect |
|--------|--------|
| `1` | Subtiele curve, bijna rechte lijn |
| `3` | Medium spiral (standaard) - duidelijk zichtbaar |
| `5` | Intense tornado/vortex effect |

**Hoe het Black Hole effect werkt:**

```
┌─────────────────────────────────────────────────────────┐
│  1. Particles starten op hun tekst-positie              │
│  2. Ze spiralen naar het centrum (vuist positie)        │
│  3. Versnelling: langzaam → snel (ease-in)              │
│  4. Particles krimpen naarmate ze dichterbij komen      │
│  5. Staggered start: niet alle particles tegelijk       │
└─────────────────────────────────────────────────────────┘

     START                    MIDDEN                    EIND

    B O O S          B  O                              ●
                        O  S                          vuist
                          ↘ ↙
```

### Voorbeelden

**Krachtige, snelle explosie met veel scatter:**
```javascript
explode: {
  duration: 0.5,
  speed: 1.2,
  drag: 0.92,
  sizeVariation: 4,
}
```

**Zachte, zwevende explosie (uniform):**
```javascript
explode: {
  duration: 1.2,
  speed: 0.4,
  drag: 0.97,
  sizeVariation: 1,
}
```

**"Atoms in Space" effect (aanbevolen):**
```javascript
explode: {
  duration: 0.8,
  speed: 2,
  drag: 1,
  sizeVariation: 3,
}
```

**Dramatische Black Hole implode:**
```javascript
implode: {
  duration: 0.6,
  spiralStrength: 3,
}
```

**Snelle vortex:**
```javascript
implode: {
  duration: 0.3,
  spiralStrength: 5,
}
```

**Zachte, langzame zuig:**
```javascript
implode: {
  duration: 1.0,
  spiralStrength: 2,
}
```
