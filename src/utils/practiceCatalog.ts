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
  { type: 'same-pitch-matching', category: 'ear', description: '试听三个候选亮点，找到与目标相同的音高。' },
  { type: 'interval-identification', category: 'ear', description: '辨别两个音之间的音程距离。' },
  { type: 'chord-quality', category: 'ear', description: '区分大三和弦与小三和弦的色彩。' },
  {
    type: 'reference-pitch-to-position',
    category: 'ear',
    description: '仅凭听觉，在整块指板中自由定位相同 MIDI 音高。',
    advanced: true
  },
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
    type: 'same-pitch-matching',
    progressKey: 'same-pitch-matching:beginner',
    label: '同音匹配：入门级'
  },
  {
    type: 'interval-identification',
    progressKey: 'interval-identification:beginner',
    label: '音程听辨：入门级'
  },
  { type: 'chord-quality', progressKey: 'chord-quality', label: '大三 / 小三和弦辨别' },
  {
    type: 'same-pitch-matching',
    progressKey: 'same-pitch-matching:advanced',
    label: '同音匹配：进阶级'
  },
  {
    type: 'interval-identification',
    progressKey: 'interval-identification:advanced',
    label: '音程听辨：进阶级'
  },
  { type: 'listen-to-chord', progressKey: 'listen-to-chord', label: '听和弦 → 和弦名' }
];

export function practiceRequiresAudio(type: PracticeType): boolean {
  return [
    'note-to-name-and-position',
    'listen-to-chord',
    'pitch-direction',
    'same-pitch-matching',
    'reference-pitch-to-position',
    'interval-identification',
    'chord-quality'
  ].includes(type);
}
