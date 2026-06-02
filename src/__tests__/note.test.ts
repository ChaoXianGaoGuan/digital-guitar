import { describe, it, expect } from 'vitest';
import { 
  midiToNoteName, 
  midiToFullNoteName, 
  noteNameToMidi, 
  fullNoteNameToMidi,
  getNaturalMajorNotesInRange,
  NOTE_NAMES
} from '../utils/note';

describe('note utils', () => {
  describe('midiToNoteName', () => {
    it('should convert MIDI to natural major note name', () => {
      // C4 = MIDI 60
      expect(midiToNoteName(60)).toBe('C');
      // D4 = MIDI 62
      expect(midiToNoteName(62)).toBe('D');
      // E4 = MIDI 64
      expect(midiToNoteName(64)).toBe('E');
      // F4 = MIDI 65
      expect(midiToNoteName(65)).toBe('F');
      // G4 = MIDI 67
      expect(midiToNoteName(67)).toBe('G');
      // A4 = MIDI 69
      expect(midiToNoteName(69)).toBe('A');
      // B4 = MIDI 71
      expect(midiToNoteName(71)).toBe('B');
    });

    it('should handle different octaves', () => {
      // C3 = MIDI 48
      expect(midiToNoteName(48)).toBe('C');
      // C5 = MIDI 72
      expect(midiToNoteName(72)).toBe('C');
    });
  });

  describe('midiToFullNoteName', () => {
    it('should convert MIDI to full note name with octave', () => {
      // C4 = MIDI 60
      expect(midiToFullNoteName(60)).toBe('C4');
      // D4 = MIDI 62
      expect(midiToFullNoteName(62)).toBe('D4');
      // E4 = MIDI 64
      expect(midiToFullNoteName(64)).toBe('E4');
    });

    it('should handle different octaves', () => {
      // C3 = MIDI 48
      expect(midiToFullNoteName(48)).toBe('C3');
      // C5 = MIDI 72
      expect(midiToFullNoteName(72)).toBe('C5');
    });

    it('should handle sharps', () => {
      // C#4 = MIDI 61
      expect(midiToFullNoteName(61)).toBe('C♯4');
      // F#4 = MIDI 66
      expect(midiToFullNoteName(66)).toBe('F♯4');
    });
  });

  describe('noteNameToMidi', () => {
    it('should convert note name to MIDI', () => {
      expect(noteNameToMidi('C', 4)).toBe(60);
      expect(noteNameToMidi('D', 4)).toBe(62);
      expect(noteNameToMidi('E', 4)).toBe(64);
      expect(noteNameToMidi('F', 4)).toBe(65);
      expect(noteNameToMidi('G', 4)).toBe(67);
      expect(noteNameToMidi('A', 4)).toBe(69);
      expect(noteNameToMidi('B', 4)).toBe(71);
    });

    it('should handle different octaves', () => {
      expect(noteNameToMidi('C', 3)).toBe(48);
      expect(noteNameToMidi('C', 5)).toBe(72);
    });
  });

  describe('fullNoteNameToMidi', () => {
    it('should convert full note name to MIDI', () => {
      expect(fullNoteNameToMidi('C4')).toBe(60);
      expect(fullNoteNameToMidi('D4')).toBe(62);
      expect(fullNoteNameToMidi('E4')).toBe(64);
    });

    it('should handle sharps', () => {
      expect(fullNoteNameToMidi('C#4')).toBe(61);
      expect(fullNoteNameToMidi('F#4')).toBe(66);
    });
  });

  describe('getNaturalMajorNotesInRange', () => {
    it('should return natural major notes in range', () => {
      // C4-B4 range (MIDI 60-71)
      const notes = getNaturalMajorNotesInRange(60, 71);
      expect(notes).toEqual([60, 62, 64, 65, 67, 69, 71]);
    });

    it('should handle wider range', () => {
      // C4-C5 range (MIDI 60-72)
      const notes = getNaturalMajorNotesInRange(60, 72);
      expect(notes).toEqual([60, 62, 64, 65, 67, 69, 71, 72]);
    });

    it('should exclude non-natural notes', () => {
      // C4-C#5 range (MIDI 60-73)
      const notes = getNaturalMajorNotesInRange(60, 73);
      // C# (61), D# (63), F# (66), G# (68), A# (70) should be excluded
      expect(notes).toEqual([60, 62, 64, 65, 67, 69, 71, 72]);
    });
  });

  describe('NOTE_NAMES', () => {
    it('should contain 7 natural major notes', () => {
      expect(NOTE_NAMES).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B']);
    });
  });
});
