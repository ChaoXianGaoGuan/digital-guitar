import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import type {
  Chord,
  ChordCurriculum,
  FretboardPosition
} from '../utils/chord';
import { formatChordFingering, getFingeringMidiNotes } from '../utils/chord';
import type { FretClick } from '../utils/fretboard';
import type { NoteName } from '../utils/note';
import type { MajorKey, MajorScalePatternId } from '../utils/majorScalePattern';
import type {
  FretRange,
  IntervalCurriculum,
  IntervalId,
  SamePitchCurriculum,
  ChordQuality,
  PitchDirection,
  PositionSearchRange,
  PracticeFeedback,
  PracticeQuestion,
  PracticeStats,
  PracticeType
} from '../utils/practice';
import {
  checkChordNameAnswer,
  checkChordPositionAnswer,
  checkChordQualityAnswer,
  checkIntervalAnswer,
  checkMajorScalePatternNoteAnswer,
  checkNoteNameAnswer,
  checkPitchDirectionAnswer,
  checkPositionAnswer,
  checkPositionSetAnswer,
  checkSamePitchMatchingAnswer,
  generateQuestion
} from '../utils/practice';
import type { Tuning } from '../utils/tuning';
import { STANDARD_TUNING } from '../utils/tuning';
import { usePracticeSummary } from './usePracticeSummary';

export interface CorrectAnswer {
  noteName?: NoteName;
  scaleNoteName?: string;
  position?: FretboardPosition;
  positions?: FretboardPosition[];
  selectedPositions?: FretboardPosition[];
  missingPositions?: FretboardPosition[];
  extraPositions?: FretboardPosition[];
  chordPositions?: FretboardPosition[];
  chordName?: string;
  fingering?: string;
  pitchDirection?: PitchDirection;
  interval?: IntervalId;
  chordQuality?: ChordQuality;
}

interface PracticeState {
  isActive: boolean;
  practiceType: PracticeType | null;
  question: PracticeQuestion | null;
  stats: PracticeStats;
  feedback: PracticeFeedback;
  fretRange: FretRange;
  positionSearchRange: PositionSearchRange;
  chordCurriculum: ChordCurriculum;
  intervalCurriculum: IntervalCurriculum;
  samePitchCurriculum: SamePitchCurriculum;
  majorKey: MajorKey;
  scalePatternId: MajorScalePatternId;
  correctAnswer: CorrectAnswer | null;
  selectedNote: NoteName | null;
  selectedPosition: FretboardPosition | null;
  selectedChord: Chord | null;
  selectedChordPositions: FretboardPosition[];
  selectedNotePositions: FretboardPosition[];
  selectedCandidatePosition: FretboardPosition | null;
}

type PracticeAction =
  | { type: 'start'; practiceType: PracticeType; question: PracticeQuestion }
  | { type: 'stop' }
  | { type: 'new-question'; question: PracticeQuestion }
  | { type: 'set-range'; range: FretRange; question?: PracticeQuestion }
  | { type: 'set-position-search-range'; range: PositionSearchRange; question: PracticeQuestion }
  | { type: 'set-curriculum'; curriculum: ChordCurriculum; question?: PracticeQuestion }
  | { type: 'set-interval-curriculum'; curriculum: IntervalCurriculum; question?: PracticeQuestion }
  | { type: 'set-same-pitch-curriculum'; curriculum: SamePitchCurriculum; question?: PracticeQuestion }
  | { type: 'set-major-key'; majorKey: MajorKey; question?: PracticeQuestion }
  | { type: 'set-scale-pattern'; patternId: MajorScalePatternId; question?: PracticeQuestion }
  | { type: 'select-note'; note: NoteName }
  | { type: 'select-position'; position: FretboardPosition }
  | { type: 'select-chord'; chord: Chord }
  | { type: 'toggle-chord-position'; position: FretboardPosition }
  | { type: 'toggle-note-position'; position: FretboardPosition }
  | { type: 'clear-chord-positions' }
  | { type: 'clear-note-positions' }
  | { type: 'toggle-candidate-position'; position: FretboardPosition }
  | { type: 'clear-candidate-position' }
  | { type: 'submit-result'; isCorrect: boolean; answer: CorrectAnswer };

const INITIAL_STATE: PracticeState = {
  isActive: false,
  practiceType: null,
  question: null,
  stats: { total: 0, correct: 0 },
  feedback: 'none',
  fretRange: 'all',
  positionSearchRange: '1st',
  chordCurriculum: 'beginner',
  intervalCurriculum: 'beginner',
  samePitchCurriculum: 'beginner',
  majorKey: 'C',
  scalePatternId: 'mi',
  correctAnswer: null,
  selectedNote: null,
  selectedPosition: null,
  selectedChord: null,
  selectedChordPositions: [],
  selectedNotePositions: [],
  selectedCandidatePosition: null
};

function withNewQuestion(state: PracticeState, question: PracticeQuestion): PracticeState {
  return {
    ...state,
    question,
    feedback: 'none',
    correctAnswer: null,
    selectedNote: null,
    selectedPosition: null,
    selectedChord: null,
    selectedChordPositions: [],
    selectedNotePositions: [],
    selectedCandidatePosition: null
  };
}

export function practiceReducer(state: PracticeState, action: PracticeAction): PracticeState {
  switch (action.type) {
    case 'start':
      return withNewQuestion({
        ...state,
        isActive: true,
        practiceType: action.practiceType,
        stats: { total: 0, correct: 0 },
        positionSearchRange: action.practiceType === 'note-name-to-all-positions'
          ? '1st'
          : state.positionSearchRange
      }, action.question);
    case 'stop':
      return {
        ...INITIAL_STATE,
        fretRange: state.fretRange,
        positionSearchRange: state.positionSearchRange,
        chordCurriculum: state.chordCurriculum,
        intervalCurriculum: state.intervalCurriculum,
        samePitchCurriculum: state.samePitchCurriculum,
        majorKey: state.majorKey,
        scalePatternId: state.scalePatternId
      };
    case 'new-question':
      return withNewQuestion(state, action.question);
    case 'set-range':
      return action.question
        ? withNewQuestion({ ...state, fretRange: action.range }, action.question)
        : { ...state, fretRange: action.range };
    case 'set-position-search-range':
      return withNewQuestion({ ...state, positionSearchRange: action.range }, action.question);
    case 'set-curriculum':
      return action.question
        ? withNewQuestion({ ...state, chordCurriculum: action.curriculum }, action.question)
        : { ...state, chordCurriculum: action.curriculum };
    case 'set-interval-curriculum':
      return action.question
        ? withNewQuestion({ ...state, intervalCurriculum: action.curriculum }, action.question)
        : { ...state, intervalCurriculum: action.curriculum };
    case 'set-same-pitch-curriculum':
      return action.question
        ? withNewQuestion({ ...state, samePitchCurriculum: action.curriculum }, action.question)
        : { ...state, samePitchCurriculum: action.curriculum };
    case 'set-major-key':
      return action.question
        ? withNewQuestion({ ...state, majorKey: action.majorKey }, action.question)
        : { ...state, majorKey: action.majorKey };
    case 'set-scale-pattern':
      return action.question
        ? withNewQuestion({ ...state, scalePatternId: action.patternId }, action.question)
        : { ...state, scalePatternId: action.patternId };
    case 'select-note':
      return state.feedback === 'none' ? { ...state, selectedNote: action.note } : state;
    case 'select-position':
      return state.feedback === 'none' ? { ...state, selectedPosition: action.position } : state;
    case 'select-chord':
      return state.feedback === 'none' ? { ...state, selectedChord: action.chord } : state;
    case 'toggle-chord-position': {
      if (state.feedback !== 'none') return state;
      const exactMatch = state.selectedChordPositions.some(position => (
        position.string === action.position.string && position.fret === action.position.fret
      ));
      return {
        ...state,
        selectedChordPositions: exactMatch
          ? state.selectedChordPositions.filter(position => (
              position.string !== action.position.string || position.fret !== action.position.fret
            ))
          : [
              ...state.selectedChordPositions.filter(position => position.string !== action.position.string),
              action.position
            ]
      };
    }
    case 'toggle-note-position': {
      if (state.feedback !== 'none') return state;
      const exactMatch = state.selectedNotePositions.some(position => (
        position.string === action.position.string && position.fret === action.position.fret
      ));
      return {
        ...state,
        selectedNotePositions: exactMatch
          ? state.selectedNotePositions.filter(position => (
              position.string !== action.position.string || position.fret !== action.position.fret
            ))
          : [...state.selectedNotePositions, action.position]
      };
    }
    case 'clear-chord-positions':
      return state.feedback === 'none' ? { ...state, selectedChordPositions: [] } : state;
    case 'clear-note-positions':
      return state.feedback === 'none' ? { ...state, selectedNotePositions: [] } : state;
    case 'toggle-candidate-position':
      if (state.feedback !== 'none') return state;
      return {
        ...state,
        selectedCandidatePosition: state.selectedCandidatePosition?.string === action.position.string
          && state.selectedCandidatePosition.fret === action.position.fret
          ? null
          : action.position
      };
    case 'clear-candidate-position':
      return state.feedback === 'none' ? { ...state, selectedCandidatePosition: null } : state;
    case 'submit-result':
      if (state.feedback !== 'none') return state;
      return {
        ...state,
        feedback: action.isCorrect ? 'correct' : 'wrong',
        correctAnswer: action.isCorrect ? null : action.answer,
        stats: {
          total: state.stats.total + 1,
          correct: state.stats.correct + (action.isCorrect ? 1 : 0)
        }
      };
  }
}

function getQuestionPrompt(question: PracticeQuestion): string {
  if (question.type === 'pitch-direction') return '高低比较';
  if (question.type === 'interval-identification') return '音程听辨';
  if (question.type === 'chord-quality') return '大三 / 小三和弦辨别';
  if (question.type === 'same-pitch-matching') return `MIDI ${question.targetMidi}`;
  if (question.type === 'major-scale-pattern-note-name') {
    return `${question.majorKey ?? ''} ${question.scalePattern?.name ?? ''}`;
  }
  if (question.chord) return question.chord.name;
  if (question.midiNote !== undefined) return `MIDI ${question.midiNote}`;
  if (question.correctNoteName) return question.correctNoteName;
  return question.type;
}

function getCorrectAnswerText(question: PracticeQuestion): string {
  return question.correctChordName
    ?? question.correctNoteName
    ?? question.correctPitchDirection
    ?? question.correctInterval
    ?? question.correctScaleNoteName
    ?? (question.targetMidi !== undefined ? `MIDI ${question.targetMidi}` : undefined)
    ?? '';
}

export function usePractice(tuning: Tuning = STANDARD_TUNING) {
  const [state, dispatch] = useReducer(practiceReducer, INITIAL_STATE);
  const nextQuestionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canSubmitRef = useRef(false);
  const { summary, recordAnswer, clearSummary } = usePracticeSummary();

  const cancelScheduledQuestion = useCallback(() => {
    if (nextQuestionTimerRef.current) {
      clearTimeout(nextQuestionTimerRef.current);
      nextQuestionTimerRef.current = null;
    }
  }, []);

  useEffect(() => cancelScheduledQuestion, [cancelScheduledQuestion]);

  const createQuestion = useCallback((
    type: PracticeType,
    range = state.fretRange,
    curriculum = state.chordCurriculum,
    intervalCurriculum = state.intervalCurriculum,
    samePitchCurriculum = state.samePitchCurriculum,
    majorKey = state.majorKey,
    scalePatternId = state.scalePatternId
  ) => generateQuestion(
    type,
    tuning,
    range,
    curriculum,
    intervalCurriculum,
    samePitchCurriculum,
    majorKey,
    scalePatternId
  ), [
    state.fretRange,
    state.chordCurriculum,
    state.intervalCurriculum,
    state.samePitchCurriculum,
    state.majorKey,
    state.scalePatternId,
    tuning
  ]);

  const startPractice = useCallback((type: PracticeType) => {
    cancelScheduledQuestion();
    canSubmitRef.current = true;
    dispatch({
      type: 'start',
      practiceType: type,
      question: type === 'note-name-to-all-positions'
        ? generateQuestion(type, tuning, '1st')
        : createQuestion(type)
    });
  }, [cancelScheduledQuestion, createQuestion, tuning]);

  const stopPractice = useCallback(() => {
    cancelScheduledQuestion();
    canSubmitRef.current = false;
    dispatch({ type: 'stop' });
  }, [cancelScheduledQuestion]);

  const nextQuestion = useCallback(() => {
    if (!state.practiceType) return;
    cancelScheduledQuestion();
    canSubmitRef.current = true;
    dispatch({
      type: 'new-question',
      question: state.practiceType === 'note-name-to-all-positions'
        ? generateQuestion(state.practiceType, tuning, state.positionSearchRange)
        : createQuestion(state.practiceType)
    });
  }, [
    cancelScheduledQuestion,
    createQuestion,
    state.practiceType,
    state.positionSearchRange,
    tuning
  ]);

  const scheduleNextQuestion = useCallback(() => {
    cancelScheduledQuestion();
    nextQuestionTimerRef.current = setTimeout(() => {
      nextQuestionTimerRef.current = null;
      nextQuestion();
    }, 500);
  }, [cancelScheduledQuestion, nextQuestion]);

  const handleResult = useCallback((
    isCorrect: boolean,
    currentQuestion: PracticeQuestion,
    answer: CorrectAnswer
  ) => {
    if (!canSubmitRef.current) return;
    canSubmitRef.current = false;
    recordAnswer(
      currentQuestion.type,
      getQuestionPrompt(currentQuestion),
      getCorrectAnswerText(currentQuestion),
      isCorrect,
      currentQuestion.type === 'interval-identification'
        ? `interval-identification:${state.intervalCurriculum}`
        : currentQuestion.type === 'same-pitch-matching'
          ? `same-pitch-matching:${state.samePitchCurriculum}`
          : currentQuestion.type
    );
    dispatch({ type: 'submit-result', isCorrect, answer });
    if (isCorrect) scheduleNextQuestion();
  }, [recordAnswer, scheduleNextQuestion, state.intervalCurriculum, state.samePitchCurriculum]);

  const setFretRange = useCallback((range: FretRange) => {
    cancelScheduledQuestion();
    canSubmitRef.current = state.practiceType !== null;
    dispatch({
      type: 'set-range',
      range,
      question: state.practiceType
        ? generateQuestion(
            state.practiceType,
            tuning,
            range,
            state.chordCurriculum,
            state.intervalCurriculum,
            state.samePitchCurriculum,
            state.majorKey,
            state.scalePatternId
          )
        : undefined
    });
  }, [
    cancelScheduledQuestion,
    state.practiceType,
    state.chordCurriculum,
    state.intervalCurriculum,
    state.samePitchCurriculum,
    state.majorKey,
    state.scalePatternId,
    tuning
  ]);

  const setPositionSearchRange = useCallback((range: PositionSearchRange) => {
    cancelScheduledQuestion();
    canSubmitRef.current = state.practiceType !== null;
    dispatch({
      type: 'set-position-search-range',
      range,
      question: generateQuestion('note-name-to-all-positions', tuning, range)
    });
  }, [cancelScheduledQuestion, state.practiceType, tuning]);

  const setChordCurriculum = useCallback((curriculum: ChordCurriculum) => {
    cancelScheduledQuestion();
    canSubmitRef.current = state.practiceType !== null;
    dispatch({
      type: 'set-curriculum',
      curriculum,
      question: state.practiceType
        ? generateQuestion(
            state.practiceType,
            tuning,
            state.fretRange,
            curriculum,
            state.intervalCurriculum,
            state.samePitchCurriculum,
            state.majorKey,
            state.scalePatternId
          )
        : undefined
    });
  }, [
    cancelScheduledQuestion,
    state.practiceType,
    state.fretRange,
    state.intervalCurriculum,
    state.samePitchCurriculum,
    state.majorKey,
    state.scalePatternId,
    tuning
  ]);

  const setIntervalCurriculum = useCallback((curriculum: IntervalCurriculum) => {
    cancelScheduledQuestion();
    canSubmitRef.current = state.practiceType !== null;
    dispatch({
      type: 'set-interval-curriculum',
      curriculum,
      question: state.practiceType
        ? generateQuestion(
            state.practiceType,
            tuning,
            state.fretRange,
            state.chordCurriculum,
            curriculum,
            state.samePitchCurriculum,
            state.majorKey,
            state.scalePatternId
          )
        : undefined
    });
  }, [
    cancelScheduledQuestion,
    state.practiceType,
    state.fretRange,
    state.chordCurriculum,
    state.samePitchCurriculum,
    state.majorKey,
    state.scalePatternId,
    tuning
  ]);

  const setSamePitchCurriculum = useCallback((curriculum: SamePitchCurriculum) => {
    cancelScheduledQuestion();
    canSubmitRef.current = state.practiceType !== null;
    dispatch({
      type: 'set-same-pitch-curriculum',
      curriculum,
      question: state.practiceType
        ? generateQuestion(
            state.practiceType,
            tuning,
            state.fretRange,
            state.chordCurriculum,
            state.intervalCurriculum,
            curriculum,
            state.majorKey,
            state.scalePatternId
          )
        : undefined
    });
  }, [
    cancelScheduledQuestion,
    state.practiceType,
    state.fretRange,
    state.chordCurriculum,
    state.intervalCurriculum,
    state.majorKey,
    state.scalePatternId,
    tuning
  ]);

  const setMajorKey = useCallback((majorKey: MajorKey) => {
    cancelScheduledQuestion();
    canSubmitRef.current = state.practiceType !== null;
    dispatch({
      type: 'set-major-key',
      majorKey,
      question: state.practiceType
        ? generateQuestion(
            state.practiceType,
            tuning,
            state.fretRange,
            state.chordCurriculum,
            state.intervalCurriculum,
            state.samePitchCurriculum,
            majorKey,
            state.scalePatternId
          )
        : undefined
    });
  }, [
    cancelScheduledQuestion,
    state.practiceType,
    state.fretRange,
    state.chordCurriculum,
    state.intervalCurriculum,
    state.samePitchCurriculum,
    state.scalePatternId,
    tuning
  ]);

  const setScalePattern = useCallback((patternId: MajorScalePatternId) => {
    cancelScheduledQuestion();
    canSubmitRef.current = state.practiceType !== null;
    dispatch({
      type: 'set-scale-pattern',
      patternId,
      question: state.practiceType
        ? generateQuestion(
            state.practiceType,
            tuning,
            state.fretRange,
            state.chordCurriculum,
            state.intervalCurriculum,
            state.samePitchCurriculum,
            state.majorKey,
            patternId
          )
        : undefined
    });
  }, [
    cancelScheduledQuestion,
    state.practiceType,
    state.fretRange,
    state.chordCurriculum,
    state.intervalCurriculum,
    state.samePitchCurriculum,
    state.majorKey,
    tuning
  ]);

  const submitPitchDirection = useCallback((answer: PitchDirection) => {
    const question = state.question;
    if (
      state.feedback !== 'none'
      || !question?.correctPitchDirection
      || state.practiceType !== 'pitch-direction'
    ) return;
    handleResult(
      checkPitchDirectionAnswer(answer, question.correctPitchDirection),
      question,
      { pitchDirection: question.correctPitchDirection }
    );
  }, [state.feedback, state.question, state.practiceType, handleResult]);

  const submitInterval = useCallback((answer: IntervalId) => {
    const question = state.question;
    if (
      state.feedback !== 'none'
      || !question?.correctInterval
      || state.practiceType !== 'interval-identification'
    ) return;
    handleResult(
      checkIntervalAnswer(answer, question.correctInterval),
      question,
      { interval: question.correctInterval }
    );
  }, [state.feedback, state.question, state.practiceType, handleResult]);

  const submitChordQuality = useCallback((answer: ChordQuality) => {
    const question = state.question;
    if (
      state.feedback !== 'none'
      || !question?.correctChordQuality
      || state.practiceType !== 'chord-quality'
    ) return;
    handleResult(
      checkChordQualityAnswer(answer, question.correctChordQuality),
      question,
      { chordQuality: question.correctChordQuality }
    );
  }, [state.feedback, state.question, state.practiceType, handleResult]);

  const submitReferencePosition = useCallback((position: FretboardPosition) => {
    const question = state.question;
    if (
      state.feedback !== 'none'
      || question?.correctMidiNote === undefined
      || state.practiceType !== 'reference-pitch-to-position'
    ) return;
    handleResult(
      checkPositionAnswer(position, question.correctMidiNote, tuning),
      question,
      { position: question.correctPosition }
    );
  }, [state.feedback, state.question, state.practiceType, tuning, handleResult]);

  const submitSamePitchMatch = useCallback((position = state.selectedCandidatePosition) => {
    const question = state.question;
    if (
      state.feedback !== 'none'
      || question?.targetMidi === undefined
      || state.practiceType !== 'same-pitch-matching'
    ) return;
    handleResult(
      checkSamePitchMatchingAnswer(position, question.targetMidi, tuning),
      question,
      { position: question.correctPosition }
    );
  }, [
    state.feedback,
    state.question,
    state.practiceType,
    state.selectedCandidatePosition,
    tuning,
    handleResult
  ]);

  const submitNoteAndPosition = useCallback((
    name: NoteName,
    position: FretboardPosition
  ) => {
    const question = state.question;
    if (
      state.feedback !== 'none'
      || question?.correctMidiNote === undefined
      || !question.correctNoteName
      || state.practiceType !== 'note-to-name-and-position'
    ) return;

    handleResult(
      checkNoteNameAnswer(name, question.correctNoteName)
        && checkPositionAnswer(position, question.correctMidiNote, tuning),
      question,
      { noteName: question.correctNoteName, position: question.correctPosition }
    );
  }, [state.feedback, state.question, state.practiceType, tuning, handleResult]);

  const submitNoteName = useCallback((name: NoteName) => {
    const question = state.question;
    if (
      state.feedback !== 'none'
      || !question?.correctNoteName
      || state.practiceType !== 'position-to-name'
    ) return;

    handleResult(
      checkNoteNameAnswer(name, question.correctNoteName),
      question,
      { noteName: question.correctNoteName, position: question.correctPosition }
    );
  }, [state.feedback, state.question, state.practiceType, handleResult]);

  const submitMajorScalePatternNoteName = useCallback((name: string) => {
    const question = state.question;
    if (
      state.feedback !== 'none'
      || !question?.correctScaleNoteName
      || state.practiceType !== 'major-scale-pattern-note-name'
    ) return;

    handleResult(
      checkMajorScalePatternNoteAnswer(name, question.correctScaleNoteName),
      question,
      { scaleNoteName: question.correctScaleNoteName, position: question.correctPosition }
    );
  }, [state.feedback, state.question, state.practiceType, handleResult]);

  const submitChordPositions = useCallback((positions = state.selectedChordPositions) => {
    const question = state.question;
    if (
      state.feedback !== 'none'
      || !question?.correctChordFingerings
      || state.practiceType !== 'chord-to-position'
    ) return;

    handleResult(
      checkChordPositionAnswer(positions, question.correctChordFingerings),
      question,
      {
        chordName: question.correctChordName,
        chordPositions: question.correctChordPositions,
        fingering: formatChordFingering(question.correctChordFingerings[0])
      }
    );
  }, [
    state.feedback,
    state.question,
    state.practiceType,
    state.selectedChordPositions,
    handleResult
  ]);

  const submitChordName = useCallback((name: string) => {
    const question = state.question;
    if (
      state.feedback !== 'none'
      || !question?.correctChordName
      || !question.correctChordFingerings
      || (state.practiceType !== 'position-to-chord' && state.practiceType !== 'listen-to-chord')
    ) return;

    handleResult(
      checkChordNameAnswer(name, question.correctChordName),
      question,
      {
        chordName: question.correctChordName,
        chordPositions: question.correctChordPositions,
        fingering: formatChordFingering(question.correctChordFingerings[0])
      }
    );
  }, [state.feedback, state.question, state.practiceType, handleResult]);

  const submitNotePositions = useCallback((positions = state.selectedNotePositions) => {
    const question = state.question;
    if (
      state.feedback !== 'none'
      || !question?.correctPositions
      || !question.correctNoteName
      || state.practiceType !== 'note-name-to-all-positions'
    ) return;

    const missingPositions = question.correctPositions.filter(correct => (
      !positions.some(position => position.string === correct.string && position.fret === correct.fret)
    ));
    const extraPositions = positions.filter(position => (
      !question.correctPositions!.some(correct => (
        position.string === correct.string && position.fret === correct.fret
      ))
    ));
    handleResult(
      checkPositionSetAnswer(positions, question.correctPositions),
      question,
      {
        noteName: question.correctNoteName,
        positions: question.correctPositions,
        selectedPositions: positions,
        missingPositions,
        extraPositions
      }
    );
  }, [
    state.feedback,
    state.question,
    state.practiceType,
    state.selectedNotePositions,
    handleResult
  ]);

  const selectNote = useCallback((note: NoteName) => {
    if (state.feedback !== 'none') return;
    dispatch({ type: 'select-note', note });
    if (state.practiceType === 'note-to-name-and-position' && state.selectedPosition) {
      submitNoteAndPosition(note, state.selectedPosition);
    } else if (state.practiceType === 'position-to-name') {
      submitNoteName(note);
    }
  }, [
    state.feedback,
    state.practiceType,
    state.selectedPosition,
    submitNoteAndPosition,
    submitNoteName
  ]);

  const selectChord = useCallback((chord: Chord) => {
    if (state.feedback !== 'none') return;
    dispatch({ type: 'select-chord', chord });
    submitChordName(chord.name);
  }, [state.feedback, submitChordName]);

  const handleFretboardClick = useCallback((click: FretClick): boolean => {
    if (state.feedback !== 'none') return false;

    if (state.practiceType === 'note-to-name-and-position') {
      dispatch({ type: 'select-position', position: click.position });
      if (state.selectedNote) submitNoteAndPosition(state.selectedNote, click.position);
      return true;
    }

    if (state.practiceType === 'reference-pitch-to-position') {
      dispatch({ type: 'select-position', position: click.position });
      submitReferencePosition(click.position);
      return true;
    }

    if (state.practiceType === 'same-pitch-matching') {
      const isCandidate = state.question?.candidatePositions?.some(position => (
        position.string === click.position.string && position.fret === click.position.fret
      ));
      if (!isCandidate) return false;
      dispatch({ type: 'toggle-candidate-position', position: click.position });
      return true;
    }

    if (state.practiceType === 'major-scale-pattern-note-name') {
      return false;
    }

    if (state.practiceType === 'chord-to-position') {
      dispatch({ type: 'toggle-chord-position', position: click.position });
      return true;
    }

    if (state.practiceType === 'note-name-to-all-positions') {
      dispatch({ type: 'toggle-note-position', position: click.position });
      return true;
    }

    return false;
  }, [
    state.feedback,
    state.practiceType,
    state.question?.candidatePositions,
    state.selectedNote,
    submitNoteAndPosition,
    submitReferencePosition
  ]);

  const clearChordPositions = useCallback(() => {
    dispatch({ type: 'clear-chord-positions' });
  }, []);

  const clearNotePositions = useCallback(() => {
    dispatch({ type: 'clear-note-positions' });
  }, []);

  const fretHighlights = useMemo(() => {
    const question = state.question;
    if (!question) return [];
    if (state.practiceType === 'same-pitch-matching') {
      return [
        ...(question.candidatePositions ?? []).map(position => ({ position, tone: 'prompt' as const })),
        ...(state.selectedCandidatePosition
          ? [{ position: state.selectedCandidatePosition, tone: 'selected' as const }]
          : []),
        ...(state.feedback === 'wrong' && state.correctAnswer?.position
          ? [{ position: state.correctAnswer.position, tone: 'correct' as const }]
          : [])
      ];
    }
    if (state.practiceType === 'major-scale-pattern-note-name') {
      return [
        ...(question.scalePatternPositions ?? []).map(position => ({ position, tone: 'area' as const })),
        ...(question.correctPosition ? [{ position: question.correctPosition, tone: 'prompt' as const }] : []),
        ...(state.feedback === 'wrong' && state.correctAnswer?.position
          ? [{ position: state.correctAnswer.position, tone: 'correct' as const }]
          : [])
      ];
    }
    if (state.feedback === 'wrong') {
      const positions = state.correctAnswer?.positions
        ?? state.correctAnswer?.chordPositions
        ?? (state.correctAnswer?.position ? [state.correctAnswer.position] : []);
      return positions.map(position => ({ position, tone: 'correct' as const }));
    }
    if (state.practiceType === 'position-to-name' && question.correctPosition) {
      return [{ position: question.correctPosition, tone: 'prompt' as const }];
    }
    if (state.practiceType === 'position-to-chord') {
      return (question.correctChordPositions ?? []).map(position => ({ position, tone: 'prompt' as const }));
    }
    if (state.practiceType === 'chord-to-position') {
      return state.selectedChordPositions.map(position => ({ position, tone: 'selected' as const }));
    }
    if (state.practiceType === 'note-name-to-all-positions') {
      return state.selectedNotePositions.map(position => ({ position, tone: 'selected' as const }));
    }
    if (state.practiceType === 'note-to-name-and-position' && state.selectedPosition) {
      return [{ position: state.selectedPosition, tone: 'selected' as const }];
    }
    if (state.practiceType === 'reference-pitch-to-position' && state.selectedPosition) {
      return [{ position: state.selectedPosition, tone: 'selected' as const }];
    }
    return [];
  }, [
    state.question,
    state.feedback,
    state.correctAnswer,
    state.practiceType,
    state.selectedChordPositions,
    state.selectedNotePositions,
    state.selectedPosition,
    state.selectedCandidatePosition
  ]);

  const playbackMidiNotes = useMemo(() => {
    if (!state.question) return [];
    if (
      (state.practiceType === 'note-to-name-and-position'
        || state.practiceType === 'position-to-name'
        || state.practiceType === 'same-pitch-matching'
        || state.practiceType === 'reference-pitch-to-position')
      && state.question.midiNote !== undefined
    ) {
      return [state.question.midiNote];
    }
    if (
      (state.practiceType === 'pitch-direction' || state.practiceType === 'interval-identification')
      && state.question.firstMidi !== undefined
      && state.question.secondMidi !== undefined
    ) {
      return [state.question.firstMidi, state.question.secondMidi];
    }
    if (state.practiceType === 'chord-quality') {
      return state.question.playbackMidiNotes ?? [];
    }
    if (state.practiceType === 'listen-to-chord' && state.question.correctChordFingerings) {
      return getFingeringMidiNotes(state.question.correctChordFingerings[0], tuning);
    }
    return [];
  }, [state.practiceType, state.question, tuning]);

  const playbackKind = useMemo(() => {
    if (state.practiceType === 'pitch-direction' || state.practiceType === 'interval-identification') {
      return 'sequence';
    }
    if (state.practiceType === 'listen-to-chord' || state.practiceType === 'chord-quality') {
      return 'chord';
    }
    return 'note';
  }, [state.practiceType]);

  const highlightedPositions = useMemo(
    () => fretHighlights.map(highlight => highlight.position),
    [fretHighlights]
  );

  return {
    ...state,
    summary,
    fretHighlights,
    highlightedPositions,
    playbackMidiNotes,
    playbackKind,
    startPractice,
    stopPractice,
    setFretRange,
    setPositionSearchRange,
    setChordCurriculum,
    setIntervalCurriculum,
    setSamePitchCurriculum,
    setMajorKey,
    setScalePattern,
    selectNote,
    selectChord,
    handleFretboardClick,
    clearChordPositions,
    clearNotePositions,
    clearCandidatePosition: () => dispatch({ type: 'clear-candidate-position' }),
    submitNoteAndPosition,
    submitNoteName,
    submitChordPositions,
    submitChordName,
    submitNotePositions,
    submitPitchDirection,
    submitInterval,
    submitChordQuality,
    submitSamePitchMatch,
    submitMajorScalePatternNoteName,
    nextQuestion,
    clearSummary
  };
}

export type PracticeController = ReturnType<typeof usePractice>;
