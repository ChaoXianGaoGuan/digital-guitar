// 12个半音名（用于显示）
export const CHROMATIC_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'] as const;
export type ChromaticName = typeof CHROMATIC_NAMES[number];

// 自然大调音名（用于练习答案按钮）
export const NOTE_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
export type NoteName = typeof NOTE_NAMES[number];

// 完整的12个半音名（用于调弦选择）
export const ALL_NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export type AllNoteName = typeof ALL_NOTE_NAMES[number];

// MIDI音符编号转完整音名（带八度）
export function midiToFullNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const noteName = CHROMATIC_NAMES[midi % 12];
  return `${noteName}${octave}`;
}

// MIDI音符编号转12半音显示名（不带八度，带♯）
export function midiToChromaticName(midi: number): string {
  return CHROMATIC_NAMES[midi % 12];
}

// MIDI音符编号转自然大调音名（不带八度，只有C D E F G A B）
// 用于练习答案按钮
export function midiToNoteName(midi: number): NoteName {
  const noteIndex = midi % 12;
  const naturalMajorMap: Record<number, NoteName> = {
    0: 'C',   // C
    1: 'C',   // C♯ → 显示C（练习模式用）
    2: 'D',   // D
    3: 'D',   // D♯ → 显示D
    4: 'E',   // E
    5: 'F',   // F
    6: 'F',   // F♯ → 显示F
    7: 'G',   // G
    8: 'G',   // G♯ → 显示G
    9: 'A',   // A
    10: 'A',  // A♯ → 显示A
    11: 'B',  // B
  };
  return naturalMajorMap[noteIndex] || 'C';
}

// 音名转MIDI音符编号（在指定八度内）
export function noteNameToMidi(noteName: NoteName, octave: number): number {
  const noteMap: Record<NoteName, number> = {
    'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
  };
  return (octave + 1) * 12 + noteMap[noteName];
}

// 完整音名转MIDI音符编号
export function fullNoteNameToMidi(fullNoteName: string): number {
  const match = fullNoteName.match(/^([A-G]#?)(\d)$/);
  if (!match) {
    throw new Error(`Invalid note name: ${fullNoteName}`);
  }
  const noteName = match[1] as AllNoteName;
  const octave = parseInt(match[2]);
  const noteMap: Record<AllNoteName, number> = {
    'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 
    'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
  };
  return (octave + 1) * 12 + noteMap[noteName];
}

// 获取指定范围内的自然大调音符
export function getNaturalMajorNotesInRange(lowMidi: number, highMidi: number): number[] {
  const notes: number[] = [];
  for (let midi = lowMidi; midi <= highMidi; midi++) {
    const noteIndex = midi % 12;
    if ([0, 2, 4, 5, 7, 9, 11].includes(noteIndex)) {
      notes.push(midi);
    }
  }
  return notes;
}
