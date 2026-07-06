# API 参考文档

本文档描述项目中所有导出的类型、常量和函数签名。

---

## utils/note.ts — 音符工具

### 常量

```typescript
CHROMATIC_NAMES: readonly ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']
NOTE_NAMES: readonly ['C', 'D', 'E', 'F', 'G', 'A', 'B']
ALL_NOTE_NAMES: readonly ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
```

### 类型

```typescript
type ChromaticName = 'C' | 'C♯' | 'D' | 'D♯' | 'E' | 'F' | 'F♯' | 'G' | 'G♯' | 'A' | 'A♯' | 'B'
type NoteName = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'
type AllNoteName = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B'
```

### 函数

#### `midiToFullNoteName(midi: number): string`

MIDI 编号转完整音名（带八度）。

- `midi` — MIDI 音符编号（0-127）
- 返回 `"C4"`、`"F#5"` 等格式

```typescript
midiToFullNoteName(60) // "C4"
midiToFullNoteName(66) // "F♯4"
```

#### `midiToChromaticName(midi: number): string`

MIDI 编号转 12 半音显示名（不带八度，带 ♯）。

- `midi` — MIDI 音符编号
- 返回 `"C"`、`"C♯"` 等格式

```typescript
midiToChromaticName(60) // "C"
midiToChromaticName(61) // "C♯"
```

#### `midiToNoteName(midi: number): NoteName`

MIDI 编号转自然大调音名（不带八度）。升降音映射到最近的自然音。

- `midi` — MIDI 音符编号
- 返回 `NoteName`（C/D/E/F/G/A/B）

```typescript
midiToNoteName(60) // "C"
midiToNoteName(61) // "C"  (C♯ 映射到 C)
midiToNoteName(63) // "D"  (D♯ 映射到 D)
```

#### `noteNameToMidi(noteName: NoteName, octave: number): number`

音名 + 八度转 MIDI 编号。

- `noteName` — 自然音名（C/D/E/F/G/A/B）
- `octave` — 八度（0-9）
- 返回 MIDI 编号

```typescript
noteNameToMidi('C', 4) // 60
noteNameToMidi('E', 4) // 64
```

#### `fullNoteNameToMidi(fullNoteName: string): number`

完整音名字符串转 MIDI 编号。

- `fullNoteName` — 格式 `"C4"`、`"F#5"`
- 返回 MIDI 编号
- 格式无效时抛出 `Error`

```typescript
fullNoteNameToMidi("C4")  // 60
fullNoteNameToMidi("F#5") // 78
```

#### `getNaturalMajorNotesInRange(lowMidi: number, highMidi: number): number[]`

获取指定 MIDI 范围内的所有自然大调音符。

- `lowMidi` — 下限（含）
- `highMidi` — 上限（含）
- 返回 MIDI 编号数组（已过滤升降音）

```typescript
getNaturalMajorNotesInRange(60, 71) // [60, 62, 64, 65, 67, 69, 71] (C4-B4)
```

---

## utils/tuning.ts — 调弦配置

### 接口

```typescript
interface Tuning {
  id: string;        // 稳定标识，如 standard、drop-d、open-g、custom
  name: string;      // 调弦名称
  strings: [number, number, number, number, number, number];
}
```

### 常量

```typescript
STANDARD_TUNING: Tuning // { id: "standard", name: "Standard", strings: [40, 45, 50, 55, 59, 64] }
DROP_D_TUNING: Tuning   // { id: "drop-d", name: "Drop D", strings: [38, 45, 50, 55, 59, 64] }
OPEN_G_TUNING: Tuning   // { id: "open-g", name: "Open G", strings: [38, 43, 50, 55, 59, 62] }
PRESET_TUNINGS: Tuning[] // [STANDARD_TUNING, DROP_D_TUNING, OPEN_G_TUNING]
```

### 函数

#### `getStringMidi(tuning: Tuning, stringIndex: number): number`

获取指定弦的空弦 MIDI 编号。

- `stringIndex` — 弦索引（0-5）
- 返回 MIDI 编号
- 索引越界时抛出 `Error`

```typescript
getStringMidi(STANDARD_TUNING, 0) // 40 (6弦 E2)
getStringMidi(STANDARD_TUNING, 5) // 64 (1弦 E4)
```

#### `getNoteMidi(tuning: Tuning, stringIndex: number, fret: number): number`

获取指定弦和品的 MIDI 编号。

- `stringIndex` — 弦索引（0-5）
- `fret` — 品号（0=空弦，1-15）
- 返回 MIDI 编号

```typescript
getNoteMidi(STANDARD_TUNING, 0, 0) // 40 (6弦空弦 E2)
getNoteMidi(STANDARD_TUNING, 0, 5) // 45 (6弦5品 A2)
```

#### `createCustomTuning(strings: Tuning['strings'], name?: string): Tuning`

根据 6弦→1弦的 MIDI 数组创建自定义调弦，默认名称为 `自定义`。

#### `isStandardTuning(tuning: Tuning): boolean`

判断当前调弦是否与标准调弦完全一致。和弦练习与大调指型练习依赖此判断禁用非标准调弦入口。

---

## utils/chord.ts — 和弦定义

### 类型

```typescript
type ChordType = 'major' | 'minor' | 'dominant7'
type ChordTier = 'beginner' | 'full'
type ChordCurriculum = 'beginner' | 'all'
type FretValue = number | null // null=闷弦，0=空弦
type StringIndex = 0 | 1 | 2 | 3 | 4 | 5
type FretboardPosition = { string: StringIndex; fret: number }
```

### 接口

```typescript
interface Chord {
  root: NoteName;   // 根音 (C/D/E/F/G/A/B)
  type: ChordType;  // 和弦类型
  name: string;     // 显示名 ("C", "Am", "G7")
  intervals: number[]; // 音程（半音数），如 [0, 4, 7]
  tier: 'beginner' | 'full';
  fingerings: ChordFingering[];
}

interface ChordFingering {
  frets: [FretValue, FretValue, FretValue, FretValue, FretValue, FretValue];
}
```

### 常量

```typescript
CHORD_INTERVALS: Record<ChordType, number[]>
// major: [0, 4, 7]
// minor: [0, 3, 7]
// dominant7: [0, 4, 7, 10]

CHORD_TYPE_NAMES: Record<ChordType, string>
// major: "大三"
// minor: "小三"
// dominant7: "七"

ALL_CHORDS: Chord[] // 21个和弦（7音名 × 3类型）
```

### 函数

#### `generateAllChords(): Chord[]`

生成所有 21 个和弦（7 根音 × 3 类型）。

- 返回 `Chord[]`

#### `parseChordFingering(notation: string): ChordFingering`

将六弦到一弦的指法字符串转为 `ChordFingering`。`X` 表示闷弦，数字表示品位，例如 `"X32010"`。

#### `getChordPool(curriculum: ChordCurriculum): Chord[]`

根据题库级别返回和弦池。`beginner` 返回入门和弦，`all` 返回全部 21 个和弦。

#### `getChordNotes(chord: Chord, octave?: number): number[]`

获取和弦在指定八度的 MIDI 音符。

- `chord` — 和弦对象
- `octave` — 八度（默认 4）
- 返回 MIDI 编号数组

```typescript
getChordNotes({ root: 'C', type: 'major', name: 'C', intervals: [0,4,7] }, 4)
// [60, 64, 67] (C4, E4, G4)
```

#### `getFingeringPositions(fingering: ChordFingering): FretboardPosition[]`

获取某个真实指法中的发声位置，包括空弦，不包括闷弦。

#### `getFingeringMidiNotes(fingering: ChordFingering, tuning?: Tuning): number[]`

根据指法和调弦计算实际发声 MIDI 音符。默认使用标准调弦。

#### `formatChordFingering(fingering: ChordFingering): string`

把指法格式化为显示字符串，按 6弦→1弦输出，闷弦显示为 `X`。

#### `getChordPositions(chord: Chord, tuning?: Tuning): FretboardPosition[]`

获取和弦首个标准调弦真实指法中的发声位置，包括空弦，不包括闷弦。

- `chord` — 和弦对象
- `tuning` — 当前保留为兼容参数，实际位置来自标准指法库
- 返回位置数组，每项包含 `string`（弦索引）和 `fret`（品号）

#### `checkChordPositions(userPositions, correctPositions): boolean`

验证用户选择的和弦位置是否正确。排序后逐位置比较。

- `userPositions` — 用户选择的位置数组
- `correctPositions` — 正确位置数组
- 返回 `boolean`

---

## utils/majorScalePattern.ts — 大调指型

### 类型与常量

```typescript
type MajorKey = 'C' | 'G' | 'D' | 'A' | 'E' | 'B' | 'F♯' | 'D♭' | 'A♭' | 'E♭' | 'B♭' | 'F'
type MajorScalePatternId = 'mi' | 'sol' | 'la' | 'ti' | 're'

MAJOR_KEYS: MajorKey[]
MAJOR_KEY_SCALE_NOTES: Record<MajorKey, string[]>
MAJOR_SCALE_PATTERNS: MajorScalePatternId[]
MAJOR_SCALE_PATTERN_NAMES: Record<MajorScalePatternId, string>
```

`MAJOR_KEY_SCALE_NOTES` 使用真实调内音名，例如 D 大调为 `D E F♯ G A B C♯`，B♭ 大调为 `B♭ C D E♭ F G A`。

### 函数

#### `getMajorScalePattern(key: MajorKey, patternId: MajorScalePatternId): MajorScalePattern`

在标准调弦下按 `56 / 712 / 345 / 671 / 234` 级数循环生成 Mi/Sol/La/Ti/Re 指型形状，返回起止品位与形状内所有调内音位置。Mi 型从六弦空弦音开始。

#### `generateMajorScalePatternQuestionData(key, patternId): MajorScalePatternQuestionData`

从指定大调与指型区域中随机选择一个目标点，并返回其正确调内音名。

#### `checkMajorScalePatternNoteAnswer(answer: string, correctAnswer: string): boolean`

验证大调指型音名答案。必须与当前大调的真实调内音名完全一致。

---

## utils/practice.ts — 练习题目生成与验证

### 类型

```typescript
type PracticeType =
  | 'note-to-name-and-position'   // 听音高 → 音名 + 指板位置
  | 'position-to-name'            // 指板亮点 → 音名
  | 'note-name-to-all-positions'  // 音名 → 全部指板位置
  | 'chord-to-position'           // 和弦 → 指板位置
  | 'position-to-chord'           // 指板按和弦 → 和弦名
  | 'listen-to-chord'             // 听和弦 → 和弦名
  | 'pitch-direction'             // 高低比较
  | 'same-pitch-matching'         // 同音匹配 → 指板位置
  | 'reference-pitch-to-position' // 听音高 → 指板自由定位
  | 'interval-identification'     // 音程听辨
  | 'chord-quality'               // 大三 / 小三和弦辨别
  | 'major-scale-pattern-note-name' // 大调指型 → 音名

type PitchDirection = 'higher' | 'same' | 'lower'
type IntervalId = 'unison' | 'minor2' | 'major2' | 'minor3' | 'major3' | 'perfect4' | 'perfect5' | 'octave'
type IntervalCurriculum = 'beginner' | 'advanced'
type SamePitchCurriculum = 'beginner' | 'advanced'
type PlaybackDirection = 'ascending' | 'descending'
type ChordQuality = 'major' | 'minor'
type HighlightTone = 'selected' | 'prompt' | 'correct' | 'area'

type FretRange = 'all' | '1st' | '2nd' | '3rd'
type PositionSearchRange = '1st' | '2nd' | '3rd'

type PracticeFeedback = 'none' | 'correct' | 'wrong'
```

### 接口

```typescript
interface PracticeQuestion {
  id: number;                     // 唯一标识（递增）
  type: PracticeType;             // 练习类型
  midiNote?: number;              // 音符题目的 MIDI 编号
  chord?: Chord;                  // 和弦题目
  correctNoteName?: NoteName;     // 正确音名
  correctPosition?: { string: number; fret: number }; // 正确位置（参考）
  correctMidiNote?: number;       // 正确 MIDI 编号（用于验证位置）
  correctPositions?: { string: number; fret: number }[]; // 同音名位置题的全部答案
  correctChordFingerings?: ChordFingering[]; // 和弦题接受的真实指法
  correctChordPositions?: { string: number; fret: number }[]; // 和弦正确位置
  correctChordName?: string;      // 和弦正确名称
  firstMidi?: number;             // 序列第一个音
  secondMidi?: number;            // 序列第二个音
  correctPitchDirection?: PitchDirection;
  correctInterval?: IntervalId;
  intervalDirection?: PlaybackDirection;
  correctChordQuality?: 'major' | 'minor';
  playbackMidiNotes?: number[];   // 同时播放的和弦性质题音符
  targetMidi?: number;            // 同音匹配的目标音高
  candidatePositions?: { string: number; fret: number }[]; // 三个候选亮点
  majorKey?: MajorKey;            // 大调指型题的大调
  scalePatternId?: MajorScalePatternId; // Mi/Sol/La/Ti/Re
  scalePattern?: MajorScalePattern; // 当前大调指型数据
  scalePatternPositions?: { string: number; fret: number }[]; // 指型区域
  correctScaleNoteName?: string;  // 当前大调内的正确音名
}

interface PracticeStats {
  total: number;   // 答题数
  correct: number; // 正确数
}

interface FretHighlight {
  position: FretboardPosition;
  tone: HighlightTone;
}
```

### 常量

```typescript
PRACTICE_TYPE_NAMES: Record<PracticeType, string>
// 'note-to-name-and-position': '听音高 → 音名 + 指板位置'
// 'position-to-name': '指板亮点 → 音名'
// 'note-name-to-all-positions': '音名 → 全部指板位置'
// 'major-scale-pattern-note-name': '大调指型 → 音名'
// 'chord-to-position': '和弦 → 指板位置'
// 'position-to-chord': '指板按和弦 → 和弦名'
// 'listen-to-chord': '听和弦 → 和弦名'

FRET_RANGE_NAMES: Record<FretRange, string>
// 'all': '全部'
// '1st': '第一把位 (空弦、1-4品)'
// '2nd': '第二把位 (5-8品)'
// '3rd': '第三把位 (9-12品)'

FRET_RANGES: Record<FretRange, { min: number; max: number }>
// 'all': { min: 0, max: 15 }
// '1st': { min: 0, max: 4 }
// '2nd': { min: 5, max: 8 }
// '3rd': { min: 9, max: 12 }
```

### 函数

#### `generateQuestion(type, tuning?, fretRange?, chordCurriculum?, intervalCurriculum?, samePitchCurriculum?, majorKey?, scalePatternId?): PracticeQuestion`

生成练习题目。根据类型分发到音符题目或和弦题目生成。

- `type` — 练习类型
- `tuning` — 调弦配置（默认 STANDARD_TUNING）
- `fretRange` — 把位范围（默认 'all'）
- `majorKey` — 大调指型题的大调（默认 C）
- `scalePatternId` — 大调指型题的指型（默认 mi）
- 返回 `PracticeQuestion`

```typescript
generateQuestion('position-to-name', STANDARD_TUNING, '1st')
// 返回第一把位范围内的随机音符题目
```

#### `checkNoteNameAnswer(userAnswer: NoteName, correctAnswer: NoteName): boolean`

验证音名答案。直接比较。

#### `checkPositionAnswer(userPosition: { string: number; fret: number }, correctMidiNote: number, tuning: Tuning): boolean`

验证指板位置答案。计算用户位置的 MIDI 编号，与正确 MIDI 比较。接受任意能产生正确 MIDI 的位置。

```typescript
// F4 = MIDI 65
checkPositionAnswer({ string: 5, fret: 1 }, 65, STANDARD_TUNING) // true (1弦1品 = 64+1 = 65)
checkPositionAnswer({ string: 4, fret: 6 }, 65, STANDARD_TUNING) // true (2弦6品 = 59+6 = 65)
checkPositionAnswer({ string: 5, fret: 2 }, 65, STANDARD_TUNING) // false (1弦2品 = 66)
```

#### `getPositionsForNoteName(noteName: NoteName, tuning: Tuning, range: PositionSearchRange): FretboardPosition[]`

获取指定把位内所有同名自然音位置。第一把位包含空弦，第二、第三把位分别为 5-8、9-12 品。

#### `checkPositionSetAnswer(selected: FretboardPosition[], correct: FretboardPosition[]): boolean`

验证用户是否找全全部同名位置。顺序无关，数量和位置集合必须完全一致。

#### `generateSamePitchMatchingQuestion(tuning: Tuning, range: FretRange, curriculum: SamePitchCurriculum): PracticeQuestion`

生成同音匹配题：一个目标音高、一个正确位置和两个干扰位置。入门级优先使用距离较大的干扰音，进阶级优先使用相差 1-3 个半音的干扰音。

#### `checkSamePitchMatchingAnswer(selected: FretboardPosition | null, targetMidi: number, tuning: Tuning): boolean`

验证候选位置是否产生与目标完全相同的 MIDI 音高。同音名不同八度不算正确。

#### `checkChordNameAnswer(userAnswer: string, correctAnswer: string): boolean`

验证和弦名答案。直接比较。

#### `checkChordPositionAnswer(userPositions, acceptedFingerings): boolean`

验证和弦位置答案。接受已录入真实指法中的任意一个答案。

#### `checkChordFingeringAnswer(userPositions, acceptedFingerings): boolean`

验证用户选择的位置是否匹配任意一个可接受真实指法。

#### 新增练耳纯函数

```typescript
generatePitchDirectionQuestion(): PracticeQuestion
generateReferencePitchQuestion(tuning: Tuning, range: FretRange): PracticeQuestion
generateIntervalQuestion(curriculum: IntervalCurriculum): PracticeQuestion
generateChordQualityQuestion(): PracticeQuestion
checkPitchDirectionAnswer(answer, correct): boolean
checkIntervalAnswer(answer, correct): boolean
checkChordQualityAnswer(answer, correct): boolean
```

---

## hooks/useGuitarAudio.ts — 音频播放

### 接口

```typescript
interface UseGuitarAudioReturn {
  playNote: (midi: number) => void;       // 播放单音
  playChord: (midiNotes: number[]) => void; // 同时播放多个音
  playSequence: (midiNotes: number[], options?: {
    noteDurationMs?: number;
    gapMs?: number;
  }) => void;                               // 依次播放，开始前取消旧序列
  stopSequence: () => void;                 // 清除待播放序列
  status: 'loading' | 'ready' | 'error';  // SoundFont 状态
  error: string | null;                    // 加载错误信息
  retry: () => void;                       // 重新加载音频
}
```

### `useGuitarAudio(): UseGuitarAudioReturn`

音频播放 Hook。

- 由 `GuitarAudioProvider` 动态导入 `soundfont-player`，全应用只加载一次 `acoustic_guitar_nylon` 音色
- `playNote` 播放单音（duration 0.5s，gain = volume × 3）
- `playChord` 同时播放多个音（duration 0.8s，gain = volume × 3）
- 音量低于默认值，乘以 3 倍增益

```typescript
const { playNote, playChord, playSequence, stopSequence, status, error, retry } = useGuitarAudio();
playNote(60);           // 播放 C4
playChord([60, 64, 67]); // 播放 C 大三和弦
playSequence([60, 67]);  // 依次播放两个音
```

---

## hooks/usePractice.ts — 练习状态机

### 接口

```typescript
interface UsePracticeReturn {
  isActive: boolean;
  practiceType: PracticeType | null;
  question: PracticeQuestion | null;
  stats: PracticeStats;
  feedback: PracticeFeedback;
  fretRange: FretRange;
  positionSearchRange: PositionSearchRange;
  chordCurriculum: 'beginner' | 'all';
  intervalCurriculum: 'beginner' | 'advanced';
  samePitchCurriculum: 'beginner' | 'advanced';
  majorKey: MajorKey;
  scalePatternId: MajorScalePatternId;
  summary: PracticeSummary;
  fretHighlights: FretHighlight[];
  highlightedPositions: FretboardPosition[];
  playbackMidiNotes: number[];
  playbackKind: 'note' | 'sequence' | 'chord';
  selectedNote: NoteName | null;
  selectedPosition: FretboardPosition | null;
  selectedChord: Chord | null;
  selectedChordPositions: FretboardPosition[];
  selectedNotePositions: FretboardPosition[];
  selectedCandidatePosition: FretboardPosition | null;
  correctAnswer: {
    noteName?: NoteName;
    scaleNoteName?: string;
    position?: { string: number; fret: number };
    positions?: { string: number; fret: number }[];
    selectedPositions?: { string: number; fret: number }[];
    missingPositions?: { string: number; fret: number }[];
    extraPositions?: { string: number; fret: number }[];
    chordPositions?: { string: number; fret: number }[];
    chordName?: string;
    fingering?: string;
    pitchDirection?: PitchDirection;
    interval?: IntervalId;
    chordQuality?: 'major' | 'minor';
  } | null;

  startPractice: (type: PracticeType) => void;
  stopPractice: () => void;
  setFretRange: (range: FretRange) => void;
  setPositionSearchRange: (range: PositionSearchRange) => void;
  setChordCurriculum: (curriculum: 'beginner' | 'all') => void;
  setIntervalCurriculum: (curriculum: 'beginner' | 'advanced') => void;
  setSamePitchCurriculum: (curriculum: 'beginner' | 'advanced') => void;
  setMajorKey: (majorKey: MajorKey) => void;
  setScalePattern: (patternId: MajorScalePatternId) => void;
  selectNote: (note: NoteName) => void;
  selectChord: (chord: Chord) => void;
  clearChordPositions: () => void;
  clearNotePositions: () => void;
  clearCandidatePosition: () => void;
  submitNoteAndPosition: (name: NoteName, position: { string: number; fret: number }) => void;
  submitNoteName: (name: NoteName) => void;
  submitChordPositions: (positions?: FretboardPosition[]) => void;
  submitChordName: (name: string) => void;
  submitNotePositions: (positions?: FretboardPosition[]) => void;
  submitPitchDirection: (answer: PitchDirection) => void;
  submitInterval: (answer: IntervalId) => void;
  submitChordQuality: (answer: 'major' | 'minor') => void;
  submitSamePitchMatch: (position?: FretboardPosition | null) => void;
  submitMajorScalePatternNoteName: (name: string) => void;
  handleFretboardClick: (click: FretClick) => boolean;
  nextQuestion: () => void;
  clearSummary: () => void;
}
```

### `usePractice(tuning?: Tuning): UsePracticeReturn`

练习状态机 Hook。

**状态流转**：
1. `startPractice(type)` — 初始化统计，生成首题
2. 用户作答 → `submitNoteName` / `submitNoteAndPosition` / `submitChordPositions` / `submitChordName`
3. 验证答案 → 更新 `stats` 和 `feedback`
4. 答对 → 500ms 后自动生成新题；答错 → 显示正确答案，用户点"下一题"
5. `stopPractice()` — 重置所有状态

**特殊行为**：
- `setFretRange(range)` — 切换把位范围，如果正在练习则立即用新范围生成新题
- `submitNoteAndPosition` — 听音高模式专用，音名+位置一起验证，只算一道题
- `playbackMidiNotes` / `playbackKind` — 由当前题目派生，供 UI 决定播放单音、顺序音或和弦
- `fretHighlights` — 由当前题目、用户选择和反馈派生，供指板统一渲染高亮

---

## hooks/usePracticeSummary.ts — 学习摘要

### 常量

```typescript
MASTERY_WINDOW = 20
MASTERY_THRESHOLD = 0.8
```

学习记录保存到 `localStorage`，key 为 `digital-guitar-practice-summary-v1`。每个 progress key 只保留最近 20 次结果；最近 20 题正确率至少 80% 时视为已掌握。

### 接口

```typescript
interface PracticeSummaryEntry {
  total: number;
  correct: number;
  wrong: number;
}

interface RecentMistake {
  type: PracticeType;
  prompt: string;
  correctAnswer: string;
  answeredAt: string;
}

interface PracticeSummary {
  byType: Record<PracticeType, PracticeSummaryEntry>;
  mistakeCounts: Record<string, number>;
  recentMistakes: RecentMistake[];
  recentResults: Partial<Record<string, boolean[]>>;
}
```

### 函数

#### `createEmptySummary(): PracticeSummary`

创建包含全部练习类型初始统计的空摘要。

#### `loadPracticeSummary(): PracticeSummary`

从 `localStorage` 加载学习摘要，并对非法或旧数据做容错回退。

#### `usePracticeSummary()`

返回 `{ summary, recordAnswer, clearSummary }`。`recordAnswer(type, prompt, correctAnswer, isCorrect, progressKey?)` 会更新累计统计、最近结果和最近错题。

#### `getPracticeMastery(summary: PracticeSummary, key: string)`

根据 progress key 返回 `{ answered, accuracy, mastered }`。

---

## hooks/useSettings.ts — 设置持久化

### 接口

```typescript
interface Settings {
  showNoteNames: boolean;                // 是否显示音名（默认 false）
  noteDisplayMode: 'natural' | 'octave'; // 音名格式：不带八度十二音 / 带八度（默认 'natural'）
  volume: number;                        // 音量 0-1（默认 0.5）
  theme: 'wood' | 'metal';              // 主题（默认 'wood'）
  tuning: Tuning;                        // 调弦（默认 STANDARD_TUNING）
}

interface UseSettingsReturn {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
  setShowNoteNames: (show: boolean) => void;
  setNoteDisplayMode: (mode: 'natural' | 'octave') => void;
  setVolume: (volume: number) => void;
  setTheme: (theme: 'wood' | 'metal') => void;
  setTuning: (tuning: Tuning) => void;
  resetToDefault: () => void;
}
```

### `useSettings(): UseSettingsReturn`

设置读写 Hook。

- 从 `localStorage`（key: `digital-guitar-settings-v2`）加载设置，并迁移旧键 `digital-guitar-settings`
- 任何设置变更自动保存到 `localStorage`
- `resetToDefault()` 恢复所有设置为默认值
