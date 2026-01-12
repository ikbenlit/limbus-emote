# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Limbus is a gesture-based emotion visualizer that translates hand movements into particle effects. Built as a LinkedIn demo to showcase AI/WebGL capabilities for GGZ (mental health) sector applications.

**Status:** Greenfield project - documentation complete, implementation pending.

## Planned Tech Stack

- **Vanilla JS + Vite** (no framework for max performance)
- **Three.js** for GPU-accelerated particle rendering
- **MediaPipe GestureRecognizer** for hand tracking
- **No backend** - all processing runs client-side in browser

## Commands (once project is set up)

```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run preview      # Preview production build
```

## Architecture

Three-layer pipeline:

```
CAPTURE              ANALYSIS             RENDER
├── webcam.js        ├── motionAnalyzer   ├── renderer.js
└── handTracker.js   └── emotionDetector  ├── ParticlePool.js
                                          ├── EmotionParticles.js
                                          ├── TextParticles.js
                                          └── HandOverlay.js
```

**Data flow:** Webcam → MediaPipe → Motion Analysis → Emotion Detection → Particle System → Three.js Render

## Key Documentation

- `limbus-prd.md` - Product requirements, scope, success criteria
- `limbus-fo.md` - Functional design, user flows, detection logic
- `limbus-td.md` - Technical design, algorithms, data structures, shaders

## Emotion Detection Logic

Three emotions detected via hand movement analysis:

| Emotion | Trigger |
|---------|---------|
| **Woede** | velocity > 0.08 AND closed fist AND high jerk |
| **Verdriet** | velocity < 0.02 AND downward direction |
| **Kalmte** | medium velocity AND low jerk AND circular pattern |

500ms hysteresis prevents flickering between states.

## Performance Targets

- 60fps target, 30fps minimum
- Max 10,000 particles with object pooling
- < 50ms gesture-to-visual latency
- MediaPipe inference throttled to 30fps
