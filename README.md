# Night Market

A pocket autobattler for mobile — stock your stall with enchanted wares, then watch them fight when the lanterns dim.

## Quick start

```bash
npm install
npm run dev
```

Open the local URL Vite prints (usually `http://localhost:5173`) on your phone or in a mobile-sized browser window.

## Production build

```bash
npm run build
npm run preview
```

Output goes to `dist/` — deploy that folder to any static host (Netlify, Vercel, GitHub Pages, etc.).

## Project structure

```
src/
├── app.ts                 # App orchestration & event wiring
├── main.ts                # Entry point
├── config/constants.ts    # Balance knobs & tier config
├── data/                  # Content definitions (items, heroes, rivals)
├── game/                  # Pure game logic (no DOM)
│   ├── combat.ts          # Combat tick engine
│   ├── economy.ts         # Stats, pricing, descriptions
│   ├── enemy.ts           # Enemy generation
│   ├── run-state.ts       # Run lifecycle
│   ├── shop-actions.ts    # Buy / sell / move / reroll
│   └── types.ts           # Shared TypeScript types
├── ui/                    # DOM rendering & input
│   ├── components/        # Reusable card & sheet builders
│   ├── screens/           # Screen-specific views & battle controller
│   └── drag-drop.ts       # Touch drag-and-drop for shop
├── fx/                    # Visual effects (GSAP, canvas, Three.js)
└── styles/main.css        # All styles
```

## Architecture notes

- **Game logic is DOM-free** — combat, shop math, and enemy generation live under `src/game/` and can be unit-tested independently.
- **UI is a thin layer** — screens render state and forward input back to game actions.
- **FX is isolated** — animations, particles, and the Three.js lantern field are injectable services.
- **Mobile-first** — safe-area insets, touch drag with scroll-aware carousel, `100dvh` layout, no user scaling.

## Tech stack

- [Vite](https://vitejs.dev/) + TypeScript
- [GSAP](https://gsap.com/) for motion
- [Three.js](https://threejs.org/) for ambient background particles
