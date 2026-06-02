import { describe, expect, it } from 'vitest';
import {
  checkPositionSetAnswer,
  generateQuestion,
  getPositionsForNoteName
} from '../utils/practice';
import { createCustomTuning, OPEN_G_TUNING, STANDARD_TUNING } from '../utils/tuning';

describe('note-name to all fretboard positions', () => {
  it('includes open strings only in the first position', () => {
    const first = getPositionsForNoteName('E', STANDARD_TUNING, '1st');
    const second = getPositionsForNoteName('E', STANDARD_TUNING, '2nd');
    const third = getPositionsForNoteName('E', STANDARD_TUNING, '3rd');

    expect(first).toContainEqual({ string: 0, fret: 0 });
    expect(first).toContainEqual({ string: 5, fret: 0 });
    expect(first.every(position => position.fret >= 0 && position.fret <= 4)).toBe(true);
    expect(second.every(position => position.fret >= 5 && position.fret <= 8)).toBe(true);
    expect(third.every(position => position.fret >= 9 && position.fret <= 12)).toBe(true);
  });

  it('matches exact natural names without including sharp notes', () => {
    const positions = getPositionsForNoteName('C', STANDARD_TUNING, '1st');
    expect(positions).toContainEqual({ string: 1, fret: 3 }); // C3
    expect(positions).not.toContainEqual({ string: 1, fret: 4 }); // C♯3
  });

  it('computes answers from the active tuning', () => {
    const custom = createCustomTuning([36, 43, 48, 55, 59, 64]);
    expect(getPositionsForNoteName('D', OPEN_G_TUNING, '1st')).toContainEqual({ string: 0, fret: 0 });
    expect(getPositionsForNoteName('C', custom, '1st')).toContainEqual({ string: 0, fret: 0 });
  });

  it('validates unordered position sets exactly', () => {
    const correct = [{ string: 0 as const, fret: 0 }, { string: 5 as const, fret: 0 }];
    expect(checkPositionSetAnswer([...correct].reverse(), correct)).toBe(true);
    expect(checkPositionSetAnswer(correct.slice(1), correct)).toBe(false);
  });

  it('generates a natural-name question with at least one answer', () => {
    const question = generateQuestion('note-name-to-all-positions', STANDARD_TUNING, '1st');
    expect(['C', 'D', 'E', 'F', 'G', 'A', 'B']).toContain(question.correctNoteName);
    expect(question.correctPositions?.length).toBeGreaterThan(0);
  });
});
