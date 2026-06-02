import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import type {
  Chord,
  ChordCurriculum,
  FretboardPosition
} from '../utils/chord';
import { formatChordFingering, getFingeringMidiNotes } from '../utils/chord';
import type { FretClick } from '../utils/fretboard';
import type { NoteName } from '../utils/note';
import type {
  FretRange,
  IntervalCurriculum,
  IntervalId,
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
  checkNoteNameAnswer,
  checkPitchDirectionAnswer,
  checkPositionAnswer,
  checkPositionSetAnswer,
  generateQuestion
} from '../utils/practice';
import type { Tuning } from '../utils/tuning';
import { STANDARD_TUNING } from '../utils/tuning';
import { usePracticeSummary } from './usePracticeSummary';

export interface CorrectAnswer {
  noteName?: NoteName;
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
  correctAnswer: CorrectAnswer | null;
  selectedNote: NoteName | null;
  selectedPosition: FretboardPosition | null;
  selectedChord: Chord | null;
  selectedChordPositions: FretboardPosition[];
  selectedNotePositions: FretboardPosition[];
}

type PracticeAction =
  | { type: 'start'; practiceType: PracticeType; question: PracticeQuestion }
  | { type: 'stop' }
  | { type: 'new-question'; question: PracticeQuestion }
  | { type: 'set-range'; range: FretRange; question?: PracticeQuestion }
  | { type: 'set-position-search-range'; range: PositionSearchRange; question: PracticeQuestion }
  | { type: 'set-curriculum'; curriculum: ChordCurriculum; question?: PracticeQuestion }
  | { type: 'set-interval-curriculum'; curriculum: IntervalCurriculum; question?: PracticeQuestion }
  | { type: 'select-note'; note: NoteName }
  | { type: 'select-position'; position: FretboardPosition }
  | { type: 'select-chord'; chord: Chord }
  | { type: 'toggle-chord-position'; position: FretboardPosition }
  | { type: 'toggle-note-position'; position: FretboardPosition }
  | { type: 'clear-chord-positions' }
  | { type: 'clear-note-positions' }
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
  correctAnswer: null,
  selectedNote: null,
  selectedPosition: null,
  selectedChord: null,
  selectedChordPositions: [],
  selectedNotePositions: []
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
    selectedNotePositions: []
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
        intervalCurriculum: state.intervalCurriculum
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
    intervalCurriculum = state.intervalCurriculum
  ) => generateQuestion(type, tuning, range, curriculum, intervalCurriculum), [
    state.fretRange,
    state.chordCurriculum,
    state.intervalCurriculum,
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
        : currentQuestion.type
    );
    dispatch({ type: 'submit-result', isCorrect, answer });
    if (isCorrect) scheduleNextQuestion();
  }, [recordAnswer, scheduleNextQuestion, state.intervalCurriculum]);

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
            state.intervalCurriculum
          )
        : undefined
    });
  }, [
    cancelScheduledQuestion,
    state.practiceType,
    state.chordCurriculum,
    state.intervalCurriculum,
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
            state.intervalCurriculum
          )
        : undefined
    });
  }, [
    cancelScheduledQuestion,
    state.practiceType,
    state.fretRange,
    state.intervalCurriculum,
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
            curriculum
          )
        : undefined
    });
  }, [
    cancelScheduledQuestion,
    state.practiceType,
    state.fretRange,
    state.chordCurriculum,
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

  const highlightedPositions = useMemo(() => {
    const question = state.question;
    if (!question) return [];
    if (state.feedback === 'wrong') {
      return state.correctAnswer?.positions
        ?? state.correctAnswer?.chordPositions
        ?? (state.correctAnswer?.position ? [state.correctAnswer.position] : []);
    }
    if (state.practiceType === 'position-to-name' && question.correctPosition) {
      return [question.correctPosition];
    }
    if (state.practiceType === 'position-to-chord') {
      return question.correctChordPositions ?? [];
    }
    if (state.practiceType === 'chord-to-position') {
      return state.selectedChordPositions;
    }
    if (state.practiceType === 'note-name-to-all-positions') {
      return state.selectedNotePositions;
    }
    if (state.practiceType === 'note-to-name-and-position' && state.selectedPosition) {
      return [state.selectedPosition];
    }
    if (state.practiceType === 'reference-pitch-to-position' && state.selectedPosition) {
      return [state.selectedPosition];
    }
    return [];
  }, [
    state.question,
    state.feedback,
    state.correctAnswer,
    state.practiceType,
    state.selectedChordPositions,
    state.selectedNotePositions,
    state.selectedPosition
  ]);

  const playbackMidiNotes = useMemo(() => {
    if (!state.question) return [];
    if (
      (state.practiceType === 'note-to-name-and-position'
        || state.practiceType === 'position-to-name'
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

  return {
    ...state,
    summary,
    highlightedPositions,
    playbackMidiNotes,
    playbackKind,
    startPractice,
    stopPractice,
    setFretRange,
    setPositionSearchRange,
    setChordCurriculum,
    setIntervalCurriculum,
    selectNote,
    selectChord,
    handleFretboardClick,
    clearChordPositions,
    clearNotePositions,
    submitNoteAndPosition,
    submitNoteName,
    submitChordPositions,
    submitChordName,
    submitNotePositions,
    submitPitchDirection,
    submitInterval,
    submitChordQuality,
    nextQuestion,
    clearSummary
  };
}

export type PracticeController = ReturnType<typeof usePractice>;
