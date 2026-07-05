import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePractice } from '../hooks/usePractice';
import { STANDARD_TUNING } from '../utils/tuning';

describe('usePractice', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('does not count repeated submissions after feedback appears', () => {
    const { result } = renderHook(() => usePractice());
    act(() => result.current.startPractice('position-to-name'));
    const correct = result.current.question?.correctNoteName;
    expect(correct).toBeDefined();

    act(() => result.current.submitNoteName(correct!));
    act(() => result.current.submitNoteName(correct!));
    expect(result.current.stats).toEqual({ total: 1, correct: 1 });
  });

  it('cancels an automatic next question when practice stops', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => usePractice());
    act(() => result.current.startPractice('position-to-name'));

    act(() => result.current.submitNoteName(result.current.question!.correctNoteName!));
    expect(result.current.feedback).toBe('correct');

    act(() => result.current.stopPractice());
    act(() => vi.advanceTimersByTime(500));
    expect(result.current.question).toBeNull();
  });

  it('regenerates note questions when the fret range changes', () => {
    const { result } = renderHook(() => usePractice());
    act(() => result.current.startPractice('position-to-name'));
    act(() => result.current.setFretRange('3rd'));
    expect(result.current.question?.correctPosition?.fret).toBeGreaterThanOrEqual(9);
    expect(result.current.question?.correctPosition?.fret).toBeLessThanOrEqual(12);
  });

  it('cancels an automatic next question when the fret range changes', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => usePractice());
    act(() => result.current.startPractice('position-to-name'));
    act(() => result.current.submitNoteName(result.current.question!.correctNoteName!));
    act(() => result.current.setFretRange('3rd'));
    const replacementId = result.current.question?.id;

    act(() => vi.advanceTimersByTime(500));
    expect(result.current.question?.id).toBe(replacementId);
  });

  it('selects and cancels open strings before a manual chord submission', () => {
    const { result } = renderHook(() => usePractice());
    act(() => result.current.startPractice('chord-to-position'));
    const positions = result.current.question!.correctChordPositions!;
    const openPosition = positions.find(position => position.fret === 0)!;
    const openMidi = STANDARD_TUNING.strings[openPosition.string];

    act(() => {
      result.current.handleFretboardClick({ position: openPosition, midi: openMidi });
    });
    expect(result.current.highlightedPositions).toContainEqual(openPosition);
    expect(result.current.stats.total).toBe(0);

    act(() => {
      result.current.handleFretboardClick({ position: openPosition, midi: openMidi });
    });
    expect(result.current.highlightedPositions).not.toContainEqual(openPosition);

    act(() => {
      for (const position of positions) {
        result.current.handleFretboardClick({
          position,
          midi: STANDARD_TUNING.strings[position.string] + position.fret
        });
      }
    });
    expect(result.current.stats.total).toBe(0);
    act(() => result.current.submitChordPositions());
    expect(result.current.stats).toEqual({ total: 1, correct: 1 });
  });

  it('ignores fretboard clicks in a read-only position question', () => {
    const { result } = renderHook(() => usePractice());
    act(() => result.current.startPractice('position-to-name'));
    let handled = true;
    act(() => {
      handled = result.current.handleFretboardClick({
        position: { string: 0, fret: 0 },
        midi: 40
      });
    });
    expect(handled).toBe(false);
  });

  it('exposes the highlighted position MIDI for position-to-name playback', () => {
    const { result } = renderHook(() => usePractice());
    act(() => result.current.startPractice('position-to-name'));
    expect(result.current.playbackKind).toBe('note');
    expect(result.current.playbackMidiNotes).toEqual([result.current.question?.midiNote]);
  });

  it('highlights the correct chord fingering, including open strings, after a wrong answer', () => {
    const { result } = renderHook(() => usePractice());
    act(() => result.current.startPractice('chord-to-position'));
    act(() => {
      result.current.handleFretboardClick({
        position: { string: 0, fret: 15 },
        midi: 55
      });
      result.current.submitChordPositions([{ string: 0, fret: 15 }]);
    });

    expect(result.current.feedback).toBe('wrong');
    expect(result.current.highlightedPositions).toEqual(result.current.question?.correctChordPositions);
    expect(result.current.highlightedPositions.some(position => position.fret === 0)).toBe(true);
  });

  it('accepts a matching MIDI position in the listen-note exercise', () => {
    const { result } = renderHook(() => usePractice());
    act(() => result.current.startPractice('note-to-name-and-position'));
    const question = result.current.question!;
    act(() => result.current.selectNote(question.correctNoteName!));
    act(() => {
      result.current.handleFretboardClick({
        position: question.correctPosition!,
        midi: question.correctMidiNote!
      });
    });
    expect(result.current.stats).toEqual({ total: 1, correct: 1 });
  });

  it('submits names for both chord-name exercise variants', () => {
    const positionQuestion = renderHook(() => usePractice());
    act(() => positionQuestion.result.current.startPractice('position-to-chord'));
    act(() => {
      positionQuestion.result.current.submitChordName(
        positionQuestion.result.current.question!.correctChordName!
      );
    });
    expect(positionQuestion.result.current.stats).toEqual({ total: 1, correct: 1 });

    const listeningQuestion = renderHook(() => usePractice());
    act(() => listeningQuestion.result.current.startPractice('listen-to-chord'));
    expect(listeningQuestion.result.current.playbackMidiNotes.length).toBeGreaterThan(0);
    act(() => {
      listeningQuestion.result.current.submitChordName(
        listeningQuestion.result.current.question!.correctChordName!
      );
    });
    expect(listeningQuestion.result.current.stats).toEqual({ total: 1, correct: 1 });
  });

  it('cancels an automatic next question when switching exercise type', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => usePractice());
    act(() => result.current.startPractice('position-to-name'));
    act(() => result.current.submitNoteName(result.current.question!.correctNoteName!));
    act(() => result.current.startPractice('position-to-chord'));
    const replacementId = result.current.question?.id;

    act(() => vi.advanceTimersByTime(500));
    expect(result.current.practiceType).toBe('position-to-chord');
    expect(result.current.question?.id).toBe(replacementId);
  });

  it('selects, cancels, clears and manually submits all matching note-name positions', () => {
    const { result } = renderHook(() => usePractice());
    act(() => result.current.startPractice('note-name-to-all-positions'));
    const positions = result.current.question!.correctPositions!;
    const first = positions[0];

    expect(result.current.positionSearchRange).toBe('1st');
    act(() => {
      result.current.handleFretboardClick({
        position: first,
        midi: STANDARD_TUNING.strings[first.string] + first.fret
      });
    });
    expect(result.current.highlightedPositions).toContainEqual(first);
    expect(result.current.stats.total).toBe(0);

    act(() => {
      result.current.handleFretboardClick({
        position: first,
        midi: STANDARD_TUNING.strings[first.string] + first.fret
      });
    });
    expect(result.current.highlightedPositions).not.toContainEqual(first);

    act(() => {
      for (const position of positions) {
        result.current.handleFretboardClick({
          position,
          midi: STANDARD_TUNING.strings[position.string] + position.fret
        });
      }
      result.current.clearNotePositions();
    });
    expect(result.current.highlightedPositions).toEqual([]);

    act(() => {
      for (const position of positions) {
        result.current.handleFretboardClick({
          position,
          midi: STANDARD_TUNING.strings[position.string] + position.fret
        });
      }
    });
    expect(result.current.stats.total).toBe(0);
    act(() => result.current.submitNotePositions());
    act(() => result.current.submitNotePositions());
    expect(result.current.stats).toEqual({ total: 1, correct: 1 });
  });

  it('regenerates the note-name position question when its range changes', () => {
    const { result } = renderHook(() => usePractice());
    act(() => result.current.startPractice('note-name-to-all-positions'));
    act(() => result.current.setPositionSearchRange('3rd'));
    expect(result.current.positionSearchRange).toBe('3rd');
    expect(result.current.question?.correctPositions?.every(position => (
      position.fret >= 9 && position.fret <= 12
    ))).toBe(true);
  });

  it('cancels an automatic next question when its focused range changes', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => usePractice());
    act(() => result.current.startPractice('note-name-to-all-positions'));
    act(() => result.current.submitNotePositions(result.current.question!.correctPositions!));
    act(() => result.current.setPositionSearchRange('2nd'));
    const replacementId = result.current.question?.id;

    act(() => vi.advanceTimersByTime(500));
    expect(result.current.question?.id).toBe(replacementId);
  });

  it('highlights every correct note-name position after a wrong submission', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.3); // E includes open strings in the first position.
    const { result } = renderHook(() => usePractice());
    act(() => result.current.startPractice('note-name-to-all-positions'));
    act(() => result.current.submitNotePositions([]));
    expect(result.current.feedback).toBe('wrong');
    expect(result.current.highlightedPositions).toEqual(result.current.question?.correctPositions);
    expect(result.current.highlightedPositions.some(position => position.fret === 0)).toBe(true);
  });

  it('explains missing and extra positions after an all-position mistake', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.2); // D: 4弦空弦、2弦3品.
    const { result } = renderHook(() => usePractice());
    act(() => result.current.startPractice('note-name-to-all-positions'));
    const correct = result.current.question!.correctPositions!;
    expect(correct).toEqual([
      { string: 2, fret: 0 },
      { string: 4, fret: 3 }
    ]);

    act(() => result.current.submitNotePositions([{ string: 2, fret: 0 }, { string: 1, fret: 5 }]));
    expect(result.current.correctAnswer?.selectedPositions).toEqual([
      { string: 2, fret: 0 },
      { string: 1, fret: 5 }
    ]);
    expect(result.current.correctAnswer?.missingPositions).toEqual([{ string: 4, fret: 3 }]);
    expect(result.current.correctAnswer?.extraPositions).toEqual([{ string: 1, fret: 5 }]);
  });

  it('accepts both first-position D locations as a complete answer', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.2);
    const { result } = renderHook(() => usePractice());
    act(() => result.current.startPractice('note-name-to-all-positions'));
    act(() => result.current.submitNotePositions([
      { string: 2, fret: 0 },
      { string: 4, fret: 3 }
    ]));
    expect(result.current.stats).toEqual({ total: 1, correct: 1 });
  });

  it('accepts any position with the exact reference MIDI and rejects a different octave', () => {
    const { result } = renderHook(() => usePractice());
    act(() => result.current.startPractice('reference-pitch-to-position'));
    const question = result.current.question!;
    act(() => {
      result.current.handleFretboardClick({
        position: question.correctPosition!,
        midi: question.correctMidiNote!
      });
    });
    expect(result.current.stats).toEqual({ total: 1, correct: 1 });

    const wrong = renderHook(() => usePractice());
    act(() => wrong.result.current.startPractice('reference-pitch-to-position'));
    act(() => {
      wrong.result.current.handleFretboardClick({
        position: { string: 0, fret: 12 },
        midi: STANDARD_TUNING.strings[0] + 12
      });
    });
    expect(wrong.result.current.feedback).toBe('wrong');
  });

  it('allows auditioning only same-pitch candidates and submits manually', () => {
    const { result } = renderHook(() => usePractice());
    act(() => result.current.startPractice('same-pitch-matching'));
    const question = result.current.question!;
    const correct = question.candidatePositions!.find(position => (
      STANDARD_TUNING.strings[position.string] + position.fret === question.targetMidi
    ))!;
    const nonCandidate = { string: 5 as const, fret: 15 };

    let handled = true;
    act(() => {
      handled = result.current.handleFretboardClick({
        position: nonCandidate,
        midi: STANDARD_TUNING.strings[nonCandidate.string] + nonCandidate.fret
      });
    });
    expect(handled).toBe(false);
    expect(result.current.selectedCandidatePosition).toBeNull();

    act(() => {
      handled = result.current.handleFretboardClick({
        position: correct,
        midi: STANDARD_TUNING.strings[correct.string] + correct.fret
      });
    });
    expect(handled).toBe(true);
    expect(result.current.stats.total).toBe(0);
    expect(result.current.selectedCandidatePosition).toEqual(correct);

    act(() => result.current.submitSamePitchMatch());
    expect(result.current.stats).toEqual({ total: 1, correct: 1 });
  });

  it('toggles a same-pitch candidate and highlights the correct answer after a mistake', () => {
    const { result } = renderHook(() => usePractice());
    act(() => result.current.startPractice('same-pitch-matching'));
    const question = result.current.question!;
    const wrong = question.candidatePositions!.find(position => (
      STANDARD_TUNING.strings[position.string] + position.fret !== question.targetMidi
    ))!;

    act(() => {
      result.current.handleFretboardClick({
        position: wrong,
        midi: STANDARD_TUNING.strings[wrong.string] + wrong.fret
      });
      result.current.handleFretboardClick({
        position: wrong,
        midi: STANDARD_TUNING.strings[wrong.string] + wrong.fret
      });
    });
    expect(result.current.selectedCandidatePosition).toBeNull();

    act(() => result.current.submitSamePitchMatch(wrong));
    expect(result.current.feedback).toBe('wrong');
    expect(result.current.fretHighlights).toContainEqual({
      position: question.correctPosition,
      tone: 'correct'
    });
  });

  it('scores pitch direction, intervals and chord quality only once', () => {
    const direction = renderHook(() => usePractice());
    act(() => direction.result.current.startPractice('pitch-direction'));
    act(() => {
      direction.result.current.submitPitchDirection(direction.result.current.question!.correctPitchDirection!);
      direction.result.current.submitPitchDirection(direction.result.current.question!.correctPitchDirection!);
    });
    expect(direction.result.current.stats).toEqual({ total: 1, correct: 1 });

    const interval = renderHook(() => usePractice());
    act(() => interval.result.current.startPractice('interval-identification'));
    act(() => interval.result.current.setIntervalCurriculum('advanced'));
    expect(interval.result.current.intervalCurriculum).toBe('advanced');
    act(() => interval.result.current.submitInterval(interval.result.current.question!.correctInterval!));
    expect(interval.result.current.stats).toEqual({ total: 1, correct: 1 });

    const quality = renderHook(() => usePractice());
    act(() => quality.result.current.startPractice('chord-quality'));
    expect(quality.result.current.playbackMidiNotes).toHaveLength(3);
    act(() => quality.result.current.submitChordQuality(quality.result.current.question!.correctChordQuality!));
    expect(quality.result.current.stats).toEqual({ total: 1, correct: 1 });
  });

  it('switches major key and scale pattern for the major-scale pattern note-name exercise', () => {
    const { result } = renderHook(() => usePractice());
    act(() => result.current.startPractice('major-scale-pattern-note-name'));
    expect(result.current.majorKey).toBe('C');
    expect(result.current.scalePatternId).toBe('mi');
    expect(result.current.fretHighlights.some(highlight => highlight.tone === 'area')).toBe(true);
    expect(result.current.fretHighlights).toContainEqual({
      position: result.current.question?.correctPosition,
      tone: 'prompt'
    });

    act(() => result.current.setMajorKey('D'));
    expect(result.current.majorKey).toBe('D');
    expect(result.current.question?.majorKey).toBe('D');

    act(() => result.current.setScalePattern('sol'));
    expect(result.current.scalePatternId).toBe('sol');
    expect(result.current.question?.scalePatternId).toBe('sol');
  });

  it('scores major-scale pattern note names once and highlights the correct point after a mistake', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => usePractice());
    act(() => result.current.startPractice('major-scale-pattern-note-name'));
    const correct = result.current.question!.correctScaleNoteName!;
    const wrong = correct === 'C' ? 'D' : 'C';

    act(() => result.current.submitMajorScalePatternNoteName(wrong));
    act(() => result.current.submitMajorScalePatternNoteName(wrong));
    expect(result.current.stats).toEqual({ total: 1, correct: 0 });
    expect(result.current.feedback).toBe('wrong');
    expect(result.current.fretHighlights).toContainEqual({
      position: result.current.question?.correctPosition,
      tone: 'correct'
    });

    act(() => result.current.nextQuestion());
    act(() => result.current.submitMajorScalePatternNoteName(correct));
    expect(result.current.stats).toEqual({ total: 2, correct: 1 });
  });
});
