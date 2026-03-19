# Architecture Research

**Domain:** Browser-based multiplayer dice game with 3D graphics and WebRTC P2P
**Researched:** 2026-03-19
**Confidence:** HIGH

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Presentation Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  React UI    │  │  R3F Canvas  │  │  QR / Join   │          │
│  │  (HUD, menus │  │  (3D scene,  │  │  (connection │          │
│  │   scores)    │  │   dice, table│  │   flow)      │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                  │                  │
├─────────┴─────────────────┴──────────────────┴──────────────────┤
│                     State Layer (Zustand)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Game Store  │  │  Dice Store  │  │  Network     │          │
│  │  (turns,     │  │  (positions, │  │  Store       │          │
│  │   scores,    │  │   results,   │  │  (peers,     │          │
│  │   players)   │  │   animation) │  │   connection)│          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                  │                  │
├─────────┴─────────────────┴──────────────────┴──────────────────┤
│                     Logic Layer                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Game Engine │  │  Physics     │  │  Network     │          │
│  │  (rules,     │  │  (Rapier     │  │  Manager     │          │
│  │   scoring,   │  │   simulation │  │  (PeerJS,    │          │
│  │   turns, AI) │  │   + readout) │  │   WebRTC)    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                     Persistence Layer                           │
│  ┌──────────────────────────────────────────────────────┐       │
│  │              localStorage (stats, settings)          │       │
│  └──────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| React UI | HUD overlay: scores, turn indicator, controls, menus, settings | React components rendered outside the R3F Canvas via HTML overlay |
| R3F Canvas | 3D scene: dice meshes, game table, lighting, camera | `<Canvas>` with Drei helpers, custom dice components, Rapier physics world |
| QR / Join Flow | Connection setup: generate/scan QR, lobby management | Modal flow using QR code library + PeerJS peer ID exchange |
| Game Store | Authoritative game state: players, scores, current turn, phase | Zustand store, subscribed by both UI and network layer |
| Dice Store | Dice-specific state: which dice are held, roll results, animation phase | Zustand store, drives both 3D visuals and scoring logic |
| Network Store | Connection state: peer list, connection status, host/guest role | Zustand store, updated by Network Manager |
| Game Engine | Pure game logic: scoring rules, turn flow, farkle detection, AI decisions | Plain TypeScript module, no React dependencies, fully testable |
| Physics | Dice simulation: apply forces, detect settled state, read face values | Rapier via `@react-three/rapier`, deterministic simulation |
| Network Manager | WebRTC orchestration: signaling, message serialization, state sync | PeerJS wrapper, sends/receives game actions over DataChannel |
| Persistence | Stats tracking, settings storage | localStorage with JSON serialization |

## Recommended Project Structure

```
src/
├── components/              # React UI components
│   ├── hud/                 # In-game overlay (scores, controls)
│   │   ├── Scoreboard.tsx
│   │   ├── TurnControls.tsx # Roll, Bank, Select dice buttons
│   │   └── TurnIndicator.tsx
│   ├── menu/                # Screens: main menu, settings, lobby
│   │   ├── MainMenu.tsx
│   │   ├── GameSetup.tsx
│   │   └── LobbyScreen.tsx
│   └── connection/          # QR code generation/scanning, join flow
│       ├── HostQRCode.tsx
│       └── JoinGame.tsx
├── scene/                   # R3F 3D scene components
│   ├── GameScene.tsx        # Top-level Canvas + scene setup
│   ├── GameTable.tsx        # Felt/wood surface, walls, lighting
│   ├── Dice.tsx             # Single die: mesh + rigid body + face readout
│   ├── DiceGroup.tsx        # Manages 6 dice, rolling area, held area
│   └── Camera.tsx           # Camera positioning, responsive adjustments
├── engine/                  # Pure game logic (zero React imports)
│   ├── scoring.ts           # Scoring rules: singles, triples, straights, etc.
│   ├── turn.ts              # Turn flow: roll, select, bank, farkle, hot dice
│   ├── game.ts              # Game flow: player order, threshold, final round
│   ├── ai.ts                # AI personality strategies
│   └── types.ts             # Game state types, action types
├── stores/                  # Zustand state stores
│   ├── gameStore.ts         # Players, scores, turn state, game phase
│   ├── diceStore.ts         # Dice values, held state, roll animation phase
│   └── networkStore.ts      # Peers, connection status, host/guest role
├── network/                 # WebRTC / P2P networking
│   ├── peerManager.ts       # PeerJS connection lifecycle
│   ├── protocol.ts          # Message types, serialization
│   └── sync.ts              # State synchronization logic (host broadcasts)
├── persistence/             # Local storage
│   ├── stats.ts             # Stats tracking (wins, high scores, streaks)
│   └── settings.ts          # Game settings (threshold, target score)
├── hooks/                   # Shared React hooks
│   ├── useDiceRoll.ts       # Orchestrates: physics trigger -> settle -> score
│   ├── useGameFlow.ts       # Turn/game lifecycle management
│   └── useConnection.ts     # Network connection management
├── assets/                  # Textures, models
│   ├── textures/            # Felt, wood, dice face textures
│   └── sounds/              # Dice rolling, banking sounds (optional)
├── App.tsx                  # Root: routing between menu and game
└── main.tsx                 # Entry point
```

### Structure Rationale

- **engine/:** Pure TypeScript with zero framework dependencies. This is the most critical code (game rules) and must be independently testable with unit tests. No React, no Three.js, no side effects.
- **scene/:** All R3F components live here. These components read from Zustand stores and use `useFrame` for animations. They never contain game logic.
- **components/:** Standard React UI that overlays the 3D scene. Uses HTML/CSS, not 3D elements.
- **stores/:** Zustand stores are the communication bridge between all layers. The game engine writes to stores, the UI reads from stores, the network layer syncs stores across peers.
- **network/:** Isolated from game logic. The network layer transmits actions and state, but does not interpret game rules. This means single-player and multiplayer use the same game engine code path.

## Architectural Patterns

### Pattern 1: Command Pattern for Game Actions

**What:** All player actions (roll, select die, bank score) are expressed as serializable command objects. The game engine processes commands and produces new state.
**When to use:** Always. This is the backbone of both local play and network sync.
**Trade-offs:** Slightly more ceremony than direct state mutation, but enables network replay, undo, and AI integration.

**Example:**
```typescript
// engine/types.ts
type GameAction =
  | { type: 'ROLL_DICE' }
  | { type: 'SELECT_DIE'; dieIndex: number }
  | { type: 'DESELECT_DIE'; dieIndex: number }
  | { type: 'BANK_SCORE' }
  | { type: 'START_GAME'; players: Player[] };

// engine/game.ts
function applyAction(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'ROLL_DICE': return handleRoll(state);
    case 'SELECT_DIE': return handleSelect(state, action.dieIndex);
    case 'BANK_SCORE': return handleBank(state);
    // ...
  }
}
```

### Pattern 2: Dual-State for 3D Rendering

**What:** Separate "goal state" (app-level, in Zustand) from "frame state" (interpolated per-frame in `useFrame`). The 3D scene interpolates toward goal positions rather than snapping.
**When to use:** All 3D animations -- dice positions, camera movement, score popups.
**Trade-offs:** Requires discipline to not push frame-rate updates through Zustand. Well-established pattern in the R3F community.

**Example:**
```typescript
// scene/Dice.tsx
function Dice({ index }: { index: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const isHeld = useDiceStore(state => state.dice[index].held); // goal state

  useFrame(() => {
    if (!meshRef.current) return;
    // Interpolate toward held position (goal), don't set directly
    const targetY = isHeld ? 0.5 : 0;
    meshRef.current.position.y = THREE.MathUtils.lerp(
      meshRef.current.position.y, targetY, 0.1
    );
  });

  return <mesh ref={meshRef}>...</mesh>;
}
```

### Pattern 3: Host-Authoritative Networking

**What:** The game creator's browser runs the game engine and is the source of truth. Remote players send actions to the host; the host validates, applies, and broadcasts resulting state to all peers.
**When to use:** All remote multiplayer games in this project.
**Trade-offs:** Simple to reason about (single source of truth), avoids consensus complexity. Downside: if the host disconnects, the game ends. Acceptable for casual play.

**Flow:**
```
Guest Player                    Host Player
    │                               │
    │── action (BANK_SCORE) ───────>│
    │                               ├── validate action
    │                               ├── applyAction(state, action)
    │                               ├── update local store
    │<── full game state broadcast ─┤
    │                               │──> broadcast to all guests
    ├── update local store          │
```

### Pattern 4: Deterministic Physics for Network Sync

**What:** Rather than syncing physics frames, the host sends dice roll parameters (initial positions, forces, torques) to guests. Each peer runs identical Rapier simulation locally and arrives at the same result.
**When to use:** Dice rolling in multiplayer mode.
**Trade-offs:** Rapier is deterministic by default (same WASM binary, same inputs = same outputs). Avoids streaming physics state. Caveat: must disable interpolation for determinism and ensure all peers use the same Rapier version.

**Example:**
```typescript
// network/protocol.ts
type DiceRollParams = {
  seeds: Array<{
    position: [number, number, number];
    impulse: [number, number, number];
    torque: [number, number, number];
  }>;
};

// Host generates params, applies locally, broadcasts to guests
// Guests receive params, apply to their local Rapier world
// Both see the same dice animation and read the same final values
```

## Data Flow

### Core Game Loop (Single Player / Hotseat)

```
[Player clicks "Roll"]
    │
    ├── TurnControls dispatches GameAction { type: 'ROLL_DICE' }
    │
    ├── useDiceRoll hook:
    │   ├── Generate random roll parameters (forces, torques)
    │   ├── Apply to Rapier rigid bodies
    │   ├── Set diceStore.phase = 'rolling'
    │   │
    │   ├── useFrame loop: monitor rigid bodies for sleep/settled
    │   │
    │   └── On settled:
    │       ├── Read face values from dice orientations
    │       ├── Set diceStore.values = [results]
    │       ├── Set diceStore.phase = 'scored'
    │       ├── Call engine/scoring.ts to compute available scores
    │       └── Update gameStore with scoring options
    │
    ├── [Player selects dice, clicks "Bank" or "Roll Again"]
    │   └── Repeat cycle or end turn
    │
    └── gameStore updates trigger React UI re-renders (Scoreboard, TurnIndicator)
```

### Multiplayer Data Flow (WebRTC)

```
[Guest Player]                              [Host Player]
     │                                           │
     ├── User action ──> networkManager.send() ──>│
     │   (serialized GameAction)                  │
     │                                            ├── Validate action
     │                                            │   (is it their turn? legal move?)
     │                                            │
     │                                            ├── applyAction(gameState, action)
     │                                            │
     │                                            ├── If ROLL_DICE:
     │                                            │   ├── Generate roll params
     │                                            │   ├── Apply physics locally
     │                                            │   └── Broadcast rollParams to all
     │                                            │
     │<── State update + rollParams ──────────────┤
     │                                            │
     ├── Apply rollParams to local physics        │
     ├── Update local gameStore from host state    │
     └── UI re-renders from store                  │
```

### Connection Setup Flow (QR Code)

```
[Host]                                      [Guest]
  │                                            │
  ├── Create PeerJS Peer(hostId)               │
  ├── Generate QR code containing:             │
  │   { hostPeerId, gameUrl }                  │
  ├── Display QR on screen                     │
  │                                            │
  │                        [Guest scans QR] ───┤
  │                                            ├── Open gameUrl
  │                                            ├── Create PeerJS Peer(guestId)
  │                                            ├── Connect to hostPeerId
  │                                            │
  │<── DataChannel established ────────────────┤
  │                                            │
  ├── Add guest to game lobby                  │
  ├── Broadcast lobby state                    │
  │                                            │
  │   [Host starts game]                       │
  ├── Broadcast initial GameState ─────────────>│
  │                                            ├── Enter game view
```

### State Management

```
                    ┌──────────────┐
                    │  Game Engine  │
                    │  (pure logic) │
                    └──────┬───────┘
                           │ produces new state
                           v
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  diceStore   │  │  gameStore   │  │ networkStore  │
│  - dice[]    │  │  - players[] │  │  - peers[]    │
│  - phase     │  │  - scores[]  │  │  - isHost     │
│  - held[]    │  │  - turnIdx   │  │  - status     │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                  │
       ├── R3F scene     ├── React HUD      ├── Connection UI
       │   subscribes    │   subscribes     │   subscribes
       v                 v                  v
   [3D Dice]       [Scoreboard]       [Lobby/Status]
```

### Key Data Flows

1. **Dice Roll:** User action -> generate physics params -> Rapier simulation -> settled detection -> face readout -> scoring engine -> store update -> UI refresh
2. **Network Sync:** Guest action -> DataChannel to host -> host validates + applies -> host broadcasts state -> all guests update stores
3. **AI Turn:** Game engine detects AI player's turn -> AI strategy evaluates risk -> generates actions -> same pipeline as human player (actions applied, physics rendered)
4. **Persistence:** On game end, stats module reads final gameStore state -> merges with localStorage history -> writes back

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1-4 players (target) | Single PeerJS connection per guest to host. Minimal bandwidth (game actions are small JSON). No adjustments needed. |
| 5-8 players | PeerJS handles this fine. Host broadcasts to all peers in a star topology. Game turns are sequential so no concurrent state conflicts. |
| 8+ players | Not a design goal. If needed: batch state updates, compress payloads. Realistically, a dice game with 8+ players would be tedious anyway. |

### Scaling Priorities

1. **First bottleneck: Mobile GPU performance.** Six dice with physics on low-end phones. Mitigation: use simple geometries (BoxGeometry, not imported models), limit shadow maps, use Drei's `AdaptiveDpr` to lower resolution on slow devices.
2. **Second bottleneck: Physics settle detection.** Rapier must detect when all dice have stopped moving. If the sleep threshold is too sensitive, dice may appear settled but jitter. Mitigation: tune `sleeping` thresholds in Rapier config and add a short debounce after bodies sleep.

## Anti-Patterns

### Anti-Pattern 1: Game Logic in React Components

**What people do:** Put scoring rules, turn validation, and game flow inside React event handlers or component effects.
**Why it's wrong:** Untestable without rendering. Impossible to reuse for AI players or network sync. Couples game rules to UI framework.
**Do this instead:** Keep all game logic in `engine/` as pure functions. Components dispatch actions; the engine processes them.

### Anti-Pattern 2: Pushing Physics State Through Zustand

**What people do:** Store per-frame physics positions/rotations in Zustand and re-render React on every frame.
**Why it's wrong:** 60Hz state updates through React's reconciler destroy performance. Zustand triggers re-renders on every update.
**Do this instead:** Use `useFrame` to read Rapier body positions directly and mutate Three.js object transforms. Only push "milestone" events to Zustand (roll started, dice settled, final values).

### Anti-Pattern 3: Coupling Network Code to Game Logic

**What people do:** Write WebRTC message handlers that directly mutate game state or call scoring functions.
**Why it's wrong:** Makes it impossible to play offline, breaks single-player mode, creates untestable spaghetti.
**Do this instead:** Network layer receives messages and converts them to GameActions. The same `applyAction()` function handles actions from local UI, AI, and network peers identically.

### Anti-Pattern 4: Manual SDP Exchange via QR for WebRTC

**What people do:** Encode raw SDP offers in QR codes, requiring a two-way QR scan (offer + answer).
**Why it's wrong:** SDP blobs are large (multiple KB), require two-way exchange (host scans guest's answer too), and fail without ICE/STUN configuration.
**Do this instead:** Use PeerJS with its free cloud signaling server. The QR code only needs to encode a short peer ID string (or a URL containing it). PeerJS handles SDP exchange, ICE candidates, and STUN traversal automatically.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| PeerJS Cloud Server | Signaling only (peer discovery + SDP relay) | Free tier, no data passes through it. Self-hostable if needed. |
| Google STUN (stun:stun.l.google.com:19302) | NAT traversal for WebRTC | Free, used by PeerJS by default. Needed for cross-network play. |
| TURN server (optional) | Relay for symmetric NAT situations | Only needed if peers can't establish direct connection. ~10% of cases. Can use free Metered TURN or self-host coturn. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| React UI <-> Game Engine | Via Zustand stores (unidirectional: engine writes, UI reads + dispatches actions) | UI never calls engine functions directly; dispatches actions through hooks |
| R3F Scene <-> Physics | Via Rapier rigid body refs (useFrame reads body state) | No Zustand in the render loop; direct ref mutation only |
| Game Engine <-> Network | Via action/state serialization (network sends actions, receives state) | Network layer is a transparent pipe; does not interpret game rules |
| Game Engine <-> AI | AI module calls engine's scoring/evaluation functions, returns actions | AI is just another action source; game engine treats it identically to human input |
| Game Engine <-> Persistence | Stats module subscribes to game-end events in gameStore | Read-only relationship; persistence never modifies game state |

## Build Order (Dependency Chain)

The architecture implies this build sequence:

1. **Game Engine first** (`engine/`) -- Pure logic, no dependencies. Scoring rules, turn flow, farkle detection. Can be fully tested with unit tests before any UI exists.

2. **3D Scene second** (`scene/`) -- Dice rendering, physics simulation, table. Depends on nothing except Three.js/Rapier. Can be developed with hardcoded values.

3. **Stores + Hooks third** (`stores/`, `hooks/`) -- Wire game engine to 3D scene. `useDiceRoll` orchestrates physics -> engine -> state updates.

4. **React UI fourth** (`components/hud/`) -- Reads from stores. Roll/bank/select controls. Scoreboard. Turn indicator. This is where single-player becomes playable.

5. **AI fifth** (`engine/ai.ts`) -- Uses existing game engine functions to evaluate positions. Plugs into same action pipeline.

6. **Networking last** (`network/`) -- PeerJS integration. Transmits the same actions the UI dispatches. Host-authoritative sync. QR code join flow.

Each layer depends only on layers above it in this list. Networking is explicitly last because it adds complexity but zero new game logic -- it reuses everything built in steps 1-5.

## Sources

- [React Three Fiber documentation](https://r3f.docs.pmnd.rs/) -- HIGH confidence
- [react-three-rapier GitHub](https://github.com/pmndrs/react-three-rapier) -- HIGH confidence, deterministic physics confirmed
- [Rapier vs Cannon performance discussion](https://discourse.threejs.org/t/rapier-vs-cannon-performance/53475) -- MEDIUM confidence
- [Web Game Dev physics overview](https://www.webgamedev.com/physics) -- MEDIUM confidence, confirms Rapier as current standard
- [R3F state management patterns](https://discourse.threejs.org/t/how-to-use-state-management-with-react-three-fiber-without-performance-issues/61223) -- HIGH confidence
- [Owlbear Rodeo dice project](https://github.com/owlbear-rodeo/dice) -- HIGH confidence, real-world R3F+Rapier dice implementation
- [PeerJS documentation](https://peerjs.com/docs/) -- HIGH confidence
- [WebRTC without signaling server](https://dev.to/hexshift/building-a-minimal-webrtc-peer-without-a-signaling-server-using-only-manual-sdp-exchange-mck) -- MEDIUM confidence
- [WebRTC for browser multiplayer games](https://www.daydreamsoft.com/blog/webrtc-for-browser-based-multiplayer-games-building-real-time-gaming-experiences-without-plugins) -- MEDIUM confidence
- [Wawa Sensei R3F game tutorial with Zustand](https://wawasensei.dev/tuto/react-three-fiber-tutorial-hiragana-katakana-game) -- MEDIUM confidence

---
*Architecture research for: 10K -- Browser-based multiplayer dice game*
*Researched: 2026-03-19*
