---
phase: 01-scoring-engine
verified: 2026-03-19T13:10:00Z
status: passed
score: 14/14 must-haves verified
re_verification: false
gaps: []
human_verification: []
---

# Phase 1: Scoring Engine Verification Report

**Phase Goal:** All Ten Thousand scoring rules and turn mechanics are correctly implemented as pure TypeScript functions with comprehensive test coverage
**Verified:** 2026-03-19T13:10:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| #   | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| 1   | Given any combination of 6 dice values, the engine returns the correct score per BCSTH rules (singles, triples, 4+of-a-kind, straights, three pairs) | ✓ VERIFIED | 45/45 scoring tests pass covering all rule types; `scoreRoll` implements frequency-map algorithm with priority ordering (straight > three pairs > N-of-a-kind > singles) |
| 2   | The engine correctly identifies which dice in a roll are scoring dice and which are not | ✓ VERIFIED | `findScoringDice` returns sorted index array; 5 dedicated tests including farkle detection; `scoreDice` rejects non-scoring dice with total=0 |
| 3   | Hot dice are detected when all 6 dice are set aside as scoring | ✓ VERIFIED | `selectDice` in turn.ts checks `newTotalDiceSetAside >= DICE_COUNT`; 5 hot dice tests pass including multi-throw accumulation |
| 4   | Farkle is detected when no scoring dice exist in a roll | ✓ VERIFIED | `roll` in turn.ts calls `findScoringDice` and auto-transitions to FARKLED with `accumulatedScore: 0` when result is empty; 3 farkle tests pass |
| 5   | Turn state machine correctly enforces the flow: roll, select scoring dice, bank-or-roll-again, with 800-point entry threshold | ✓ VERIFIED | `createTurn`, `roll`, `selectDice`, `bank` implement full FSM; 32 turn tests pass covering all transitions, invalid phase rejections, and threshold enforcement |

**Score:** 5/5 success criteria verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `package.json` | Project config with TypeScript and Vitest | ✓ VERIFIED | Contains `vitest` in devDependencies; Vitest 3.2.4 (downgraded from 4.1.0 due to Node 18 constraint — functionally equivalent) |
| `tsconfig.json` | Strict TypeScript configuration | ✓ VERIFIED | `"strict": true` present; ES2022 target, bundler module resolution |
| `vitest.config.ts` | Vitest test runner configuration | ✓ VERIFIED | `defineConfig` present; `passWithNoTests: true` added (required for zero-test phase baseline) |
| `src/engine/types.ts` | Shared type definitions | ✓ VERIFIED | All required exports present: `DieValue`, `Roll`, `ScoreComponent`, `ScoreBreakdown`, `TurnPhase`, `TurnState`, `TurnActionResult`; 72 lines |
| `src/engine/constants.ts` | Scoring constants and game defaults | ✓ VERIFIED | All required exports: `SINGLE_SCORES` (1:100, 5:50), `TRIPLE_SCORES` (all 6 values), `STRAIGHT_SCORE` (1000), `THREE_PAIRS_SCORE` (1000), `DEFAULT_ENTRY_THRESHOLD` (800), `DEFAULT_TARGET_SCORE` (10000), `DICE_COUNT` (6); 33 lines |
| `src/engine/scoring.ts` | Pure scoring functions | ✓ VERIFIED | All 4 exports present: `scoreRoll`, `findScoringDice`, `scoreDice`, `bestPossibleScore`; 191 lines (min_lines: 80 met); `Math.pow(2, count - 3)` doubling formula present |
| `src/engine/scoring.test.ts` | Exhaustive scoring tests | ✓ VERIFIED | 241 lines (min_lines: 150 met); 45 tests in 7 describe blocks covering SCORE-01 through SCORE-07 |
| `src/engine/turn.ts` | Turn state machine | ✓ VERIFIED | All 4 exports: `createTurn`, `roll`, `selectDice`, `bank`; 238 lines (min_lines: 80 met); `FARKLED`, `HOT_DICE`, `entryThreshold`, `DICE_COUNT` all present |
| `src/engine/turn.test.ts` | Comprehensive turn mechanics tests | ✓ VERIFIED | 379 lines (min_lines: 150 met); 32 tests in 8 describe blocks covering TURN-01 through TURN-07 and SCORE-06 |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `src/engine/scoring.ts` | `src/engine/types.ts` | `import type { DieValue, Roll, ScoreBreakdown, ScoreComponent }` | ✓ WIRED | Line 1: `import type { DieValue, Roll, ScoreBreakdown, ScoreComponent } from './types.js'` |
| `src/engine/scoring.ts` | `src/engine/constants.ts` | `import { SINGLE_SCORES, TRIPLE_SCORES, ... }` | ✓ WIRED | Lines 2-8: all 5 constants imported and used in scoring logic |
| `src/engine/turn.ts` | `src/engine/scoring.ts` | `import findScoringDice, scoreDice` | ✓ WIRED | Line 2: `import { findScoringDice, scoreDice } from './scoring.js'`; both used in `roll()` and `selectDice()` |
| `src/engine/turn.ts` | `src/engine/types.ts` | `import TurnState, TurnActionResult, TurnPhase, Roll, DieValue` | ✓ WIRED | Line 1: `import type { TurnState, TurnActionResult, Roll, DieValue } from './types.js'` |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| SCORE-01 | 01-02-PLAN | Single 1s (100pts) and single 5s (50pts) | ✓ SATISFIED | 6 passing tests; `SINGLE_SCORES` constant used in `scoreByFrequency` |
| SCORE-02 | 01-02-PLAN | Three-of-a-kind scoring (1s=1000, others=face*100) | ✓ SATISFIED | 8 passing tests; `TRIPLE_SCORES` used in `scoreByFrequency` |
| SCORE-03 | 01-02-PLAN | 4+ of-a-kind doubling (tripleBase * 2^(count-3)) | ✓ SATISFIED | 8 passing tests; `Math.pow(2, count - 3)` formula in scoring.ts line 83 |
| SCORE-04 | 01-02-PLAN | Straight (1-2-3-4-5-6) scores 1000 on all 6 dice | ✓ SATISFIED | 3 passing tests including order-independence; `checkStraight` requires `freq.size === 6` and all counts = 1 |
| SCORE-05 | 01-02-PLAN | Three pairs scores 1000 on all 6 dice | ✓ SATISFIED | 4 passing tests; `checkThreePairs` checks `freq.size === 3` and all counts = 2; [1,1,5,5,3,3]=1000 confirmed |
| SCORE-06 | 01-01-PLAN, 01-03-PLAN | Scoring only within single throw | ✓ SATISFIED | 2 dedicated SCORE-06 tests in turn.test.ts; `roll()` from SELECTING adds throwScore to accumulatedScore before generating new dice; new roll scored independently |
| SCORE-07 | 01-02-PLAN | Identifies all valid scoring dice, prevents non-scoring selection | ✓ SATISFIED | 5 `findScoringDice` tests; `scoreDice` returns total=0 when non-scoring dice included; `selectDice` in turn.ts uses `scoreDice` to validate |
| TURN-01 | 01-03-PLAN | Roll all 6 dice at start of turn | ✓ SATISFIED | 5 roll tests; `createTurn` initializes `availableDice: DICE_COUNT (6)` |
| TURN-02 | 01-03-PLAN | Must set aside at least one scoring die | ✓ SATISFIED | 7 selectDice tests; `selectDice` rejects empty indices and non-scoring dice |
| TURN-03 | 01-03-PLAN | Player can bank accumulated turn points | ✓ SATISFIED | `bank()` function returns `valid: true` from SELECTING phase with `pointsBanked` set |
| TURN-04 | 01-03-PLAN | Farkle: no scoring dice = lose all accumulated points | ✓ SATISFIED | 3 farkle tests; `roll()` sets `accumulatedScore: 0` when `findScoringDice` returns empty |
| TURN-05 | 01-03-PLAN | Hot dice: all 6 set aside = must roll all 6 again | ✓ SATISFIED | 5 hot dice tests; `selectDice` transitions to HOT_DICE at totalDiceSetAside >= 6; `bank()` from HOT_DICE returns valid: false |
| TURN-06 | 01-03-PLAN | 800-point entry threshold to get on board | ✓ SATISFIED | 2 threshold tests; `bank()` checks `!state.isOnBoard && totalPoints < state.entryThreshold` with error containing "threshold" |
| TURN-07 | 01-03-PLAN | After on board, bank any positive amount | ✓ SATISFIED | 2 on-board tests including 50-point minimum; `bank()` skips threshold check when `isOnBoard === true` |

**All 14 requirements: SATISFIED**

No orphaned requirements detected. All Phase 1 requirements (SCORE-01 through SCORE-07, TURN-01 through TURN-07) are claimed by plans and verified in the codebase.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `src/engine/scoring.ts` | 25, 27, 45, 47 | `return null` | ℹ️ Info | Legitimate early-exit guards in private helper functions `checkStraight` and `checkThreePairs`; not stubs |

No blockers or warnings found. No TODO/FIXME/HACK comments. No placeholder implementations.

### Human Verification Required

None. All behaviors are verifiable programmatically via unit tests. The scoring engine and turn state machine are pure TypeScript functions with no UI, external services, or visual components requiring manual inspection.

### Test Run Results

```
Test Files  2 passed (2)
     Tests  77 passed (77)
  Start at  13:09:33
  Duration  774ms
```

TypeScript typecheck: `npx tsc --noEmit` exits with code 0 (no output, no errors).

### Gaps Summary

No gaps. All 5 success criteria from ROADMAP.md are met, all 9 artifacts exist and are substantive, all 4 key links are wired, all 14 requirement IDs are covered. The phase goal is fully achieved.

---

_Verified: 2026-03-19T13:10:00Z_
_Verifier: Claude (gsd-verifier)_
