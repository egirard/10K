# Technology Stack

**Project:** 10K (Ten Thousand Dice Game)
**Researched:** 2026-03-19
**Overall Confidence:** HIGH

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| React | ^19.2.4 | UI framework | React 19 is stable, pairs with R3F v9, provides concurrent rendering benefits for mixing UI + 3D canvas | HIGH |
| TypeScript | ^5.9.3 | Type safety | Stable release, excellent R3F/drei type support. Avoid TS 6.0 RC -- too fresh. | HIGH |
| Vite | ^8.0.0 | Build tool / dev server | Vite 8 ships with Rolldown (replaces esbuild+Rollup), faster builds, native WASM support for Rapier. @vitejs/plugin-react v6 drops Babel dependency. | HIGH |

### 3D Rendering & Physics

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Three.js | ^0.183.2 | 3D rendering engine | Foundation for all 3D in the browser. R3F wraps this. | HIGH |
| @react-three/fiber | ^9.5.0 | React renderer for Three.js | v9 pairs with React 19. Declarative 3D scene graph inside React. The pmndrs ecosystem is the standard for React+3D. | HIGH |
| @react-three/drei | ^10.7.7 | R3F utilities/helpers | Provides Environment, useTexture, shadows, camera controls, and dozens of ready-made abstractions. Massive time saver. | HIGH |
| @react-three/rapier | ^2.2.0 | Physics integration | v2 supports R3F v9 + React 19. Wraps Rapier WASM engine with declarative `<RigidBody>` and `<Physics>` components. Automatic collider generation from meshes. | HIGH |
| @dimforge/rapier3d-compat | ^0.19.3 | Physics engine (WASM) | Rapier is 2-5x faster in 2025/2026 than prior versions. The `-compat` package works without top-level await (better browser compat than `@dimforge/rapier3d`). | HIGH |

### State Management

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Zustand | ^5.0.12 | Global state | Same ecosystem as R3F (pmndrs). ~1.2KB, no Provider wrapper, works inside and outside React (important for game logic that runs outside the render loop). Perfect fit for game state, player turns, scores. | HIGH |

### Multiplayer / Networking

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| PeerJS | ^1.5.5 | WebRTC abstraction | Simplifies WebRTC data channels to a clean API. Handles signaling, peer ID management, connection lifecycle. 250K weekly downloads, battle-tested. Free cloud signaling server works for casual games. | MEDIUM |

### QR Code

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| qrcode.react | ^4.2.0 | QR code generation | Renders QR codes as React SVG components. Simple, lightweight, well-maintained. Used to share game room URLs for remote join. | HIGH |

### Styling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Tailwind CSS | ^4.0 | UI styling | Utility-first CSS. v4 has zero-config setup with Vite, CSS-first configuration, no PostCSS plugin needed. Fast iteration on responsive game UI (scoreboard, menus, modals). | HIGH |

### Testing

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vitest | ^3.x | Unit/integration tests | Native Vite integration, same config, fast. Use for game rule logic (scoring, farkle detection, hot dice). | HIGH |
| Playwright | ^1.x | E2E tests | For testing game flows if needed later. Lower priority than unit tests for game logic. | MEDIUM |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Physics | @react-three/rapier (Rapier) | cannon-es / @react-three/cannon | Cannon-es is unmaintained. Rapier is faster (Rust/WASM), more accurate, actively developed. Cannon had the ecosystem lead historically but Rapier has surpassed it. |
| Physics | @react-three/rapier (Rapier) | Ammo.js (Bullet port) | Ammo.js has a terrible API, huge bundle size (~1MB), no React integration. Rapier is smaller, faster, better DX. |
| State | Zustand | Redux Toolkit | Overkill for a game. Zustand is simpler, same ecosystem (pmndrs), no boilerplate. Game state is not complex enough to justify Redux patterns. |
| State | Zustand | Jotai | Jotai is atomic (bottom-up), Zustand is store-based (top-down). Game state is naturally a single store (current player, scores, dice state, turn phase). Zustand fits better. Also same ecosystem. |
| WebRTC | PeerJS | simple-peer | simple-peer is lower-level -- you must handle signaling yourself. PeerJS includes signaling server. For a casual game with QR-code join, PeerJS's managed peer IDs are ideal. |
| WebRTC | PeerJS | Livekit / mediasoup | These are media-focused SFU solutions. We only need data channels for game state sync. PeerJS is purpose-built for this. |
| Build | Vite | Next.js | No SSR needed. No routing needed. This is a single-page game, not a web app. Vite is lighter and faster. |
| Build | Vite | Create React App | Deprecated. Do not use. |
| 3D | R3F (declarative) | Raw Three.js | R3F provides React lifecycle integration, automatic disposal, pointer events, and the drei/rapier ecosystem. Raw Three.js means reimplementing all of this. |
| QR | qrcode.react | react-qr-code | Both work. qrcode.react has more downloads and longer track record. Either is fine. |
| Styling | Tailwind CSS | CSS Modules | Tailwind is faster for prototyping game UI. CSS Modules are fine but slower to iterate. The game UI (scoreboards, buttons, modals) benefits from utility classes. |
| Styling | Tailwind CSS | styled-components | Runtime CSS-in-JS has performance overhead. Not ideal when sharing the thread with a 3D canvas. Tailwind is zero-runtime. |

## What NOT to Use

| Technology | Why Not |
|------------|---------|
| cannon-es / @react-three/cannon | Unmaintained. Last significant update was 2022. Rapier is the modern standard. |
| Create React App | Officially deprecated. Vite is the community standard. |
| Ammo.js | Massive bundle, terrible DX, no React wrapper. |
| Socket.IO / WebSockets | Requires a server. The project is serverless/client-only. WebRTC data channels replace this. |
| Firebase Realtime Database | Adds a backend dependency. Contradicts the "no backend" constraint. |
| Redux | Unnecessary complexity for game state. |
| styled-components / Emotion | Runtime CSS-in-JS competes for main thread with 3D rendering. |
| Next.js | SSR/routing overhead for a single-page game with no SEO needs. |

## Architecture Notes for Stack Choices

### Why the pmndrs Ecosystem Matters

React Three Fiber, drei, react-three-rapier, and Zustand are all from the **pmndrs** (Poimandres) collective. This matters because:

- Versions are coordinated (R3F v9 + rapier v2 + React 19 all align)
- Patterns are consistent across libraries
- Community support covers the full stack
- Zustand stores can be read from inside R3F's render loop without causing React re-renders (critical for 60fps 3D)

### PeerJS Signaling: Production Considerations

PeerJS's free cloud signaling server (`0.peerjs.com`) is fine for a casual dice game because:

- Signaling only happens at connection time (seconds), not during gameplay
- Once WebRTC data channel is established, traffic is peer-to-peer
- The free server handles the scale of a casual game (not thousands of concurrent rooms)

If the free server becomes unreliable, self-hosting `peerjs-server` is trivial (single npm package, deploys to any Node host). But start with the free server -- YAGNI.

### WASM Loading Strategy

Rapier ships as WASM. Use `@dimforge/rapier3d-compat` (not `@dimforge/rapier3d`) because:

- `-compat` works without top-level `await` -- broader browser support
- `-compat` initializes via `import RAPIER from '@dimforge/rapier3d-compat'; await RAPIER.init()`
- `@react-three/rapier` handles this initialization automatically

### Performance Budget

The 3D canvas with physics runs on the main thread alongside React. Key mitigations:

- Zustand (not Context) avoids re-render cascades reaching the canvas
- Tailwind (not CSS-in-JS) avoids runtime style computation
- Rapier WASM is 2-5x faster than JS physics alternatives
- R3F's `useFrame` hook runs outside React's render cycle

## Installation

```bash
# Initialize project
npm create vite@latest 10k -- --template react-ts
cd 10k

# Core 3D + Physics
npm install three @react-three/fiber @react-three/drei @react-three/rapier

# State management
npm install zustand

# Multiplayer
npm install peerjs

# QR code
npm install qrcode.react

# Styling
npm install tailwindcss @tailwindcss/vite

# Dev dependencies
npm install -D typescript @types/three @types/react @types/react-dom vitest
```

**Note:** `@dimforge/rapier3d-compat` is installed automatically as a dependency of `@react-three/rapier`. Do not install it separately unless you need to pin a version.

## Version Compatibility Matrix

| Package | Version | Requires |
|---------|---------|----------|
| @react-three/fiber v9 | ^9.5.0 | React ^19, Three.js ^0.170 |
| @react-three/rapier v2 | ^2.2.0 | @react-three/fiber ^9, React ^19 |
| @react-three/drei v10 | ^10.7.7 | @react-three/fiber ^9 |
| Zustand v5 | ^5.0.12 | React ^18 or ^19 |
| Vite v8 | ^8.0.0 | Node.js ^20 |
| @vitejs/plugin-react v6 | ^6.0.1 | Vite ^8 |

**Critical:** All @react-three/* packages must target the same major version of R3F. Mixing v8 and v9 packages will break.

## Sources

- [React Three Fiber docs](https://r3f.docs.pmnd.rs/getting-started/introduction) - HIGH confidence
- [React Three Fiber npm](https://www.npmjs.com/package/@react-three/fiber) - Version verified
- [@react-three/rapier GitHub](https://github.com/pmndrs/react-three-rapier) - HIGH confidence
- [@react-three/rapier npm](https://www.npmjs.com/package/@react-three/rapier) - Version verified
- [Rapier physics engine](https://rapier.rs/) - HIGH confidence
- [Dimforge 2025 review](https://dimforge.com/blog/2026/01/09/the-year-2025-in-dimforge/) - Performance claims verified
- [PeerJS](https://peerjs.com/) - MEDIUM confidence (free server reliability unverified for production)
- [PeerJS npm](https://www.npmjs.com/package/peerjs) - Version verified
- [Zustand npm](https://www.npmjs.com/package/zustand) - Version verified
- [Three.js npm](https://www.npmjs.com/package/three) - Version verified
- [Vite 8 announcement](https://vite.dev/blog/announcing-vite8) - HIGH confidence
- [qrcode.react npm](https://www.npmjs.com/package/qrcode.react) - Version verified
- [React 19 npm](https://www.npmjs.com/package/react) - Version verified
- [TypeScript npm](https://www.npmjs.com/package/typescript) - Version verified
