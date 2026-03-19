import type { TurnState, TurnActionResult, Roll, DieValue } from './types.js';
import { findScoringDice, scoreDice } from './scoring.js';
import { DEFAULT_ENTRY_THRESHOLD, DICE_COUNT } from './constants.js';

/**
 * Create a new turn with initial state.
 */
export function createTurn(options?: {
  isOnBoard?: boolean;
  entryThreshold?: number;
}): TurnState {
  return {
    phase: 'START',
    availableDice: DICE_COUNT,
    currentRoll: [],
    selectedDiceIndices: [],
    throwScore: 0,
    accumulatedScore: 0,
    totalDiceSetAside: 0,
    throwsThisTurn: 0,
    isOnBoard: options?.isOnBoard ?? false,
    entryThreshold: options?.entryThreshold ?? DEFAULT_ENTRY_THRESHOLD,
  };
}

/**
 * Generate random dice values.
 */
function generateDice(count: number): Roll {
  return Array.from(
    { length: count },
    () => (Math.floor(Math.random() * 6) + 1) as DieValue
  );
}

/**
 * Roll dice from a valid state.
 * Valid phases: START, SELECTING, HOT_DICE.
 * If no scoring dice exist after rolling, auto-transitions to FARKLED.
 */
export function roll(
  state: TurnState,
  overrides?: { diceValues?: Roll }
): TurnActionResult {
  // Validate phase
  if (
    state.phase !== 'START' &&
    state.phase !== 'SELECTING' &&
    state.phase !== 'HOT_DICE'
  ) {
    return {
      valid: false,
      state,
      error: `Cannot roll in phase ${state.phase}`,
    };
  }

  // Determine dice count and prepare accumulated score
  let availableDice = state.availableDice;
  let accumulatedScore = state.accumulatedScore;
  let totalDiceSetAside = state.totalDiceSetAside;

  // When rolling from SELECTING, add current throwScore to accumulated
  if (state.phase === 'SELECTING') {
    accumulatedScore += state.throwScore;
  }

  // When rolling from HOT_DICE, reset dice and add throwScore to accumulated
  if (state.phase === 'HOT_DICE') {
    availableDice = DICE_COUNT;
    totalDiceSetAside = 0;
  }

  // Generate dice
  const diceValues = overrides?.diceValues ?? generateDice(availableDice);

  // Check for farkle
  const scoringIndices = findScoringDice(diceValues);
  if (scoringIndices.length === 0) {
    return {
      valid: true,
      state: {
        ...state,
        phase: 'FARKLED',
        currentRoll: diceValues,
        selectedDiceIndices: [],
        throwScore: 0,
        accumulatedScore: 0, // Lose all accumulated points
        availableDice,
        totalDiceSetAside,
        throwsThisTurn: state.throwsThisTurn + 1,
      },
    };
  }

  return {
    valid: true,
    state: {
      ...state,
      phase: 'ROLLED',
      currentRoll: diceValues,
      selectedDiceIndices: [],
      throwScore: 0,
      accumulatedScore,
      availableDice,
      totalDiceSetAside,
      throwsThisTurn: state.throwsThisTurn + 1,
    },
  };
}

/**
 * Select scoring dice from the current roll.
 * Must select at least one die, all must be valid scoring dice.
 */
export function selectDice(
  state: TurnState,
  indices: number[]
): TurnActionResult {
  // Validate phase
  if (state.phase !== 'ROLLED') {
    return {
      valid: false,
      state,
      error: `Cannot select dice in phase ${state.phase}`,
    };
  }

  // Must select at least one
  if (indices.length === 0) {
    return {
      valid: false,
      state,
      error: 'You must select at least one scoring die',
    };
  }

  // Validate indices in range
  for (const idx of indices) {
    if (idx < 0 || idx >= state.currentRoll.length) {
      return {
        valid: false,
        state,
        error: `Die index ${idx} is out of range`,
      };
    }
  }

  // Extract selected dice values
  const selectedDiceValues = indices.map((i) => state.currentRoll[i]) as Roll;

  // Score the selection -- scoreDice validates all dice are scoring
  const scoreResult = scoreDice(selectedDiceValues);
  if (scoreResult.total === 0) {
    return {
      valid: false,
      state,
      error: 'Selected dice do not form valid scoring combinations',
    };
  }

  const newTotalDiceSetAside = state.totalDiceSetAside + indices.length;
  const newAvailableDice = state.availableDice - indices.length;

  // Check hot dice: if all dice have been set aside
  if (newTotalDiceSetAside >= DICE_COUNT) {
    return {
      valid: true,
      state: {
        ...state,
        phase: 'HOT_DICE',
        selectedDiceIndices: indices,
        throwScore: scoreResult.total,
        accumulatedScore: state.accumulatedScore + scoreResult.total,
        availableDice: newAvailableDice,
        totalDiceSetAside: newTotalDiceSetAside,
      },
    };
  }

  return {
    valid: true,
    state: {
      ...state,
      phase: 'SELECTING',
      selectedDiceIndices: indices,
      throwScore: scoreResult.total,
      availableDice: newAvailableDice,
      totalDiceSetAside: newTotalDiceSetAside,
    },
  };
}

/**
 * Bank accumulated points to end the turn.
 * Validates entry threshold for players not yet on the board.
 */
export function bank(state: TurnState): TurnActionResult {
  // Cannot bank from HOT_DICE
  if (state.phase === 'HOT_DICE') {
    return {
      valid: false,
      state,
      error: 'You must roll on hot dice',
    };
  }

  // Can only bank from SELECTING
  if (state.phase !== 'SELECTING') {
    return {
      valid: false,
      state,
      error: `Cannot bank in phase ${state.phase}`,
    };
  }

  const totalPoints = state.accumulatedScore + state.throwScore;

  // Entry threshold check
  if (!state.isOnBoard && totalPoints < state.entryThreshold) {
    return {
      valid: false,
      state,
      error: `Must accumulate at least ${state.entryThreshold} points to get on the board (threshold)`,
    };
  }

  return {
    valid: true,
    state: {
      ...state,
      phase: 'BANKED',
      accumulatedScore: totalPoints,
    },
    pointsBanked: totalPoints,
  };
}
