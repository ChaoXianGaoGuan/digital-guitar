import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PracticeMode } from '../components/PracticeMode';
import { GuitarAudioContext } from '../context/guitarAudioContext';
import type { GuitarAudioStatus } from '../context/guitarAudioContext';
import { usePractice } from '../hooks/usePractice';
import { OPEN_G_TUNING, STANDARD_TUNING } from '../utils/tuning';

function Harness({
  status,
  tuning = STANDARD_TUNING
}: {
  status: GuitarAudioStatus;
  tuning?: typeof STANDARD_TUNING;
}) {
  const practice = usePractice(tuning);
  return (
    <GuitarAudioContext.Provider value={{
      status,
      error: status === 'error' ? '加载失败' : null,
      retry: vi.fn(),
      playNote: vi.fn(),
      playChord: vi.fn(),
      playSequence: vi.fn(),
      stopSequence: vi.fn()
    }}>
      <PracticeMode
        tuning={tuning}
        audioStatus={status}
        practice={practice}
        onStop={vi.fn()}
      />
    </GuitarAudioContext.Provider>
  );
}

describe('PracticeMode', () => {
  it('disables chord practice outside standard tuning', () => {
    render(<Harness status="ready" tuning={OPEN_G_TUNING} />);
    expect(screen.getByText('和弦练习与大调指型练习目前仅支持标准调弦。')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '和弦 → 指板位置' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '大调指型 → 音名' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '指板亮点 → 音名' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '音名 → 全部指板位置' })).toBeEnabled();
  });

  it('disables listening practice while audio is loading', () => {
    render(<Harness status="loading" />);
    expect(screen.getByText('音频尚未就绪，听音练习暂不可用。')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '听音高 → 音名 + 指板位置' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '听和弦 → 和弦名' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '高低比较' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '同音匹配 → 指板位置' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '听音高 → 指板自由定位' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '音程听辨' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '大三 / 小三和弦辨别' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '指板亮点 → 音名' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '音名 → 全部指板位置' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '大调指型 → 音名' })).toBeEnabled();
  });

  it('shows only three focused ranges for the all-position exercise', () => {
    render(<Harness status="ready" />);
    fireEvent.click(screen.getByRole('button', { name: '音名 → 全部指板位置' }));

    const range = screen.getByLabelText('练习范围：');
    expect(range).toHaveValue('1st');
    expect(screen.getByRole('option', { name: '第一把位 (空弦、1-4品)' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '第二把位 (5-8品)' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '第三把位 (9-12品)' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: '全部' })).not.toBeInTheDocument();
  });

  it('groups the exercise cards and the active selector consistently', () => {
    render(<Harness status="ready" />);
    expect(screen.getByRole('heading', { name: '指板训练' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '练耳训练' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '和弦训练' })).toBeInTheDocument();
    expect(screen.getByText('推荐下一课')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '高低比较' }));
    expect(screen.getByRole('group', { name: '练耳训练' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '重新听音' })).toBeInTheDocument();
  });

  it('shows the controls for the same-pitch matching bridge exercise', () => {
    render(<Harness status="ready" />);
    fireEvent.click(screen.getByRole('button', { name: '同音匹配 → 指板位置' }));

    expect(screen.getByText('听目标音，再试听三个候选亮点，选择音高完全相同的位置。')).toBeInTheDocument();
    expect(screen.getByLabelText('练习范围：')).toHaveValue('all');
    expect(screen.getByLabelText('同音匹配级别：')).toHaveValue('beginner');
    expect(screen.getByRole('button', { name: '重新听音' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '清除选择' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '提交答案' })).toBeInTheDocument();
  });

  it('shows controls and scale-note answers for the major-scale pattern exercise', () => {
    render(<Harness status="ready" />);
    fireEvent.click(screen.getByRole('button', { name: '大调指型 → 音名' }));

    expect(screen.getByLabelText('大调：')).toHaveValue('C');
    expect(screen.getByLabelText('指型：')).toHaveValue('mi');
    expect(screen.getByText(/当前为/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('大调：'), { target: { value: 'D' } });
    expect(screen.getByRole('button', { name: 'F♯' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'C♯' })).toBeInTheDocument();
  });
});
