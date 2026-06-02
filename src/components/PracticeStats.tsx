import React from 'react';
import type { PracticeStats as PracticeStatsType } from '../utils/practice';

interface PracticeStatsProps {
  stats: PracticeStatsType;
}

export const PracticeStats: React.FC<PracticeStatsProps> = ({ stats }) => {
  const accuracy = stats.total > 0 
    ? Math.round((stats.correct / stats.total) * 100) 
    : 0;

  return (
    <div className="practice-stats">
      <div className="stat-item">
        <span className="stat-label">答题数:</span>
        <span className="stat-value">{stats.total}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">正确数:</span>
        <span className="stat-value">{stats.correct}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">正确率:</span>
        <span className="stat-value">{accuracy}%</span>
      </div>
    </div>
  );
};
