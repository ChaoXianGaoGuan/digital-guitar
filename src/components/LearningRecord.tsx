import { HARMONY_KEYS } from '../utils/harmony';
import { getPracticeMastery } from '../hooks/usePracticeSummary';
import type { PracticeSummary } from '../hooks/usePracticeSummary';
import { RECOMMENDED_LESSONS } from '../utils/practiceCatalog';
import { PRACTICE_TYPE_NAMES } from '../utils/practice';

interface LearningRecordProps {
  summary: PracticeSummary;
  onClear: () => void;
}

export function LearningRecord({ summary, onClear }: LearningRecordProps) {
  const entries = Object.values(summary.byType);
  const total = entries.reduce((sum, entry) => sum + entry.total, 0);
  const correct = entries.reduce((sum, entry) => sum + entry.correct, 0);
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  const handleClear = () => {
    if (window.confirm('确定清空全部学习记录吗？')) {
      onClear();
    }
  };

  return (
    <details className="learning-record">
      <summary>学习记录：累计 {total} 题，正确率 {accuracy}%</summary>
      {summary.recentMistakes.length === 0 ? (
        <p>暂无错题记录。</p>
      ) : (
        <ul>
          {summary.recentMistakes.map((mistake, index) => (
            <li key={`${mistake.answeredAt}-${index}`}>
              {PRACTICE_TYPE_NAMES[mistake.type]}：{mistake.prompt}，正确答案 {mistake.correctAnswer}
            </li>
          ))}
        </ul>
      )}
      <h4>最近 20 题完成度</h4>
      <ul className="learning-progress">
        {RECOMMENDED_LESSONS.map(lesson => {
          const mastery = getPracticeMastery(summary, lesson.progressKey);
          return (
            <li key={lesson.progressKey}>
              {lesson.label}：{mastery.mastered
                ? `已掌握（${Math.round(mastery.accuracy * 100)}%）`
                : `${mastery.answered} / 20（${Math.round(mastery.accuracy * 100)}%）`}
            </li>
          );
        })}
      </ul>
      {(['chord-degree', 'chord-progression'] as const).map(type => summary.byType[type].total > 0 && (
        <div key={type} className="harmony-record-group">
          <h4>{PRACTICE_TYPE_NAMES[type]} · 累计 {summary.byType[type].total} 题，正确 {summary.byType[type].correct} 题</h4>
          <ul className="learning-progress">{HARMONY_KEYS.map(key => {
            const mastery = getPracticeMastery(summary, `${type}:${key}`);
            return <li key={key}>{key} 大调：{mastery.mastered ? '已掌握' : `${mastery.answered} / 20`}（{Math.round(mastery.accuracy * 100)}%）</li>;
          })}</ul>
        </div>
      ))}
      <button type="button" onClick={handleClear} disabled={total === 0}>清空记录</button>
    </details>
  );
}
