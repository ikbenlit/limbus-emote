/**
 * SixSevenParticles - Particle system for the 6-7 meme gesture
 * Each hand gets its own number ('6' or '7') formed by particles
 */

import * as THREE from 'three';
import { TextSampler } from '../../utils/TextSampler.js';
import { easeOutCubic } from '../../utils/easing.js';
import { initParticleAttributes, markAttributesDirty } from '../../utils/bufferHelpers.js';

export class SixSevenParticles {
    constructor(config, textConfig) {
        this.config = config;
        this.textSampler = new TextSampler(textConfig);

        // Total particles split between two numbers
        this.maxParticles = config.count || 2000;
        this.particlesPerNumber = Math.floor(this.maxParticles / 2);

        this.particles = [];
        this.positions = new Float32Array(this.maxParticles * 3);
        this.colors = new Float32Array(this.maxParticles * 3);
        this.sizes = new Float32Array(this.maxParticles);
        this.opacities = new Float32Array(this.maxParticles);

        // Three.js objects
        this.geometry = null;
        this.material = null;
        this.points = null;

        // State
        this.time = 0;
        this.opacity = 0;
        this.isVisible = false;

        // Target positions for 6 and 7
        this.targets6 = [];
        this.targets7 = [];
    }

    init() {
        // Sample '6' and '7'
        this.targets6 = this.textSampler.sample('6');
        this.targets7 = this.textSampler.sample('7');

        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push({
                x: 0, y: 0, z: 0.5,
                tx: 0, ty: 0,      // Target relative to hand
                r: 1, g: 1, b: 1,
                size: 0.02,
                active: false,
                handScale: i < this.particlesPerNumber ? 0 : 1 // 0 for left hand ('6'), 1 for right hand ('7')
            });
        }

        this.geometry = new THREE.BufferGeometry();
        initParticleAttributes(this.geometry, this.positions, this.colors, this.sizes, this.opacities);

        this.material = new THREE.ShaderMaterial({
            uniforms: {
                uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
            },
            vertexShader: `
        uniform float uPixelRatio;
        attribute vec3 color;
        attribute float size;
        attribute float opacity;
        varying vec3 vColor;
        varying float vOpacity;
        void main() {
          vColor = color;
          vOpacity = opacity;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = size * uPixelRatio * 350.0;
        }
      `,
            fragmentShader: `
        precision mediump float;
        varying vec3 vColor;
        varying float vOpacity;
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center) * 2.0;
          float alpha = 1.0 - smoothstep(0.5, 1.0, dist);
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(vColor, alpha * vOpacity);
        }
      `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });

        this.points = new THREE.Points(this.geometry, this.material);
        this.points.frustumCulled = false;
        this.points.renderOrder = 110; // Top of everything

        return this;
    }

    getMesh() {
        return this.points;
    }

    update(deltaTime, leftPos, rightPos, active) {
        this.time += deltaTime;

        if (active) {
            this.opacity = Math.min(1, this.opacity + deltaTime * 4);
            this.isVisible = true;
        } else {
            this.opacity = Math.max(0, this.opacity - deltaTime * 4);
            if (this.opacity <= 0) {
                this.isVisible = false;
            }
        }

        if (!this.isVisible) {
            this.points.visible = false;
            return;
        }
        this.points.visible = true;

        // Determine colors
        const colorPrimary = new THREE.Color(this.config.colors.primary);
        const colorSecondary = new THREE.Color(this.config.colors.secondary);

        for (let i = 0; i < this.maxParticles; i++) {
            const p = this.particles[i];
            const i3 = i * 3;

            // Split particles between 6 and 7
            const isSix = i < this.particlesPerNumber;
            const handPos = isSix ? leftPos : rightPos; // Mirrored webcam: user right is leftPos
            const targets = isSix ? this.targets6 : this.targets7;

            if (!handPos || !targets.length) {
                this.positions[i3] = -9999;
                this.sizes[i] = 0;
                continue;
            }

            const targetIdx = i % targets.length;
            const target = targets[targetIdx];

            // Position above hand
            const offsetY = 0.3;
            p.x = handPos.x + target.x;
            p.y = handPos.y + target.y + offsetY;

            // Add subtle vibration/glitch
            const seed = i * 0.1;
            p.x += Math.sin(this.time * 20 + seed) * 0.005;
            p.y += Math.cos(this.time * 18 + seed) * 0.005;

            this.positions[i3] = p.x;
            this.positions[i3 + 1] = p.y;
            this.positions[i3 + 2] = 0.5;

            // Color mix
            const mix = (Math.sin(this.time * 2 + seed) + 1) / 2;
            this.colors[i3] = colorPrimary.r + (colorSecondary.r - colorPrimary.r) * mix;
            this.colors[i3 + 1] = colorPrimary.g + (colorSecondary.g - colorPrimary.g) * mix;
            this.colors[i3 + 2] = colorPrimary.b + (colorSecondary.b - colorPrimary.b) * mix;

            this.sizes[i] = this.config.appearance.size.min + Math.random() * (this.config.appearance.size.max - this.config.appearance.size.min);
            this.opacities[i] = this.opacity;
        }

        markAttributesDirty(this.geometry);
    }

    dispose() {
        this.geometry.dispose();
        this.material.dispose();
    }
}
