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
  afterEach(() => vi.restoreAllMocks());

  it('opens through the shared catalog and submits a previewed answer', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: '和弦级数' }));
    expect(screen.getByText('把级数变成和弦')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /开始练习/ }));
    expect(screen.getByRole('button', { name: /提交答案/ })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '根音 C' }));
    expect(audio.playChord).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /^大三/ }));
    expect(audio.playChord).toHaveBeenLastCalledWith([48, 52, 55, 60, 64]);
    fireEvent.click(screen.getByRole('button', { name: /提交答案/ }));
    expect(screen.getByText('全部正确，继续保持')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /下一题/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /提交答案/ })).not.toBeInTheDocument();
  });

  it('fills a progression and synchronizes cancellable playback to answer cards', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: '流行走向' }));
    fireEvent.click(screen.getByRole('button', { name: /开始练习/ }));
    const roots = ['C', 'A', 'F', 'G'];
    roots.forEach((root, i) => {
      fireEvent.click(screen.getByRole('button', { name: new RegExp(`^第 ${i + 1} 格`) }));
      fireEvent.click(screen.getByRole('button', { name: `根音 ${root}` }));
      fireEvent.click(screen.getByRole('button', { name: i === 1 ? /^小三/ : /^大三/ }));
    });
    fireEvent.click(screen.getByRole('button', { name: /提交答案/ }));
    expect(screen.getByText('全部正确，继续保持')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /播放正确走向/ }));
    const [chords, options] = audio.playChordSequence.mock.lastCall!;
    expect(chords).toHaveLength(4);
    act(() => options.onStep(1));
    expect(screen.getByRole('button', { name: /^第 2 格/ })).toHaveAttribute('aria-pressed', 'true');
    expect(audio.playChord).toHaveBeenCalledTimes(4); // No duplicate chord playback from the step callback.
    fireEvent.click(screen.getByRole('button', { name: /停止播放/ }));
    expect(audio.stopSequence).toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('练习类型：'), { target: { value: 'position-to-name' } });
    expect(screen.queryByText('写出这条和弦走向')).not.toBeInTheDocument();
  });
});
