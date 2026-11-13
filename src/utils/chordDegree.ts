import { CHROMATIC_NAMES } from './note';
import type { ChordFingering } from './chord';

export const DEGREE_KEYS = ['C', 'G', 'D', 'A', 'E'] as const;
export type DegreeKey = typeof DEGREE_KEYS[number];
export type TriadQuality = 'major' | 'minor' | 'dim';
export interface Triad { root: number; quality: TriadQuality }
export const PROGRESSIONS = ['1645', '1564', '6415', '4536251', '15634145', '6251'];
const KEY_ROOTS: Record<DegreeKey, number> = { C: 0, G: 7, D: 2, A: 9, E: 4 };
const INTERVALS = [0, 2, 4, 5, 7, 9, 11];
const QUALITIES: TriadQuality[] = ['major', 'minor', 'minor', 'major', 'major', 'minor', 'dim'];
export function degreeChord(key: DegreeKey, degree: number): Triad {
  if (!Number.isInteger(degree) || degree < 1 || degree > 7) throw new Error('Invalid degree');
  return { root: (KEY_ROOTS[key] + INTERVALS[degree - 1]) % 12, quality: QUALITIES[degree - 1] };
}
export function triadName(chord: Triad): string {
  return CHROMATIC_NAMES[chord.root] + (chord.quality === 'minor' ? 'm' : chord.quality === 'dim' ? 'dim' : '');
}
export function triadFingering(chord: Triad): ChordFingering {
  if (chord.quality === 'dim') {
    const r = ((chord.root - 9 + 12) % 12) || 12;
    return { frets: [null, r, r + 1, r + 2, r + 1, null] };
  }
  const r = (chord.root - 4 + 12) % 12;
  return { frets: [r, r + 2, r + 2, r + (chord.quality === 'major' ? 1 : 0), r, r] };
}
export function validProgression(value: string): boolean { return /^[1-7]{1,32}$/.test(value); }
