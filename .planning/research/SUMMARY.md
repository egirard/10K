# Project Research Summary

**Project:** 10K (Ten Thousand Dice Game)
**Domain:** Browser-based 3D dice game with physics, AI opponents, and WebRTC P2P multiplayer
**Researched:** 2026-03-19
**Confidence:** HIGH

## Executive Summary

Ten Thousand (a Farkle variant) is a well-understood casual dice game that every browser competitor implements poorly in one critical dimension: the physical act of rolling dice. All major competitors (cardgames.io, BuddyBoardGames, Board Game Arena) use flat 2D dice and generic web aesthetics. This project's core value proposition is a premium, physics-based 3D dice experience on a felt game table — a differentiator no browser competitor has executed well. The recommended approach is to build on the pmndrs ecosystem (React Three Fiber v9 + react-three-rapier v2 + Zustand v5 on React 19 + Vite 8), which provides a coherent, version-coordinated stack purpose-built for exactly this use case.

The architecture must enforce a hard separation between pure game logic (the scoring engine in `engine/`), 3D rendering (R3F scene components), and React UI (HUD overlay). This separation is not optional — it is what makes the scoring engine independently testable, enables AI opponents as pure strategy functions, and allows the networking layer to reuse the same `applyAction()` pipeline as local play. The build order implied by architecture research is definitive: scoring engine first, then 3D scene, then stores/hooks wiring them together, then React HUD, then AI, then networking. Each phase depends only on what came before.

The most dangerous risks are concentrated in two phases: the initial 3D dice implementation (where React state management anti-patterns cause unplayable mobile performance) and the WebRTC multiplayer phase (where signaling complexity and NAT traversal failures can derail the entire feature). Both risks are well-documented and have clear mitigations — Rapier over cannon-es, quaternion dot-product face detection, `useFrame` with ref mutations instead of React state for physics, and PeerJS for managed signaling rather than manual SDP exchange. WebRTC multiplayer should be deferred to v2 to keep the launch scope manageable.

## Key Findings

### Recommended Stack

The stack is built around the pmndrs collective's ecosystem, where React Three Fiber, react-three-rapier, and Zustand are version-coordinated. The critical version alignment is R3F v9 + react-three-rapier v2 + React 19. Vite 8 with Rolldown provides significantly faster builds and native WASM support, which matters because Rapier ships as WASM. Tailwind CSS v4's zero-config Vite integration and zero-runtime cost are important for a UI that shares the main thread with 3D physics rendering.

**Core technologies:**
- React 19 + TypeScript 5.9: UI framework with concurrent rendering — stable, excellent R3F ecosystem support
- Vite 8 + @vitejs/plugin-react v6: Build/dev server with Rolldown, no Babel, native WASM — faster builds and better Rapier compatibility
- @react-three/fiber v9: Declarative React renderer for Three.js — the standard for React + 3D
- @react-three/drei v10: Utilities (Environment, useTexture, shadows) — massive time saver
- @react-three/rapier v2: Physics integration wrapping Rapier WASM — 2-5x faster than cannon-es, deterministic for multiplayer
- Zustand v5: Global state — same pmndrs ecosystem, readable from inside R3F's render loop without re-renders
- PeerJS v1.5.5: WebRTC abstraction with managed signaling — free cloud server handles casual game scale
- qrcode.react v4.2: QR code generation for game room join links
- Tailwind CSS v4: Zero-runtime utility CSS — safe for main thread shared with 3D canvas
- Vitest v3: Unit tests for game engine logic — native Vite integration

### Expected Features

The feature landscape is clear: the scoring logic engine and 3D physics dice on a felt table are the non-negotiable core. Everything else layers on top of these two foundations. Competitors have the scoring right; none have the 3D physics experience.

**Must have (table stakes for v1):**
- Scoring logic engine with all BCSTH variant rules (singles, triples, straights, three pairs, hot dice, entry threshold, final round)
- 3D physics dice rolling on felt table surface — the core differentiator
- Dice selection UI (click/tap to hold scoring dice)
- Roll and Bank actions with turn state management
- Farkle and hot dice detection with feedback
- Score display for all players and turn indicator
- Single-player vs one AI opponent (simple strategy)
- Scoring reference accessible in-game
- Mobile-responsive layout with touch-optimized controls
- Basic sound effects (dice clatter, bank, farkle)

**Should have (v1.x after validation):**
- Multiple named AI personalities with distinct risk strategies
- Hotseat multiplayer (pass-and-play, same device)
- Configurable rules (threshold, target score, scoring variants)
- Stats tracking in localStorage (wins, streaks, personal bests)
- Visual juice (animated score tallying, speed settings)
- Full game table aesthetic polish (wood rim, warm lighting, textures)

**Defer (v2+):**
- WebRTC peer-to-peer remote multiplayer — significant complexity, needs stable game state model first
- QR code game joining — depends on WebRTC being solid
- Dice roll anticipation and camera work — polish requiring mature 3D engine

### Architecture Approach

The architecture is a four-layer stack: Presentation (React HUD components + R3F Canvas), State (three Zustand stores: gameStore, diceStore, networkStore), Logic (pure TypeScript game engine + Rapier physics + PeerJS network manager), and Persistence (localStorage). The defining pattern is that the game engine is pure TypeScript with zero framework imports — it accepts GameActions and returns new GameState. This same `applyAction()` function serves human input, AI decisions, and network messages identically. The 3D scene communicates with physics through `useFrame` and direct ref mutations, never through React state or Zustand updates during the render loop.

**Major components:**
1. Game Engine (`engine/`) — Pure TypeScript: scoring rules, turn flow, farkle detection, AI strategies. Zero React dependencies. Fully unit-testable.
2. R3F Scene (`scene/`) — Dice meshes, Rapier physics world, game table, camera. Reads Zustand goal state; uses `useFrame` for interpolated animation. Never contains game logic.
3. React HUD (`components/hud/`) — Scoreboard, turn controls, menus. Overlays the canvas. Reads stores; dispatches actions through hooks.
4. Zustand Stores (`stores/`) — The communication bridge between all layers. Engine writes, UI reads, network syncs.
5. Network Manager (`network/`) — PeerJS wrapper. Converts incoming messages to GameActions; forwards host state broadcasts to peers. Does not interpret game rules.

### Critical Pitfalls

1. **React state driving physics updates (re-render death spiral)** — Use `useFrame` with direct ref mutations for all per-frame updates. Never call `setState` from `useFrame`. Only push milestone events to Zustand (dice settled, final values). This must be established at the start of the 3D dice phase; retrofitting is painful.

2. **Dice face detection returning wrong values** — Use the quaternion dot-product method: transform the six face-normal vectors by the die's world quaternion, pick whichever has the highest dot product with world up. Avoid Euler angle checks entirely (gimbal lock, floating-point failures). Test all 6 orientations in an automated test suite.

3. **WebRTC signaling complexity** — Manual SDP exchange via QR produces ~2,500-byte QR codes that are nearly impossible to scan. Use PeerJS, which reduces the QR payload to a short peer ID string. The QWBP protocol (compresses SDP to ~55-100 bytes) is an alternative if truly serverless is required.

4. **Host disconnection killing the game** — In host-authoritative P2P, if the host's tab closes, the game is lost. Mitigate with periodic state snapshot broadcasts to all peers and localStorage persistence after each turn. Design this into state management from the start.

5. **Scoring logic edge cases** — Build the scoring engine as pure functions with exhaustive unit tests before any UI. Test all 462 unique unordered 6-die combinations. The optimal-score selection (three pairs vs. individual scoring of the same dice) and hot dice rules are the most error-prone areas.

## Implications for Roadmap

Based on the architecture's explicit build-order dependency chain and the feature prioritization research, the natural phase structure is:

### Phase 1: Scoring Engine
**Rationale:** The scoring logic is the dependency foundation for everything — game loop, AI, multiplayer, and stats all depend on a correct and tested scoring engine. Building it first in pure TypeScript means it can be fully validated before any UI exists.
**Delivers:** A production-quality, fully tested implementation of Ten Thousand scoring rules (BCSTH variant). All edge cases covered. Runnable unit tests as the specification.
**Addresses:** Correct scoring logic (table stakes), farkle detection, hot dice detection, entry threshold, final round logic
**Avoids:** Scoring edge case pitfall (Pitfall 7) — all 462 6-die combinations tested before building on top

### Phase 2: 3D Dice and Game Table
**Rationale:** The core differentiator must be validated early. This is the highest-risk, highest-value technical challenge. If the dice physics can't feel satisfying on mobile, the project's premise fails. It is also architecturally independent of game logic at this stage — the integration point (reading face values) is well-defined.
**Delivers:** Six dice with Rapier physics on a felt game table. Quaternion-based face detection. Dice feel right on mobile. Performance budget established.
**Uses:** @react-three/fiber v9, @react-three/rapier v2, @react-three/drei v10, Three.js
**Avoids:** React state re-render spiral (Pitfall 1), wrong face detection (Pitfall 2), cannon-es performance ceiling (Pitfall 5), GC pauses from in-frame object creation (Pitfall 10), mount/unmount flash glitches (Pitfall 9)

### Phase 3: Core Game Loop and HUD
**Rationale:** Wire the scoring engine to the 3D dice via Zustand stores and hooks, add the React HUD overlay. This is the phase where the game becomes playable for the first time. The architecture must keep the `useFrame` / physics layer isolated from React re-renders.
**Delivers:** A playable single-turn game: roll dice, select scoring dice, bank or roll again, detect farkle, detect hot dice. Score display, roll/bank controls, turn indicator.
**Implements:** diceStore, gameStore, useDiceRoll hook, useGameFlow hook, TurnControls, Scoreboard, TurnIndicator
**Avoids:** Game logic in React components (Architecture Anti-Pattern 1), physics state through Zustand (Anti-Pattern 2), touch event conflicts (Pitfall 11)

### Phase 4: Single-Player and AI Opponents
**Rationale:** A complete solo game loop (player vs AI) is the MVP validation target. The AI must be implemented as pure strategy functions that feed into the same `applyAction()` pipeline as human input. Named AI personalities provide replayability without backend complexity.
**Delivers:** Full playable game: multi-player turn order, entry threshold, final round, game over detection, AI opponent(s) with distinct risk strategies, scoring reference.
**Addresses:** AI personalities (differentiator), configurable rules (should-have)
**Avoids:** AI logic coupled to rendering (Pitfall 13) — AI produces decisions, animation layer executes them separately

### Phase 5: Hotseat Multiplayer and Polish
**Rationale:** Hotseat multiplayer (pass-and-play) requires only turn management already built in Phase 4 and adds the "pass the device" prompt. This is low complexity but high value for family/group use. Polish features (sound, juice, stats) layer in here without architectural risk.
**Delivers:** Hotseat multiplayer, basic sound design (dice clatter, bank, farkle), animated score tallying, stats tracking in localStorage, mobile responsiveness polish.
**Addresses:** Hotseat multiplayer (should-have), sound design (should-have), stats (should-have), animated feedback (should-have)
**Avoids:** localStorage quota exceeded (Pitfall 12) — store aggregate stats only

### Phase 6: WebRTC Remote Multiplayer (v2)
**Rationale:** Remote multiplayer is the highest-complexity phase and deferred until the core game is solid. By this point, the game state model is stable, actions are serializable, and the host-authoritative pattern is embedded in the architecture. The signaling approach (PeerJS) and host-disconnect mitigation must be prototyped before committing to this phase.
**Delivers:** Peer-to-peer remote multiplayer with QR code join, host-authoritative state sync, deterministic physics replication, connection error handling.
**Uses:** PeerJS v1.5.5, qrcode.react v4.2, network stores and manager
**Avoids:** Manual SDP in QR codes (Pitfall 3), host disconnect data loss (Pitfall 4), NAT traversal failures (Pitfall 8), network code coupled to game logic (Architecture Anti-Pattern 3 and 4)

### Phase Ordering Rationale

- **Scoring engine before everything** because all downstream features (game loop, AI, multiplayer) depend on it being correct and tested.
- **3D dice before game loop** because it is the highest-risk technical unknown. Validating early avoids discovering a fatal flaw after investing in the full game loop.
- **Single-player before multiplayer** because multiplayer adds zero new game logic — it reuses the action pipeline. Building multiplayer first would couple complexity unnecessarily.
- **WebRTC last** because it depends on a stable, serializable game state model that emerges naturally from building phases 1-5. The architecture research explicitly states: "Networking is last because it adds complexity but zero new game logic."

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (3D Dice):** Physics parameter tuning for dice feel (restitution, friction, damping) requires experimentation. The Rapier-specific sleep threshold configuration needs hands-on testing. Reference the Codrops cannon-es tutorial for parameter starting points, then adapt to Rapier.
- **Phase 6 (WebRTC):** The PeerJS free cloud signaling server reliability for production should be verified. TURN server selection (Metered.ca vs Xirsys free tier) needs current availability check. The QWBP protocol for SDP compression is MEDIUM confidence — may need alternative.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Scoring Engine):** Rules are fully documented in the BCSTH PDF. Pure TypeScript implementation with Vitest. Well-understood domain.
- **Phase 3 (Game Loop/HUD):** Standard Zustand + R3F patterns. Well-documented in pmndrs ecosystem. The data flow is fully specified in ARCHITECTURE.md.
- **Phase 4 (AI):** AI strategy as pure functions is a standard pattern. Named personalities with risk thresholds are straightforward to parameterize.
- **Phase 5 (Polish/Hotseat):** Hotseat is minimal (turn management already exists). localStorage stats are standard. Sound design is additive.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified against npm. pmndrs ecosystem alignment confirmed. PeerJS free server reliability unverified for production load. |
| Features | HIGH | Competitor analysis confirms table stakes. BCSTH rules documented in PDF. Feature dependencies clearly mapped. |
| Architecture | HIGH | Build order derived from dependency analysis. Patterns confirmed against real-world R3F+Rapier dice implementation (Owlbear Rodeo). Anti-patterns well-documented. |
| Pitfalls | HIGH | Critical pitfalls are documented in official R3F docs and multiple community sources. QWBP SDP compression is MEDIUM (newer, less battle-tested). |

**Overall confidence:** HIGH

### Gaps to Address

- **PeerJS free server production reliability:** The architecture recommends starting with the free `0.peerjs.com` server and self-hosting `peerjs-server` if needed. During Phase 6 planning, verify current uptime history and assess whether self-hosting on a minimal Node host is needed from the start.
- **Rapier sleep threshold tuning for mobile:** The exact `sleepSpeedLimit` and `sleepTimeLimit` values that produce good dice behavior on low-end Android need empirical testing. Cannot be determined from documentation alone. Budget dedicated time in Phase 2 for this.
- **TURN server for remote play:** ~15-20% of WebRTC connections fail without TURN. The "no backend" constraint is in tension with reliable remote play. Decision: accept STUN-only for v1 with a clear "works best on same Wi-Fi" disclaimer, or include a free-tier TURN server (Metered.ca) from the start. Resolve during Phase 6 planning.
- **Optimal score selection algorithm:** When multiple valid scoring interpretations exist for the same dice (e.g., three pairs vs. combinations of singles/triples), the engine must always pick the highest. The algorithm for this (exhaustive scoring of all valid subsets) needs to be specified during Phase 1 planning to avoid a later rewrite.

## Sources

### Primary (HIGH confidence)
- [React Three Fiber docs](https://r3f.docs.pmnd.rs/) — R3F v9 patterns, pitfalls, useFrame best practices
- [react-three-rapier GitHub](https://github.com/pmndrs/react-three-rapier) — v2 API, deterministic physics, sleep configuration
- [Rapier physics engine](https://rapier.rs/) — WASM performance, determinism guarantees
- [Dimforge 2025 review](https://dimforge.com/blog/2026/01/09/the-year-2025-in-dimforge/) — Rapier performance claims
- [Vite 8 announcement](https://vite.dev/blog/announcing-vite8) — Rolldown, WASM support, plugin-react v6
- [Owlbear Rodeo dice project](https://github.com/owlbear-rodeo/dice) — Real-world R3F+Rapier dice implementation
- [R3F Official Pitfalls page](https://r3f.docs.pmnd.rs/advanced/pitfalls) — Performance anti-patterns
- [Three.js issue #5597](https://github.com/mrdoob/three.js/issues/5597) — Dice face detection via quaternions
- [PeerJS documentation](https://peerjs.com/docs/) — Signaling API, peer ID management
- npm version verification for all packages (2026-03-19)

### Secondary (MEDIUM confidence)
- [Codrops: Dice Roller with Three.js and Cannon-es](https://tympanus.net/codrops/2023/01/25/crafting-a-dice-roller-with-three-js-and-cannon-es/) — Physics parameter tuning reference (cannon-es values as starting point)
- [Rapier vs Cannon performance (Three.js forum)](https://discourse.threejs.org/t/rapier-vs-cannon-performance/53475) — Performance comparison
- [R3F state management patterns (Three.js forum)](https://discourse.threejs.org/t/how-to-use-state-management-with-react-three-fiber-without-performance-issues/61223) — Zustand integration patterns
- [QWBP: SDP compression for serverless WebRTC](https://magarcia.io/air-gapped-webrtc-breaking-the-qr-limit/) — SDP compression to 55-100 bytes
- [BlogGeek: WebRTC session disconnection handling](https://bloggeek.me/handling-session-disconnections-in-webrtc/) — Host migration patterns
- [Dice orientations and quaternions (Entonos)](https://entonos.com/index.php/2019/09/13/dice-orientations-and-quaternions) — Face detection approach

### Tertiary (LOW confidence)
- [Farkle Rules (Dice Game Depot)](https://www.dicegamedepot.com/farkle-rules/) — Rule variants reference (BCSTH PDF is authoritative)

---
*Research completed: 2026-03-19*
*Ready for roadmap: yes*
