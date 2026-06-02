import type { PracticeType } from './practice';

export type PracticeCategory = 'fretboard' | 'ear' | 'chord';

export interface PracticeCatalogEntry {
  type: PracticeType;
  category: PracticeCategory;
  description: string;
  advanced?: boolean;
}

export const PRACTICE_CATEGORY_NAMES: Record<PracticeCategory, string> = {
  fretboard: '指板训练',
  ear: '练耳训练',
  chord: '和弦训练'
};

export const PRACTICE_CATEGORIES: PracticeCategory[] = ['fretboard', 'ear', 'chord'];

export const PRACTICE_CATALOG: PracticeCatalogEntry[] = [
  { type: 'position-to-name', category: 'fretboard', description: '根据指板亮点识别自然音名。' },
  { type: 'note-name-to-all-positions', category: 'fretboard', description: '找出当前把位内全部同名音。' },
  { type: 'pitch-direction', category: 'ear', description: '判断第二个音更高、相同或更低。' },
  { type: 'reference-pitch-to-position', category: 'ear', description: '根据听到的参照音定位同一音高。' },
  { type: 'interval-identification', category: 'ear', description: '辨别两个音之间的音程距离。' },
  { type: 'chord-quality', category: 'ear', description: '区分大三和弦与小三和弦的色彩。' },
  {
    type: 'note-to-name-and-position',
    category: 'ear',
    description: '识别音名，并定位到相同 MIDI 音高。',
    advanced: true
  },
  { type: 'chord-to-position', category: 'chord', description: '根据和弦名按出标准指法。' },
  { type: 'position-to-chord', category: 'chord', description: '根据指板上的完整指法识别和弦。' },
  {
    type: 'listen-to-chord',
    category: 'chord',
    description: '仅凭听觉识别具体和弦名。',
    advanced: true
  }
];

export interface RecommendedLesson {
  type: PracticeType;
  progressKey: string;
  label: string;
}

export const RECOMMENDED_LESSONS: RecommendedLesson[] = [
  { type: 'pitch-direction', progressKey: 'pitch-direction', label: '高低比较' },
  {
    type: 'reference-pitch-to-position',
    progressKey: 'reference-pitch-to-position',
    label: '参照音 → 指板位置'
  },
  {
    type: 'interval-identification',
    progressKey: 'interval-identification:beginner',
    label: '音程听辨：入门级'
  },
  { type: 'chord-quality', progressKey: 'chord-quality', label: '大三 / 小三和弦辨别' },
  {
    type: 'interval-identification',
    progressKey: 'interval-identification:advanced',
    label: '音程听辨：进阶级'
  },
  {
    type: 'note-to-name-and-position',
    progressKey: 'note-to-name-and-position',
    label: '听音高 → 音名 + 指板位置'
  },
  { type: 'listen-to-chord', progressKey: 'listen-to-chord', label: '听和弦 → 和弦名' }
];

export function practiceRequiresAudio(type: PracticeType): boolean {
  return [
    'note-to-name-and-position',
    'listen-to-chord',
    'pitch-direction',
    'reference-pitch-to-position',
    'interval-identification',
    'chord-quality'
  ].includes(type);
}
