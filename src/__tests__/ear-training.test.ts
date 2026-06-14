import { describe, expect, it } from 'vitest';
import {
  ADVANCED_INTERVALS,
  BEGINNER_INTERVALS,
  INTERVAL_SEMITONES,
  checkChordQualityAnswer,
  checkIntervalAnswer,
  checkPitchDirectionAnswer,
  checkSamePitchMatchingAnswer,
  generateChordQualityQuestion,
  generateIntervalQuestion,
  generatePitchDirectionQuestion,
  generateReferencePitchQuestion,
  generateSamePitchMatchingQuestion
} from '../utils/practice';
import { createCustomTuning, OPEN_G_TUNING, STANDARD_TUNING } from '../utils/tuning';

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

  it('builds three unique same-pitch candidates with exactly one correct MIDI', () => {
    for (const tuning of [
      STANDARD_TUNING,
      OPEN_G_TUNING,
      createCustomTuning([41, 46, 51, 56, 60, 65])
    ]) {
      for (const [range, min, max] of [
        ['all', 0, 15],
        ['1st', 0, 4],
        ['2nd', 5, 8],
        ['3rd', 9, 12]
      ] as const) {
        const question = generateSamePitchMatchingQuestion(tuning, range, 'beginner');
        const candidates = question.candidatePositions!;
        expect(candidates).toHaveLength(3);
        expect(new Set(candidates.map(position => `${position.string}:${position.fret}`)).size).toBe(3);
        expect(new Set(candidates.map(position => tuning.strings[position.string] + position.fret)).size).toBe(3);
        expect(candidates.every(position => position.fret >= min && position.fret <= max)).toBe(true);
        expect(candidates.filter(position => (
          tuning.strings[position.string] + position.fret === question.targetMidi
        ))).toHaveLength(1);
      }
    }
  });

  it('prefers far beginner distractors and near advanced distractors', () => {
    for (let index = 0; index < 100; index++) {
      const beginner = generateSamePitchMatchingQuestion(STANDARD_TUNING, 'all', 'beginner');
      const advanced = generateSamePitchMatchingQuestion(STANDARD_TUNING, 'all', 'advanced');
      const distances = (question: typeof beginner) => question.candidatePositions!
        .map(position => Math.abs(STANDARD_TUNING.strings[position.string] + position.fret - question.targetMidi!))
        .filter(distance => distance !== 0);
      expect(distances(beginner).every(distance => distance >= 5)).toBe(true);
      expect(distances(advanced).every(distance => distance >= 1 && distance <= 3)).toBe(true);
    }
  });

  it('checks same-pitch matches by exact MIDI rather than note name', () => {
    expect(checkSamePitchMatchingAnswer({ string: 0, fret: 0 }, 40, STANDARD_TUNING)).toBe(true);
    expect(checkSamePitchMatchingAnswer({ string: 0, fret: 12 }, 40, STANDARD_TUNING)).toBe(false);
    expect(checkSamePitchMatchingAnswer(null, 40, STANDARD_TUNING)).toBe(false);
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
