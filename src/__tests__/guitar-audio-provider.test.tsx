import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GuitarAudioProvider } from '../components/GuitarAudioProvider';
import { useGuitarAudio } from '../hooks/useGuitarAudio';
import { usePractice } from '../hooks/usePractice';
import { PracticeMode } from '../components/PracticeMode';
import { STANDARD_TUNING } from '../utils/tuning';

const mocks = vi.hoisted(() => ({
  instrument: vi.fn(),
  play: vi.fn(),
  stop: vi.fn(),
  voiceStop: vi.fn()
}));

vi.mock('soundfont-player', () => ({
  default: { instrument: mocks.instrument }
}));

class FakeAudioContext {
  static latest: FakeAudioContext | null = null;
  currentTime = 1;
  state: AudioContextState = 'suspended';
  resume = vi.fn(async () => {
    this.state = 'running';
  });
  close = vi.fn(async () => {
    this.state = 'closed';
  });

  constructor() {
    FakeAudioContext.latest = this;
  }
}

function AudioHarness() {
  const { status, error, playNote, retry } = useGuitarAudio();
  if (status === 'loading') return <p>loading</p>;
  if (error) return <button type="button" onClick={retry}>{error}</button>;
  return <button type="button" onClick={() => playNote(60)}>play</button>;
}

function BrowseWhileLoadingHarness() {
  const { status } = useGuitarAudio();
  return <button type="button">browse-{status}</button>;
}

function SequenceHarness() {
  const { status, playSequence, stopSequence } = useGuitarAudio();
  if (status !== 'ready') return <p>loading</p>;
  return (
    <>
      <button type="button" onClick={() => playSequence([60, 62])}>sequence</button>
      <button type="button" onClick={stopSequence}>stop-sequence</button>
    </>
  );
}

const chordSteps = vi.fn();
const chordComplete = vi.fn();
function ChordSequenceHarness() {
  const { status, playChordSequence, stopSequence } = useGuitarAudio();
  if (status !== 'ready') return <p>loading</p>;
  return <><button type="button" onClick={() => playChordSequence([[60, 64, 67], [62, 65, 69]], { onStep: chordSteps, onComplete: chordComplete })}>chord-sequence</button><button type="button" onClick={stopSequence}>stop-chords</button></>;
}

function HarmonyHarness() {
  const { status } = useGuitarAudio();
  const practice = usePractice();
  return <PracticeMode tuning={STANDARD_TUNING} audioStatus={status} practice={practice} onStop={vi.fn()} />;
}

describe('GuitarAudioProvider', () => {
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
  beforeEach(() => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    mocks.instrument.mockReset();
    mocks.play.mockReset();
    mocks.stop.mockReset();
    mocks.voiceStop.mockReset();
    mocks.play.mockImplementation(() => ({ stop: mocks.voiceStop }));
    mocks.instrument.mockResolvedValue({ play: mocks.play, stop: mocks.stop });
  });

  it('resumes the shared context and applies the current volume', async () => {
    const { rerender } = render(
      <GuitarAudioProvider volume={0.5}><AudioHarness /></GuitarAudioProvider>
    );
    fireEvent.click(await screen.findByRole('button', { name: 'play' }));
    await waitFor(() => expect(mocks.play).toHaveBeenCalledWith('60', 1, {
      duration: 0.5,
      gain: 1.5
    }));
    expect(FakeAudioContext.latest?.resume).toHaveBeenCalledOnce();

    rerender(<GuitarAudioProvider volume={0.2}><AudioHarness /></GuitarAudioProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'play' }));
    await waitFor(() => expect(mocks.play).toHaveBeenCalledTimes(2));
    expect(mocks.play.mock.lastCall?.[2]).toMatchObject({ duration: 0.5 });
    expect(mocks.play.mock.lastCall?.[2]?.gain).toBeCloseTo(0.6);
  });

  it('offers a retry after loading fails', async () => {
    mocks.instrument
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({ play: mocks.play, stop: mocks.stop });

    render(<GuitarAudioProvider volume={0.5}><AudioHarness /></GuitarAudioProvider>);
    fireEvent.click(await screen.findByRole('button', { name: '音频加载失败，请重试' }));
    expect(await screen.findByRole('button', { name: 'play' })).toBeInTheDocument();
    expect(mocks.instrument).toHaveBeenCalledTimes(2);
  });

  it('keeps child content available while soundfont is loading', () => {
    mocks.instrument.mockReturnValue(new Promise(() => undefined));
    render(
      <GuitarAudioProvider volume={0.5}>
        <BrowseWhileLoadingHarness />
      </GuitarAudioProvider>
    );
    expect(screen.getByRole('button', { name: 'browse-loading' })).toBeInTheDocument();
  });

  it('synchronizes chord sequence steps and cancels future chords and completion', async () => {
    vi.useFakeTimers(); chordSteps.mockClear(); chordComplete.mockClear();
    render(<GuitarAudioProvider volume={0.5}><ChordSequenceHarness /></GuitarAudioProvider>);
    await act(async () => undefined);
    fireEvent.click(screen.getByRole('button', { name: 'chord-sequence' }));
    await act(async () => { vi.advanceTimersByTime(0); await Promise.resolve(); });
    expect(chordSteps).toHaveBeenLastCalledWith(0);
    expect(mocks.play).toHaveBeenCalledTimes(3);
    await act(async () => vi.advanceTimersByTime(1000));
    expect(chordSteps).toHaveBeenLastCalledWith(1);
    expect(mocks.play).toHaveBeenCalledTimes(6);
    fireEvent.click(screen.getByRole('button', { name: 'stop-chords' }));
    await act(async () => vi.advanceTimersByTime(2000));
    expect(chordComplete).not.toHaveBeenCalled();
    expect(mocks.voiceStop).toHaveBeenCalledTimes(6);
    expect(mocks.stop).not.toHaveBeenCalled();
  });

  it.each(['和弦级数', '流行走向'])('preserves the preview chord through submission and automatic advancement in %s', async type => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    localStorage.clear();
    render(<GuitarAudioProvider volume={0.5}><HarmonyHarness /></GuitarAudioProvider>);
    await act(async () => undefined);
    fireEvent.click(screen.getByRole('button', { name: type }));
    fireEvent.click(screen.getByRole('button', { name: /开始练习/ }));
    const roots = type === '和弦级数' ? ['C'] : ['C', 'A', 'F', 'G'];
    for (const [i, root] of roots.entries()) {
      if (type === '流行走向') fireEvent.click(screen.getByRole('button', { name: new RegExp(`^第 ${i + 1} 格`) }));
      fireEvent.click(screen.getByRole('button', { name: `根音 ${root}` }));
      fireEvent.click(screen.getByRole('button', { name: i === 1 ? /^小三/ : /^大三/ }));
      await act(async () => undefined);
    }
    expect(mocks.play).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '提交答案' }));
    expect(mocks.voiceStop).not.toHaveBeenCalled();
    expect(mocks.stop).not.toHaveBeenCalled();
    await act(async () => vi.advanceTimersByTime(500));
    expect(screen.queryByRole('button', { name: '提交答案' })).not.toBeInTheDocument();
    expect(mocks.voiceStop).not.toHaveBeenCalled();
    expect(mocks.stop).not.toHaveBeenCalled();
    expect(mocks.play.mock.lastCall?.[2]).toMatchObject({ duration: 0.8 });
  });

  it('does not play a cancelled chord after AudioContext finishes resuming', async () => {
    vi.useFakeTimers();
    render(<GuitarAudioProvider volume={0.5}><ChordSequenceHarness /></GuitarAudioProvider>);
    await act(async () => undefined);
    let resume!: () => void;
    FakeAudioContext.latest!.resume.mockImplementationOnce(() => new Promise<void>(resolve => { resume = resolve; }));
    fireEvent.click(screen.getByRole('button', { name: 'chord-sequence' }));
    await act(async () => vi.advanceTimersByTime(0));
    fireEvent.click(screen.getByRole('button', { name: 'stop-chords' }));
    await act(async () => { resume(); await Promise.resolve(); });
    expect(mocks.play).not.toHaveBeenCalled();
  });

  it('plays a sequence in order and cancels pending notes', async () => {
    vi.useFakeTimers();
    render(<GuitarAudioProvider volume={0.5}><SequenceHarness /></GuitarAudioProvider>);
    await act(async () => undefined);
    fireEvent.click(screen.getByRole('button', { name: 'sequence' }));
    await act(async () => {
      vi.advanceTimersByTime(0);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(mocks.play).toHaveBeenCalledWith('60', 1, {
      duration: 0.5,
      gain: 1.5
    });
    fireEvent.click(screen.getByRole('button', { name: 'stop-sequence' }));
    await act(async () => vi.advanceTimersByTime(1000));
    expect(mocks.play).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
