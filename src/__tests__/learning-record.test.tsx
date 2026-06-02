import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LearningRecord } from '../components/LearningRecord';
import { createEmptySummary } from '../hooks/usePracticeSummary';

describe('LearningRecord', () => {
  it('asks for confirmation before clearing records', () => {
    const onClear = vi.fn();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const summary = createEmptySummary();
    summary.byType['position-to-name'] = { total: 1, correct: 0, wrong: 1 };

    render(<LearningRecord summary={summary} onClear={onClear} />);
    fireEvent.click(screen.getByRole('button', { name: '清空记录' }));
    expect(confirm).toHaveBeenCalledOnce();
    expect(onClear).not.toHaveBeenCalled();

    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: '清空记录' }));
    expect(onClear).toHaveBeenCalledOnce();
    confirm.mockRestore();
  });
});
