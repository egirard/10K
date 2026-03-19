import { describe, it, expect } from 'vitest';
import { scoreRoll, findScoringDice, scoreDice, bestPossibleScore } from './scoring.js';
import type { DieValue, Roll } from './types.js';

describe('scoreRoll', () => {
  describe('singles (SCORE-01)', () => {
    it('scores single 1 as 100 points', () => {
      const result = scoreRoll([1]);
      expect(result.total).toBe(100);
      expect(result.components.length).toBeGreaterThan(0);
      expect(result.components.some(c => c.description.includes('1'))).toBe(true);
    });

    it('scores single 5 as 50 points', () => {
      const result = scoreRoll([5]);
      expect(result.total).toBe(50);
      expect(result.components.some(c => c.description.includes('5'))).toBe(true);
    });

    it('scores 1 and 5 together as 150 points', () => {
      const result = scoreRoll([1, 5]);
      expect(result.total).toBe(150);
    });

    it('scores two 1s as 200 points', () => {
      const result = scoreRoll([1, 1]);
      expect(result.total).toBe(200);
    });

    it('scores a single 2 as 0 points', () => {
      const result = scoreRoll([2]);
      expect(result.total).toBe(0);
      expect(result.components).toEqual([]);
    });

    it('scores non-scoring dice [3, 4, 6] as 0 points', () => {
      const result = scoreRoll([3, 4, 6]);
      expect(result.total).toBe(0);
    });
  });

  describe('three-of-a-kind (SCORE-02)', () => {
    it('scores three 1s as 1000 points', () => {
      expect(scoreRoll([1, 1, 1]).total).toBe(1000);
    });

    it('scores three 2s as 200 points', () => {
      expect(scoreRoll([2, 2, 2]).total).toBe(200);
    });

    it('scores three 3s as 300 points', () => {
      expect(scoreRoll([3, 3, 3]).total).toBe(300);
    });

    it('scores three 4s as 400 points', () => {
      expect(scoreRoll([4, 4, 4]).total).toBe(400);
    });

    it('scores three 5s as 500 points', () => {
      expect(scoreRoll([5, 5, 5]).total).toBe(500);
    });

    it('scores three 6s as 600 points', () => {
      expect(scoreRoll([6, 6, 6]).total).toBe(600);
    });

    it('scores triple 1s + single 5 as 1050', () => {
      expect(scoreRoll([1, 1, 1, 5]).total).toBe(1050);
    });

    it('scores triple 2s + single 1 as 300', () => {
      expect(scoreRoll([2, 2, 2, 1]).total).toBe(300);
    });
  });

  describe('N-of-a-kind doubling (SCORE-03)', () => {
    it('scores four 1s as 2000 (1000 * 2^1)', () => {
      expect(scoreRoll([1, 1, 1, 1]).total).toBe(2000);
    });

    it('scores five 1s as 4000 (1000 * 2^2)', () => {
      expect(scoreRoll([1, 1, 1, 1, 1]).total).toBe(4000);
    });

    it('scores six 1s as 8000 (1000 * 2^3)', () => {
      expect(scoreRoll([1, 1, 1, 1, 1, 1]).total).toBe(8000);
    });

    it('scores four 2s as 400 (200 * 2^1)', () => {
      expect(scoreRoll([2, 2, 2, 2]).total).toBe(400);
    });

    it('scores five 2s as 800 (200 * 2^2)', () => {
      expect(scoreRoll([2, 2, 2, 2, 2]).total).toBe(800);
    });

    it('scores six 2s as 1600 (200 * 2^3)', () => {
      expect(scoreRoll([2, 2, 2, 2, 2, 2]).total).toBe(1600);
    });

    it('scores four 5s as 1000 (500 * 2^1)', () => {
      expect(scoreRoll([5, 5, 5, 5]).total).toBe(1000);
    });

    it('scores six 6s as 4800 (600 * 2^3)', () => {
      expect(scoreRoll([6, 6, 6, 6, 6, 6]).total).toBe(4800);
    });
  });

  describe('straight (SCORE-04)', () => {
    it('scores [1,2,3,4,5,6] as 1000 with Straight description', () => {
      const result = scoreRoll([1, 2, 3, 4, 5, 6]);
      expect(result.total).toBe(1000);
      expect(result.components.some(c => c.description.includes('Straight'))).toBe(true);
    });

    it('scores [6,5,4,3,2,1] as 1000 (order irrelevant)', () => {
      expect(scoreRoll([6, 5, 4, 3, 2, 1]).total).toBe(1000);
    });

    it('does NOT score [1,2,3,4,5] as straight (only 5 dice)', () => {
      const result = scoreRoll([1, 2, 3, 4, 5]);
      // 5 dice cannot be a straight; should score as singles: 1=100, 5=50 = 150
      expect(result.total).not.toBe(1000);
    });
  });

  describe('three pairs (SCORE-05)', () => {
    it('scores [1,1,2,2,3,3] as 1000 with Three Pairs description', () => {
      const result = scoreRoll([1, 1, 2, 2, 3, 3]);
      expect(result.total).toBe(1000);
      expect(result.components.some(c => c.description.includes('Three Pairs'))).toBe(true);
    });

    it('scores [4,4,5,5,6,6] as 1000', () => {
      expect(scoreRoll([4, 4, 5, 5, 6, 6]).total).toBe(1000);
    });

    it('scores [1,1,5,5,3,3] as 1000 (NOT 300 from individual scoring)', () => {
      expect(scoreRoll([1, 1, 5, 5, 3, 3]).total).toBe(1000);
    });

    it('does NOT score [2,2,2,2,3,3] as three pairs', () => {
      const result = scoreRoll([2, 2, 2, 2, 3, 3] as Roll);
      // This is four 2s (400) + pair of 3s (0) = 400
      expect(result.total).not.toBe(1000);
      expect(result.total).toBe(400);
    });
  });

  describe('edge cases', () => {
    it('returns 0 for empty roll', () => {
      const result = scoreRoll([]);
      expect(result.total).toBe(0);
      expect(result.components).toEqual([]);
      expect(result.scoringDiceIndices).toEqual([]);
    });

    it('does not double-count dice consumed by triples as singles', () => {
      // [1,1,1,5] = triple 1s (1000) + single 5 (50) = 1050, NOT 1350
      expect(scoreRoll([1, 1, 1, 5]).total).toBe(1050);
    });

    it('scores [1,1,1] as 1000 not 300', () => {
      // Three 1s is a triple (1000), not three singles (300)
      expect(scoreRoll([1, 1, 1]).total).toBe(1000);
    });

    it('scores [5,5,5,1] as 600 (triple 5s + single 1)', () => {
      expect(scoreRoll([5, 5, 5, 1]).total).toBe(600);
    });

    it('scores [1,5,2,3,4,6] as straight 1000', () => {
      expect(scoreRoll([1, 5, 2, 3, 4, 6]).total).toBe(1000);
    });
  });
});

describe('findScoringDice (SCORE-07)', () => {
  it('returns [0] for [1,3,4,2,6,2] (only the 1 at index 0 scores)', () => {
    const result = findScoringDice([1, 3, 4, 2, 6, 2]);
    expect(result).toEqual([0]);
  });

  it('returns [0, 1] for [1,5,3,4,2,2] (1 and 5 score)', () => {
    const result = findScoringDice([1, 5, 3, 4, 2, 2]);
    expect(result).toEqual([0, 1]);
  });

  it('returns [] for [2,3,4,6,2,3] (farkle)', () => {
    const result = findScoringDice([2, 3, 4, 6, 2, 3]);
    expect(result).toEqual([]);
  });

  it('returns [0, 1, 2] for [1,1,1,2,3,4] (triple 1s)', () => {
    const result = findScoringDice([1, 1, 1, 2, 3, 4]);
    expect(result).toEqual([0, 1, 2]);
  });

  it('returns [0,1,2,3,4,5] for [1,2,3,4,5,6] (straight, all score)', () => {
    const result = findScoringDice([1, 2, 3, 4, 5, 6]);
    expect(result).toEqual([0, 1, 2, 3, 4, 5]);
  });
});

describe('scoreDice', () => {
  it('rejects invalid selection where non-scoring die is included', () => {
    // Selecting [1, 3] -- the 3 is not a scoring die
    const result = scoreDice([1, 3]);
    expect(result.total).toBe(0);
    expect(result.scoringDiceIndices).toEqual([]);
  });

  it('scores valid selection of single 1 as 100', () => {
    const result = scoreDice([1]);
    expect(result.total).toBe(100);
  });

  it('returns 0 for empty selection', () => {
    const result = scoreDice([]);
    expect(result.total).toBe(0);
  });
});

describe('bestPossibleScore', () => {
  it('returns 1050 for [1,1,1,5,3,4]', () => {
    const result = bestPossibleScore([1, 1, 1, 5, 3, 4]);
    expect(result.total).toBe(1050);
  });

  it('returns 0 for [2,3,4,6,2,3] (farkle)', () => {
    const result = bestPossibleScore([2, 3, 4, 6, 2, 3]);
    expect(result.total).toBe(0);
  });

  it('returns 1000 for [1,1,5,5,3,3] (three pairs beats 300)', () => {
    const result = bestPossibleScore([1, 1, 5, 5, 3, 3]);
    expect(result.total).toBe(1000);
  });
});
