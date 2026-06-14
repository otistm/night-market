import * as THREE from 'three';
import type { Mood } from '@/game/types';
import { reduceMotion } from '@/fx/animations';

type BackdropMode = 'default' | 'title';

interface Background3D {
  setMood(m: Mood): void;
  setBackdropMode(mode: BackdropMode): void;
  pulse(): void;
}

function makeGlowTexture(size: number, soft: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const r = size / 2;
  const grad = ctx.createRadialGradient(r, r, 0, r, r, r);

  if (soft) {
    grad.addColorStop(0, 'rgba(255,248,235,1)');
    grad.addColorStop(0.05, 'rgba(255,220,160,0.7)');
    grad.addColorStop(0.22, 'rgba(255,150,60,0.16)');
    grad.addColorStop(0.5, 'rgba(255,110,40,0.05)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
  } else {
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.22, 'rgba(255,255,255,0.55)');
    grad.addColorStop(0.55, 'rgba(255,255,255,0.12)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

export function createBackground3D(appEl: HTMLElement, canvas: HTMLCanvasElement): Background3D {
  const noop: Background3D = { setMood() {}, setBackdropMode() {}, pulse() {} };
  if (reduceMotion) return noop;

  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const fog = new THREE.FogExp2(0x0a0613, 0.028);
    scene.fog = fog;

    const cam = new THREE.PerspectiveCamera(60, 1, 0.1, 60);
    cam.position.set(0, 0, 12);

    const haloTex = makeGlowTexture(128, true);
    const coreTex = makeGlowTexture(64, false);

    const N = 130;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const baseCol = new Float32Array(N * 3);
    const seeds: { s: number; ph: number; mix: number; flick: number }[] = [];

    const AMBER = new THREE.Color(0xffd080);
    const VIOLET = new THREE.Color(0xb794ff);
    const RED = new THREE.Color(0xff667a);
    const GOLD = new THREE.Color(0xffe08a);
    const LANTERN = new THREE.Color(0xff7a28);
    const EMBER = new THREE.Color(0xff5a18);
    const MOON = new THREE.Color(0xffc4b0);

    const state = { backdrop: 'default' as BackdropMode, mood: 'shop' as Mood };

    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 22;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 16;
      seeds.push({
        s: 0.18 + Math.random() * 0.55,
        ph: Math.random() * Math.PI * 2,
        mix: Math.random(),
        flick: 0.7 + Math.random() * 1.4,
      });
      const c = Math.random() < 0.68 ? AMBER : VIOLET;
      baseCol[i * 3] = c.r;
      baseCol[i * 3 + 1] = c.g;
      baseCol[i * 3 + 2] = c.b;
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

    const haloMat = new THREE.PointsMaterial({
      size: 5.6,
      map: haloTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    const coreMat = new THREE.PointsMaterial({
      size: 1.65,
      map: coreTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    scene.add(new THREE.Points(geo, haloMat));
    scene.add(new THREE.Points(geo, coreMat));

    let speed = 1;
    let drift = 0.42;
    let px = 0;
    let py = 0;
    let pulseT = 0;

    const haloBase = { size: 5.6, opacity: 0.28 };
    const coreBase = { size: 1.65, opacity: 0.92 };

    function applyBackdrop(): void {
      const p = geo.attributes.position.array as Float32Array;
      if (state.backdrop === 'title') {
        fog.color.setHex(0x101828);
        fog.density = 0.018;
        haloBase.size = 7.4;
        haloBase.opacity = 0.16;
        coreBase.size = 1.05;
        coreBase.opacity = 0.48;
        drift = 0.26;
        for (let i = 0; i < N; i++) {
          p[i * 3] = (Math.random() - 0.5) * 24;
          p[i * 3 + 1] = Math.random() * 24 - 6;
          p[i * 3 + 2] = (Math.random() - 0.5) * 12;
          seeds[i].mix = Math.random();
        }
        geo.attributes.position.needsUpdate = true;
      } else {
        fog.color.setHex(0x0a0613);
        fog.density = 0.028;
        haloBase.size = 5.6;
        haloBase.opacity = 0.28;
        coreBase.size = 1.65;
        coreBase.opacity = 0.92;
        drift = 0.42;
      }
      applyMoodColors();
    }

    function applyMoodColors(): void {
      if (state.backdrop === 'title') {
        recolor(LANTERN, MOON);
        for (let i = 0; i < N; i++) {
          if (seeds[i].mix > 0.82) {
            baseCol[i * 3] = EMBER.r;
            baseCol[i * 3 + 1] = EMBER.g;
            baseCol[i * 3 + 2] = EMBER.b;
          }
        }
        return;
      }
      if (state.mood === 'battle') recolor(RED, VIOLET);
      else if (state.mood === 'sudden') recolor(RED, RED);
      else if (state.mood === 'win') recolor(GOLD, AMBER);
      else recolor(AMBER, VIOLET);
    }

    function size(): void {
      const r = appEl.getBoundingClientRect();
      renderer.setSize(r.width, r.height, false);
      cam.aspect = r.width / r.height;
      cam.updateProjectionMatrix();
    }

    addEventListener('resize', size);
    size();

    addEventListener(
      'pointermove',
      (e) => {
        const r = appEl.getBoundingClientRect();
        px = (e.clientX / r.width - 0.5) * 2;
        py = (e.clientY / r.height - 0.5) * 2;
      },
      { passive: true },
    );

    const clock = new THREE.Clock();

    function recolor(a: THREE.Color, b: THREE.Color): void {
      for (let i = 0; i < N; i++) {
        const k = seeds[i].mix < 0.65 ? a : b;
        baseCol[i * 3] = k.r;
        baseCol[i * 3 + 1] = k.g;
        baseCol[i * 3 + 2] = k.b;
      }
    }

    function applyFlicker(t: number): void {
      const c = geo.attributes.color.array as Float32Array;
      for (let i = 0; i < N; i++) {
        const flickerFloor = state.backdrop === 'title' ? 0.55 : 0.42;
        const wave =
          flickerFloor +
          (1 - flickerFloor) * Math.sin(t * seeds[i].flick + seeds[i].ph) ** 2;
        const bright = 0.75 + 0.25 * Math.sin(t * 0.7 + seeds[i].ph * 1.7);
        const k = wave * bright;
        c[i * 3] = baseCol[i * 3] * k;
        c[i * 3 + 1] = baseCol[i * 3 + 1] * k;
        c[i * 3 + 2] = baseCol[i * 3 + 2] * k;
      }
      geo.attributes.color.needsUpdate = true;
    }

    let rafId = 0;
    let paused = false;

    function loop(): void {
      rafId = requestAnimationFrame(loop);
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      const p = geo.attributes.position.array as Float32Array;

      for (let i = 0; i < N; i++) {
        p[i * 3 + 1] += seeds[i].s * drift * speed * dt;
        p[i * 3] += Math.sin(t * 0.35 + seeds[i].ph) * 0.08 * dt;
        if (p[i * 3 + 1] > 15) p[i * 3 + 1] = -15;
      }
      geo.attributes.position.needsUpdate = true;

      applyFlicker(t);

      pulseT = Math.max(0, pulseT - dt * 2);
      const boost = 1 + pulseT * 0.35;
      haloMat.size = haloBase.size * boost;
      haloMat.opacity = haloBase.opacity + pulseT * (state.backdrop === 'title' ? 0.06 : 0.12);
      coreMat.size = coreBase.size * boost;
      coreMat.opacity = coreBase.opacity;

      cam.position.x += (px * 1.1 - cam.position.x) * 0.04;
      cam.position.y += (-py * 0.8 - cam.position.y) * 0.04;
      cam.lookAt(0, 0, 0);

      renderer.render(scene, cam);
    }

    rafId = requestAnimationFrame(loop);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && !paused) {
        paused = true;
        cancelAnimationFrame(rafId);
      } else if (!document.hidden && paused) {
        paused = false;
        clock.getDelta();
        rafId = requestAnimationFrame(loop);
      }
    });

    return {
      setMood(m: Mood) {
        state.mood = m;
        if (m === 'battle') speed = 2.2;
        else if (m === 'sudden') speed = 4;
        else if (m === 'win') speed = 1.4;
        else speed = 1;
        applyMoodColors();
      },
      setBackdropMode(mode: BackdropMode) {
        if (mode === state.backdrop) return;
        state.backdrop = mode;
        applyBackdrop();
      },
      pulse() {
        pulseT = 1;
      },
    };
  } catch {
    return noop;
  }
}
