import { createContext } from 'react';

export interface GuitarAudioContextValue {
  playNote: (midi: number) => void;
  playChord: (midiNotes: number[]) => void;
  playSequence: (
    midiNotes: number[],
    options?: { noteDurationMs?: number; gapMs?: number }
  ) => void;
  stopSequence: () => void;
  status: GuitarAudioStatus;
  error: string | null;
  retry: () => void;
}

export type GuitarAudioStatus = 'loading' | 'ready' | 'error';

export const GuitarAudioContext = createContext<GuitarAudioContextValue | null>(null);
