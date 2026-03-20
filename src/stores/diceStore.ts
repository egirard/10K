import { create } from 'zustand';
import type { DieValue } from '../engine/types.js';
import { DICE_COUNT } from '../engine/constants.js';

export type DicePhase = 'idle' | 'rolling' | 'settled';

export interface DieState {
  value: DieValue | null;
  selected: boolean;
  canScore: boolean;
}

interface DiceStore {
  phase: DicePhase;
  dice: DieState[];
  rollCount: number;
  /** Ordered list of selected die indices (for slot assignment) */
  selectionOrder: number[];

  // Actions
  startRoll: () => void;
  setSettled: (values: DieValue[]) => void;
  selectDie: (index: number) => void;
  deselectDie: (index: number) => void;
  setCanScore: (indices: number[]) => void;
  reset: () => void;
}

const createInitialDice = (): DieState[] =>
  Array.from({ length: DICE_COUNT }, () => ({
    value: null,
    selected: false,
    canScore: false,
  }));

export const useDiceStore = create<DiceStore>((set) => ({
  phase: 'idle',
  dice: createInitialDice(),
  rollCount: 0,
  selectionOrder: [],

  startRoll: () => set((s) => ({
    phase: 'rolling',
    rollCount: s.rollCount + 1,
    selectionOrder: [],
    dice: s.dice.map((d) => ({ ...d, value: null, selected: false, canScore: false })),
  })),

  setSettled: (values) => set((s) => ({
    phase: 'settled',
    dice: s.dice.map((d, i) => ({ ...d, value: values[i] ?? null })),
  })),

  selectDie: (index) => set((s) => ({
    selectionOrder: [...s.selectionOrder, index],
    dice: s.dice.map((d, i) => i === index ? { ...d, selected: true } : d),
  })),

  deselectDie: (index) => set((s) => ({
    selectionOrder: s.selectionOrder.filter((i) => i !== index),
    dice: s.dice.map((d, i) => i === index ? { ...d, selected: false } : d),
  })),

  setCanScore: (indices) => set((s) => ({
    dice: s.dice.map((d, i) => ({ ...d, canScore: indices.includes(i) })),
  })),

  reset: () => set({
    phase: 'idle',
    dice: createInitialDice(),
    rollCount: 0,
    selectionOrder: [],
  }),
}));
