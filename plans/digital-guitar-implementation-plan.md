# 数字吉他实施计划书

**实施方式**：在当前项目内渐进重构，保留可用功能与 localStorage 数据，不创建第二套工程。

## 1. 项目目标

构建一个浏览器端数字吉他学习工具，帮助用户建立“音名 ↔ 音高 ↔ 指板位置”关系，并练习常用和弦。项目保持纯前端架构，不引入后端、登录或云同步。

交付标准：

- 自由弹奏、十二种练习、设置、真实和弦指法、大调指型与学习记录全部可用。
- 空弦和普通品位使用同一套交互与视觉规则。
- `npm run lint`、`npm test`、`npm run build` 全部通过。
- 桌面、窄屏和键盘操作完成浏览器验收。

## 2. 技术架构

### 2.1 领域模型

音乐规则使用纯函数实现，不放入 React 组件。

```ts
interface Tuning {
  id: string;
  name: string;
  strings: [number, number, number, number, number, number]; // 6弦 -> 1弦
}

interface FretboardPosition {
  string: 0 | 1 | 2 | 3 | 4 | 5;
  fret: number; // 0 = 空弦
}

type FretValue = number | null; // null = 闷弦

interface ChordFingering {
  frets: [FretValue, FretValue, FretValue, FretValue, FretValue, FretValue];
}

interface Chord {
  name: string;
  root: NoteName;
  type: 'major' | 'minor' | 'dominant7';
  tier: 'beginner' | 'full';
  fingerings: ChordFingering[];
}
```

模块职责：

- `note.ts`：MIDI、音名、八度和 `♯` 显示转换。
- `tuning.ts`：Standard、Drop D、Open G 与自定义调弦。
- `chord.ts`：标准调弦下 21 个真实低把位指法。
- `practice.ts`：出题、判题和答案格式化纯函数。

固定预设：

- Standard：`E-A-D-G-B-E`
- Drop D：`D-A-D-G-B-E`
- Open G：`D-G-D-G-B-D`

### 2.2 练习状态机

使用 reducer 管理练习，不在 UI 中分散维护计分规则。`generateQuestion()` 只负责出题，判题使用纯函数，`practiceReducer()` 处理切题、选择、反馈和计分。

```ts
type PracticeType =
  | 'note-to-name-and-position'
  | 'position-to-name'
  | 'note-name-to-all-positions'
  | 'chord-to-position'
  | 'position-to-chord'
  | 'listen-to-chord'
  | 'pitch-direction'
  | 'same-pitch-matching'
  | 'reference-pitch-to-position'
  | 'interval-identification'
  | 'chord-quality'
  | 'major-scale-pattern-note-name';

interface PracticeConfig {
  fretRange: 'all' | '1st' | '2nd' | '3rd';
  chordCurriculum: 'beginner' | 'all';
  intervalCurriculum: 'beginner' | 'advanced';
  samePitchCurriculum: 'beginner' | 'advanced';
  majorKey: MajorKey;
  scalePatternId: MajorScalePatternId;
}

interface PracticeSession {
  type: PracticeType;
  question: PracticeQuestion;
  feedback: 'none' | 'correct' | 'wrong';
  stats: { total: number; correct: number };
}
```

- 答对后 500ms 自动下一题；答错后停留并显示答案。
- 停止练习、切换题型或切换范围时取消旧定时器。
- 反馈出现后禁止重复提交和重复计分。

### 2.3 音频服务

使用全局 `GuitarAudioProvider`：

```ts
interface GuitarAudioApi {
  status: 'loading' | 'ready' | 'error';
  playNote(midi: number): void;
  playChord(notes: number[]): void;
  retry(): void;
}
```

- 全应用只创建一次 `AudioContext` 和尼龙弦吉他 SoundFont。
- 首次播放前调用 `AudioContext.resume()`。
- 音量从设置注入，变化后立即生效。
- 页面不因音色加载而整体阻塞；听音入口在未就绪时禁用并显示状态。
- 加载失败时显示重试按钮。

### 2.4 UI 组件

- `Fretboard`：统一生成 6 个空弦与 90 个品位。
- `FretCell`：空弦和普通品位共用亮点、音名、点击和键盘样式。
- `PracticeMode`：根据题型组合题目区、答案区和反馈区。
- `SettingsModal`：音名、音量、主题和调弦。
- `LearningRecord`：累计统计、最近错题和清空操作。

统一事件接口：

```ts
interface FretClick {
  position: FretboardPosition;
  midi: number;
}
```

不使用强制 remount、跨组件 ref 回调或 UI 内部音乐规则。高亮状态由题目、选择和反馈派生。

## 3. 用户功能

### 3.1 自由弹奏

- 点击空弦或品位立即发声。
- 亮点显示 1 秒；重复点击重新计时并重新播放。
- 多个音符可以同时发声。
- 音名支持隐藏、不带八度十二音音名和带八度格式。
- 空弦与普通品位的亮点、文字层级和触控反馈完全一致。

### 3.2 十二种练习

1. **听音高 → 音名 + 位置**：播放单音；选择自然音名并点击任意同 MIDI 位置。
2. **亮点 → 音名**：指板显示一个蓝色亮点；只允许选择音名。
3. **音名 → 全部位置**：显示自然音名；在指定把位找出全部同名位置；第一把位包含空弦；手动提交。
4. **大调指型 → 音名**：选择 12 大调和 Mi/Sol/La/Ti/Re 指型，在级数形状中识别目标点音名。
5. **和弦 → 位置**：点击真实指法中的发声位置，包括空弦；闷弦无需选择；手动提交。
6. **亮点和弦 → 和弦名**：显示真实指法中的全部发声位置；选择和弦名。
7. **听和弦 → 和弦名**：播放真实指法发出的 MIDI 音符；选择和弦名。
8. **高低比较**：顺序播放两个十二音 MIDI 音符；选择“更高 / 相同 / 更低”。
9. **同音匹配 → 指板位置**：播放目标音；试听三个候选亮点，手动提交相同 MIDI 音高的位置。
10. **听音高 → 指板自由定位**：进阶选修；播放一个十二音 MIDI 音符，点击任意同 MIDI 指板位置。
11. **音程听辨**：入门级使用六种上行音程；进阶级加入小二度、小三度与随机上下行。
12. **大三 / 小三和弦辨别**：播放随机根音的紧凑排列三和弦；只判断和弦性质。

调弦边界：

- Standard 支持全部练习。
- Drop D、Open G 和自定义调弦支持自由弹奏与不依赖标准指法的音名/练耳练习。
- 非 Standard 调弦下禁用和弦练习与大调指型练习，并显示原因。

### 3.3 设置与记录

设置使用 `digital-guitar-settings-v2` 保存，并迁移旧键 `digital-guitar-settings`。

```ts
interface Settings {
  showNoteNames: boolean;
  noteDisplayMode: 'natural' | 'octave';
  volume: number;
  theme: 'wood' | 'metal';
  tuning: Tuning;
}
```

学习摘要使用 `digital-guitar-practice-summary-v1`：

```ts
interface PracticeSummary {
  byType: Record<PracticeType, {
    total: number;
    correct: number;
    wrong: number;
  }>;
  mistakeCounts: Record<string, number>;
  recentMistakes: Array<{
    type: PracticeType;
    prompt: string;
    correctAnswer: string;
    answeredAt: string;
  }>;
  recentResults: Partial<Record<string, boolean[]>>;
}
```

近期错题最多保留 20 条，清空记录前显示确认弹窗。

## 4. 实施步骤

1. 整理现有代码，保留测试、文档和 localStorage 兼容入口。
2. 重写音名、调弦和真实和弦指法纯函数。
3. 用 reducer 替换分散的练习状态逻辑。
4. 实现单例音频 Provider，并让页面在音色加载期间仍可浏览。
5. 合并空弦与普通品位为统一 `FretCell`。
6. 接入自由弹奏与十二种练习模式。
7. 接入设置迁移、学习摘要和错误反馈。
8. 增加键盘操作、Esc 关闭弹窗、焦点管理和窄屏样式。
9. 同步 README、规格和 API 文档。
10. 执行自动化与浏览器验收。

## 5. 测试计划

必须通过：

```bash
npm run lint
npm test
npm run build
```

自动化覆盖：

- MIDI、自然音、`♯` 与八度转换。
- Standard、Drop D、Open G 和自定义调弦校验。
- 21 个真实和弦指法的音符组成、空弦和闷弦解析。
- 六种题型的出题、正确、错误、重复提交和定时器取消。
- 非 Standard 调弦下和弦练习禁用。
- 空弦与普通品位的点击、亮点、音名层级和键盘操作一致。
- 音频 Provider 单例、音量变化、上下文恢复和失败重试。
- localStorage 迁移、非法数据回退、错题上限与清空确认。

浏览器验收：

- 自由弹奏中快速重复点击和同时播放多个音。
- Standard 下完成一个包含空弦的和弦题。
- 切换 Open G 后确认和弦练习禁用。
- 桌面与窄屏布局可用。
- Tab 键可访问主要控件，Esc 可关闭弹窗。

## 6. 非目标

本轮不加入：

- 独立的十二音/降号专项练习。
- 自适应出题。
- 节拍器。
- 麦克风识别。
- 歌曲训练。
- 后端、登录或云同步。

## 7. 后续扩展

1. 十二音、调性和自定义音符集合。
2. 错题加权与薄弱项强化。
3. 单次练习总结和指板热力图。
4. 多把位和弦、横按和弦与转位。
5. 节拍器、和弦进行和真实吉他输入。
