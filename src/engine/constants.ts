import type { DieValue } from './types.js';

/** Points for single scoring dice (only 1s and 5s score individually) */
export const SINGLE_SCORES: Partial<Record<DieValue, number>> = {
  1: 100,
  5: 50,
};

/** Base points for three-of-a-kind of each value */
export const TRIPLE_SCORES: Record<DieValue, number> = {
  1: 1000,
  2: 200,
  3: 300,
  4: 400,
  5: 500,
  6: 600,
};

/** Points for a straight (1-2-3-4-5-6) on all 6 dice */
export const STRAIGHT_SCORE = 1000;

/** Points for three pairs on all 6 dice */
export const THREE_PAIRS_SCORE = 1000;

/** Default minimum points to bank on first scoring turn */
export const DEFAULT_ENTRY_THRESHOLD = 800;

/** Default points needed to win the game */
export const DEFAULT_TARGET_SCORE = 10000;

/** Number of dice in the game */
export const DICE_COUNT = 6;
