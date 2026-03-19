import type { DieValue, Roll, ScoreBreakdown, ScoreComponent } from './types.js';
import {
  SINGLE_SCORES,
  TRIPLE_SCORES,
  STRAIGHT_SCORE,
  THREE_PAIRS_SCORE,
  DICE_COUNT,
} from './constants.js';

/**
 * Build a frequency map counting occurrences of each die value.
 */
function buildFrequencyMap(dice: Roll): Map<DieValue, number> {
  const freq = new Map<DieValue, number>();
  for (const die of dice) {
    freq.set(die, (freq.get(die) || 0) + 1);
  }
  return freq;
}

/**
 * Check if the roll is a straight (1-2-3-4-5-6). Only valid with exactly 6 dice.
 */
function checkStraight(dice: Roll, freq: Map<DieValue, number>): ScoreBreakdown | null {
  if (freq.size !== 6) return null;
  for (const count of freq.values()) {
    if (count !== 1) return null;
  }
  return {
    total: STRAIGHT_SCORE,
    components: [{
      dice: [1, 2, 3, 4, 5, 6] as DieValue[],
      points: STRAIGHT_SCORE,
      description: 'Straight',
    }],
    scoringDiceIndices: Array.from({ length: dice.length }, (_, i) => i),
  };
}

/**
 * Check if the roll is three pairs. Only valid with exactly 6 dice,
 * exactly 3 distinct values, each appearing exactly twice.
 */
function checkThreePairs(dice: Roll, freq: Map<DieValue, number>): ScoreBreakdown | null {
  if (freq.size !== 3) return null;
  for (const count of freq.values()) {
    if (count !== 2) return null;
  }
  return {
    total: THREE_PAIRS_SCORE,
    components: [{
      dice: [...dice] as DieValue[],
      points: THREE_PAIRS_SCORE,
      description: 'Three Pairs',
    }],
    scoringDiceIndices: Array.from({ length: dice.length }, (_, i) => i),
  };
}

/**
 * Score dice by frequency: N-of-a-kind first, then singles.
 * Tracks which original indices contribute to scoring.
 */
function scoreByFrequency(dice: Roll, freq: Map<DieValue, number>): ScoreBreakdown {
  const components: ScoreComponent[] = [];
  const scoringDiceIndices: number[] = [];
  let total = 0;

  // Build index map: value -> list of original indices
  const indexMap = new Map<DieValue, number[]>();
  for (let i = 0; i < dice.length; i++) {
    const val = dice[i];
    if (!indexMap.has(val)) indexMap.set(val, []);
    indexMap.get(val)!.push(i);
  }

  // Track remaining counts (so we don't double-count)
  const remaining = new Map<DieValue, number>(freq);

  // Process N-of-a-kind (3+) for each value
  for (const [value, count] of freq) {
    if (count >= 3) {
      const points = TRIPLE_SCORES[value] * Math.pow(2, count - 3);
      const diceArr = Array(count).fill(value) as DieValue[];
      const indices = indexMap.get(value)!.slice(0, count);

      let description: string;
      if (count === 3) {
        description = `Three ${value}s`;
      } else if (count === 4) {
        description = `Four ${value}s`;
      } else if (count === 5) {
        description = `Five ${value}s`;
      } else {
        description = `Six ${value}s`;
      }

      components.push({ dice: diceArr, points, description });
      scoringDiceIndices.push(...indices);
      total += points;
      remaining.set(value, 0); // All consumed by N-of-a-kind
    }
  }

  // Process singles (1s and 5s only, with remaining count)
  for (const [value, singlePoints] of Object.entries(SINGLE_SCORES)) {
    const dieValue = Number(value) as DieValue;
    const remainingCount = remaining.get(dieValue) || 0;
    if (remainingCount > 0 && singlePoints !== undefined) {
      const indices = indexMap.get(dieValue)!;
      // Only take indices not already used by N-of-a-kind
      const usedCount = (freq.get(dieValue) || 0) - remainingCount;
      const availableIndices = indices.slice(usedCount, usedCount + remainingCount);

      for (let i = 0; i < remainingCount; i++) {
        components.push({
          dice: [dieValue],
          points: singlePoints,
          description: `Single ${dieValue}`,
        });
        scoringDiceIndices.push(availableIndices[i]);
        total += singlePoints;
      }
    }
  }

  scoringDiceIndices.sort((a, b) => a - b);

  return { total, components, scoringDiceIndices };
}

/**
 * Score a roll of dice, returning the breakdown of scoring combinations.
 * Priority: straight > three pairs > N-of-a-kind > singles.
 */
export function scoreRoll(dice: Roll): ScoreBreakdown {
  if (dice.length === 0) {
    return { total: 0, components: [], scoringDiceIndices: [] };
  }

  const freq = buildFrequencyMap(dice);

  // Check 6-dice combinations first
  if (dice.length === DICE_COUNT) {
    const straight = checkStraight(dice, freq);
    if (straight) return straight;

    const threePairs = checkThreePairs(dice, freq);
    if (threePairs) return threePairs;
  }

  return scoreByFrequency(dice, freq);
}

/**
 * Find indices of all scoring dice in a roll.
 * Returns sorted array of indices. Empty array means farkle.
 */
export function findScoringDice(dice: Roll): number[] {
  const result = scoreRoll(dice);
  return result.scoringDiceIndices;
}

/**
 * Score a player-selected subset of dice.
 * Validates that ALL selected dice participate in scoring combinations.
 * If any die is "dead weight", returns total: 0 (invalid selection).
 */
export function scoreDice(selectedDice: Roll): ScoreBreakdown {
  if (selectedDice.length === 0) {
    return { total: 0, components: [], scoringDiceIndices: [] };
  }

  const result = scoreRoll(selectedDice);

  // Validate all dice participate in scoring
  if (result.scoringDiceIndices.length !== selectedDice.length) {
    return { total: 0, components: [], scoringDiceIndices: [] };
  }

  return result;
}

/**
 * Return the best possible score for a roll.
 * scoreRoll already returns the optimal score due to priority ordering.
 */
export function bestPossibleScore(dice: Roll): ScoreBreakdown {
  return scoreRoll(dice);
}
