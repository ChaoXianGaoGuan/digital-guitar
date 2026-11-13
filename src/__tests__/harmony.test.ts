import { describe, expect, it } from 'vitest';
import { getFingeringMidiNotes } from '../utils/chord';
import {
  DEFAULT_HARMONY_CONFIG, HARMONY_KEYS, canStartHarmony, degreeChord,
  generateHarmonyQuestion, triadFingering, triadName, validProgression
} from '../utils/harmony';

describe('harmony music rules', () => {
  it('spells the seven diatonic triads correctly in all five keys', () => {
    const expected = [
      ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim'],
      ['G', 'Am', 'Bm', 'C', 'D', 'Em', 'F♯dim'],
      ['D', 'Em', 'F♯m', 'G', 'A', 'Bm', 'C♯dim'],
      ['A', 'Bm', 'C♯m', 'D', 'E', 'F♯m', 'G♯dim'],
      ['E', 'F♯m', 'G♯m', 'A', 'B', 'C♯m', 'D♯dim']
    ];
    HARMONY_KEYS.forEach((key, index) => {
      expect(Array.from({ length: 7 }, (_, degree) => triadName(degreeChord(key, degree + 1))))
        .toEqual(expected[index]);
    });
  });

  it('all 36 fingerings contain all and only the triad tones within the board', () => {
    for (let root = 0; root < 12; root++) {
      for (const quality of ['major', 'minor', 'dim'] as const) {
        const fingering = triadFingering({ root, quality });
        const notes = getFingeringMidiNotes(fingering);
        const intervals = [...new Set(notes.map(note => (note - root + 120) % 12))].sort((a, b) => a - b);
        expect(intervals).toEqual(quality === 'major' ? [0, 4, 7] : quality === 'minor' ? [0, 3, 7] : [0, 3, 6]);
        expect(fingering.frets.every(fret => fret === null || (fret >= 0 && fret <= 15))).toBe(true);
      }
    }
  });

  it('prefers common open chord voicings', () => {
    expect(triadFingering({ root: 0, quality: 'major' }).frets).toEqual([null, 3, 2, 0, 1, 0]);
    expect(triadFingering({ root: 9, quality: 'minor' }).frets).toEqual([null, 0, 2, 2, 1, 0]);
  });

  it('respects selected keys, degrees and progressions', () => {
    const config = { keys: ['D' as const], degrees: [7], progressions: ['1645'] };
    expect(generateHarmonyQuestion(config, false).chords.map(triadName)).toEqual(['C♯dim']);
    expect(generateHarmonyQuestion(config, true).chords.map(triadName)).toEqual(['D', 'Bm', 'G', 'A']);
    expect(canStartHarmony({ ...DEFAULT_HARMONY_CONFIG, keys: [] }, false)).toBe(false);
    expect(canStartHarmony({ ...config, progressions: [] }, true)).toBe(false);
    expect(validProgression('4536251')).toBe(true);
    for (const bad of ['', '0', '128', '1 6', '1'.repeat(33)]) expect(validProgression(bad)).toBe(false);
  });
});
