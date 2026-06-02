import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  createEmptySummary,
  getPracticeMastery,
  loadPracticeSummary,
  usePracticeSummary
} from '../hooks/usePracticeSummary';

describe('practice summary', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts empty when saved data is malformed', () => {
    localStorage.setItem('digital-guitar-practice-summary-v1', '{broken');
    expect(loadPracticeSummary()).toEqual(createEmptySummary());
  });

  it('records totals and keeps at most 20 recent mistakes', () => {
    const { result } = renderHook(() => usePracticeSummary());

    act(() => {
      for (let index = 0; index < 25; index++) {
        result.current.recordAnswer('position-to-name', `题目 ${index}`, 'C', false);
      }
      result.current.recordAnswer('position-to-name', '正确题', 'D', true);
    });

    expect(result.current.summary.byType['position-to-name']).toEqual({
      total: 26,
      correct: 1,
      wrong: 25
    });
    expect(result.current.summary.recentMistakes).toHaveLength(20);
    expect(result.current.summary.mistakeCounts['position-to-name:C']).toBe(25);
  });

  it('clears all accumulated records', () => {
    const { result } = renderHook(() => usePracticeSummary());
    act(() => result.current.recordAnswer('listen-to-chord', 'C', 'C', false));
    act(() => result.current.clearSummary());
    expect(result.current.summary).toEqual(createEmptySummary());
  });

  it('fills the new exercise entry when loading an older summary', () => {
    localStorage.setItem('digital-guitar-practice-summary-v1', JSON.stringify({
      byType: {
        'position-to-name': { total: 3, correct: 2, wrong: 1 }
      },
      mistakeCounts: {},
      recentMistakes: []
    }));

    expect(loadPracticeSummary().byType['note-name-to-all-positions']).toEqual({
      total: 0,
      correct: 0,
      wrong: 0
    });
    expect(loadPracticeSummary().byType['pitch-direction']).toEqual({
      total: 0,
      correct: 0,
      wrong: 0
    });
    expect(loadPracticeSummary().recentResults).toEqual({});
  });

  it('keeps the latest 20 results and marks at least 80 percent as mastered', () => {
    const { result } = renderHook(() => usePracticeSummary());
    act(() => {
      for (let index = 0; index < 25; index++) {
        result.current.recordAnswer('pitch-direction', '高低比较', 'higher', index >= 5 && index < 21);
      }
    });
    expect(result.current.summary.recentResults['pitch-direction']).toHaveLength(20);
    expect(getPracticeMastery(result.current.summary, 'pitch-direction')).toEqual({
      answered: 20,
      accuracy: 0.8,
      mastered: true
    });
  });

  it('stores interval curriculum progress separately', () => {
    const { result } = renderHook(() => usePracticeSummary());
    act(() => {
      result.current.recordAnswer(
        'interval-identification',
        '音程听辨',
        'major3',
        true,
        'interval-identification:beginner'
      );
    });
    expect(result.current.summary.recentResults['interval-identification:beginner']).toEqual([true]);
    expect(result.current.summary.recentResults['interval-identification:advanced']).toBeUndefined();
  });
});
