import { describe, expect, it } from 'vitest';
import {
  ADVANCED_INTERVALS,
  BEGINNER_INTERVALS,
  INTERVAL_SEMITONES,
  checkChordQualityAnswer,
  checkIntervalAnswer,
  checkPitchDirectionAnswer,
  generateChordQualityQuestion,
  generateIntervalQuestion,
  generatePitchDirectionQuestion,
  generateReferencePitchQuestion
} from '../utils/practice';
import { OPEN_G_TUNING, STANDARD_TUNING } from '../utils/tuning';

describe('ear training question generators', () => {
  it('keeps pitch comparison notes inside C3-B4 and labels their direction', () => {
    for (let index = 0; index < 300; index++) {
      const question = generatePitchDirectionQuestion();
      expect(question.firstMidi).toBeGreaterThanOrEqual(48);
      expect(question.firstMidi).toBeLessThanOrEqual(71);
      expect(question.secondMidi).toBeGreaterThanOrEqual(48);
      expect(question.secondMidi).toBeLessThanOrEqual(71);
      const difference = question.secondMidi! - question.firstMidi!;
      expect(question.correctPitchDirection).toBe(difference > 0 ? 'higher' : difference < 0 ? 'lower' : 'same');
    }
  });

  it('generates reference notes from the current tuning and requested range', () => {
    for (const [range, min, max] of [
      ['all', 0, 15],
      ['1st', 0, 4],
      ['2nd', 5, 8],
      ['3rd', 9, 12]
    ] as const) {
      const question = generateReferencePitchQuestion(OPEN_G_TUNING, range);
      expect(question.correctPosition?.fret).toBeGreaterThanOrEqual(min);
      expect(question.correctPosition?.fret).toBeLessThanOrEqual(max);
      expect(question.correctMidiNote).toBe(
        OPEN_G_TUNING.strings[question.correctPosition!.string] + question.correctPosition!.fret
      );
    }
  });

  it('limits beginner intervals to six ascending choices', () => {
    for (let index = 0; index < 200; index++) {
      const question = generateIntervalQuestion('beginner');
      expect(BEGINNER_INTERVALS).toContain(question.correctInterval);
      expect(question.intervalDirection).toBe('ascending');
      expect(question.secondMidi! - question.firstMidi!).toBe(INTERVAL_SEMITONES[question.correctInterval!]);
    }
  });

  it('supports every advanced interval and descending playback', () => {
    const generated = Array.from({ length: 1000 }, () => generateIntervalQuestion('advanced'));
    expect(new Set(generated.map(question => question.correctInterval))).toEqual(new Set(ADVANCED_INTERVALS));
    expect(generated.some(question => question.intervalDirection === 'descending')).toBe(true);
  });

  it('builds compact major and minor triads without depending on tuning', () => {
    for (let index = 0; index < 100; index++) {
      const question = generateChordQualityQuestion();
      const [root, third, fifth] = question.playbackMidiNotes!;
      expect(fifth - root).toBe(7);
      expect(third - root).toBe(question.correctChordQuality === 'major' ? 4 : 3);
    }
    expect(STANDARD_TUNING.strings).toHaveLength(6);
  });

  it('checks each new button answer exactly', () => {
    expect(checkPitchDirectionAnswer('higher', 'higher')).toBe(true);
    expect(checkPitchDirectionAnswer('lower', 'same')).toBe(false);
    expect(checkIntervalAnswer('perfect5', 'perfect5')).toBe(true);
    expect(checkIntervalAnswer('perfect4', 'perfect5')).toBe(false);
    expect(checkChordQualityAnswer('minor', 'minor')).toBe(true);
    expect(checkChordQualityAnswer('major', 'minor')).toBe(false);
  });
});
