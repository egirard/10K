---
phase: 01-scoring-engine
plan: 02
subsystem: engine
tags: [typescript, scoring, pure-functions, tdd, game-logic]

# Dependency graph
requires:
  - phase: 01-scoring-engine/01
    provides: "Shared types (DieValue, Roll, ScoreBreakdown) and constants (SINGLE_SCORES, TRIPLE_SCORES)"
provides:
  - Pure scoring functions (scoreRoll, findScoringDice, scoreDice, bestPossibleScore)
  - Frequency-based scoring algorithm with priority ordering
  - N-of-a-kind doubling formula
  - Farkle detection via findScoringDice
affects: [01-03-PLAN]

# Tech tracking
tech-stack:
  added: []
  patterns: [frequency-map-scoring, priority-ordered-combinations, tdd-red-green]

key-files:
  created:
    - src/engine/scoring.ts
    - src/engine/scoring.test.ts
  modified: []

key-decisions:
  - "Fixed plan test input [1,5,3,4,2,6] which is actually a straight; replaced with [1,5,3,4,2,2] for findScoringDice singles test"
  - "scoreRoll priority: straight > three pairs > N-of-a-kind > singles ensures optimal scoring"

patterns-established:
  - "Frequency-map approach: buildFrequencyMap then check combinations in priority order"
  - "Dice consumption: higher combinations consume dice first, preventing double-counting"
  - "scoreDice validates ALL selected dice participate in scoring (no dead weight)"

requirements-completed: [SCORE-01, SCORE-02, SCORE-03, SCORE-04, SCORE-05, SCORE-07]

# Metrics
duration: 2min
completed: 2026-03-19
---

# Phase 1 Plan 02: Scoring Engine Summary

**Pure scoring engine with frequency-based algorithm: scoreRoll, findScoringDice, scoreDice, bestPossibleScore covering singles, triples, N-of-a-kind doubling, straights, and three pairs with 45 passing tests**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-19T17:00:54Z
- **Completed:** 2026-03-19T17:03:11Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Complete scoring engine with all SCORE requirements (01-05, 07) implemented and tested
- 45 tests covering singles, triples, N-of-a-kind doubling (4x-6x), straights, three pairs, edge cases, farkle detection, subset validation, and optimal scoring
- Priority-ordered scoring ensures three pairs [1,1,5,5,3,3] = 1000 beats individual scoring (300)
- N-of-a-kind formula `TRIPLE_SCORES[value] * 2^(count-3)` correctly handles all cases through 6-of-a-kind

## Task Commits

Each task was committed atomically:

1. **Task 1: RED -- Write comprehensive scoring tests** - `c9fd0e2` (test)
2. **Task 2: GREEN -- Implement scoring engine** - `42ae979` (feat)

## Files Created/Modified
- `src/engine/scoring.ts` - Pure scoring functions: scoreRoll, findScoringDice, scoreDice, bestPossibleScore
- `src/engine/scoring.test.ts` - 45 tests covering all SCORE requirements and edge cases

## Decisions Made
- Fixed plan test input `[1,5,3,4,2,6]` to `[1,5,3,4,2,2]` for findScoringDice test because the original input is a straight (all 6 values present), making all dice scoring dice rather than just the 1 and 5.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed incorrect test input in findScoringDice test**
- **Found during:** Task 2 (GREEN phase, running tests)
- **Issue:** Plan specified `findScoringDice([1, 5, 3, 4, 2, 6])` should return `[0, 1]`, but [1,5,3,4,2,6] contains all values 1-6 and is a straight, so all dice score (returns [0,1,2,3,4,5])
- **Fix:** Changed test input to `[1, 5, 3, 4, 2, 2]` which has a duplicate 2 instead of 6, so only the 1 and 5 score
- **Files modified:** src/engine/scoring.test.ts
- **Verification:** All 45 tests pass
- **Committed in:** 42ae979 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug in plan test data)
**Impact on plan:** Minimal -- test intent preserved, only the input dice were wrong.

## Issues Encountered
None beyond the deviation documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All scoring functions exported and ready for Plan 03 (turn state machine) to import
- scoreRoll provides ScoreBreakdown with components and scoringDiceIndices needed by turn logic
- findScoringDice enables farkle detection (TURN-04) and valid die selection (TURN-02)
- Zero type errors with strict TypeScript

## Self-Check: PASSED

- All 2 created files verified on disk
- Both task commits (c9fd0e2, 42ae979) verified in git log
- 45/45 tests pass
- Zero type errors

---
*Phase: 01-scoring-engine*
*Completed: 2026-03-19*
