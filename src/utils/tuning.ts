// 调弦配置
export interface Tuning {
  id: string;
  name: string;
  strings: [number, number, number, number, number, number]; // 6个MIDI音符编号，从6弦（最粗）到1弦（最细）
}

// 标准调弦：E-A-D-G-B-E
export const STANDARD_TUNING: Tuning = {
  id: 'standard',
  name: 'Standard',
  strings: [40, 45, 50, 55, 59, 64] // E2-A2-D3-G3-B3-E4
};

// Drop D：D-A-D-G-B-E
export const DROP_D_TUNING: Tuning = {
  id: 'drop-d',
  name: 'Drop D',
  strings: [38, 45, 50, 55, 59, 64] // D2-A2-D3-G3-B3-E4
};

// Open G：D-G-D-G-B-D
export const OPEN_G_TUNING: Tuning = {
  id: 'open-g',
  name: 'Open G',
  strings: [38, 43, 50, 55, 59, 62] // D2-G2-D3-G3-B3-D4
};

// 预设调弦列表
export const PRESET_TUNINGS: Tuning[] = [
  STANDARD_TUNING,
  DROP_D_TUNING,
  OPEN_G_TUNING
];

export function createCustomTuning(
  strings: Tuning['strings'],
  name = '自定义'
): Tuning {
  return {
    id: 'custom',
    name,
    strings: [...strings]
  };
}

// 获取弦的MIDI音符编号
export function getStringMidi(tuning: Tuning, stringIndex: number): number {
  if (stringIndex < 0 || stringIndex > 5) {
    throw new Error(`Invalid string index: ${stringIndex}`);
  }
  return tuning.strings[stringIndex];
}

// 获取指定弦和品的MIDI音符编号
export function getNoteMidi(tuning: Tuning, stringIndex: number, fret: number): number {
  const openStringMidi = getStringMidi(tuning, stringIndex);
  return openStringMidi + fret;
}

export function isStandardTuning(tuning: Tuning): boolean {
  return tuning.strings.length === STANDARD_TUNING.strings.length
    && tuning.strings.every((midi, index) => midi === STANDARD_TUNING.strings[index]);
}
