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
 * Check if the roll is a straight (1-2-3-4-5-6 on all 6 dice).
 * Returns a ScoreBreakdown if it is, null otherwise.
 */
function checkStraight(
  dice: Roll,
  freq: Map<DieValue, number>,
): ScoreBreakdown | null {
  if (freq.size !== DICE_COUNT) return null;
  for (const count of freq.values()) {
    if (count !== 1) return null;
  }
  return {
    total: STRAIGHT_SCORE,
    components: [
      {
        dice: [1, 2, 3, 4, 5, 6],
        points: STRAIGHT_SCORE,
        description: 'Straight',
      },
    ],
    scoringDiceIndices: dice.map((_, i) => i),
  };
}

/**
 * Check if the roll is three pairs (exactly 3 distinct values, each appearing twice).
 * Returns a ScoreBreakdown if it is, null otherwise.
 */
function checkThreePairs(
  dice: Roll,
  freq: Map<DieValue, number>,
): ScoreBreakdown | null {
  if (freq.size !== 3) return null;
  for (const count of freq.values()) {
    if (count !== 2) return null;
  }
  const pairDice = Array.from(freq.entries()).flatMap(
    ([v]) => [v, v] as DieValue[],
  );
  return {
    total: THREE_PAIRS_SCORE,
    components: [
      {
        dice: pairDice,
        points: THREE_PAIRS_SCORE,
        description: 'Three Pairs',
      },
    ],
    scoringDiceIndices: dice.map((_, i) => i),
  };
}

/**
 * Score dice by frequency: N-of-a-kind (3+) first, then singles (1s and 5s).
 * Dice consumed by higher combinations are not available for lower ones.
 */
function scoreByFrequency(
  dice: Roll,
  freq: Map<DieValue, number>,
): ScoreBreakdown {
  const components: ScoreComponent[] = [];
  const scoringDiceIndices: number[] = [];
  let total = 0;

  // Track which indices have been consumed
  const consumed = new Set<number>();

  // Process N-of-a-kind (count >= 3) first
  for (const [value, count] of freq.entries()) {
    if (count >= 3) {
      const tripleBase = TRIPLE_SCORES[value];
      const points = tripleBase * Math.pow(2, count - 3);
      total += points;

      // Collect dice values for this component
      const componentDice: DieValue[] = Array(count).fill(value);
      components.push({
        dice: componentDice,
        points,
        description:
          count === 3
            ? `Three ${value}s`
            : `${count}-of-a-kind ${value}s`,
      });

      // Find and consume the indices for these dice
      let found = 0;
      for (let i = 0; i < dice.length && found < count; i++) {
        if (!consumed.has(i) && dice[i] === value) {
          consumed.add(i);
          scoringDiceIndices.push(i);
          found++;
        }
      }
    }
  }

  // Process remaining singles (1s and 5s not consumed by triples)
  for (let i = 0; i < dice.length; i++) {
    if (consumed.has(i)) continue;
    const value = dice[i];
    const singleScore = SINGLE_SCORES[value];
    if (singleScore !== undefined) {
      total += singleScore;
      consumed.add(i);
      scoringDiceIndices.push(i);
      components.push({
        dice: [value],
        points: singleScore,
        description: `Single ${value}`,
      });
    }
  }

  return {
    total,
    components,
    scoringDiceIndices: scoringDiceIndices.sort((a, b) => a - b),
  };
}

/**
 * Score a roll of dice, returning the complete breakdown.
 *
 * Priority order: straight > three pairs > N-of-a-kind > singles.
 * Dice consumed by higher combinations are NOT available for lower ones.
 */
export function scoreRoll(dice: Roll): ScoreBreakdown {
  if (dice.length === 0) {
    return { total: 0, components: [], scoringDiceIndices: [] };
  }

  const freq = buildFrequencyMap(dice);

  // Check 6-dice combinations first (only valid with exactly 6 dice)
  if (dice.length === DICE_COUNT) {
    const straightResult = checkStraight(dice, freq);
    if (straightResult) return straightResult;

    const threePairsResult = checkThreePairs(dice, freq);
    if (threePairsResult) return threePairsResult;
  }

  // Extract N-of-a-kind (3+), then singles (1s and 5s)
  return scoreByFrequency(dice, freq);
}

/**
 * Find all dice indices that participate in scoring combinations.
 * Returns a sorted array of indices. Empty array means farkle.
 */
export function findScoringDice(dice: Roll): number[] {
  const result = scoreRoll(dice);
  return result.scoringDiceIndices;
}

/**
 * Score a specific subset of dice the player chose to keep.
 * Validates that ALL selected dice participate in scoring combinations.
 * Returns { total: 0, components: [], scoringDiceIndices: [] } if invalid.
 */
export function scoreDice(selectedDice: Roll): ScoreBreakdown {
  if (selectedDice.length === 0) {
    return { total: 0, components: [], scoringDiceIndices: [] };
  }

  const result = scoreRoll(selectedDice);

  // Validate that ALL selected dice participate in scoring
  if (result.scoringDiceIndices.length !== selectedDice.length) {
    return { total: 0, components: [], scoringDiceIndices: [] };
  }

  return result;
}

/**
 * Find the best possible score from a roll.
 * scoreRoll already returns the optimal score due to priority ordering.
 */
export function bestPossibleScore(dice: Roll): ScoreBreakdown {
  return scoreRoll(dice);
}
