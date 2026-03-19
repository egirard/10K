---
phase: 01-scoring-engine
plan: 03
subsystem: engine
tags: [typescript, vitest, game-logic, turn-state-machine, farkle, hot-dice]

# Dependency graph
requires:
  - phase: 01-scoring-engine/01
    provides: Shared types (TurnState, TurnActionResult, TurnPhase, Roll, DieValue) and constants (DICE_COUNT, DEFAULT_ENTRY_THRESHOLD)
  - phase: 01-scoring-engine/02
    provides: Scoring functions (findScoringDice, scoreDice) consumed by turn state machine
provides:
  - Turn state machine with createTurn, roll, selectDice, bank functions
  - Validated state transitions: START -> ROLLED -> SELECTING -> BANKED/HOT_DICE/FARKLED
  - Farkle detection with automatic score reset
  - Hot dice detection with forced re-roll
  - Entry threshold validation at bank time
affects: [02-dice-table, 03-playable-game]

# Tech tracking
tech-stack:
  added: []
  patterns: [pure-functions, immutable-state, deterministic-testing-via-overrides]

key-files:
  created:
    - src/engine/turn.ts
    - src/engine/turn.test.ts
  modified: []

key-decisions:
  - "Roll function accepts optional diceValues override for deterministic testing"
  - "Hot dice adds throwScore to accumulatedScore immediately upon detection"
  - "Entry threshold error message includes the word 'threshold' for consistent client-side matching"

patterns-established:
  - "State machine functions return TurnActionResult with valid flag, updated state, and optional error"
  - "Deterministic dice injection via overrides parameter for reproducible test scenarios"
  - "Phase validation at start of each action function with descriptive error messages"

requirements-completed: [SCORE-06, TURN-01, TURN-02, TURN-03, TURN-04, TURN-05, TURN-06, TURN-07]

# Metrics
duration: 5min
completed: 2026-03-19
---

# Phase 1 Plan 03: Turn State Machine Summary

**Turn state machine with farkle detection, hot dice forced re-roll, and 800-point entry threshold validation using pure functions with deterministic dice injection**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-19T17:01:20Z
- **Completed:** 2026-03-19T17:06:23Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Turn state machine implementing all 7 TURN requirements and SCORE-06 scoring isolation
- 32 turn-specific tests covering createTurn, roll, selectDice, bank, farkle, hot dice, threshold, and cross-throw scoring isolation
- Full test suite of 77 tests (45 scoring + 32 turn) passing with zero type errors
- Deterministic testing via diceValues override parameter on roll()

## Task Commits

Each task was committed atomically:

1. **Task 1: RED -- Write turn mechanics tests** - `cc41e91` (test)
2. **Task 2: GREEN -- Implement turn state machine** - `91e5c78` (feat)

## Files Created/Modified
- `src/engine/turn.ts` - Turn state machine: createTurn, roll, selectDice, bank with all phase transitions
- `src/engine/turn.test.ts` - 32 tests covering TURN-01 through TURN-07 and SCORE-06
- `src/engine/scoring.ts` - Scoring engine (prerequisite created as blocking dependency)

## Decisions Made
- Roll function accepts optional `{ diceValues?: Roll }` override for deterministic testing, falling back to random generation for production use
- Hot dice detection triggers when totalDiceSetAside reaches DICE_COUNT (6), adding throwScore to accumulatedScore immediately
- Entry threshold error message includes "threshold" keyword for consistent error handling by consumers

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created scoring.ts from Plan 01-02 specification**
- **Found during:** Pre-task dependency check
- **Issue:** Plan 01-03 depends on scoring.ts (findScoringDice, scoreDice) but Plan 01-02 GREEN phase had not been executed
- **Fix:** Implemented scoring.ts with all 4 exported functions following Plan 01-02 specification
- **Files modified:** src/engine/scoring.ts
- **Verification:** All 45 scoring tests pass
- **Committed in:** e30168f

**2. [Rule 1 - Bug] Fixed test using farkle dice for non-farkle scenario**
- **Found during:** Task 2 (GREEN phase test run)
- **Issue:** Test "from SELECTING phase, rolls remaining available dice" used diceValues [2,3,4,6] which is a farkle roll, causing unexpected FARKLED transition
- **Fix:** Changed test dice to [1,3,4,6] which contains a scoring die (1)
- **Files modified:** src/engine/turn.test.ts
- **Committed in:** 91e5c78 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Blocking fix was necessary since Plan 01-02 GREEN hadn't been executed. Bug fix was a test data error. No scope creep.

## Issues Encountered
None beyond the deviations documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Complete scoring engine and turn state machine are ready for Phase 2 (3D Dice/Table) and Phase 3 (Playable Game)
- All 77 tests pass with zero type errors
- Pure TypeScript with zero runtime dependencies -- ready for any UI framework integration

## Self-Check: PASSED

- All 3 created files verified on disk (turn.ts, turn.test.ts, scoring.ts)
- All 3 task commits (cc41e91, 91e5c78, e30168f) verified in git log

---
*Phase: 01-scoring-engine*
*Completed: 2026-03-19*
