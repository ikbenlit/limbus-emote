# Emotie-Gebaren Handleiding

**Limbus - Gesture-Based Emotion Visualizer**

---

## Overzicht

Limbus herkent emoties op basis van **hoe je beweegt**, niet welk gebaar je maakt. Dit is intuïtiever en therapeutisch waardevoller - emoties zitten in het lichaam en uiten zich natuurlijk in beweging.

---

## De 5 Emoties

### 😠 BOOS (Angry)

**Beweging:** Snelle, korte, schokkende beweging

```
    ✊→→→ HAK BEWEGING →→→

    Of: heen en weer schudden
    ✊ ←→ ←→ ←→ (snel)
```

| Aspect | Beschrijving |
|--------|--------------|
| **Hoe** | Snel naar voren of opzij bewegen, alsof je iets weg duwt |
| **Voelt als** | Frustratie uiten, iets van je af slaan |
| **Snelheid** | Hoog |
| **Karakter** | Schokkig, abrupt |

**Visueel effect:** Rode/oranje explosieve particles die uit de hand spatten

---

### 😢 VERDRIETIG (Sad)

**Beweging:** Langzame beweging naar beneden

```
         🖐️
          ↓
          ↓  (langzaam)
          ↓
         ~~~
```

| Aspect | Beschrijving |
|--------|--------------|
| **Hoe** | Hand langzaam laten zakken, alsof de energie wegvloeit |
| **Voelt als** | Neerslachtig, zwaar, moe |
| **Snelheid** | Laag |
| **Karakter** | Vloeiend, naar beneden gericht |

**Visueel effect:** Blauwe particles die als druppels naar beneden vallen

---

### 😌 KALM (Calm)

**Beweging:** Langzame, ronde, cirkelvormige beweging

```
        ╭───╮
       ╱     ╲
      │   🖐️  │  (langzame cirkel)
       ╲     ╱
        ╰───╯
```

| Aspect | Beschrijving |
|--------|--------------|
| **Hoe** | Rustig rondjes draaien met je hand, zoals roeren |
| **Voelt als** | Meditatief, ontspannen, in balans |
| **Snelheid** | Medium-laag |
| **Karakter** | Vloeiend, continu, rond |

**Visueel effect:** Groene/turquoise golvende particles in een rustgevend patroon

---

### 😊 BLIJ (Happy)

**Beweging:** Snelle beweging omhoog met open hand

```
         🎉
        ↗ ↑ ↖
       ↗  ↑  ↖
         🖐️
    (confetti gooien)
```

| Aspect | Beschrijving |
|--------|--------------|
| **Hoe** | Hand snel omhoog gooien, alsof je confetti strooit |
| **Voelt als** | Juichen, vieren, energie omhoog |
| **Snelheid** | Hoog |
| **Karakter** | Opwaarts, open, explosief |

**Visueel effect:** Gele/gouden confetti-achtige particles die omhoog spatten

---

### 😨 BANG (Scared)

**Beweging:** Kleine, snelle trilbeweging of terugtrekken

```
      🖐️~ ~ ~
       (trillen)

    Of: hand terugtrekken
      🖐️ ←←← (naar lichaam)
```

| Aspect | Beschrijving |
|--------|--------------|
| **Hoe** | Hand licht laten trillen, of terugtrekken naar je lichaam |
| **Voelt als** | Onzeker, angstig, jezelf beschermen |
| **Snelheid** | Kleine, snelle bewegingen |
| **Karakter** | Trillend, onregelmatig, naar binnen gericht |

**Visueel effect:** Paarse/witte flikkerende particles die trillen

---

## Detectie Parameters

| Emotie | Snelheid | Richting | Patroon | Jerk |
|--------|----------|----------|---------|------|
| **BOOS** | Hoog (>0.08) | Horizontaal | Lineair | Hoog |
| **VERDRIETIG** | Laag (<0.03) | Omlaag ↓ | Lineair | Laag |
| **KALM** | Medium | Circulair ↻ | Rond | Zeer laag |
| **BLIJ** | Hoog (>0.05) | Omhoog ↑ | Explosief | Medium |
| **BANG** | Variabel | Naar binnen | Trillend | Hoog freq |

### Begrippen

- **Snelheid (velocity):** Hoe snel de hand beweegt (pixels per frame)
- **Richting (direction):** Welke kant de hand op gaat (x, y vector)
- **Patroon (pattern):** De vorm van de beweging over tijd
- **Jerk:** De "schokkigheid" - hoe abrupt de beweging verandert

---

## Twee-Handen Interactie

### Concept: Creëren & Vangen

De twee handen hebben verschillende rollen die samen een speelse interactie vormen:

| Hand | Rol | Actie |
|------|-----|-------|
| **Rechterhand** | Bron | Particles **CREËREN** |
| **Linkerhand** | Magneet | Particles **VANGEN** |

### Visuele Weergave

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                                                         │
│      🧲 VANGEN        ✨←←←←←←←✨        🎨 MAKEN       │
│      (magneet)                           (bron)         │
│                                                         │
│         🖐️            ← ← ← ←             🤚           │
│       LINKS                              RECHTS         │
│                                                         │
│    "VANG JE                         "MAAK JE            │
│     GEVOELENS!"                      GEVOELENS!"        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Particle Flow

Wanneer beide handen in beeld zijn:
- Particles **ontstaan** bij de rechterhand (gebaseerd op beweging/emotie)
- Linkerhand werkt als **magneet** die particles aantrekt
- Particles **stromen** van rechts naar links
- Hoe dichter bij linkerhand, hoe sterker de aantrekkingskracht

```
   LINKERHAND                               RECHTERHAND
   (magneet)                                (bron)
       │                                        │
       │    ●←←←●←←←●←←←●←←←●←←←●←←←●←←←●      │
       │   vangen                    spawnen   │
       │                                        │
    VANG ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←← CREËER
```

### Speelse Interactie

> **"Vang je gevoelens!"** - Ideaal voor kinderen

| Situatie | Effect | Wat het kind ervaart |
|----------|--------|---------------------|
| Rechts beweegt boos | Rode particles ontstaan | "Ik maak boze gevoelens" |
| Links vangt | Particles stromen naar links | "Ik vang ze op!" |
| Handen dichtbij | Particles versnellen | "Ze willen gevangen worden" |
| Handen ver uit elkaar | Langzame flow | "Ze moeten ver reizen" |

---

## Samenwerken = Versterken

### Concept: Beide Handen Samen

Wanneer beide handen **dezelfde beweging** maken, ontstaat een **versterkt effect**:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│              🎉🎉🎉 MEGA EFFECT 🎉🎉🎉                  │
│                                                         │
│         🖐️        ✨✨✨✨✨✨✨✨        🤚              │
│       LINKS    ←  SAMEN BEWEGEN  →    RECHTS           │
│                                                         │
│              Zelfde emotie = VERSTERKING                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Versterkings-effecten

| Beide handen | Beweging | Versterkt effect |
|--------------|----------|------------------|
| **BLIJ + BLIJ** | Samen omhoog gooien | 🎉🎉 MEGA confetti explosie |
| **KALM + KALM** | Samen cirkelen | 🌊 Grote rustgevende golf |
| **BOOS + BOOS** | Samen schudden | 🔥🔥 Intense vuurexplosie |
| **VERDRIETIG + VERDRIETIG** | Samen zakken | 💧💧 Regen van druppels |
| **BANG + BANG** | Samen trillen | ⚡⚡ Elektrische spanning |

### Handen Samen Brengen

Speciale interactie wanneer handen **naar elkaar toe** bewegen:

```
        🖐️  →  →  →  ←  ←  ←  🤚
              ↓
           FUSIE!
              ↓
           💥✨💫
      Particles smelten samen
```

| Actie | Effect |
|-------|--------|
| Handen naderen elkaar | Particles trekken naar midden |
| Handen raken bijna | Particles fuseren tot één punt |
| Handen samen | **Explosie** vanuit het midden |

### Scenario's

#### Scenario 1: Samen vieren

```
Kind: [beide handen maken blije beweging omhoog]
      → MEGA confetti explosie!
      → Gouden particles vullen het scherm

Therapeut: "Wauw! Kijk wat er gebeurt als je met
            beide handen blij bent!"
```

#### Scenario 2: Samen tot rust komen

```
Kind: [beide handen maken langzame cirkels]
      → Grote groene golf beweegt over scherm
      → Rustgevend, meditatief effect

Therapeut: "Voel je hoe rustig het wordt als
            beide handen samenwerken?"
```

#### Scenario 3: Gevoelens samenvoegen

```
Kind: [brengt beide handen naar elkaar toe]
      → Particles stromen naar het midden
      → Fusie-explosie wanneer handen samenkomen

Therapeut: "Je brengt al je gevoelens samen.
            Wat gebeurt er?"
```

### Staten

| Rechterhand | Linkerhand | Modus | Visueel |
|-------------|------------|-------|---------|
| Actief | Actief (zelfde) | **Versterking** | Mega-effect van die emotie |
| Actief | Actief (anders) | **Creëer & Vang** | Particles stromen R→L |
| Actief | Standby | **Solo creatie** | Particles drijven vrij |
| Standby | Actief | **Solo magneet** | Omgeving-particles worden aangetrokken |
| Naar elkaar | Naar elkaar | **Fusie** | Particles smelten samen |
| Standby | Standby | **Rust** | Neutrale ambient particles |

### Technische Flow

```
1. Detecteer beide handen
          ↓
2. Analyseer beweging per hand
          ↓
3. Check: Zelfde emotie beide handen?
   ├─ JA → Versterkt effect (mega-particles)
   └─ NEE → Creëer & Vang modus
          ↓
4. Check: Handen naderen elkaar?
   ├─ JA → Start fusie-animatie
   └─ NEE → Normale flow
          ↓
5. Rechterhand spawnt particles (kleur = emotie)
          ↓
6. Linkerhand trekt particles aan (magneet-kracht)
          ↓
7. Particles bewegen van rechts naar links
```

---

## Therapeutische Toepassing

### Voor Kinderen

1. **Geen instructie nodig** - "Beweeg je hand zoals je je voelt"
2. **Lichaamsexpressie** - Emoties uiten via beweging
3. **Visuele feedback** - Kind ziet direct welke emotie herkend wordt
4. **Emotie-vocabulaire** - Leert woorden voor gevoelens

### Regulatie Oefening

Van grote emotie naar rust:

```
BOOS (snel, schokkig)
        ↓
  vertragen...
        ↓
  ronder maken...
        ↓
KALM (langzaam, cirkel)
```

> "Kijk, je kunt je boze energie veranderen in rustige energie"

---

## Kleurenschema

| Emotie | Primair | Secundair | Gevoel |
|--------|---------|-----------|--------|
| BOOS | `#FF0000` | `#FF6600` | Warm, intens |
| VERDRIETIG | `#0044FF` | `#6600FF` | Koud, diep |
| KALM | `#00FF88` | `#0088FF` | Fris, rustgevend |
| BLIJ | `#FFD700` | `#FF69B4` | Warm, licht |
| BANG | `#9932CC` | `#FFFFFF` | Onzeker, flikkerend |

---

*Limbus v2.0 - Bewegingsgestuurde emotie-visualisatie*
