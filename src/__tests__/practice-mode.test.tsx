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
    expect(screen.getByText('和弦练习目前仅支持标准调弦。')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '和弦 → 指板位置' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '指板亮点 → 音名' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '音名 → 全部指板位置' })).toBeEnabled();
  });

  it('disables listening practice while audio is loading', () => {
    render(<Harness status="loading" />);
    expect(screen.getByText('音频尚未就绪，听音练习暂不可用。')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '听音高 → 音名 + 指板位置' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '听和弦 → 和弦名' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '高低比较' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '参照音 → 指板位置' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '音程听辨' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '大三 / 小三和弦辨别' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '指板亮点 → 音名' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '音名 → 全部指板位置' })).toBeEnabled();
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
});
