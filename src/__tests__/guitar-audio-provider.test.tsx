import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GuitarAudioProvider } from '../components/GuitarAudioProvider';
import { useGuitarAudio } from '../hooks/useGuitarAudio';

const mocks = vi.hoisted(() => ({
  instrument: vi.fn(),
  play: vi.fn(),
  stop: vi.fn()
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

describe('GuitarAudioProvider', () => {
  beforeEach(() => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    mocks.instrument.mockReset();
    mocks.play.mockReset();
    mocks.stop.mockReset();
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
