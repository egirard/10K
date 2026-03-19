import { describe, it, expect } from 'vitest';
import { createTurn, roll, selectDice, bank } from './turn.js';
import type { TurnState, Roll, DieValue } from './types.js';

describe('createTurn', () => {
  it('returns initial state with phase START and 6 available dice', () => {
    const state = createTurn();
    expect(state.phase).toBe('START');
    expect(state.availableDice).toBe(6);
    expect(state.accumulatedScore).toBe(0);
    expect(state.throwsThisTurn).toBe(0);
    expect(state.totalDiceSetAside).toBe(0);
    expect(state.currentRoll).toEqual([]);
    expect(state.selectedDiceIndices).toEqual([]);
    expect(state.throwScore).toBe(0);
    expect(state.isOnBoard).toBe(false);
    expect(state.entryThreshold).toBe(800);
  });

  it('respects isOnBoard option', () => {
    const state = createTurn({ isOnBoard: true });
    expect(state.isOnBoard).toBe(true);
  });

  it('respects custom entryThreshold', () => {
    const state = createTurn({ entryThreshold: 500 });
    expect(state.entryThreshold).toBe(500);
  });
});

describe('roll (TURN-01)', () => {
  it('from START phase, produces 6 dice and transitions to ROLLED', () => {
    const state = createTurn();
    const result = roll(state, { diceValues: [1, 3, 4, 2, 6, 2] as Roll });
    expect(result.valid).toBe(true);
    expect(result.state.phase).toBe('ROLLED');
    expect(result.state.currentRoll).toEqual([1, 3, 4, 2, 6, 2]);
    expect(result.state.currentRoll.length).toBe(6);
    expect(result.state.throwsThisTurn).toBe(1);
  });

  it('from SELECTING phase, rolls remaining available dice', () => {
    // Simulate: rolled 6, selected 2 dice (indices 0, 1 from [1, 5, 3, 4, 2, 6])
    const state = createTurn();
    const rolled = roll(state, { diceValues: [1, 5, 3, 4, 2, 6] as Roll });
    const selected = selectDice(rolled.state, [0, 1]); // select 1 and 5
    expect(selected.valid).toBe(true);
    expect(selected.state.availableDice).toBe(4);

    const rerolled = roll(selected.state, { diceValues: [2, 3, 4, 6] as Roll });
    expect(rerolled.valid).toBe(true);
    expect(rerolled.state.phase).toBe('ROLLED');
    expect(rerolled.state.currentRoll.length).toBe(4);
  });

  it('from FARKLED phase, returns valid: false', () => {
    const farkledState: TurnState = {
      phase: 'FARKLED',
      availableDice: 6,
      currentRoll: [],
      selectedDiceIndices: [],
      throwScore: 0,
      accumulatedScore: 0,
      totalDiceSetAside: 0,
      throwsThisTurn: 1,
      isOnBoard: false,
      entryThreshold: 800,
    };
    const result = roll(farkledState);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('from BANKED phase, returns valid: false', () => {
    const bankedState: TurnState = {
      phase: 'BANKED',
      availableDice: 0,
      currentRoll: [],
      selectedDiceIndices: [],
      throwScore: 0,
      accumulatedScore: 500,
      totalDiceSetAside: 3,
      throwsThisTurn: 1,
      isOnBoard: true,
      entryThreshold: 800,
    };
    const result = roll(bankedState);
    expect(result.valid).toBe(false);
  });

  it('roll result has dice with all values between 1-6', () => {
    const state = createTurn();
    const result = roll(state, { diceValues: [1, 2, 3, 4, 5, 6] as Roll });
    expect(result.valid).toBe(true);
    for (const die of result.state.currentRoll) {
      expect(die).toBeGreaterThanOrEqual(1);
      expect(die).toBeLessThanOrEqual(6);
    }
  });
});

describe('selectDice (TURN-02)', () => {
  it('must select at least one die', () => {
    const state = createTurn();
    const rolled = roll(state, { diceValues: [1, 3, 4, 2, 6, 2] as Roll });
    const result = selectDice(rolled.state, []);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('must select');
  });

  it('rejects non-scoring die selection', () => {
    const state = createTurn();
    // [2, 3, 4, 1, 6, 2] -- index 0 is a 2, not scoring alone
    const rolled = roll(state, { diceValues: [2, 3, 4, 1, 6, 2] as Roll });
    const result = selectDice(rolled.state, [0]); // selecting the 2
    expect(result.valid).toBe(false);
  });

  it('accepts valid scoring die selection', () => {
    const state = createTurn();
    // [1, 3, 4, 2, 6, 2] -- index 0 is a 1 (scores 100)
    const rolled = roll(state, { diceValues: [1, 3, 4, 2, 6, 2] as Roll });
    const result = selectDice(rolled.state, [0]);
    expect(result.valid).toBe(true);
  });

  it('updates throwScore, reduces availableDice, increases totalDiceSetAside', () => {
    const state = createTurn();
    const rolled = roll(state, { diceValues: [1, 5, 3, 4, 2, 6] as Roll });
    const result = selectDice(rolled.state, [0, 1]); // 1 and 5
    expect(result.valid).toBe(true);
    expect(result.state.throwScore).toBe(150); // 100 + 50
    expect(result.state.availableDice).toBe(4); // 6 - 2
    expect(result.state.totalDiceSetAside).toBe(2);
  });

  it('after selecting, phase becomes SELECTING', () => {
    const state = createTurn();
    const rolled = roll(state, { diceValues: [1, 3, 4, 2, 6, 2] as Roll });
    const result = selectDice(rolled.state, [0]);
    expect(result.state.phase).toBe('SELECTING');
  });

  it('rejects indices out of range', () => {
    const state = createTurn();
    const rolled = roll(state, { diceValues: [1, 3, 4, 2, 6, 2] as Roll });
    const result = selectDice(rolled.state, [10]);
    expect(result.valid).toBe(false);
  });

  it('rejects negative indices', () => {
    const state = createTurn();
    const rolled = roll(state, { diceValues: [1, 3, 4, 2, 6, 2] as Roll });
    const result = selectDice(rolled.state, [-1]);
    expect(result.valid).toBe(false);
  });
});

describe('farkle (TURN-04)', () => {
  it('auto-transitions to FARKLED when no scoring dice exist', () => {
    const state = createTurn();
    // [2, 3, 4, 6, 2, 3] has no scoring dice
    const result = roll(state, { diceValues: [2, 3, 4, 6, 2, 3] as Roll });
    expect(result.valid).toBe(true);
    expect(result.state.phase).toBe('FARKLED');
  });

  it('accumulated score resets to 0 on farkle', () => {
    // First throw: score some points, then farkle on second throw
    const state = createTurn();
    const rolled = roll(state, { diceValues: [1, 5, 3, 4, 2, 6] as Roll });
    const selected = selectDice(rolled.state, [0, 1]); // 1 and 5 = 150
    expect(selected.state.throwScore).toBe(150);

    // Second throw with remaining 4 dice - all non-scoring
    const farkled = roll(selected.state, { diceValues: [2, 3, 4, 6] as Roll });
    expect(farkled.state.phase).toBe('FARKLED');
    expect(farkled.state.accumulatedScore).toBe(0);
  });

  it('cannot perform roll from FARKLED', () => {
    const state = createTurn();
    const farkled = roll(state, { diceValues: [2, 3, 4, 6, 2, 3] as Roll });
    expect(farkled.state.phase).toBe('FARKLED');
    const result = roll(farkled.state);
    expect(result.valid).toBe(false);
  });
});

describe('hot dice (TURN-05)', () => {
  it('transitions to HOT_DICE when totalDiceSetAside reaches 6', () => {
    const state = createTurn();
    // Roll a straight (all 6 dice score)
    const rolled = roll(state, { diceValues: [1, 2, 3, 4, 5, 6] as Roll });
    expect(rolled.state.phase).toBe('ROLLED');

    // Select all 6 dice
    const selected = selectDice(rolled.state, [0, 1, 2, 3, 4, 5]);
    expect(selected.valid).toBe(true);
    expect(selected.state.phase).toBe('HOT_DICE');
    expect(selected.state.totalDiceSetAside).toBe(6);
  });

  it('accumulated score carries forward on hot dice', () => {
    const state = createTurn();
    const rolled = roll(state, { diceValues: [1, 2, 3, 4, 5, 6] as Roll });
    const selected = selectDice(rolled.state, [0, 1, 2, 3, 4, 5]);
    expect(selected.state.phase).toBe('HOT_DICE');
    // Straight = 1000 points, should be in accumulated
    expect(selected.state.accumulatedScore).toBe(1000);
  });

  it('from HOT_DICE, roll resets availableDice to 6', () => {
    const state = createTurn();
    const rolled = roll(state, { diceValues: [1, 2, 3, 4, 5, 6] as Roll });
    const selected = selectDice(rolled.state, [0, 1, 2, 3, 4, 5]);
    expect(selected.state.phase).toBe('HOT_DICE');

    const rerolled = roll(selected.state, { diceValues: [1, 3, 4, 2, 6, 5] as Roll });
    expect(rerolled.valid).toBe(true);
    expect(rerolled.state.phase).toBe('ROLLED');
    expect(rerolled.state.currentRoll.length).toBe(6);
    expect(rerolled.state.availableDice).toBe(6);
  });

  it('from HOT_DICE, bank returns valid: false (must roll)', () => {
    const state = createTurn();
    const rolled = roll(state, { diceValues: [1, 2, 3, 4, 5, 6] as Roll });
    const selected = selectDice(rolled.state, [0, 1, 2, 3, 4, 5]);
    expect(selected.state.phase).toBe('HOT_DICE');

    const bankResult = bank(selected.state);
    expect(bankResult.valid).toBe(false);
    expect(bankResult.error).toContain('must roll');
  });

  it('hot dice across multiple throws when totalDiceSetAside reaches 6', () => {
    const state = createTurn();
    // Throw 1: roll 6 dice, select 3 scoring dice
    const rolled1 = roll(state, { diceValues: [1, 1, 1, 2, 3, 4] as Roll });
    const selected1 = selectDice(rolled1.state, [0, 1, 2]); // triple 1s = 1000
    expect(selected1.state.totalDiceSetAside).toBe(3);
    expect(selected1.state.phase).toBe('SELECTING');

    // Throw 2: roll 3 remaining dice, select all 3
    const rolled2 = roll(selected1.state, { diceValues: [1, 1, 5] as Roll });
    const selected2 = selectDice(rolled2.state, [0, 1, 2]); // two 1s + one 5 = 250
    expect(selected2.state.totalDiceSetAside).toBe(6);
    expect(selected2.state.phase).toBe('HOT_DICE');
  });
});

describe('bank (TURN-03, TURN-06, TURN-07)', () => {
  describe('threshold (TURN-06)', () => {
    it('rejects bank when not on board and accumulated < 800', () => {
      const state = createTurn({ isOnBoard: false });
      const rolled = roll(state, { diceValues: [1, 3, 4, 2, 6, 2] as Roll });
      const selected = selectDice(rolled.state, [0]); // single 1 = 100
      expect(selected.state.phase).toBe('SELECTING');

      const result = bank(selected.state);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('threshold');
    });

    it('allows bank when not on board and accumulated >= 800', () => {
      const state = createTurn({ isOnBoard: false });
      // Roll with lots of scoring: [1, 1, 1, 1, 5, 5] = four 1s (2000) + two 5s (100) = 2100
      const rolled = roll(state, { diceValues: [1, 1, 1, 1, 5, 5] as Roll });
      const selected = selectDice(rolled.state, [0, 1, 2, 3, 4, 5]);
      // Hot dice triggered (all 6 set aside), so we need to roll again
      expect(selected.state.phase).toBe('HOT_DICE');

      // Re-roll after hot dice
      const rerolled = roll(selected.state, { diceValues: [1, 3, 4, 2, 6, 2] as Roll });
      const selected2 = selectDice(rerolled.state, [0]); // single 1 = 100
      expect(selected2.state.phase).toBe('SELECTING');

      const result = bank(selected2.state);
      expect(result.valid).toBe(true);
      expect(result.pointsBanked).toBeGreaterThanOrEqual(800);
    });
  });

  describe('on board (TURN-07)', () => {
    it('allows bank with any positive amount when on board', () => {
      const state = createTurn({ isOnBoard: true });
      const rolled = roll(state, { diceValues: [1, 3, 4, 2, 6, 2] as Roll });
      const selected = selectDice(rolled.state, [0]); // single 1 = 100
      expect(selected.state.phase).toBe('SELECTING');

      const result = bank(selected.state);
      expect(result.valid).toBe(true);
      expect(result.pointsBanked).toBe(100);
    });

    it('allows bank with 50 points (single 5) when on board', () => {
      const state = createTurn({ isOnBoard: true });
      const rolled = roll(state, { diceValues: [5, 3, 4, 2, 6, 2] as Roll });
      const selected = selectDice(rolled.state, [0]); // single 5 = 50
      expect(selected.state.phase).toBe('SELECTING');

      const result = bank(selected.state);
      expect(result.valid).toBe(true);
      expect(result.pointsBanked).toBe(50);
    });
  });

  it('bank from ROLLED phase (before selecting) returns valid false', () => {
    const state = createTurn({ isOnBoard: true });
    const rolled = roll(state, { diceValues: [1, 3, 4, 2, 6, 2] as Roll });
    expect(rolled.state.phase).toBe('ROLLED');

    const result = bank(rolled.state);
    expect(result.valid).toBe(false);
  });

  it('bank transitions to BANKED with correct pointsBanked', () => {
    const state = createTurn({ isOnBoard: true });
    const rolled = roll(state, { diceValues: [1, 5, 3, 4, 2, 6] as Roll });
    const selected = selectDice(rolled.state, [0, 1]); // 1 + 5 = 150

    const result = bank(selected.state);
    expect(result.valid).toBe(true);
    expect(result.state.phase).toBe('BANKED');
    expect(result.pointsBanked).toBe(150);
  });

  it('bank adds throwScore to accumulatedScore in pointsBanked', () => {
    const state = createTurn({ isOnBoard: true });
    // Throw 1: select 1 (100 pts)
    const rolled1 = roll(state, { diceValues: [1, 3, 4, 2, 6, 2] as Roll });
    const selected1 = selectDice(rolled1.state, [0]); // 100
    expect(selected1.state.throwScore).toBe(100);

    // Throw 2: roll 5 dice, select 5 (50 pts)
    const rolled2 = roll(selected1.state, { diceValues: [5, 3, 4, 2, 6] as Roll });
    const selected2 = selectDice(rolled2.state, [0]); // 50

    const result = bank(selected2.state);
    expect(result.valid).toBe(true);
    expect(result.pointsBanked).toBe(150); // 100 + 50
  });
});

describe('single throw scoring (SCORE-06)', () => {
  it('scores each throw independently, not combined across throws', () => {
    const state = createTurn({ isOnBoard: true });
    // Throw 1: [1, 3, 4, 2, 6, 2], select the 1 -> 100 points
    const rolled1 = roll(state, { diceValues: [1, 3, 4, 2, 6, 2] as Roll });
    const selected1 = selectDice(rolled1.state, [0]); // single 1 = 100

    // Throw 2: [2, 2, 2, 4, 3], score is 200 from triple 2s
    const rolled2 = roll(selected1.state, { diceValues: [2, 2, 2, 4, 3] as Roll });
    const selected2 = selectDice(rolled2.state, [0, 1, 2]); // triple 2s = 200
    expect(selected2.state.throwScore).toBe(200);

    // Bank: accumulated = 100 (from throw 1) + 200 (from throw 2) = 300
    const result = bank(selected2.state);
    expect(result.valid).toBe(true);
    expect(result.pointsBanked).toBe(300);
  });

  it('cannot combine dice from previous throws with current throw', () => {
    const state = createTurn({ isOnBoard: true });
    // Throw 1: [1, 1, 3, 4, 2, 6], select two 1s -> 200 points
    const rolled1 = roll(state, { diceValues: [1, 1, 3, 4, 2, 6] as Roll });
    const selected1 = selectDice(rolled1.state, [0, 1]); // two 1s = 200

    // Throw 2: [1, 3, 4, 2] -- the single 1 scores 100, NOT combined with previous 1s for triple
    const rolled2 = roll(selected1.state, { diceValues: [1, 3, 4, 2] as Roll });
    const selected2 = selectDice(rolled2.state, [0]); // single 1 = 100

    const result = bank(selected2.state);
    expect(result.valid).toBe(true);
    expect(result.pointsBanked).toBe(300); // 200 + 100, not 1000
  });
});
