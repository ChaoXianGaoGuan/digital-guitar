import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GuitarAudioContext } from '../context/guitarAudioContext';
import { PracticeMode } from '../components/PracticeMode';
import { usePractice } from '../hooks/usePractice';
import { STANDARD_TUNING } from '../utils/tuning';

const audio = {
  status: 'ready' as const, error: null, retry: vi.fn(), playNote: vi.fn(),
  playChord: vi.fn(), playSequence: vi.fn(), playChordSequence: vi.fn(), stopSequence: vi.fn()
};
function Harness() {
  const practice = usePractice();
  return <GuitarAudioContext.Provider value={audio}>
    <PracticeMode tuning={STANDARD_TUNING} audioStatus="ready" practice={practice} onStop={vi.fn()} />
  </GuitarAudioContext.Provider>;
}

describe('integrated harmony UI', () => {
  beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); vi.spyOn(Math, 'random').mockReturnValue(0); });
  afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

  it('opens through the shared catalog and submits a previewed answer', () => {
    vi.useFakeTimers();
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: '和弦级数' }));
    expect(screen.getByText('和弦级数设置')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /开始练习/ }));
    expect(screen.queryByRole('button', { name: /提交答案/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^大三/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '根音 C' }));
    expect(audio.playChord).not.toHaveBeenCalled();
    expect(screen.getByRole('group', { name: 'C 的性质与提交' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /提交答案/ })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /^大三/ }));
    expect(audio.playChord).toHaveBeenLastCalledWith([48, 52, 55, 60, 64]);
    fireEvent.click(screen.getByRole('button', { name: /提交答案/ }));
    expect(screen.getByText('✓ 回答正确，正在进入下一题…')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /下一题/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /提交答案/ })).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(500));
    expect(screen.queryByRole('button', { name: /提交答案/ })).not.toBeInTheDocument();
  });

  it('moves the follow-up group to the selected root and supports keyboard selection', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: '和弦级数' }));
    fireEvent.click(screen.getByRole('button', { name: /开始练习/ }));
    fireEvent.click(screen.getByRole('button', { name: '根音 B' }), { detail: 0 });
    expect(screen.getByRole('group', { name: 'B 的性质与提交' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^大三/ })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: '根音 C' }), { detail: 1 });
    expect(screen.queryByRole('group', { name: 'B 的性质与提交' })).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'C 的性质与提交' })).toBeInTheDocument();
  });

  it('fills a progression and synchronizes cancellable playback to answer cards', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: '流行走向' }));
    fireEvent.click(screen.getByRole('button', { name: /开始练习/ }));
    const roots = ['D', 'A', 'F', 'G'];
    roots.forEach((root, i) => {
      fireEvent.click(screen.getByRole('button', { name: new RegExp(`^第 ${i + 1} 格`) }));
      expect(screen.queryByRole('button', { name: /提交答案/ })).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: `根音 ${root}` }));
      fireEvent.click(screen.getByRole('button', { name: i === 1 ? /^小三/ : /^大三/ }));
    });
    fireEvent.click(screen.getByRole('button', { name: /提交答案/ }));
    expect(screen.getByText('↺ 再巩固一下')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /播放正确走向/ }));
    const [chords, options] = audio.playChordSequence.mock.lastCall!;
    expect(chords).toHaveLength(4);
    act(() => options.onStep(1));
    expect(screen.getByRole('button', { name: /^第 2 格/ })).toHaveAttribute('aria-pressed', 'true');
    expect(audio.playChord).toHaveBeenCalledTimes(4); // No duplicate chord playback from the step callback.
    fireEvent.click(screen.getByRole('button', { name: /停止播放/ }));
    expect(audio.stopSequence).toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('练习类型：'), { target: { value: 'position-to-name' } });
    expect(screen.queryByRole('button', { name: /播放正确走向/ })).not.toBeInTheDocument();
  });
});
