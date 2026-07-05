import type { FretboardPosition, StringIndex } from './chord';
import { STANDARD_TUNING } from './tuning';

export type MajorKey =
  | 'C'
  | 'G'
  | 'D'
  | 'A'
  | 'E'
  | 'B'
  | 'F♯'
  | 'D♭'
  | 'A♭'
  | 'E♭'
  | 'B♭'
  | 'F';

export type MajorScalePatternId = 'mi' | 'sol' | 'la' | 'ti' | 're';

export interface MajorScalePattern {
  id: MajorScalePatternId;
  name: string;
  startFret: number;
  endFret: number;
  positions: FretboardPosition[];
}

export interface MajorScalePatternQuestionData {
  key: MajorKey;
  patternId: MajorScalePatternId;
  pattern: MajorScalePattern;
  targetPosition: FretboardPosition;
  correctNoteName: string;
}

const KEY_ROOT_PITCH_CLASS: Record<MajorKey, number> = {
  C: 0,
  G: 7,
  D: 2,
  A: 9,
  E: 4,
  B: 11,
  'F♯': 6,
  'D♭': 1,
  'A♭': 8,
  'E♭': 3,
  'B♭': 10,
  F: 5
};

export const MAJOR_KEYS: MajorKey[] = ['C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'D♭', 'A♭', 'E♭', 'B♭', 'F'];

export const MAJOR_KEY_SCALE_NOTES: Record<MajorKey, string[]> = {
  C: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
  G: ['G', 'A', 'B', 'C', 'D', 'E', 'F♯'],
  D: ['D', 'E', 'F♯', 'G', 'A', 'B', 'C♯'],
  A: ['A', 'B', 'C♯', 'D', 'E', 'F♯', 'G♯'],
  E: ['E', 'F♯', 'G♯', 'A', 'B', 'C♯', 'D♯'],
  B: ['B', 'C♯', 'D♯', 'E', 'F♯', 'G♯', 'A♯'],
  'F♯': ['F♯', 'G♯', 'A♯', 'B', 'C♯', 'D♯', 'E♯'],
  'D♭': ['D♭', 'E♭', 'F', 'G♭', 'A♭', 'B♭', 'C'],
  'A♭': ['A♭', 'B♭', 'C', 'D♭', 'E♭', 'F', 'G'],
  'E♭': ['E♭', 'F', 'G', 'A♭', 'B♭', 'C', 'D'],
  'B♭': ['B♭', 'C', 'D', 'E♭', 'F', 'G', 'A'],
  F: ['F', 'G', 'A', 'B♭', 'C', 'D', 'E']
};

export const MAJOR_SCALE_PATTERN_NAMES: Record<MajorScalePatternId, string> = {
  mi: 'Mi 指型',
  sol: 'Sol 指型',
  la: 'La 指型',
  ti: 'Ti 指型',
  re: 'Re 指型'
};

export const MAJOR_SCALE_PATTERNS: MajorScalePatternId[] = ['mi', 'sol', 'la', 'ti', 're'];

const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
type ScaleDegree = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const DEGREE_GROUPS: ScaleDegree[][] = [
  [5, 6],
  [7, 1, 2],
  [3, 4, 5],
  [6, 7, 1],
  [2, 3, 4]
];

const PATTERN_START_GROUP_INDEX: Record<MajorScalePatternId, number> = {
  mi: 2,
  sol: 0,
  la: 3,
  ti: 1,
  re: 4
};

function normalizePitchClass(value: number): number {
  return ((value % 12) + 12) % 12;
}

export function getMajorScalePitchClasses(key: MajorKey): number[] {
  const root = KEY_ROOT_PITCH_CLASS[key];
  return MAJOR_SCALE_INTERVALS.map(interval => normalizePitchClass(root + interval));
}

function getPitchClassForDegree(key: MajorKey, degree: ScaleDegree): number {
  return getMajorScalePitchClasses(key)[degree - 1];
}

function getClosestFretForPitchClass(
  openMidi: number,
  targetPitchClass: number,
  anchorFret: number
): number {
  const candidates: number[] = [];
  for (let fret = 0; fret <= 15; fret++) {
    if (normalizePitchClass(openMidi + fret) === targetPitchClass) {
      candidates.push(fret);
    }
  }

  return candidates.reduce((best, fret) => (
    Math.abs(fret - anchorFret) < Math.abs(best - anchorFret) ? fret : best
  ), candidates[0]);
}

export function getScaleNoteNameForMidi(key: MajorKey, midi: number): string {
  const pitchClass = normalizePitchClass(midi);
  const index = getMajorScalePitchClasses(key).indexOf(pitchClass);
  return index === -1 ? '' : MAJOR_KEY_SCALE_NOTES[key][index];
}

export function getMajorScalePattern(
  key: MajorKey,
  patternId: MajorScalePatternId
): MajorScalePattern {
  const startGroupIndex = PATTERN_START_GROUP_INDEX[patternId];
  const sixthStringGroup = DEGREE_GROUPS[startGroupIndex];
  const anchorPitchClass = getPitchClassForDegree(key, sixthStringGroup[0]);
  const anchorFret = getClosestFretForPitchClass(
    STANDARD_TUNING.strings[0],
    anchorPitchClass,
    0
  );
  const positions: FretboardPosition[] = [];

  for (let string = 0; string < 6; string++) {
    const degreeGroup = DEGREE_GROUPS[(startGroupIndex + string) % DEGREE_GROUPS.length];
    for (const degree of degreeGroup) {
      positions.push({
        string: string as StringIndex,
        fret: getClosestFretForPitchClass(
          STANDARD_TUNING.strings[string],
          getPitchClassForDegree(key, degree),
          anchorFret
        )
      });
    }
  }
  const frets = positions.map(position => position.fret);

  return {
    id: patternId,
    name: MAJOR_SCALE_PATTERN_NAMES[patternId],
    startFret: Math.min(...frets),
    endFret: Math.max(...frets),
    positions
  };
}

export function generateMajorScalePatternQuestionData(
  key: MajorKey,
  patternId: MajorScalePatternId
): MajorScalePatternQuestionData {
  const pattern = getMajorScalePattern(key, patternId);
  const targetPosition = pattern.positions[Math.floor(Math.random() * pattern.positions.length)]
    ?? pattern.positions[0];
  const midi = STANDARD_TUNING.strings[targetPosition.string] + targetPosition.fret;

  return {
    key,
    patternId,
    pattern,
    targetPosition,
    correctNoteName: getScaleNoteNameForMidi(key, midi)
  };
}

export function checkMajorScalePatternNoteAnswer(answer: string, correctAnswer: string): boolean {
  return answer === correctAnswer;
}
