import type { NoteName } from './note';
import { NOTE_NAMES } from './note';
import type { Tuning } from './tuning';
import { STANDARD_TUNING } from './tuning';

export type ChordType = 'major' | 'minor' | 'dominant7';
export type ChordTier = 'beginner' | 'full';
export type ChordCurriculum = 'beginner' | 'all';
export type FretValue = number | null;
export type StringIndex = 0 | 1 | 2 | 3 | 4 | 5;
export type FretboardPosition = { string: StringIndex; fret: number };

export interface ChordFingering {
  frets: [FretValue, FretValue, FretValue, FretValue, FretValue, FretValue];
}

export interface Chord {
  root: NoteName;
  type: ChordType;
  name: string;
  intervals: number[];
  tier: ChordTier;
  fingerings: ChordFingering[];
}

export const CHORD_INTERVALS: Record<ChordType, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  dominant7: [0, 4, 7, 10],
};

export const CHORD_TYPE_NAMES: Record<ChordType, string> = {
  major: '大三',
  minor: '小三',
  dominant7: '七',
};

const BEGINNER_CHORD_NAMES = new Set([
  'C', 'D', 'E', 'G', 'A', 'Am', 'Dm', 'Em', 'C7', 'D7', 'E7', 'G7', 'A7', 'B7'
]);

const FINGERING_NOTATION: Record<string, string> = {
  C: 'X32010',
  Cm: 'X35543',
  C7: 'X32310',
  D: 'XX0232',
  Dm: 'XX0231',
  D7: 'XX0212',
  E: '022100',
  Em: '022000',
  E7: '020100',
  F: '133211',
  Fm: '133111',
  F7: '131211',
  G: '320003',
  Gm: '355333',
  G7: '320001',
  A: 'X02220',
  Am: 'X02210',
  A7: 'X02020',
  B: 'X24442',
  Bm: 'X24432',
  B7: 'X21202',
};

export function parseChordFingering(notation: string): ChordFingering {
  if (!/^[X0-9]{6}$/.test(notation)) {
    throw new Error(`Invalid chord fingering: ${notation}`);
  }

  const frets = [...notation].map(char => char === 'X' ? null : Number(char));
  return {
    frets: frets as ChordFingering['frets']
  };
}

function getChordName(root: NoteName, type: ChordType): string {
  if (type === 'minor') return `${root}m`;
  if (type === 'dominant7') return `${root}7`;
  return root;
}

export function generateAllChords(): Chord[] {
  const chords: Chord[] = [];

  for (const root of NOTE_NAMES) {
    for (const type of ['major', 'minor', 'dominant7'] as ChordType[]) {
      const name = getChordName(root, type);
      chords.push({
        root,
        type,
        name,
        intervals: CHORD_INTERVALS[type],
        tier: BEGINNER_CHORD_NAMES.has(name) ? 'beginner' : 'full',
        fingerings: [parseChordFingering(FINGERING_NOTATION[name])]
      });
    }
  }

  return chords;
}

export const ALL_CHORDS = generateAllChords();

export function getChordPool(curriculum: ChordCurriculum): Chord[] {
  return curriculum === 'beginner'
    ? ALL_CHORDS.filter(chord => chord.tier === 'beginner')
    : ALL_CHORDS;
}

export function getChordNotes(chord: Chord, octave: number = 4): number[] {
  const rootNoteNames: Record<NoteName, number> = {
    C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11
  };
  const rootMidi = (octave + 1) * 12 + rootNoteNames[chord.root];
  return chord.intervals.map(interval => rootMidi + interval);
}

export function getFingeringPositions(fingering: ChordFingering): FretboardPosition[] {
  return fingering.frets.flatMap((fret, string) => (
    fret === null ? [] : [{ string: string as StringIndex, fret }]
  ));
}

export function getFingeringMidiNotes(
  fingering: ChordFingering,
  tuning: Tuning = STANDARD_TUNING
): number[] {
  return fingering.frets.flatMap((fret, string) => (
    fret === null ? [] : [tuning.strings[string] + fret]
  ));
}

export function formatChordFingering(fingering: ChordFingering): string {
  return fingering.frets.map(fret => (
    fret === null ? 'X' : fret.toString()
  )).join('');
}

export function getChordPositions(
  chord: Chord,
  tuning: Tuning = STANDARD_TUNING
): FretboardPosition[] {
  void tuning;
  return getFingeringPositions(chord.fingerings[0]);
}

export function checkChordPositions(
  userPositions: Array<{ string: number; fret: number }>,
  correctPositions: Array<{ string: number; fret: number }>
): boolean {
  if (userPositions.length !== correctPositions.length) return false;

  const sortedUser = [...userPositions].sort((a, b) => a.string - b.string || a.fret - b.fret);
  const sortedCorrect = [...correctPositions].sort((a, b) => a.string - b.string || a.fret - b.fret);

  return sortedUser.every((position, index) => (
    position.string === sortedCorrect[index].string
      && position.fret === sortedCorrect[index].fret
  ));
}

export function checkChordFingeringAnswer(
  userPositions: FretboardPosition[],
  acceptedFingerings: ChordFingering[]
): boolean {
  return acceptedFingerings.some(fingering => (
    checkChordPositions(userPositions, getFingeringPositions(fingering))
  ));
}
