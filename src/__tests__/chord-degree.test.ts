import { describe, expect, it } from 'vitest';
import { degreeChord, triadFingering, triadName, validProgression, DEGREE_KEYS } from '../utils/chordDegree';
import { getFingeringMidiNotes } from '../utils/chord';

describe('和弦级数', () => {
  it('生成五个大调的完整顺阶三和弦', () => {
    const expected = [
      ['C','Dm','Em','F','G','Am','Bdim'],
      ['G','Am','Bm','C','D','Em','F♯dim'],
      ['D','Em','F♯m','G','A','Bm','C♯dim'],
      ['A','Bm','C♯m','D','E','F♯m','G♯dim'],
      ['E','F♯m','G♯m','A','B','C♯m','D♯dim']
    ];
    DEGREE_KEYS.forEach((key, i) => expect(Array.from({length: 7}, (_, j) => triadName(degreeChord(key, j + 1)))).toEqual(expected[i]));
  });
  it('全部根音和性质的指法只包含和弦音且覆盖三个音', () => {
    for (let root = 0; root < 12; root++) for (const quality of ['major','minor','dim'] as const) {
      const notes = getFingeringMidiNotes(triadFingering({ root, quality })).map(n => (n - root + 120) % 12);
      expect([...new Set(notes)].sort((a,b) => a-b)).toEqual(quality === 'major' ? [0,4,7] : quality === 'minor' ? [0,3,7] : [0,3,6]);
    }
  });
  it('校验自定义走向', () => { expect(validProgression('4536251')).toBe(true); expect(validProgression('018')).toBe(false); expect(validProgression('')).toBe(false); });
});
