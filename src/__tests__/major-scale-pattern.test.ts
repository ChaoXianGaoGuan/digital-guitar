import { describe, expect, it, vi } from 'vitest';
import {
  MAJOR_KEY_SCALE_NOTES,
  MAJOR_SCALE_PATTERNS,
  checkMajorScalePatternNoteAnswer,
  generateMajorScalePatternQuestionData,
  getMajorScalePattern,
  getScaleNoteNameForMidi
} from '../utils/majorScalePattern';
import { generateQuestion } from '../utils/practice';
import { STANDARD_TUNING } from '../utils/tuning';

describe('major scale pattern note-name practice', () => {
  it('spells all supported major keys with real scale note names', () => {
    expect(MAJOR_KEY_SCALE_NOTES.D).toEqual(['D', 'E', 'F♯', 'G', 'A', 'B', 'C♯']);
    expect(MAJOR_KEY_SCALE_NOTES.G).toContain('F♯');
    expect(MAJOR_KEY_SCALE_NOTES['B♭']).toEqual(['B♭', 'C', 'D', 'E♭', 'F', 'G', 'A']);
  });

  it('generates a non-empty position set for every Mi/Sol/La/Ti/Re pattern', () => {
    for (const patternId of MAJOR_SCALE_PATTERNS) {
      const pattern = getMajorScalePattern('C', patternId);
      expect(pattern.positions.length).toBeGreaterThan(0);
      expect(pattern.positions.every(position => (
        position.fret >= pattern.startFret && position.fret <= pattern.endFret
      ))).toBe(true);
    }
  });

  it('only chooses target positions from the selected key and pattern area', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const question = generateQuestion(
      'major-scale-pattern-note-name',
      STANDARD_TUNING,
      'all',
      'beginner',
      'beginner',
      'beginner',
      'D',
      'mi'
    );

    expect(question.majorKey).toBe('D');
    expect(question.scalePatternId).toBe('mi');
    expect(question.scalePatternPositions).toContainEqual(question.correctPosition);
    expect(MAJOR_KEY_SCALE_NOTES.D).toContain(question.correctScaleNoteName);
  });

  it('returns sharp answers for sharp major keys', () => {
    expect(getScaleNoteNameForMidi('D', 42)).toBe('F♯');
    expect(getScaleNoteNameForMidi('D', 49)).toBe('C♯');
    expect(checkMajorScalePatternNoteAnswer('F♯', 'F♯')).toBe(true);
    expect(checkMajorScalePatternNoteAnswer('F', 'F♯')).toBe(false);
  });

  it('builds complete question data for a selected key and pattern', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const data = generateMajorScalePatternQuestionData('A', 'la');
    expect(data.key).toBe('A');
    expect(data.patternId).toBe('la');
    expect(data.pattern.positions).toContainEqual(data.targetPosition);
    expect(MAJOR_KEY_SCALE_NOTES.A).toContain(data.correctNoteName);
  });
});
