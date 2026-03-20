---
phase: 02-3d-dice-and-game-table
plan: 03
subsystem: 3d-scene
tags: [rapier, zustand, physics, dice-rolling, three.js, react-three-fiber]

requires:
  - phase: 02-3d-dice-and-game-table
    provides: "Die mesh with pips, DiceGroup layout, GameTable with physics colliders, face detection via quaternion dot-product"
provides:
  - "Zustand dice store with phase tracking (idle/rolling/settled), face values, selection"
  - "Physics-based dice rolling with RigidBody impulse and torque"
  - "Settle detection via isSleeping debounce with face value readout"
  - "Click-to-roll trigger on table felt"
affects: [02-04-dice-selection, 03-game-flow]

tech-stack:
  added: [zustand-dice-store, rapier-rigidbody-impulse, adaptive-dpr]
  patterns: [physics-driven-mesh, imperative-physics-control, debounced-settle-detection, staggered-release]

key-files:
  created:
    - src/stores/diceStore.ts
  modified:
    - src/scene/Die.tsx
    - src/scene/DiceGroup.tsx
    - src/scene/GameScene.tsx
    - src/scene/GameTable.tsx

key-decisions:
  - "Staggered die release (0-100ms random delay) for natural hand-roll feel"
  - "10-frame debounce on isSleeping before reading face values to prevent premature reads"
  - "Gravity -30 (3x Earth) for snappier feel on small table scale"
  - "AdaptiveDpr for automatic mobile performance scaling; Stats toggle via URL param"

patterns-established:
  - "Physics control pattern: useCallback for roll trigger, useFrame for settle detection, pre-allocated temp objects"
  - "Store access pattern: useDiceStore.getState() for imperative actions in useFrame (no React state in render loop)"

requirements-completed: [DICE-01, DICE-05, DICE-06]

duration: 4min
completed: 2026-03-20
---

# Phase 02 Plan 03: Dice Physics Rolling Summary

**Rapier physics rolling with staggered release, debounced settle detection, and Zustand dice store for face values**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-20T02:37:50Z
- **Completed:** 2026-03-20T02:41:28Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Zustand dice store with phase tracking (idle/rolling/settled), face values, and selection actions
- Physics-based dice rolling with per-die random impulse, torque, and staggered release timing
- Debounced settle detection (10 consecutive frames all sleeping) with quaternion face value readout
- Tuned physics: felt restitution=0.15/friction=0.8, rim restitution=0.5/friction=0.4, gravity=-30
- Mobile performance: AdaptiveDpr for auto resolution scaling, conditional Stats overlay

## Task Commits

Each task was committed atomically:

1. **Task 1: Create dice store and add physics rolling to dice** - `d62230e` (feat)
2. **Task 2: Tune physics parameters and add roll suspense** - `29a28b3` (feat)

## Files Created/Modified
- `src/stores/diceStore.ts` - Zustand store for dice phase, values, selection, and scoring state
- `src/scene/Die.tsx` - Die mesh wrapped in RigidBody with tuned restitution/friction/damping
- `src/scene/DiceGroup.tsx` - Roll trigger with staggered release, settle detection with debounce, face readout
- `src/scene/GameScene.tsx` - Physics config (gravity=-30, timeStep=1/60), AdaptiveDpr, conditional Stats
- `src/scene/GameTable.tsx` - Felt and rim RigidBody physics parameters for realistic bounce/grip

## Decisions Made
- Staggered die release (0-100ms random delay) makes rolls feel like dice leaving a hand at different times
- 10-frame debounce prevents premature face reads from dice that briefly stop then get bumped
- Gravity set to -30 (3x real) for snappier settle on the small-scale game table
- Stats toggle via URL param (?stats=true) rather than always-on for clean default experience
- Varied impulse magnitude (0.8-1.2x multiplier) so dice do not all travel the same distance

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Dice roll with physics, settle, and face readout working end-to-end
- Click-to-roll trigger on table felt ready for testing
- Console.log of settled values available for development verification
- Plan 04 checkpoint will verify roll feel and physics tuning
- Dice store ready for selection/scoring wiring in Phase 3

---
*Phase: 02-3d-dice-and-game-table*
*Completed: 2026-03-20*
