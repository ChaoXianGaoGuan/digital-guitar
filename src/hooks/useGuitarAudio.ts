import { useContext } from 'react';
import { GuitarAudioContext } from '../context/guitarAudioContext';

export function useGuitarAudio() {
  const context = useContext(GuitarAudioContext);
  if (!context) {
    throw new Error('useGuitarAudio must be used inside GuitarAudioProvider');
  }
  return context;
}
