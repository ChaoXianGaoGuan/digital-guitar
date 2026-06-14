import type { NoteName } from './note';
import { midiToChromaticName, midiToNoteName, NOTE_NAMES } from './note';
import type { Chord, ChordCurriculum, ChordFingering, FretboardPosition, StringIndex } from './chord';
import { checkChordFingeringAnswer, getChordPool, getFingeringPositions } from './chord';
import type { Tuning } from './tuning';
import { STANDARD_TUNING } from './tuning';

export type PracticeType =
  | 'note-to-name-and-position'
  | 'position-to-name'
  | 'note-name-to-all-positions'
  | 'chord-to-position'
  | 'position-to-chord'
  | 'listen-to-chord'
  | 'pitch-direction'
  | 'same-pitch-matching'
  | 'reference-pitch-to-position'
  | 'interval-identification'
  | 'chord-quality';

export type PitchDirection = 'higher' | 'same' | 'lower';
export type IntervalId =
  | 'unison'
  | 'minor2'
  | 'major2'
  | 'minor3'
  | 'major3'
  | 'perfect4'
  | 'perfect5'
  | 'octave';
export type IntervalCurriculum = 'beginner' | 'advanced';
export type SamePitchCurriculum = 'beginner' | 'advanced';
export type PlaybackDirection = 'ascending' | 'descending';
export type ChordQuality = 'major' | 'minor';

export type FretRange = 'all' | '1st' | '2nd' | '3rd';
export type PositionSearchRange = Exclude<FretRange, 'all'>;
export type PracticeFeedback = 'none' | 'correct' | 'wrong';

export const FRET_RANGE_NAMES: Record<FretRange, string> = {
  all: '全部',
  '1st': '第一把位 (空弦、1-4品)',
  '2nd': '第二把位 (5-8品)',
  '3rd': '第三把位 (9-12品)'
};

export const FRET_RANGES: Record<FretRange, { min: number; max: number }> = {
  all: { min: 0, max: 15 },
  '1st': { min: 0, max: 4 },
  '2nd': { min: 5, max: 8 },
  '3rd': { min: 9, max: 12 }
};

export const PRACTICE_TYPE_NAMES: Record<PracticeType, string> = {
  'note-to-name-and-position': '听音高 → 音名 + 指板位置',
  'position-to-name': '指板亮点 → 音名',
  'note-name-to-all-positions': '音名 → 全部指板位置',
  'chord-to-position': '和弦 → 指板位置',
  'position-to-chord': '指板按和弦 → 和弦名',
  'listen-to-chord': '听和弦 → 和弦名',
  'pitch-direction': '高低比较',
  'same-pitch-matching': '同音匹配 → 指板位置',
  'reference-pitch-to-position': '听音高 → 指板自由定位',
  'interval-identification': '音程听辨',
  'chord-quality': '大三 / 小三和弦辨别'
};

export const INTERVAL_NAMES: Record<IntervalId, string> = {
  unison: '同度',
  minor2: '小二度',
  major2: '大二度',
  minor3: '小三度',
  major3: '大三度',
  perfect4: '纯四度',
  perfect5: '纯五度',
  octave: '八度'
};

export const INTERVAL_SEMITONES: Record<IntervalId, number> = {
  unison: 0,
  minor2: 1,
  major2: 2,
  minor3: 3,
  major3: 4,
  perfect4: 5,
  perfect5: 7,
  octave: 12
};

export const BEGINNER_INTERVALS: IntervalId[] = [
  'unison', 'major2', 'major3', 'perfect4', 'perfect5', 'octave'
];
export const ADVANCED_INTERVALS: IntervalId[] = [
  'unison', 'minor2', 'major2', 'minor3', 'major3', 'perfect4', 'perfect5', 'octave'
];

export interface PracticeQuestion {
  id: number;
  type: PracticeType;
  midiNote?: number;
  chord?: Chord;
  correctNoteName?: NoteName;
  correctPosition?: FretboardPosition;
  correctMidiNote?: number;
  correctPositions?: FretboardPosition[];
  correctChordFingerings?: ChordFingering[];
  correctChordPositions?: FretboardPosition[];
  correctChordName?: string;
  firstMidi?: number;
  secondMidi?: number;
  correctPitchDirection?: PitchDirection;
  correctInterval?: IntervalId;
  intervalDirection?: PlaybackDirection;
  correctChordQuality?: ChordQuality;
  playbackMidiNotes?: number[];
  targetMidi?: number;
  candidatePositions?: FretboardPosition[];
}

export function getPositionsForNoteName(
  noteName: NoteName,
  tuning: Tuning,
  range: PositionSearchRange
): FretboardPosition[] {
  const fretRange = FRET_RANGES[range];
  const positions: FretboardPosition[] = [];

  for (let string = 0; string < 6; string++) {
    for (let fret = fretRange.min; fret <= fretRange.max; fret++) {
      if (midiToChromaticName(tuning.strings[string] + fret) === noteName) {
        positions.push({ string: string as StringIndex, fret });
      }
    }
  }

  return positions;
}

export function checkPositionSetAnswer(
  selected: FretboardPosition[],
  correct: FretboardPosition[]
): boolean {
  if (selected.length !== correct.length) return false;
  const sortPositions = (positions: FretboardPosition[]) => (
    [...positions].sort((a, b) => a.string - b.string || a.fret - b.fret)
  );
  const sortedSelected = sortPositions(selected);
  const sortedCorrect = sortPositions(correct);
  return sortedSelected.every((position, index) => (
    position.string === sortedCorrect[index].string && position.fret === sortedCorrect[index].fret
  ));
}

export interface PracticeStats {
  total: number;
  correct: number;
}

let questionIdCounter = 0;

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function generatePitchDirectionQuestion(): PracticeQuestion {
  const direction = randomItem<PitchDirection>(['higher', 'same', 'lower']);
  const distance = direction === 'same'
    ? 0
    : 1 + Math.floor(Math.random() * 7);
  const firstMidi = direction === 'higher'
    ? 48 + Math.floor(Math.random() * (24 - distance))
    : direction === 'lower'
      ? 48 + distance + Math.floor(Math.random() * (24 - distance))
      : 48 + Math.floor(Math.random() * 24);
  const secondMidi = direction === 'higher'
    ? firstMidi + distance
    : firstMidi - distance;

  return {
    id: ++questionIdCounter,
    type: 'pitch-direction',
    firstMidi,
    secondMidi,
    correctPitchDirection: direction
  };
}

function getFretRangeWithOpenStrings(range: FretRange): { min: number; max: number } {
  return FRET_RANGES[range];
}

export function generateReferencePitchQuestion(
  tuning: Tuning,
  range: FretRange
): PracticeQuestion {
  const fretRange = getFretRangeWithOpenStrings(range);
  const string = Math.floor(Math.random() * 6) as StringIndex;
  const fret = fretRange.min + Math.floor(Math.random() * (fretRange.max - fretRange.min + 1));
  const midi = tuning.strings[string] + fret;
  return {
    id: ++questionIdCounter,
    type: 'reference-pitch-to-position',
    midiNote: midi,
    correctMidiNote: midi,
    correctPosition: { string, fret }
  };
}

function getPositionsForFretRange(
  tuning: Tuning,
  range: FretRange
): Array<FretboardPosition & { midi: number }> {
  const fretRange = getFretRangeWithOpenStrings(range);
  const positions: Array<FretboardPosition & { midi: number }> = [];
  for (let string = 0; string < 6; string++) {
    for (let fret = fretRange.min; fret <= fretRange.max; fret++) {
      positions.push({
        string: string as StringIndex,
        fret,
        midi: tuning.strings[string] + fret
      });
    }
  }
  return positions;
}

function shuffled<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function generateSamePitchMatchingQuestion(
  tuning: Tuning,
  range: FretRange,
  curriculum: SamePitchCurriculum
): PracticeQuestion {
  const positions = getPositionsForFretRange(tuning, range);
  const target = randomItem(positions);
  const distractors = positions.filter(position => (
    position.midi !== target.midi
    && (position.string !== target.string || position.fret !== target.fret)
  ));
  const preferred = distractors.filter(position => {
    const distance = Math.abs(position.midi - target.midi);
    return curriculum === 'beginner' ? distance >= 5 : distance >= 1 && distance <= 3;
  });
  const fallback = distractors.filter(position => !preferred.includes(position));
  const selectedDistractors = [...shuffled(preferred), ...shuffled(fallback)]
    .reduce<typeof distractors>((selected, position) => (
      selected.length < 2 && !selected.some(candidate => candidate.midi === position.midi)
        ? [...selected, position]
        : selected
    ), []);
  const correctPosition = { string: target.string, fret: target.fret };

  return {
    id: ++questionIdCounter,
    type: 'same-pitch-matching',
    targetMidi: target.midi,
    midiNote: target.midi,
    correctMidiNote: target.midi,
    correctPosition,
    candidatePositions: shuffled([
      correctPosition,
      ...selectedDistractors.map(({ string, fret }) => ({ string, fret }))
    ])
  };
}

export function generateIntervalQuestion(
  curriculum: IntervalCurriculum
): PracticeQuestion {
  const interval = randomItem(curriculum === 'beginner' ? BEGINNER_INTERVALS : ADVANCED_INTERVALS);
  const direction: PlaybackDirection = curriculum === 'beginner' || Math.random() < 0.5
    ? 'ascending'
    : 'descending';
  const semitones = INTERVAL_SEMITONES[interval];
  const firstMidi = direction === 'ascending'
    ? 48 + Math.floor(Math.random() * (72 - semitones - 48))
    : 60 + Math.floor(Math.random() * (72 - 60));
  const secondMidi = direction === 'ascending' ? firstMidi + semitones : firstMidi - semitones;
  return {
    id: ++questionIdCounter,
    type: 'interval-identification',
    firstMidi,
    secondMidi,
    correctInterval: interval,
    intervalDirection: direction
  };
}

export function generateChordQualityQuestion(): PracticeQuestion {
  const rootMidi = 48 + Math.floor(Math.random() * 12);
  const quality = randomItem<ChordQuality>(['major', 'minor']);
  return {
    id: ++questionIdCounter,
    type: 'chord-quality',
    correctChordQuality: quality,
    correctChordName: quality === 'major' ? '大三和弦' : '小三和弦',
    playbackMidiNotes: [
      rootMidi,
      rootMidi + (quality === 'major' ? 4 : 3),
      rootMidi + 7
    ]
  };
}

function generateNoteQuestion(
  type: PracticeType,
  tuning: Tuning,
  fretRange: FretRange
): PracticeQuestion {
  const range = FRET_RANGES[fretRange];
  const positions: Array<FretboardPosition & { midi: number }> = [];

  for (let string = 0; string < 6; string++) {
    const openMidi = tuning.strings[string];
    for (let fret = range.min; fret <= range.max; fret++) {
      const midi = openMidi + fret;
      if ([0, 2, 4, 5, 7, 9, 11].includes(midi % 12)) {
        positions.push({ string: string as StringIndex, fret, midi });
      }
    }
  }

  const position = positions[Math.floor(Math.random() * positions.length)]
    ?? { string: 2 as const, fret: 5, midi: 55 };

  return {
    id: ++questionIdCounter,
    type,
    midiNote: position.midi,
    correctNoteName: midiToNoteName(position.midi),
    correctPosition: { string: position.string, fret: position.fret },
    correctMidiNote: position.midi
  };
}

function generateChordQuestion(
  type: PracticeType,
  curriculum: ChordCurriculum
): PracticeQuestion {
  const pool = getChordPool(curriculum);
  const chord = pool[Math.floor(Math.random() * pool.length)];
  const firstFingering = chord.fingerings[0];

  return {
    id: ++questionIdCounter,
    type,
    chord,
    correctChordFingerings: chord.fingerings,
    correctChordPositions: getFingeringPositions(firstFingering),
    correctChordName: chord.name
  };
}

function generateNoteNamePositionQuestion(
  tuning: Tuning,
  range: PositionSearchRange
): PracticeQuestion {
  const candidates = NOTE_NAMES.map(noteName => ({
    noteName,
    positions: getPositionsForNoteName(noteName, tuning, range)
  })).filter(candidate => candidate.positions.length > 0);
  const candidate = candidates[Math.floor(Math.random() * candidates.length)] ?? candidates[0];

  return {
    id: ++questionIdCounter,
    type: 'note-name-to-all-positions',
    correctNoteName: candidate.noteName,
    correctPositions: candidate.positions
  };
}

export function generateQuestion(
  type: PracticeType,
  tuning: Tuning = STANDARD_TUNING,
  fretRange: FretRange = 'all',
  curriculum: ChordCurriculum = 'beginner',
  intervalCurriculum: IntervalCurriculum = 'beginner',
  samePitchCurriculum: SamePitchCurriculum = 'beginner'
): PracticeQuestion {
  switch (type) {
    case 'note-to-name-and-position':
    case 'position-to-name':
      return generateNoteQuestion(type, tuning, fretRange);
    case 'note-name-to-all-positions':
      return generateNoteNamePositionQuestion(
        tuning,
        fretRange === 'all' ? '1st' : fretRange
      );
    case 'chord-to-position':
    case 'position-to-chord':
    case 'listen-to-chord':
      return generateChordQuestion(type, curriculum);
    case 'pitch-direction':
      return generatePitchDirectionQuestion();
    case 'same-pitch-matching':
      return generateSamePitchMatchingQuestion(tuning, fretRange, samePitchCurriculum);
    case 'reference-pitch-to-position':
      return generateReferencePitchQuestion(tuning, fretRange);
    case 'interval-identification':
      return generateIntervalQuestion(intervalCurriculum);
    case 'chord-quality':
      return generateChordQualityQuestion();
  }
}

export function checkSamePitchMatchingAnswer(
  selected: FretboardPosition | null,
  targetMidi: number,
  tuning: Tuning
): boolean {
  return selected !== null && tuning.strings[selected.string] + selected.fret === targetMidi;
}

export function checkPitchDirectionAnswer(
  answer: PitchDirection,
  correct: PitchDirection
): boolean {
  return answer === correct;
}

export function checkIntervalAnswer(answer: IntervalId, correct: IntervalId): boolean {
  return answer === correct;
}

export function checkChordQualityAnswer(answer: ChordQuality, correct: ChordQuality): boolean {
  return answer === correct;
}

export function checkNoteNameAnswer(userAnswer: NoteName, correctAnswer: NoteName): boolean {
  return userAnswer === correctAnswer;
}

export function checkPositionAnswer(
  userPosition: FretboardPosition,
  correctMidiNote: number,
  tuning: Tuning
): boolean {
  return tuning.strings[userPosition.string] + userPosition.fret === correctMidiNote;
}

export function checkChordNameAnswer(userAnswer: string, correctAnswer: string): boolean {
  return userAnswer === correctAnswer;
}

export function checkChordPositionAnswer(
  userPositions: FretboardPosition[],
  acceptedFingerings: ChordFingering[]
): boolean {
  return checkChordFingeringAnswer(userPositions, acceptedFingerings);
}
