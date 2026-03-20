---
phase: 02-3d-dice-and-game-table
plan: 01
subsystem: ui
tags: [react, three, r3f, rapier, vite, 3d, game-table]

# Dependency graph
requires:
  - phase: 01-scoring-engine
    provides: Pure TypeScript scoring engine with types (DieValue, Roll)
provides:
  - Vite + React + R3F project scaffold
  - 3D game table with green felt surface and dark wood rim
  - Fixed top-down camera perspective for portrait mobile
  - Warm overhead lighting with shadow support
  - Physics world with table and rim colliders (ready for dice)
affects: [02-02-dice-models, 02-03-dice-physics, 02-04-dice-selection, 03-playable-game]

# Tech tracking
tech-stack:
  added: [react@19, react-dom@19, three@0.183, @react-three/fiber@9, @react-three/drei@10, @react-three/rapier@2, zustand@5, vite@6, @vitejs/plugin-react@4]
  patterns: [R3F Canvas with Physics wrapper, fixed camera component, rigid body colliders for table geometry]

key-files:
  created:
    - vite.config.ts
    - index.html
    - src/main.tsx
    - src/App.tsx
    - src/app.css
    - src/scene/GameScene.tsx
    - src/scene/GameTable.tsx
    - src/scene/Camera.tsx
  modified:
    - package.json
    - tsconfig.json

key-decisions:
  - "Vite 6 + plugin-react 4 instead of Vite 8 + plugin-react 6 due to Node 18 runtime incompatibility"
  - "Camera at [0, 12, 5] with fov 45 for slightly-angled top-down view matching concept images"
  - "Felt surface 8x10 units (portrait aspect) with 0.4-unit thick rim walls"

patterns-established:
  - "Scene component pattern: top-level Canvas > Camera + lights + Physics > geometry components"
  - "Physics colliders on all static geometry using RigidBody type=fixed with CuboidCollider"

requirements-completed: [DICE-03, DICE-06]

# Metrics
duration: 3min
completed: 2026-03-20
---

# Phase 02 Plan 01: Game Table Scene Summary

**R3F game table with green felt, dark wood rim, fixed camera, warm lighting, and Rapier physics colliders on Vite 6**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-20T02:25:47Z
- **Completed:** 2026-03-20T02:28:35Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Transformed TypeScript-only project into full Vite + React + R3F app while preserving all 77 engine tests
- Created 3D game table matching concept images: green felt surface, dark wood raised rim, portrait aspect ratio
- Fixed top-down camera with warm overhead lighting and shadow support
- Physics world with colliders on felt and all 4 rim walls, ready for dice in Plan 02

## Task Commits

Each task was committed atomically:

1. **Task 1: Initialize Vite + React + R3F + Rapier project** - `0d3afcc` (feat)
2. **Task 2: Create game table scene with felt, wood rim, lighting, and camera** - `19ab06b` (feat)

## Files Created/Modified
- `package.json` - Added React, R3F, Rapier, Zustand, Vite dependencies
- `tsconfig.json` - Added JSX support and DOM lib
- `vite.config.ts` - Vite config with React plugin, port 3000
- `index.html` - Entry HTML with root div and module script
- `src/main.tsx` - React entry point rendering App in StrictMode
- `src/App.tsx` - Root component rendering GameScene full-viewport
- `src/app.css` - CSS reset with touch-action: none for mobile
- `src/scene/GameScene.tsx` - R3F Canvas with Physics, ambient + directional lights
- `src/scene/GameTable.tsx` - Felt surface (8x10 units) + 4 wood rim walls with physics colliders
- `src/scene/Camera.tsx` - Fixed PerspectiveCamera at [0,12,5] looking at origin

## Decisions Made
- **Vite 6 instead of Vite 8:** Node 18 runtime does not support Vite 8 (requires Node 20.19+ or 22.12+). Downgraded to Vite 6 and @vitejs/plugin-react 4 for compatibility. Same pattern as Phase 1's Vitest downgrade.
- **Camera position [0, 12, 5]:** Creates the slightly-angled top-down perspective shown in concept images rather than a pure birds-eye view. Combined with fov 45 for portrait mobile framing.
- **Table dimensions 8x10 units:** Portrait aspect ratio matching mobile screens, with 0.4-unit thick rim walls and 0.5-unit rim height above felt.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Downgraded Vite 8 to Vite 6 for Node 18 compatibility**
- **Found during:** Task 2 (vite build verification)
- **Issue:** Vite 8 requires Node 20.19+ or 22.12+; runtime is Node 18.19.1
- **Fix:** Changed vite from ^8 to ^6 and @vitejs/plugin-react from ^6 to ^4 in package.json
- **Files modified:** package.json, package-lock.json
- **Verification:** `npx vite build` completes successfully, `npx vitest run` passes 77 tests
- **Committed in:** 19ab06b (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary for build to work on available Node runtime. No functional difference.

## Issues Encountered
None beyond the Vite version incompatibility documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- R3F Canvas with Physics wrapper ready for dice models (Plan 02)
- Table colliders in place for dice collision (Plan 03)
- Camera and lighting established for visual consistency across all plans

## Self-Check: PASSED

All 8 created files verified on disk. Both task commits (0d3afcc, 19ab06b) verified in git log.

---
*Phase: 02-3d-dice-and-game-table*
*Completed: 2026-03-20*
