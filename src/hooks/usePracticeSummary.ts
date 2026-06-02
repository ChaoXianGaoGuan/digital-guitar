import { useCallback, useEffect, useState } from 'react';
import type { PracticeType } from '../utils/practice';

const SUMMARY_KEY = 'digital-guitar-practice-summary-v1';
const MAX_RECENT_MISTAKES = 20;
export const MASTERY_WINDOW = 20;
export const MASTERY_THRESHOLD = 0.8;

export interface PracticeSummaryEntry {
  total: number;
  correct: number;
  wrong: number;
}

export interface RecentMistake {
  type: PracticeType;
  prompt: string;
  correctAnswer: string;
  answeredAt: string;
}

export interface PracticeSummary {
  byType: Record<PracticeType, PracticeSummaryEntry>;
  mistakeCounts: Record<string, number>;
  recentMistakes: RecentMistake[];
  recentResults: Partial<Record<string, boolean[]>>;
}

export const PRACTICE_TYPES: PracticeType[] = [
  'note-to-name-and-position',
  'position-to-name',
  'note-name-to-all-positions',
  'chord-to-position',
  'position-to-chord',
  'listen-to-chord',
  'pitch-direction',
  'reference-pitch-to-position',
  'interval-identification',
  'chord-quality'
];

function createEmptyEntry(): PracticeSummaryEntry {
  return { total: 0, correct: 0, wrong: 0 };
}

export function createEmptySummary(): PracticeSummary {
  return {
    byType: {
      'note-to-name-and-position': createEmptyEntry(),
      'position-to-name': createEmptyEntry(),
      'note-name-to-all-positions': createEmptyEntry(),
      'chord-to-position': createEmptyEntry(),
      'position-to-chord': createEmptyEntry(),
      'listen-to-chord': createEmptyEntry(),
      'pitch-direction': createEmptyEntry(),
      'reference-pitch-to-position': createEmptyEntry(),
      'interval-identification': createEmptyEntry(),
      'chord-quality': createEmptyEntry()
    },
    mistakeCounts: {},
    recentMistakes: [],
    recentResults: {}
  };
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0;
}

export function loadPracticeSummary(): PracticeSummary {
  try {
    const saved = localStorage.getItem(SUMMARY_KEY);
    if (!saved) return createEmptySummary();

    const parsed = JSON.parse(saved) as Partial<PracticeSummary>;
    const summary = createEmptySummary();

    for (const type of PRACTICE_TYPES) {
      const entry = parsed.byType?.[type];
      if (
        entry
        && isNonNegativeInteger(entry.total)
        && isNonNegativeInteger(entry.correct)
        && isNonNegativeInteger(entry.wrong)
      ) {
        summary.byType[type] = entry;
      }
    }

    if (parsed.mistakeCounts && typeof parsed.mistakeCounts === 'object') {
      summary.mistakeCounts = Object.fromEntries(
        Object.entries(parsed.mistakeCounts)
          .filter(([, count]) => isNonNegativeInteger(count))
      );
    }

    if (Array.isArray(parsed.recentMistakes)) {
      summary.recentMistakes = parsed.recentMistakes
        .filter((mistake): mistake is RecentMistake => (
          mistake
          && PRACTICE_TYPES.includes(mistake.type)
          && typeof mistake.prompt === 'string'
          && typeof mistake.correctAnswer === 'string'
          && typeof mistake.answeredAt === 'string'
        ))
        .slice(0, MAX_RECENT_MISTAKES);
    }

    if (parsed.recentResults && typeof parsed.recentResults === 'object') {
      summary.recentResults = Object.fromEntries(
        Object.entries(parsed.recentResults)
          .filter(([, results]) => (
            Array.isArray(results) && results.every(result => typeof result === 'boolean')
          ))
          .map(([key, results]) => [key, (results as boolean[]).slice(-MASTERY_WINDOW)])
      );
    }

    return summary;
  } catch {
    return createEmptySummary();
  }
}

function savePracticeSummary(summary: PracticeSummary): void {
  try {
    localStorage.setItem(SUMMARY_KEY, JSON.stringify(summary));
  } catch {
    // localStorage can be unavailable in privacy modes.
  }
}

export function usePracticeSummary() {
  const [summary, setSummary] = useState<PracticeSummary>(loadPracticeSummary);

  useEffect(() => {
    savePracticeSummary(summary);
  }, [summary]);

  const recordAnswer = useCallback((
    type: PracticeType,
    prompt: string,
    correctAnswer: string,
    isCorrect: boolean,
    progressKey: string = type
  ) => {
    setSummary(previous => {
      const entry = previous.byType[type];
      const nextEntry = {
        total: entry.total + 1,
        correct: entry.correct + (isCorrect ? 1 : 0),
        wrong: entry.wrong + (isCorrect ? 0 : 1)
      };

      const recentResults = {
        ...previous.recentResults,
        [progressKey]: [...(previous.recentResults[progressKey] ?? []), isCorrect]
          .slice(-MASTERY_WINDOW)
      };
      if (isCorrect) return {
        ...previous,
        byType: { ...previous.byType, [type]: nextEntry },
        recentResults
      };
      const mistakeKey = `${type}:${correctAnswer}`;
      return {
        byType: { ...previous.byType, [type]: nextEntry },
        mistakeCounts: {
          ...previous.mistakeCounts,
          [mistakeKey]: (previous.mistakeCounts[mistakeKey] ?? 0) + 1
        },
        recentMistakes: [{
          type,
          prompt,
          correctAnswer,
          answeredAt: new Date().toISOString()
        }, ...previous.recentMistakes].slice(0, MAX_RECENT_MISTAKES),
        recentResults
      };
    });
  }, []);

  const clearSummary = useCallback(() => {
    setSummary(createEmptySummary());
  }, []);

  return { summary, recordAnswer, clearSummary };
}

export function getPracticeMastery(summary: PracticeSummary, key: string) {
  const results = summary.recentResults[key] ?? [];
  const correct = results.filter(Boolean).length;
  const accuracy = results.length ? correct / results.length : 0;
  return {
    answered: results.length,
    accuracy,
    mastered: results.length >= MASTERY_WINDOW && accuracy >= MASTERY_THRESHOLD
  };
}
