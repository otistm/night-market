import * as THREE from 'three';
import type { Mood } from '@/game/types';
import { reduceMotion } from '@/fx/animations';

interface Background3D {
  setMood(m: Mood): void;
  pulse(): void;
}

export function createBackground3D(appEl: HTMLElement, canvas: HTMLCanvasElement): Background3D {
  const noop: Background3D = { setMood() {}, pulse() {} };
  if (reduceMotion) return noop;

  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0613, 0.055);

    const cam = new THREE.PerspectiveCamera(60, 1, 0.1, 60);
    cam.position.set(0, 0, 12);

    const texCanvas = document.createElement('canvas');
    texCanvas.width = texCanvas.height = 64;
    const ctx = texCanvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.35, 'rgba(255,255,255,.55)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(texCanvas);

    const N = 150;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const seeds: { s: number; ph: number; mix: number }[] = [];

    const AMBER = new THREE.Color(0xffae34);
    const VIOLET = new THREE.Color(0x8b5cf6);
    const RED = new THREE.Color(0xff4d6a);
    const GOLD = new THREE.Color(0xffd75e);

    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 22;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 18;
      seeds.push({ s: 0.25 + Math.random() * 0.85, ph: Math.random() * 7, mix: Math.random() });
      const c = Math.random() < 0.65 ? AMBER : VIOLET;
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

    const mat = new THREE.PointsMaterial({
      size: 1.15,
      map: tex,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    scene.add(new THREE.Points(geo, mat));

    let speed = 1;
    let drift = 0.55;
    let px = 0;
    let py = 0;
    let pulseT = 0;

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
      const c = geo.attributes.color.array as Float32Array;
      for (let i = 0; i < N; i++) {
        const k = seeds[i].mix < 0.65 ? a : b;
        c[i * 3] = k.r;
        c[i * 3 + 1] = k.g;
        c[i * 3 + 2] = k.b;
      }
      geo.attributes.color.needsUpdate = true;
    }

    (function loop() {
      requestAnimationFrame(loop);
      const dt = Math.min(clock.getDelta(), 0.05);
      const p = geo.attributes.position.array as Float32Array;

      for (let i = 0; i < N; i++) {
        p[i * 3 + 1] += seeds[i].s * drift * speed * dt;
        p[i * 3] += Math.sin(clock.elapsedTime * 0.5 + seeds[i].ph) * 0.12 * dt;
        if (p[i * 3 + 1] > 15) p[i * 3 + 1] = -15;
      }
      geo.attributes.position.needsUpdate = true;

      pulseT = Math.max(0, pulseT - dt * 2);
      mat.size = 1.15 + pulseT * 0.9;

      cam.position.x += (px * 1.1 - cam.position.x) * 0.04;
      cam.position.y += (-py * 0.8 - cam.position.y) * 0.04;
      cam.lookAt(0, 0, 0);

      renderer.render(scene, cam);
    })();

    return {
      setMood(m: Mood) {
        if (m === 'battle') {
          speed = 2.2;
          recolor(RED, VIOLET);
        } else if (m === 'sudden') {
          speed = 4;
          recolor(RED, RED);
        } else if (m === 'win') {
          speed = 1.4;
          recolor(GOLD, AMBER);
        } else {
          speed = 1;
          recolor(AMBER, VIOLET);
        }
      },
      pulse() {
        pulseT = 1;
      },
    };
  } catch {
    return noop;
  }
}
