import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { GuitarAudioContext } from '../context/guitarAudioContext';
import type { GuitarAudioStatus } from '../context/guitarAudioContext';

interface SoundfontInstrument {
  play: (note: string, when?: number, options?: { duration?: number; gain?: number }) => unknown;
  stop: () => unknown;
}

interface SoundfontModule {
  instrument: (context: AudioContext, name: string) => Promise<SoundfontInstrument>;
}

interface GuitarAudioProviderProps extends PropsWithChildren {
  volume: number;
}

async function loadSoundfont(): Promise<SoundfontModule> {
  const imported = await import('soundfont-player');
  return (imported.default ?? imported) as SoundfontModule;
}

function createAudioContext(): AudioContext {
  const AudioContextClass = window.AudioContext
    ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextClass) {
    throw new Error('AudioContext is not supported');
  }

  return new AudioContextClass();
}

export function GuitarAudioProvider({ children, volume }: GuitarAudioProviderProps) {
  const [attempt, setAttempt] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const instrumentRef = useRef<SoundfontInstrument | null>(null);
  const sequenceTimersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const stopSequence = useCallback(() => {
    sequenceTimersRef.current.forEach(timer => clearTimeout(timer));
    sequenceTimersRef.current = [];
  }, []);

  useEffect(() => {
    let active = true;
    let initializingContext: AudioContext | null = null;

    const initialize = async () => {
      try {
        const soundfont = await loadSoundfont();
        initializingContext = createAudioContext();
        const instrument = await soundfont.instrument(initializingContext, 'acoustic_guitar_nylon');

        if (!active) {
          instrument.stop();
          void initializingContext.close();
          return;
        }

        audioContextRef.current = initializingContext;
        instrumentRef.current = instrument;
        setError(null);
        setIsLoading(false);
      } catch {
        if (active) {
          setError('音频加载失败，请重试');
          setIsLoading(false);
        }
        if (initializingContext?.state !== 'closed') {
          void initializingContext?.close();
        }
      }
    };

    void initialize();

    return () => {
      active = false;
      stopSequence();
      instrumentRef.current?.stop();
      instrumentRef.current = null;
      const context = audioContextRef.current;
      audioContextRef.current = null;
      if (context?.state !== 'closed') {
        void context?.close();
      }
    };
  }, [attempt, stopSequence]);

  const playNotes = useCallback((midiNotes: number[], duration: number) => {
    const play = async () => {
      try {
        const context = audioContextRef.current;
        const instrument = instrumentRef.current;
        if (!context || !instrument) return;

        if (context.state === 'suspended') {
          await context.resume();
        }

        const when = context.currentTime;
        for (const midi of midiNotes) {
          instrument.play(midi.toString(), when, { duration, gain: volume * 3 });
        }
      } catch {
        // Browsers can reject resume() until the next user gesture.
      }
    };

    void play();
  }, [volume]);

  const playNote = useCallback((midi: number) => {
    playNotes([midi], 0.5);
  }, [playNotes]);

  const playChord = useCallback((midiNotes: number[]) => {
    playNotes(midiNotes, 0.8);
  }, [playNotes]);

  const playSequence = useCallback((
    midiNotes: number[],
    options: { noteDurationMs?: number; gapMs?: number } = {}
  ) => {
    stopSequence();
    const noteDurationMs = options.noteDurationMs ?? 500;
    const gapMs = options.gapMs ?? 250;
    midiNotes.forEach((midi, index) => {
      const timer = setTimeout(() => {
        playNotes([midi], noteDurationMs / 1000);
      }, index * (noteDurationMs + gapMs));
      sequenceTimersRef.current.push(timer);
    });
  }, [playNotes, stopSequence]);

  const retry = useCallback(() => {
    stopSequence();
    setIsLoading(true);
    setError(null);
    setAttempt(previous => previous + 1);
  }, [stopSequence]);

  const status: GuitarAudioStatus = error ? 'error' : isLoading ? 'loading' : 'ready';

  const value = useMemo(() => ({
    playNote,
    playChord,
    playSequence,
    stopSequence,
    status,
    error,
    retry
  }), [playNote, playChord, playSequence, stopSequence, status, error, retry]);

  return (
    <GuitarAudioContext.Provider value={value}>
      {children}
    </GuitarAudioContext.Provider>
  );
}
