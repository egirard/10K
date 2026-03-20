---
phase: 02-3d-dice-and-game-table
plan: 02
subsystem: ui
tags: [three, r3f, dice, 3d, face-detection, quaternion, tdd]

# Dependency graph
requires:
  - phase: 02-3d-dice-and-game-table
    plan: 01
    provides: R3F Canvas with Physics wrapper, GameTable with felt/rim colliders
provides:
  - Single Die mesh with rounded edges, black pips, red 1-pip
  - DiceGroup managing 6 dice instances
  - Quaternion dot-product face detection (getUpFace)
  - Unit tests for all 6 canonical orientations
affects: [02-03-dice-physics, 02-04-dice-selection, 03-playable-game]

# Tech tracking
tech-stack:
  added: []
  patterns: [quaternion dot-product face detection, shared geometry/material via useMemo, pre-allocated Vector3 for GC avoidance]

key-files:
  created:
    - src/engine/faceDetection.ts
    - src/engine/faceDetection.test.ts
    - src/scene/Die.tsx
    - src/scene/DiceGroup.tsx
  modified:
    - src/scene/GameScene.tsx

key-decisions:
  - "Face detection uses quaternion dot-product against 6 face normals -- numerically robust, avoids gimbal lock"
  - "Corrected plan's test expectations for Z/X axis rotations to match actual quaternion transform semantics"
  - "Die uses RoundedBox from drei with radius 0.08 for slight edge rounding"

patterns-established:
  - "Face normal mapping: +Y=2, -Y=5, +Z=1, -Z=6, +X=3, -X=4 (Western standard, opposites sum to 7)"
  - "Pip placement via face tangent vectors (U/V) with shared CylinderGeometry"

requirements-completed: [DICE-01, DICE-02]

# Metrics
duration: 4min
completed: 2026-03-20
---

# Phase 02 Plan 02: Dice Models and Face Detection Summary

**Six white dice with RoundedBox geometry, black/red pips on all faces, and quaternion dot-product face detection with 7 unit tests**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-20T02:30:44Z
- **Completed:** 2026-03-20T02:34:56Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Quaternion dot-product face detection function (getUpFace) with 7 unit tests covering all 6 canonical orientations plus near-axis tolerance
- Die component with RoundedBox white body, 21 black pip cylinders and 1 red center pip on 1-face, matching concept image
- DiceGroup rendering 6 dice in 2x3 grid on felt surface, wired into GameScene Physics wrapper
- All 84 tests pass (77 existing + 7 new), build and typecheck clean

## Task Commits

Each task was committed atomically:

1. **Task 1: Face detection tests (RED)** - `c1d230e` (test)
2. **Task 1: Face detection implementation (GREEN)** - `bcb7c3b` (feat)
3. **Task 2: Die mesh, DiceGroup, GameScene wiring** - `a6e4531` (feat)

_Note: Task 1 used TDD with separate RED and GREEN commits_

## Files Created/Modified
- `src/engine/faceDetection.ts` - Quaternion dot-product face detection returning DieValue
- `src/engine/faceDetection.test.ts` - 7 tests for all 6 orientations plus tolerance
- `src/scene/Die.tsx` - Single die: RoundedBox body, pip cylinders on all 6 faces
- `src/scene/DiceGroup.tsx` - Manages 6 Die instances with refs for future physics control
- `src/scene/GameScene.tsx` - Added DiceGroup inside Physics wrapper

## Decisions Made
- **Face detection approach:** Quaternion dot-product method per Pitfall 2 research. Transform 6 face normals by die quaternion, pick highest dot with world-up. Pre-allocated Vector3 avoids GC (Pitfall 10).
- **Test expectation corrections:** Plan's test expectations for X/Z axis rotations were mathematically incorrect (swapped directions). Verified with THREE.js quaternion math and corrected test expectations to match actual transform behavior.
- **Pip construction:** CylinderGeometry pips positioned via face normal + tangent vectors. Shared geometry and materials across all pips via useMemo (Pitfall 9).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected face detection test expectations for axis rotations**
- **Found during:** Task 1 (GREEN phase, tests failing)
- **Issue:** Plan specified +90 X rotation = face 1 and -90 X = face 6, but quaternion math shows +90 X rotation makes -Z normal align with +Y (face 6) and vice versa. Similarly Z-axis rotation directions were swapped.
- **Fix:** Verified with THREE.js quaternion transforms, corrected all 4 affected test expectations
- **Files modified:** src/engine/faceDetection.test.ts
- **Verification:** All 7 tests pass; confirmed with standalone Node.js quaternion verification
- **Committed in:** c1d230e (test commit includes corrected expectations)

---

**Total deviations:** 1 auto-fixed (1 bug in plan spec)
**Impact on plan:** Test expectations corrected to match mathematical reality. Implementation is correct per quaternion semantics.

## Issues Encountered
None beyond the test expectation correction documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Die meshes and DiceGroup ready for physics rigid bodies (Plan 03)
- Face detection function ready to read settled dice values after physics simulation
- GameScene structure established: Canvas > Camera + Lights + Physics > GameTable + DiceGroup

## Self-Check: PASSED

All 5 created/modified files verified on disk. All 3 task commits verified in git log.

---
*Phase: 02-3d-dice-and-game-table*
*Completed: 2026-03-20*
