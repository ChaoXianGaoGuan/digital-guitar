import { CHROMATIC_NAMES } from './note';
import type { ChordFingering } from './chord';

export const HARMONY_KEYS = ['C', 'G', 'D', 'A', 'E'] as const;
export type HarmonyKey = typeof HARMONY_KEYS[number];
export type TriadQuality = 'major' | 'minor' | 'dim';
export interface Triad { root: number; quality: TriadQuality }
export interface HarmonyConfig { keys: HarmonyKey[]; degrees: number[]; progressions: string[] }
export interface HarmonyQuestion { key: HarmonyKey; degrees: number[]; chords: Triad[] }
export interface HarmonyAnswer { root: number | null; quality: TriadQuality | null }

export const POP_PROGRESSIONS = [
  { degrees: '1645', name: '经典四和弦', source: 'https://www.fender.com/articles/chords/3-common-guitar-chord-progressions' },
  { degrees: '1564', name: '流行四和弦', source: 'https://www.fender.com/articles/chords/3-common-guitar-chord-progressions' },
  { degrees: '6415', name: '小和弦起句', source: 'https://www.fender.com/articles/chords/3-common-guitar-chord-progressions' },
  { degrees: '4536251', name: '抒情长进行', source: 'https://www.jimbopiano.com/blog/4536251-fill-in' },
  { degrees: '15634145', name: '卡农式进行', source: 'https://www.tingyinba.com/chord-progressions' },
  { degrees: '6251', name: '回归主和弦', source: 'https://www.tingyinba.com/chord-progressions' }
] as const;
export const DEFAULT_HARMONY_CONFIG: HarmonyConfig = {
  keys: ['C'], degrees: [1, 2, 3, 4, 5, 6, 7], progressions: POP_PROGRESSIONS.map(p => p.degrees)
};
const KEY_ROOT: Record<HarmonyKey, number> = { C: 0, G: 7, D: 2, A: 9, E: 4 };
const SCALE = [0, 2, 4, 5, 7, 9, 11];
const QUALITIES: TriadQuality[] = ['major', 'minor', 'minor', 'major', 'major', 'minor', 'dim'];
export const QUALITY_LABELS: Record<TriadQuality, string> = { major: '大三', minor: '小三', dim: '减三' };
export const CUSTOM_PROGRESSIONS_KEY = 'digital-guitar-custom-progressions-v1';

export function isHarmonyType(type: string | null): boolean {
  return type === 'chord-degree' || type === 'chord-progression';
}
export function degreeChord(key: HarmonyKey, degree: number): Triad {
  if (!Number.isInteger(degree) || degree < 1 || degree > 7) throw new Error('Invalid scale degree');
  return { root: (KEY_ROOT[key] + SCALE[degree - 1]) % 12, quality: QUALITIES[degree - 1] };
}
export function triadName(chord: Triad): string {
  return CHROMATIC_NAMES[chord.root] + (chord.quality === 'major' ? '' : chord.quality === 'minor' ? 'm' : 'dim');
}
export function completeAnswer(answer: HarmonyAnswer | undefined): Triad | null {
  return answer && answer.root !== null && answer.quality !== null
    ? { root: answer.root, quality: answer.quality } : null;
}
export function sameTriad(a: Triad | null, b: Triad): boolean {
  return a !== null && a.root === b.root && a.quality === b.quality;
}
export function validProgression(value: string): boolean { return /^[1-7]{1,32}$/.test(value); }
export function loadCustomProgressions(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(CUSTOM_PROGRESSIONS_KEY) ?? '[]');
    return Array.isArray(value) ? [...new Set(value.filter((p): p is string => typeof p === 'string' && validProgression(p)))] : [];
  } catch { return []; }
}
export function canStartHarmony(config: HarmonyConfig, progression: boolean): boolean {
  return config.keys.length > 0 && config.keys.every(k => HARMONY_KEYS.includes(k))
    && (progression ? config.progressions.length > 0 && config.progressions.every(validProgression)
      : config.degrees.length > 0 && config.degrees.every(d => Number.isInteger(d) && d >= 1 && d <= 7));
}
export function generateHarmonyQuestion(config: HarmonyConfig, progression: boolean): HarmonyQuestion {
  if (!canStartHarmony(config, progression)) throw new Error('Select at least one key and exercise');
  const pick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];
  const key = pick(config.keys);
  const degrees = progression ? [...pick(config.progressions)].map(Number) : [pick(config.degrees)];
  return { key, degrees, chords: degrees.map(d => degreeChord(key, d)) };
}

// Standard tuning, six strings to first string. Open shapes take precedence.
const OPEN_SHAPES: Record<string, ChordFingering['frets']> = {
  C: [null, 3, 2, 0, 1, 0], D: [null, null, 0, 2, 3, 2],
  E: [0, 2, 2, 1, 0, 0], G: [3, 2, 0, 0, 0, 3], A: [null, 0, 2, 2, 2, 0],
  Am: [null, 0, 2, 2, 1, 0], Dm: [null, null, 0, 2, 3, 1], Em: [0, 2, 2, 0, 0, 0]
};
export function triadFingering(chord: Triad): ChordFingering {
  const open = OPEN_SHAPES[triadName(chord)];
  if (open) return { frets: [...open] };
  if (chord.quality === 'dim') {
    // Root, minor third and diminished fifth on the middle four strings.
    const r = ((chord.root - 9 + 12) % 12) || 12;
    const d = (chord.root - 2 + 12) % 12;
    return r <= d
      ? { frets: [null, r, r + 1, r + 2, r + 1, null] }
      : { frets: [null, null, d, d + 1, d + 3, d + 1] };
  }
  const e = (chord.root - 4 + 12) % 12;
  const a = (chord.root - 9 + 12) % 12;
  return e <= a
    ? { frets: [e, e + 2, e + 2, e + (chord.quality === 'major' ? 1 : 0), e, e] }
    : { frets: [null, a, a + 2, a + 2, a + (chord.quality === 'major' ? 2 : 1), a] };
}
