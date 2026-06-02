import { describe, it, expect } from 'vitest';
import { 
  generateAllChords, 
  getChordNotes, 
  getChordPositions,
  getChordPool,
  getFingeringMidiNotes,
  getFingeringPositions,
  parseChordFingering,
  checkChordFingeringAnswer,
  checkChordPositions,
  ALL_CHORDS,
  CHORD_INTERVALS,
  CHORD_TYPE_NAMES
} from '../utils/chord';
import { STANDARD_TUNING } from '../utils/tuning';

describe('chord utils', () => {
  describe('CHORD_INTERVALS', () => {
    it('should define correct intervals for major chord', () => {
      expect(CHORD_INTERVALS.major).toEqual([0, 4, 7]);
    });

    it('should define correct intervals for minor chord', () => {
      expect(CHORD_INTERVALS.minor).toEqual([0, 3, 7]);
    });

    it('should define correct intervals for dominant7 chord', () => {
      expect(CHORD_INTERVALS.dominant7).toEqual([0, 4, 7, 10]);
    });
  });

  describe('CHORD_TYPE_NAMES', () => {
    it('should have correct Chinese names', () => {
      expect(CHORD_TYPE_NAMES.major).toBe('大三');
      expect(CHORD_TYPE_NAMES.minor).toBe('小三');
      expect(CHORD_TYPE_NAMES.dominant7).toBe('七');
    });
  });

  describe('generateAllChords', () => {
    it('should generate 21 chords (7 roots * 3 types)', () => {
      const chords = generateAllChords();
      expect(chords.length).toBe(21);
    });

    it('should generate correct chord names', () => {
      const chords = generateAllChords();
      
      // Major chords
      expect(chords.find(c => c.root === 'C' && c.type === 'major')?.name).toBe('C');
      expect(chords.find(c => c.root === 'D' && c.type === 'major')?.name).toBe('D');
      
      // Minor chords
      expect(chords.find(c => c.root === 'C' && c.type === 'minor')?.name).toBe('Cm');
      expect(chords.find(c => c.root === 'D' && c.type === 'minor')?.name).toBe('Dm');
      
      // Dominant7 chords
      expect(chords.find(c => c.root === 'C' && c.type === 'dominant7')?.name).toBe('C7');
      expect(chords.find(c => c.root === 'D' && c.type === 'dominant7')?.name).toBe('D7');
    });
  });

  describe('real guitar fingerings', () => {
    const expectedFingerings: Record<string, string> = {
      C: 'X32010', Cm: 'X35543', C7: 'X32310',
      D: 'XX0232', Dm: 'XX0231', D7: 'XX0212',
      E: '022100', Em: '022000', E7: '020100',
      F: '133211', Fm: '133111', F7: '131211',
      G: '320003', Gm: '355333', G7: '320001',
      A: 'X02220', Am: 'X02210', A7: 'X02020',
      B: 'X24442', Bm: 'X24432', B7: 'X21202'
    };

    it('parses muted and open strings', () => {
      expect(parseChordFingering('X32010').frets).toEqual([null, 3, 2, 0, 1, 0]);
    });

    it('defines a Standard-tuning fingering for every chord', () => {
      for (const chord of ALL_CHORDS) {
        expect(chord.fingerings).toHaveLength(1);
        const chordClasses = chord.intervals.map(interval => (
          (getChordNotes(chord, 4)[0] + interval) % 12
        ));
        for (const midi of getFingeringMidiNotes(chord.fingerings[0], STANDARD_TUNING)) {
          expect(chordClasses).toContain(midi % 12);
        }
      }
    });

    it('stores the specified low-position fingering for all 21 chords', () => {
      expect(Object.fromEntries(ALL_CHORDS.map(chord => [
        chord.name,
        chord.fingerings[0].frets.map(fret => fret === null ? 'X' : fret).join('')
      ]))).toEqual(expectedFingerings);
    });

    it('uses a smaller beginner curriculum', () => {
      expect(getChordPool('beginner')).toHaveLength(14);
      expect(getChordPool('all')).toHaveLength(21);
    });

    it('accepts an exact fingering including open strings', () => {
      const cMajor = ALL_CHORDS.find(chord => chord.name === 'C')!;
      const positions = getFingeringPositions(cMajor.fingerings[0]);
      expect(checkChordFingeringAnswer(positions, cMajor.fingerings)).toBe(true);
      expect(checkChordFingeringAnswer(positions.slice(1), cMajor.fingerings)).toBe(false);
    });
  });

  describe('getChordNotes', () => {
    it('should return correct notes for C major chord', () => {
      const cMajor = ALL_CHORDS.find(c => c.root === 'C' && c.type === 'major')!;
      const notes = getChordNotes(cMajor, 4);
      // C4=60, E4=64, G4=67
      expect(notes).toEqual([60, 64, 67]);
    });

    it('should return correct notes for A minor chord', () => {
      const aMinor = ALL_CHORDS.find(c => c.root === 'A' && c.type === 'minor')!;
      const notes = getChordNotes(aMinor, 4);
      // A4=69, C5=72, E5=76
      expect(notes).toEqual([69, 72, 76]);
    });

    it('should return correct notes for G7 chord', () => {
      const g7 = ALL_CHORDS.find(c => c.root === 'G' && c.type === 'dominant7')!;
      const notes = getChordNotes(g7, 4);
      // G4=67, B4=71, D5=74, F5=77
      expect(notes).toEqual([67, 71, 74, 77]);
    });
  });

  describe('getChordPositions', () => {
    it('should return positions for C major chord', () => {
      const cMajor = ALL_CHORDS.find(c => c.root === 'C' && c.type === 'major')!;
      const positions = getChordPositions(cMajor, STANDARD_TUNING);
      
      // 应该返回至少1个位置（简化版本可能不是完整的和弦指法）
      expect(positions.length).toBeGreaterThanOrEqual(1);
      
      // 每个位置应该在0-15品范围内
      positions.forEach(pos => {
        expect(pos.fret).toBeGreaterThanOrEqual(0);
        expect(pos.fret).toBeLessThanOrEqual(15);
        expect(pos.string).toBeGreaterThanOrEqual(0);
        expect(pos.string).toBeLessThanOrEqual(5);
      });
    });
  });

  describe('checkChordPositions', () => {
    it('should return true for matching positions', () => {
      const userPositions = [
        { string: 0, fret: 0 },
        { string: 1, fret: 1 },
        { string: 2, fret: 0 }
      ];
      const correctPositions = [
        { string: 0, fret: 0 },
        { string: 1, fret: 1 },
        { string: 2, fret: 0 }
      ];
      expect(checkChordPositions(userPositions, correctPositions)).toBe(true);
    });

    it('should return true for matching positions in different order', () => {
      const userPositions = [
        { string: 2, fret: 0 },
        { string: 0, fret: 0 },
        { string: 1, fret: 1 }
      ];
      const correctPositions = [
        { string: 0, fret: 0 },
        { string: 1, fret: 1 },
        { string: 2, fret: 0 }
      ];
      expect(checkChordPositions(userPositions, correctPositions)).toBe(true);
    });

    it('should return false for non-matching positions', () => {
      const userPositions = [
        { string: 0, fret: 0 },
        { string: 1, fret: 1 },
        { string: 2, fret: 1 } // 不同的位置
      ];
      const correctPositions = [
        { string: 0, fret: 0 },
        { string: 1, fret: 1 },
        { string: 2, fret: 0 }
      ];
      expect(checkChordPositions(userPositions, correctPositions)).toBe(false);
    });

    it('should return false for different number of positions', () => {
      const userPositions = [
        { string: 0, fret: 0 },
        { string: 1, fret: 1 }
      ];
      const correctPositions = [
        { string: 0, fret: 0 },
        { string: 1, fret: 1 },
        { string: 2, fret: 0 }
      ];
      expect(checkChordPositions(userPositions, correctPositions)).toBe(false);
    });
  });
});
