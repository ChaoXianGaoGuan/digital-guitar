import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadPracticeSummary } from '../hooks/usePracticeSummary';
import { usePractice } from '../hooks/usePractice';
import { OPEN_G_TUNING } from '../utils/tuning';
import { CUSTOM_PROGRESSIONS_KEY, DEFAULT_HARMONY_CONFIG } from '../utils/harmony';

describe('harmony practice controller', () => {
  beforeEach(() => { localStorage.clear(); vi.spyOn(Math, 'random').mockReturnValue(0); });
  afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

  it('counts once, keeps correct feedback until manual next, and derives red points and mutes', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => usePractice());
    act(() => result.current.startPractice('chord-degree'));
    expect(result.current.harmonyReady).toBe(false);
    act(() => result.current.beginHarmony());
    act(() => result.current.selectHarmonyAnswer({ root: 0 }));
    expect(result.current.harmonyPreview).toBeNull();
    act(() => result.current.selectHarmonyAnswer({ quality: 'major' }));
    expect(result.current.fretHighlights).toHaveLength(5);
    expect(result.current.fretHighlights.every(point => point.tone === 'chord')).toBe(true);
    expect(result.current.mutedStrings).toEqual([0]);
    const id = result.current.question!.id;
    act(() => { result.current.submitHarmony(); result.current.submitHarmony(); });
    expect(result.current.stats).toEqual({ total: 1, correct: 1 });
    expect(result.current.summary.recentResults['chord-degree:C']).toEqual([true]);
    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.question!.id).toBe(id);
    act(() => result.current.nextQuestion());
    expect(result.current.harmonyPreview).toBeNull();
    expect(result.current.feedback).toBe('none');
  });

  it('rejects partial submissions and scores the full progression', () => {
    const { result } = renderHook(() => usePractice());
    act(() => result.current.startPractice('chord-progression'));
    act(() => result.current.beginHarmony());
    act(() => result.current.submitHarmony());
    expect(result.current.stats.total).toBe(0);
    const chords = result.current.question!.harmony!.chords;
    chords.forEach((chord, i) => {
      act(() => result.current.focusHarmonyAnswer(i));
      act(() => result.current.selectHarmonyAnswer(i === 1 ? { root: 0, quality: 'major' } : chord));
    });
    act(() => result.current.submitHarmony());
    expect(result.current.feedback).toBe('wrong');
    expect(result.current.stats).toEqual({ total: 1, correct: 0 });
    expect(result.current.summary.recentMistakes[0].correctAnswer).toBe('C – Am – F – G');
    const answers = result.current.harmonyAnswers;
    act(() => result.current.selectHarmonyAnswer({ root: 9 }));
    expect(result.current.harmonyAnswers).toBe(answers);
  });

  it('persists custom progressions, removes them, and prevents empty configuration', () => {
    localStorage.setItem(CUSTOM_PROGRESSIONS_KEY, '["1564","bad","1564"]');
    const { result } = renderHook(() => usePractice());
    expect(result.current.customProgressions).toEqual(['1564']);
    act(() => result.current.addCustomProgression('1451'));
    expect(JSON.parse(localStorage.getItem(CUSTOM_PROGRESSIONS_KEY)!)).toEqual(['1564', '1451']);
    act(() => result.current.removeCustomProgression('1451'));
    expect(result.current.harmonyConfig.progressions).not.toContain('1451');
    act(() => result.current.startPractice('chord-degree'));
    act(() => result.current.setHarmonyConfig({ ...DEFAULT_HARMONY_CONFIG, keys: [] }));
    act(() => result.current.beginHarmony());
    expect(result.current.harmonyReady).toBe(false);
  });

  it('keeps older cumulative records while initializing the new types', () => {
    localStorage.setItem('digital-guitar-practice-summary-v1', JSON.stringify({
      byType: { 'position-to-name': { total: 8, correct: 6, wrong: 2 } },
      recentResults: { 'chord-degree:C': [true, false] }
    }));
    const summary = loadPracticeSummary();
    expect(summary.byType['position-to-name'].total).toBe(8);
    expect(summary.byType['chord-degree']).toEqual({ total: 0, correct: 0, wrong: 0 });
    expect(summary.recentResults['chord-degree:C']).toEqual([true, false]);
  });

  it('does not start standard-fingering exercises in nonstandard tuning', () => {
    const { result } = renderHook(() => usePractice(OPEN_G_TUNING));
    act(() => result.current.startPractice('chord-degree'));
    expect(result.current.isActive).toBe(false);
  });
});
