# Domain Pitfalls

**Domain:** Browser-based 3D dice game with React Three Fiber and WebRTC multiplayer
**Researched:** 2026-03-19

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: React State Driving Physics Updates (The Re-render Death Spiral)

**What goes wrong:** Developers use `useState` to track dice positions/rotations during physics simulation, causing React to re-render the entire component tree 60 times per second. On mobile, this tanks frame rates to single digits and drains battery.

**Why it happens:** React Three Fiber looks like React, so developers reach for React patterns (state, effects) instead of imperative Three.js mutations. The physics simulation produces new positions every frame -- storing those in React state triggers the reconciler on every tick.

**Consequences:** Unplayable frame rates on mobile. Janky dice animations. Excessive battery drain. Users on mid-range phones cannot play.

**Prevention:**
- Use `useFrame` with direct ref mutations for ALL per-frame updates (position, rotation, camera).
- Never call `setState` from within `useFrame` or physics callbacks.
- Use `useRef` for mutable values that don't need to trigger re-renders.
- For values that must flow to React UI (like score), batch updates: let physics settle, THEN update React state once.
- Use `r3f-perf` during development to monitor render counts.

**Detection:** Frame rate drops below 30fps on mobile during dice rolls. React DevTools Profiler shows components re-rendering 60x/second. `r3f-perf` shows high render counts.

**Phase relevance:** Must be established in the initial 3D dice implementation phase. Retrofitting is painful because it requires rearchitecting the data flow between physics and React.

**Confidence:** HIGH -- documented in official R3F pitfalls page and widely reported.

---

### Pitfall 2: Dice Face Detection Returns Wrong Values

**What goes wrong:** After dice come to rest, the game reads the wrong face as "up," causing incorrect scoring. Players see a 6 on top but the game scores it as a 1.

**Why it happens:** Multiple approaches exist and each has failure modes:
- **Euler angle approach:** Checking euler.x/y/z against expected values (like PI/2) fails due to floating-point imprecision and gimbal lock edge cases. Thresholds that seem reasonable (e.g., within 0.1 radians) miss dice that land at slight angles.
- **Raycast approach:** Casting a ray downward from above each die to find the top face fails if geometry normals are inconsistent or the die mesh has unexpected face ordering.
- **Sleep event timing:** Checking face value before the die has truly settled (the physics engine fires "sleepy" before "sleep").

**Consequences:** Scoring is wrong. Players lose trust in the game. The bug is intermittent (only happens at certain rotation angles), making it hard to reproduce and debug.

**Prevention:**
- Use the **local-axis dot-product method**: for each die, transform the six face-normal vectors (e.g., +Y, -Y, +X, -X, +Z, -Z) by the die's world quaternion, then pick whichever transformed normal has the highest dot product with the world up vector (0, 1, 0). This is numerically robust and avoids gimbal lock entirely.
- Map face normals to die values explicitly in a lookup table so geometry changes don't silently break scoring.
- Wait for the physics body's `sleep` event (not `sleepy`) before reading the value.
- Add automated tests: for each of the 6 possible "up" orientations, set the die's quaternion directly and verify the detection returns the correct value.

**Detection:** Occasional scoring mismatches that players notice but can't reproduce. Automated test suite covering all 6 face orientations catches this immediately.

**Phase relevance:** Core dice mechanics phase. Must be bulletproof before any scoring logic is built on top.

**Confidence:** HIGH -- multiple Three.js forum threads document this exact issue, and the quaternion dot-product solution is well-established.

---

### Pitfall 3: WebRTC Signaling Requires a Server (The "Serverless" Lie)

**What goes wrong:** Developers assume WebRTC is purely peer-to-peer and discover at integration time that establishing the initial connection requires exchanging SDP offers/answers through some out-of-band channel. The project spec says "no backend," but WebRTC signaling needs a rendezvous mechanism.

**Why it happens:** WebRTC is peer-to-peer for data transfer, but the initial handshake (signaling) is explicitly not part of the WebRTC spec -- you must provide your own mechanism. Most tutorials use a WebSocket signaling server.

**Consequences:** Either the "no backend" constraint is violated (requiring a signaling server), or the QR code approach becomes much more complex than expected. Standard SDP payloads are ~2,500 bytes, which produces Version 30+ QR codes that are nearly impossible to scan reliably on phone cameras.

**Prevention:**
- Plan for the **two-QR-code exchange pattern**: Host generates an offer QR, joiner scans it and generates an answer QR, host scans the answer. This is clunky but truly serverless.
- Investigate the **QWBP protocol** (QR-WebRTC Bootstrap Protocol) which compresses SDP from ~2,500 bytes down to 55-100 bytes through semantic compression (binary encoding of IP addresses, filtering ICE candidates, eliminating SDP boilerplate). This produces Version 4-5 QR codes that scan in under 500ms.
- Alternatively, accept a minimal signaling relay (e.g., a free Firebase Realtime Database or a simple Supabase channel) as a pragmatic compromise. The game data still flows P2P; only the initial handshake touches a server.
- For LAN play, use only host-type ICE candidates (skip STUN/TURN) to keep the SDP small.

**Detection:** Attempt to build the QR-join flow and discover the QR code is the size of the entire phone screen. Or discover that without a signaling server, there's no way to exchange the answer SDP back to the host.

**Phase relevance:** Must be prototyped early in the multiplayer phase. The signaling mechanism choice has architectural implications for the entire networking layer.

**Confidence:** HIGH -- well-documented WebRTC limitation. QWBP approach is MEDIUM confidence (newer, less battle-tested).

---

### Pitfall 4: Host Disconnection Kills the Game for Everyone

**What goes wrong:** In the host-authoritative model, the host's browser IS the game server. If the host closes their tab, switches apps on mobile, or loses connectivity, every connected player loses their game state instantly. There is no recovery path.

**Why it happens:** Host-authoritative P2P means game state lives only in the host's browser memory. Unlike a dedicated server that persists, a browser tab can be killed at any time by the OS, especially on mobile (memory pressure, phone call interruption, screen lock).

**Consequences:** A 30-minute multiplayer game is lost because the host got a phone call. Players lose trust in remote multiplayer entirely.

**Prevention:**
- **Periodic state snapshots:** Host broadcasts the full serialized game state to all peers every N seconds (or after each turn). Peers store this as a recovery checkpoint.
- **Host migration:** If the host disconnects, the peer with the most recent state snapshot can become the new host. This is complex but essential for a good experience.
- **Simpler alternative:** Since Ten Thousand is turn-based (not real-time), persist game state to the host's localStorage after every turn. If the host refreshes, the game can resume. Peers just need to reconnect (which requires the signaling flow again -- see Pitfall 3).
- **Visibility API detection:** Listen for `document.visibilitychange` to detect when the host's tab is backgrounded and warn other players or trigger a state snapshot.

**Detection:** Test by closing the host's browser tab mid-game. If peers have no recovery path, this pitfall is unaddressed.

**Phase relevance:** Multiplayer architecture phase. Must be designed into the state management from the start, not bolted on later.

**Confidence:** HIGH -- fundamental to any host-authoritative P2P architecture.

---

### Pitfall 5: Physics Engine Choice Creates Mobile Performance Bottleneck

**What goes wrong:** Choosing cannon-es (JavaScript) over Rapier (Rust/WASM) means physics simulation runs entirely on the main thread in JS, competing with React rendering and causing frame drops during dice rolls on mobile devices.

**Why it happens:** cannon-es has more tutorials and examples for dice specifically, so developers default to it. But simulating 6 dice with collision detection, rolling friction, and bounce is computationally expensive -- JavaScript on mobile CPUs struggles.

**Consequences:** Dice rolls stutter or slow down on mobile. Physics simulation takes too long per frame, causing the render loop to miss frames. Battery drain from sustained high CPU usage.

**Prevention:**
- Use **Rapier** via `@react-three/rapier`. It runs physics in WebAssembly with near-native performance. It also has deterministic simulation, which is valuable for multiplayer (same inputs = same results across peers).
- Use `<Physics updateLoop="independent">` to decouple physics from rendering. Physics runs at a fixed timestep; rendering interpolates between physics states.
- Set aggressive `sleepSpeedLimit` and `sleepTimeLimit` so dice stop simulating quickly once they've settled.
- Limit the physics world: only the dice and the table surface need physics bodies. Walls/bumpers can be static colliders with simple shapes.
- Use `frameloop="demand"` on the R3F Canvas when dice are not rolling to stop rendering entirely and save battery.

**Detection:** Test on a mid-range Android phone (not just iPhone or desktop). Monitor frame times during dice rolls with `r3f-perf`. If physics step exceeds 8ms on mobile, there will be frame drops.

**Phase relevance:** Initial 3D dice implementation phase. Switching physics engines later requires rewriting all physics-related code.

**Confidence:** HIGH for the general problem. MEDIUM for Rapier being definitively better for this specific use case (6 dice is a light workload; cannon-es may be fine).

## Moderate Pitfalls

### Pitfall 6: Dice Physics Don't Feel Right

**What goes wrong:** Dice roll unrealistically -- they slide instead of tumbling, stop too abruptly, clip through the table, or bounce like rubber balls. The project explicitly says "the dice rolling experience must feel satisfying."

**Why it happens:** Physics parameters (restitution, friction, mass, damping, initial force vectors) require extensive tuning. Default physics engine values produce dice that feel "wrong." Real dice have complex rolling dynamics with angular friction that most engines don't model well out of the box.

**Prevention:**
- Start with reference implementations (Codrops dice roller tutorial uses cannon-es with tuned values).
- Key parameters to tune: `restitution: 0.3-0.5` (bounce), `friction: 0.5-0.8` (surface grip), angular damping `0.3-0.5` (spin slowdown).
- Apply initial force with both linear velocity AND angular velocity (torque) for realistic tumbling.
- Add invisible walls around the rolling area so dice don't fly off-screen.
- Use a slightly concave table surface (or angled walls) so dice naturally settle toward the center.
- Playtest on mobile early -- haptic feedback (vibration API) can compensate for visual jank.

**Detection:** Show the dice roll to 5 people who have played physical dice games. If any say "that looks weird," keep tuning.

**Phase relevance:** Core dice mechanics phase, but will need ongoing polish throughout development.

**Confidence:** HIGH -- universally reported challenge in dice game development.

---

### Pitfall 7: Scoring Logic Edge Cases Break the Game

**What goes wrong:** The Ten Thousand scoring rules have subtle interactions that are easy to get wrong: three pairs vs. two triples, hot dice triggering incorrectly, the 800-point entry threshold interacting with multi-throw turns, and the final round logic.

**Why it happens:** The rules seem simple but have combinatorial edge cases:
- What if a player has 750 points banked, rolls and scores 100, but hasn't reached 800 yet -- can they keep rolling?
- Hot dice: if all 6 dice are set aside across multiple throws in one turn, does that count? (No -- all 6 must score in a single throw.)
- Three pairs (1000 points) vs. being scored as individual 1s and 5s (which might score higher if there are triples of 1s involved).
- Final round: does the player who triggered 10K get another turn?

**Consequences:** Arguments between players about whether the game is scoring correctly. Loss of trust in the game logic. Rule variants between different groups cause confusion.

**Prevention:**
- Write the scoring engine as a pure function with exhaustive unit tests BEFORE building any UI.
- Test every combination documented in the BCSTH PDF rules.
- Create a test matrix: all possible 6-die combinations (there are only 462 unique unordered combinations of 6 dice with values 1-6) and verify scoring for each.
- Make the scoring breakdown visible to players -- show exactly WHY each score was calculated, not just the total.
- Handle the "best possible score" calculation: when multiple valid scoring interpretations exist (e.g., three pairs = 1000 vs. individual scoring), always pick the highest.

**Detection:** Build a scoring test suite with >100 cases covering all documented rules, edge cases, and the specific variants from the BCSTH PDF.

**Phase relevance:** Must be the FIRST thing built and tested, before any UI. The project description agrees: "if the scoring logic is right, everything else follows."

**Confidence:** HIGH -- rules are well-defined in the PDF but have enough edge cases to trip up any implementation.

---

### Pitfall 8: WebRTC NAT Traversal Fails for Remote Players

**What goes wrong:** P2P connections work on the same network but fail when players are on different networks (different homes, mobile data). ~15-20% of WebRTC connections fail without a TURN relay server.

**Why it happens:** Symmetric NATs (common on mobile carriers and some routers) block the hole-punching technique that STUN relies on. Without a TURN relay as fallback, these connections simply fail silently.

**Consequences:** Players share a QR code with a friend across the internet, and it just... doesn't connect. No error message, no fallback. The feature appears broken.

**Prevention:**
- Use free STUN servers (Google provides `stun:stun.l.google.com:19302`).
- For TURN fallback, use a service like Metered.ca (free tier: 500GB/month) or Xirsys (free tier available).
- Alternatively, accept that remote multiplayer only works when STUN succeeds and communicate this clearly: "Works best on the same Wi-Fi network. Internet play may not work on all networks."
- Implement connection timeout with a clear error message: "Could not connect. Try joining on the same Wi-Fi network."
- The "no backend" constraint makes this harder. Consider TURN as acceptable infrastructure (like a CDN) rather than "a backend."

**Detection:** Test with two devices on different networks (e.g., one on Wi-Fi, one on mobile data). If it fails, TURN is needed.

**Phase relevance:** Multiplayer phase. Must be decided during architecture, as TURN server configuration is part of the ICE configuration.

**Confidence:** HIGH -- well-documented WebRTC limitation with known failure rates.

---

### Pitfall 9: Component Mount/Unmount Causes Visual Glitches

**What goes wrong:** Conditionally rendering 3D dice components (mounting/unmounting React components as dice are added/removed from the scene) causes material recompilation flashes, geometry pop-in, and visible loading stutters.

**Why it happens:** R3F compiles shaders and processes geometry when components mount. Unmounting and remounting (e.g., rolling 4 dice after setting aside 2) triggers this recompilation each time.

**Prevention:**
- Mount all 6 dice once at startup. Toggle visibility (`visible={false}`) and disable physics (`type="kinematic"` or remove from physics world) for inactive dice instead of unmounting.
- Pre-warm materials by rendering all dice off-screen on first load.
- Use `useMemo` for geometries and materials so they're shared across all dice instances.
- Consider `<Instances>` from drei for the dice if they share the same geometry/material.

**Detection:** Watch for white flashes or brief geometry pop-in when dice are rolled after some are set aside.

**Phase relevance:** 3D dice implementation phase.

**Confidence:** HIGH -- documented in official R3F pitfalls.

---

### Pitfall 10: Object Creation in useFrame Causes GC Pauses

**What goes wrong:** Creating new `Vector3`, `Quaternion`, or `Euler` objects inside `useFrame` on every frame allocates thousands of short-lived objects per second, triggering garbage collection pauses that manifest as periodic micro-stutters.

**Why it happens:** JavaScript's garbage collector runs periodically to clean up unreferenced objects. Allocating objects at 60fps creates GC pressure, and GC pauses cause visible frame drops (especially on mobile where GC is less optimized).

**Prevention:**
- Declare reusable objects outside the component or as module-level constants: `const _tempVec = new THREE.Vector3()`.
- Inside `useFrame`, call `.set()`, `.copy()`, or `.fromArray()` on these pre-allocated objects instead of creating new ones.
- Use `r3f-perf` to monitor memory allocation patterns.

**Detection:** Chrome DevTools Performance tab shows periodic GC spikes correlating with frame drops. Sawtooth pattern in memory usage graph.

**Phase relevance:** 3D dice implementation phase. Easy to fix if caught early, painful if spread across many components.

**Confidence:** HIGH -- documented in official R3F pitfalls and general Three.js best practice.

## Minor Pitfalls

### Pitfall 11: Touch Event Conflicts Between R3F Canvas and React UI

**What goes wrong:** On mobile, tapping dice to "set aside" for scoring conflicts with touch events on the R3F canvas. Swiping to scroll the page accidentally rotates the camera. The React UI overlay (score display, buttons) doesn't receive clicks because the canvas intercepts them.

**Prevention:**
- Use `eventPrefix="client"` on the R3F Canvas for correct touch coordinate mapping.
- Disable orbit controls (or any camera controls) -- a dice game doesn't need camera rotation.
- Use `pointerEvents: 'none'` on the Canvas and handle dice selection through a React UI overlay with projected coordinates, OR use R3F's built-in event system with `onPointerDown` on mesh objects.
- Test on actual mobile devices, not just Chrome DevTools device emulation.

**Phase relevance:** UI integration phase.

**Confidence:** MEDIUM -- depends on implementation approach.

---

### Pitfall 12: localStorage Quota Exceeded for Stats

**What goes wrong:** Storing game stats, history, and settings in localStorage seems fine until the data grows. localStorage has a 5-10MB limit per origin (varies by browser). Storing full game replays or extensive history can hit this limit.

**Prevention:**
- Store only aggregate stats (totals, counts, highs) rather than raw game logs.
- Use IndexedDB (via a wrapper like idb-keyval) if detailed history is needed.
- Implement a retention policy: keep last 100 games, prune older data.
- Gracefully handle `QuotaExceededError` -- don't let stats tracking crash the game.

**Phase relevance:** Stats tracking phase. Low risk given the scope of data for a dice game.

**Confidence:** LOW -- unlikely to be an issue for this game's data volume, but worth defensive coding.

---

### Pitfall 13: AI Personality Logic Coupled to UI

**What goes wrong:** AI decision-making (roll/bank/select dice) is implemented inline within React components, making it impossible to test independently and creating timing issues when AI decisions need to trigger animations.

**Prevention:**
- Implement AI as pure functions: `(gameState, personality) => decision`. No side effects, no animation awareness.
- Use a decision queue: AI produces decisions, a separate animation/executor layer plays them out with appropriate delays and animations.
- Test AI strategies with thousands of simulated games (no UI needed) to verify personality differentiation.

**Phase relevance:** AI implementation phase. Architecture decision that must be made upfront.

**Confidence:** HIGH -- standard separation-of-concerns principle applied to this specific domain.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Scoring engine | Edge cases in rule combinations (Pitfall 7) | Build and test scoring as pure functions first, before any UI |
| 3D dice implementation | React state in render loop (Pitfall 1), face detection (Pitfall 2), physics feel (Pitfall 6) | Use refs and useFrame exclusively; implement quaternion dot-product face detection; budget time for tuning |
| Physics setup | Wrong engine choice locks in perf ceiling (Pitfall 5) | Start with Rapier via @react-three/rapier; benchmark on mobile early |
| Multiplayer signaling | QR code too large for SDP (Pitfall 3) | Prototype QR signaling flow in isolation before building game networking |
| Multiplayer architecture | Host disconnect kills game (Pitfall 4), NAT failures (Pitfall 8) | Design state serialization and broadcast from day one; plan TURN fallback |
| Mobile polish | Touch conflicts (Pitfall 11), GC stutters (Pitfall 10), mount flashes (Pitfall 9) | Test on real mobile devices throughout, not just at the end |
| AI opponents | Logic coupled to rendering (Pitfall 13) | Pure function architecture for AI decisions |
| Stats/persistence | localStorage limits (Pitfall 12) | Aggregate stats only; handle quota errors |

## Sources

- [R3F Official Performance Pitfalls](https://r3f.docs.pmnd.rs/advanced/pitfalls) -- HIGH confidence
- [Codrops: Crafting a Dice Roller with Three.js and Cannon-es](https://tympanus.net/codrops/2023/01/25/crafting-a-dice-roller-with-three-js-and-cannon-es/) -- HIGH confidence
- [Three.js Issue #5597: Determining upward face of 3D dice](https://github.com/mrdoob/three.js/issues/5597) -- HIGH confidence
- [Dice orientations and quaternions (Entonos)](https://entonos.com/index.php/2019/09/13/dice-orientations-and-quaternions) -- MEDIUM confidence
- [QWBP: Breaking the QR Limit for Serverless WebRTC](https://magarcia.io/air-gapped-webrtc-breaking-the-qr-limit/) -- MEDIUM confidence
- [WebRTC Data Channels for Games (MDN)](https://developer.mozilla.org/en-US/docs/Games/Techniques/WebRTC_data_channels) -- HIGH confidence
- [BlogGeek: Handling WebRTC Session Disconnections](https://bloggeek.me/handling-session-disconnections-in-webrtc/) -- MEDIUM confidence
- [WebRTC Samples Issue #991: DataChannel broken after reconnection](https://github.com/webrtc/samples/issues/991) -- HIGH confidence
- [react-three-rapier (GitHub)](https://github.com/pmndrs/react-three-rapier) -- HIGH confidence
- [Rapier vs Cannon performance (Three.js forum)](https://discourse.threejs.org/t/rapier-vs-cannon-performance/53475) -- MEDIUM confidence
- [100 Three.js Tips That Actually Improve Performance](https://www.utsubo.com/blog/threejs-best-practices-100-tips) -- MEDIUM confidence
