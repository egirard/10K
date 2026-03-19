# Phase 1: Scoring Engine - Research

**Researched:** 2026-03-19
**Domain:** Pure TypeScript game logic -- Ten Thousand (BCSTH variant) scoring rules and turn state machine
**Confidence:** HIGH

## Summary

Phase 1 builds the foundation that every subsequent phase depends on: a pure TypeScript scoring engine and turn state machine with zero framework dependencies. This is a well-understood domain with no external library dependencies beyond the test framework. The scoring rules are fully specified (BCSTH variant), and the implementation is a pure functions exercise -- no React, no 3D, no networking.

The primary challenge is not complexity but completeness. There are 462 unique unordered 6-die combinations, and the scoring engine must handle all of them correctly, including edge cases where multiple valid scoring interpretations exist for the same dice (e.g., three pairs = 1000 vs. individual 1s and 5s scoring higher). The optimal-score selection algorithm must always find the highest possible score for any set of dice.

**Primary recommendation:** Build scoring as pure functions with exhaustive unit tests. Use a combinatorial approach to verify all 462 unique die combinations. Implement the turn state machine as a finite state machine with explicit states and transitions.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SCORE-01 | Single 1s (100 pts) and single 5s (50 pts) | Core scoring function -- singles extraction after higher combinations removed |
| SCORE-02 | Three-of-a-kind scoring (1s=1000, others=face*100) | Frequency-count algorithm identifies groups of 3+ |
| SCORE-03 | 4+ of-a-kind doubling (4x=2*triple, 5x=4*triple, 6x=8*triple) | Doubling formula: `tripleScore * 2^(count-3)` |
| SCORE-04 | Straight (1-2-3-4-5-6) = 1000 on all 6 dice | Check before individual scoring -- requires exactly 6 dice with all values present |
| SCORE-05 | Three pairs = 1000 on all 6 dice | Check before individual scoring -- requires exactly 6 dice with exactly 3 distinct values each appearing twice |
| SCORE-06 | Scoring within single throw only | Turn state machine enforces -- score function receives only current throw's dice |
| SCORE-07 | Identify all valid scoring dice, prevent selecting non-scoring dice | `findScoringDice()` returns which dice can be kept; UI layer uses this for validation |
| TURN-01 | Roll all 6 dice at start of turn | Turn state machine initial state -- `ROLLING` with 6 available dice |
| TURN-02 | Must set aside at least one scoring die per roll | State transition validation -- cannot move from `ROLLED` to `ROLLING` without selecting >= 1 scoring die |
| TURN-03 | Can bank accumulated turn points | State transition `SELECTING` -> `BANKED` -- returns accumulated points to game |
| TURN-04 | Farkle: no scoring dice = lose all turn points | Automatic detection after roll -- if `findScoringDice()` returns empty, transition to `FARKLED` |
| TURN-05 | Hot dice: all 6 set aside = must roll all 6 again | Track total dice set aside this turn; when count reaches 6, reset available to 6 and continue |
| TURN-06 | 800-point threshold to get on board (configurable) | Bank validation -- if player not on board, accumulated must >= threshold |
| TURN-07 | After on board, can bank any amount | Bank validation -- if player on board, any positive amount accepted |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | ^5.9.3 | Type safety for game logic | Verified current on npm. Strict typing prevents scoring bugs. |
| Vitest | ^4.1.0 | Unit testing framework | Verified current on npm (4.1.0, not 3.x as in earlier research). Native Vite integration for when the project adds Vite later. Fast, modern, excellent TypeScript support. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | - | - | Phase 1 has zero runtime dependencies. The scoring engine is pure TypeScript. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vitest | Jest | Jest works fine but Vitest is faster, has native TS support, and aligns with the Vite build tool used in later phases |
| Pure functions | Class-based OOP | Pure functions are simpler to test, compose, and serialize for future multiplayer. No `this` binding issues. |

**Installation:**
```bash
# Phase 1 only needs TypeScript and Vitest
npm init -y
npm install -D typescript vitest
npx tsc --init
```

**Version verification:** Both packages verified against npm registry on 2026-03-19. TypeScript 5.9.3, Vitest 4.1.0.

## Architecture Patterns

### Recommended Project Structure
```
src/
  engine/
    scoring.ts          # Pure scoring functions
    scoring.test.ts     # Exhaustive scoring tests
    turn.ts             # Turn state machine
    turn.test.ts        # Turn flow tests
    types.ts            # Shared types (DieValue, Roll, TurnState, etc.)
    constants.ts        # Configurable values (thresholds, targets)
    combinations.ts     # Helper: generate/validate die combinations
    combinations.test.ts
```

### Pattern 1: Frequency-Count Scoring Algorithm
**What:** Convert a roll (array of die values) into a frequency map, then extract scoring combinations in priority order: straight > three pairs > N-of-a-kind > singles.
**When to use:** Every call to `scoreRoll()` or `findScoringDice()`.
**Example:**
```typescript
// Die values are 1-6
type DieValue = 1 | 2 | 3 | 4 | 5 | 6;

// A roll is an array of die values
type Roll = DieValue[];

// Build frequency map: how many of each value
function buildFrequencyMap(dice: Roll): Map<DieValue, number> {
  const freq = new Map<DieValue, number>();
  for (const die of dice) {
    freq.set(die, (freq.get(die) || 0) + 1);
  }
  return freq;
}

// Score breakdown shows WHY a score was calculated
interface ScoreBreakdown {
  total: number;
  components: Array<{
    dice: DieValue[];
    points: number;
    description: string; // e.g., "Three 4s", "Single 1"
  }>;
  scoringDiceIndices: number[]; // Which dice in the original roll are scoring
}
```

### Pattern 2: Priority-Ordered Combination Checking
**What:** Check for 6-die combinations first (straight, three pairs), then N-of-a-kind from highest N down, then singles. This ensures we never miss a higher-scoring interpretation.
**When to use:** Inside the main `scoreRoll()` function.
**Example:**
```typescript
function scoreRoll(dice: Roll): ScoreBreakdown {
  if (dice.length === 0) return { total: 0, components: [], scoringDiceIndices: [] };

  const freq = buildFrequencyMap(dice);

  // 1. Check 6-dice combinations first (only valid with exactly 6 dice)
  if (dice.length === 6) {
    const straightScore = checkStraight(freq);
    if (straightScore) return straightScore;

    const threePairsScore = checkThreePairs(freq);
    if (threePairsScore) return threePairsScore;
  }

  // 2. Extract N-of-a-kind (3+), then singles (1s and 5s)
  return scoreByFrequency(dice, freq);
}
```

### Pattern 3: Turn State Machine (Finite State Machine)
**What:** Model the turn as explicit states with validated transitions. States: `ROLLING`, `ROLLED`, `SELECTING`, `FARKLED`, `BANKED`, `HOT_DICE`. Each transition has preconditions.
**When to use:** Managing turn flow in `turn.ts`.
**Example:**
```typescript
type TurnPhase =
  | 'START'       // Beginning of turn, no dice rolled yet
  | 'ROLLING'     // Dice are being rolled (animation phase in future)
  | 'ROLLED'      // Dice landed, awaiting selection
  | 'SELECTING'   // Player is choosing which scoring dice to keep
  | 'FARKLED'     // No scoring dice -- turn over, lose points
  | 'HOT_DICE'    // All 6 dice scored -- must roll again
  | 'BANKED';     // Player chose to bank -- turn over, keep points

interface TurnState {
  phase: TurnPhase;
  availableDice: number;          // How many dice to roll (starts at 6)
  currentRoll: Roll;              // The current throw's dice values
  selectedDice: number[];         // Indices of dice selected this throw
  throwScore: number;             // Points from selected dice this throw
  accumulatedScore: number;       // Points accumulated across throws this turn
  throwsThisTurn: number;         // How many throws so far
  isOnBoard: boolean;             // Has player met entry threshold previously
  entryThreshold: number;         // Configurable (default 800)
}
```

### Pattern 4: Optimal Score Selection
**What:** When a player selects specific dice to keep, validate that those dice form valid scoring combinations and calculate their score. Also provide a function that returns the maximum possible score from a roll (for farkle detection and AI use).
**When to use:** `scoreDice()` for player-selected subset, `bestPossibleScore()` for engine decisions.
**Example:**
```typescript
// Score a specific subset of dice the player chose to keep
function scoreDice(selectedDice: Roll): ScoreBreakdown {
  return scoreRoll(selectedDice);
}

// Find all valid ways to score from a roll, return the highest
// Used for: farkle detection (is best score 0?), AI decisions, UI hints
function bestPossibleScore(dice: Roll): ScoreBreakdown {
  // For farkle detection, we only need to know if ANY scoring exists
  // For optimal play, enumerate valid scoring subsets
  return scoreRoll(dice);
}

// Identify which individual dice CAN score (for UI highlighting)
function findScoringDice(dice: Roll): number[] {
  // Returns indices of dice that participate in any scoring combination
  // Used by UI to prevent selecting non-scoring dice (SCORE-07)
}
```

### Anti-Patterns to Avoid
- **Mutable state in scoring functions:** Scoring must be pure -- same input always produces same output. No class instances holding state.
- **Coupling scoring to turn logic:** `scoreRoll()` should know nothing about turns, banking, or thresholds. It receives dice, returns a score breakdown.
- **String-based state machines:** Use a union type for `TurnPhase`, not strings or numbers. TypeScript's exhaustiveness checking prevents missing state transitions.
- **Ignoring the "which dice" question:** Do not just return a number. Always return which dice contributed to the score. The UI needs this for highlighting, and the turn logic needs it for tracking set-aside dice.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Test runner | Custom test harness | Vitest | Snapshot testing, watch mode, coverage, assertions all built in |
| Combination enumeration | Manual list of test cases | Programmatic generation | 462 unique 6-die combos are too many to list by hand; generate them |

**Key insight:** The scoring engine itself IS hand-rolled -- that is the point of this phase. But the test infrastructure should not be.

## Common Pitfalls

### Pitfall 1: Three Pairs vs. Individual Scoring Ambiguity
**What goes wrong:** Dice like [1, 1, 5, 5, 3, 3] could score as three pairs (1000) or as two 1s (200) + two 5s (100) = 300. The engine picks the wrong one.
**Why it happens:** If individual scoring runs before the three-pairs check, the three-pairs pattern is never detected.
**How to avoid:** Always check 6-dice combinations (straight, three pairs) FIRST, before any individual scoring. Three pairs always scores 1000 regardless of which values are paired.
**Warning signs:** Test case [1, 1, 5, 5, 3, 3] returns 300 instead of 1000.

### Pitfall 2: Hot Dice Misunderstanding
**What goes wrong:** Hot dice triggers when dice are accumulated across multiple throws instead of all 6 scoring in a single throw context.
**Why it happens:** Confusion about whether "all 6 set aside" means in one throw or across the turn.
**How to avoid:** Hot dice means all dice available for the current throw are set aside as scoring. If you started with 6 dice and set aside 3, then rolled 3 and set aside 3 more, that is 6 total set aside across the turn = hot dice. Track `availableDice` vs `totalSetAside` across throws.
**Warning signs:** Hot dice never triggers, or triggers when only some dice score in a single throw.

### Pitfall 3: N-of-a-Kind Doubling Formula Error
**What goes wrong:** 4-of-a-kind scores wrong because the doubling logic is applied incorrectly.
**Why it happens:** The rule is "each die over 3 doubles the three-of-a-kind score." Developers sometimes add instead of doubling, or double the wrong base.
**How to avoid:** Use the formula: `tripleBaseScore * Math.pow(2, count - 3)` where `tripleBaseScore` is 1000 for 1s, face*100 for others. So: 4x2s = 200*2^1 = 400, 5x2s = 200*2^2 = 800, 6x2s = 200*2^3 = 1600.
**Warning signs:** 4-of-a-kind 2s returns anything other than 400.

### Pitfall 4: Entry Threshold Check at Wrong Time
**What goes wrong:** The engine prevents rolling when accumulated score is below 800, or allows banking below 800.
**Why it happens:** The threshold check is applied to individual throws instead of the total accumulated turn score at bank time.
**How to avoid:** The threshold only matters at BANK time. During a turn, a player can keep rolling regardless of accumulated score. Only when they choose to BANK, check: if not on board AND accumulated < threshold, reject the bank (or in practice, the UI should not offer banking until threshold is met).
**Warning signs:** Player cannot continue rolling after scoring 100 points on first throw.

### Pitfall 5: Scoring Subset Validation
**What goes wrong:** Player selects dice [1, 3] from roll [1, 3, 4, 2, 6, 2] and the engine scores the 1 (100) but also erroneously allows the 3 (not a scoring die on its own).
**Why it happens:** The validation checks if any die in the selection can score, rather than checking if the entire selection forms valid combinations.
**How to avoid:** `scoreDice()` must validate that ALL selected dice participate in scoring combinations. If any die in the selection is "dead weight" (does not contribute to any scoring combination), the selection is invalid.
**Warning signs:** Non-scoring dice can be selected without error.

### Pitfall 6: Forgetting That 1s and 5s Only Score as Singles When Not Part of a Triple+
**What goes wrong:** Roll [1, 1, 1, 5] scores as triple 1s (1000) + single 5 (50) = 1050, but a buggy engine scores it as three single 1s (300) + single 5 (50) = 350, or as triple 1s (1000) + three single 1s (300) + single 5 (50).
**Why it happens:** The 1s are consumed by the triple but the singles logic doesn't know they were already used.
**How to avoid:** Process from highest combinations down, consuming dice as they are used. After extracting a triple of 1s, only remaining 1s can score as singles.
**Warning signs:** Dice are double-counted in scoring.

## Code Examples

Verified patterns from game design and TypeScript best practices:

### Scoring Constants
```typescript
// src/engine/constants.ts

export const SINGLE_SCORES: Partial<Record<number, number>> = {
  1: 100,
  5: 50,
};

export const TRIPLE_SCORES: Record<number, number> = {
  1: 1000,
  2: 200,
  3: 300,
  4: 400,
  5: 500,
  6: 600,
};

export const STRAIGHT_SCORE = 1000;
export const THREE_PAIRS_SCORE = 1000;
export const DEFAULT_ENTRY_THRESHOLD = 800;
export const DEFAULT_TARGET_SCORE = 10000;
```

### N-of-a-Kind Scoring
```typescript
// Calculates score for N dice of the same value (N >= 3)
function scoreNOfAKind(value: DieValue, count: number): number {
  if (count < 3) return 0;
  const tripleBase = TRIPLE_SCORES[value]; // 1000 for 1s, value*100 for others
  return tripleBase * Math.pow(2, count - 3);
}

// Examples:
// scoreNOfAKind(1, 3) = 1000      (three 1s)
// scoreNOfAKind(1, 4) = 2000      (four 1s)
// scoreNOfAKind(1, 5) = 4000      (five 1s)
// scoreNOfAKind(1, 6) = 8000      (six 1s)
// scoreNOfAKind(2, 3) = 200       (three 2s)
// scoreNOfAKind(2, 4) = 400       (four 2s)
// scoreNOfAKind(5, 3) = 500       (three 5s)
// scoreNOfAKind(5, 4) = 1000      (four 5s)
```

### Straight Detection
```typescript
function checkStraight(freq: Map<DieValue, number>): ScoreBreakdown | null {
  if (freq.size !== 6) return null; // Must have all 6 distinct values
  for (const count of freq.values()) {
    if (count !== 1) return null; // Each value exactly once
  }
  return {
    total: STRAIGHT_SCORE,
    components: [{ dice: [1, 2, 3, 4, 5, 6], points: 1000, description: 'Straight' }],
    scoringDiceIndices: [0, 1, 2, 3, 4, 5],
  };
}
```

### Three Pairs Detection
```typescript
function checkThreePairs(freq: Map<DieValue, number>): ScoreBreakdown | null {
  if (freq.size !== 3) return null; // Must have exactly 3 distinct values
  for (const count of freq.values()) {
    if (count !== 2) return null; // Each value exactly twice
  }
  return {
    total: THREE_PAIRS_SCORE,
    components: [{
      dice: Array.from(freq.entries()).flatMap(([v, _]) => [v, v]),
      points: 1000,
      description: 'Three Pairs'
    }],
    scoringDiceIndices: [0, 1, 2, 3, 4, 5],
  };
}
```

### Exhaustive Test Generation
```typescript
// Generate all 462 unique unordered 6-die combinations
function* allDiceCombinations(): Generator<Roll> {
  for (let a = 1; a <= 6; a++)
    for (let b = a; b <= 6; b++)
      for (let c = b; c <= 6; c++)
        for (let d = c; d <= 6; d++)
          for (let e = d; e <= 6; e++)
            for (let f = e; f <= 6; f++)
              yield [a, b, c, d, e, f] as Roll;
}

// Verify: every combination either scores > 0 or is correctly identified as farkle
// This catches missing rules and off-by-one errors
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Class-based game engine with mutable state | Pure functions with immutable state objects | Industry trend 2020+ | Easier testing, serialization for multiplayer, time-travel debugging |
| Jest for testing | Vitest 4.x | Vitest 4.1.0 current | Faster, native TS, Vite-aligned |
| Manual test cases only | Exhaustive combinatorial + manual edge cases | Best practice | Catches the long tail of scoring bugs |

**Deprecated/outdated:**
- Vitest 3.x: Research docs referenced v3, but v4.1.0 is current. Use ^4.1.0.

## Open Questions

1. **Three pairs with a triple inside: [2, 2, 2, 2, 3, 3]**
   - What we know: This has only 2 distinct values, not 3 pairs. It is 4-of-a-kind 2s (400) + pair of 3s (0) = 400.
   - What's unclear: Edge case of [1, 1, 5, 5, 3, 3] -- three pairs (1000) vs. individual scoring (200+100=300). Three pairs wins.
   - Recommendation: Three pairs requires exactly 3 distinct values each appearing exactly twice. Always check three pairs before individual scoring.

2. **Player selection vs. optimal scoring**
   - What we know: The player CHOOSES which dice to keep. They don't have to keep the highest-scoring combination.
   - What's unclear: Should the engine auto-select the best score, or let the player choose any valid subset?
   - Recommendation: Let the player choose any valid scoring subset. Provide `bestPossibleScore()` as a separate utility for AI and UI hints. The validation only needs to ensure selected dice form valid combinations -- not that they are optimal.

3. **Hot dice: "must roll" vs. "may roll"**
   - What we know: The rules say "must roll all 6 again" on hot dice. This is not optional.
   - What's unclear: Does the player get to bank before the forced re-roll?
   - Recommendation: Per BCSTH rules, hot dice is mandatory -- the accumulated points carry forward and the player MUST roll all 6 again. They cannot bank on hot dice. This is important: it adds risk (you could farkle on the re-roll and lose everything).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `vitest.config.ts` -- Wave 0 creates this |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --coverage` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SCORE-01 | Single 1s=100, single 5s=50 | unit | `npx vitest run src/engine/scoring.test.ts -t "single"` | Wave 0 |
| SCORE-02 | Three-of-a-kind scoring | unit | `npx vitest run src/engine/scoring.test.ts -t "three-of-a-kind"` | Wave 0 |
| SCORE-03 | 4+ of-a-kind doubling | unit | `npx vitest run src/engine/scoring.test.ts -t "of-a-kind"` | Wave 0 |
| SCORE-04 | Straight = 1000 | unit | `npx vitest run src/engine/scoring.test.ts -t "straight"` | Wave 0 |
| SCORE-05 | Three pairs = 1000 | unit | `npx vitest run src/engine/scoring.test.ts -t "three pairs"` | Wave 0 |
| SCORE-06 | Scoring within single throw | unit | `npx vitest run src/engine/turn.test.ts -t "single throw"` | Wave 0 |
| SCORE-07 | Valid scoring dice identification | unit | `npx vitest run src/engine/scoring.test.ts -t "scoring dice"` | Wave 0 |
| TURN-01 | Roll all 6 at start | unit | `npx vitest run src/engine/turn.test.ts -t "start"` | Wave 0 |
| TURN-02 | Must keep >= 1 scoring die | unit | `npx vitest run src/engine/turn.test.ts -t "must keep"` | Wave 0 |
| TURN-03 | Can bank accumulated points | unit | `npx vitest run src/engine/turn.test.ts -t "bank"` | Wave 0 |
| TURN-04 | Farkle detection | unit | `npx vitest run src/engine/turn.test.ts -t "farkle"` | Wave 0 |
| TURN-05 | Hot dice detection and forced re-roll | unit | `npx vitest run src/engine/turn.test.ts -t "hot dice"` | Wave 0 |
| TURN-06 | 800-point entry threshold | unit | `npx vitest run src/engine/turn.test.ts -t "threshold"` | Wave 0 |
| TURN-07 | After on board, bank any amount | unit | `npx vitest run src/engine/turn.test.ts -t "on board"` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --coverage`
- **Phase gate:** Full suite green with coverage before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `package.json` -- project initialization with TypeScript + Vitest
- [ ] `tsconfig.json` -- strict TypeScript config
- [ ] `vitest.config.ts` -- Vitest configuration
- [ ] `src/engine/types.ts` -- shared type definitions
- [ ] `src/engine/constants.ts` -- scoring constants and defaults
- [ ] `src/engine/scoring.test.ts` -- scoring test file
- [ ] `src/engine/turn.test.ts` -- turn mechanics test file

## Sources

### Primary (HIGH confidence)
- Project REQUIREMENTS.md -- authoritative scoring rules and requirement IDs
- Project research/SUMMARY.md -- architecture decisions and phase rationale
- Project research/PITFALLS.md -- Pitfall 7 (scoring edge cases) directly relevant
- npm registry -- TypeScript 5.9.3, Vitest 4.1.0 verified 2026-03-19

### Secondary (MEDIUM confidence)
- Project research/STACK.md -- stack decisions (TypeScript, Vitest confirmed)
- Ten Thousand / Farkle rules (BCSTH variant) -- well-documented dice game with known rule set

### Tertiary (LOW confidence)
- None -- this phase is well-understood with no external dependencies beyond verified tooling

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- only TypeScript + Vitest, both verified on npm
- Architecture: HIGH -- pure functions, no framework dependencies, well-established patterns
- Pitfalls: HIGH -- scoring edge cases are well-documented for this game variant
- Test strategy: HIGH -- combinatorial coverage is standard for finite game rule sets

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable domain, 30-day validity)
