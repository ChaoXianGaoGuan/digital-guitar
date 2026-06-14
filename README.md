# 数字吉他 (Digital Guitar)

一个基于浏览器的虚拟吉他指板工具，用于建立"音名 ↔ 音高 ↔ 指板位置"的三角关系，帮助吉他学习者从"六线谱翻译机"进阶到能够独立改编歌曲。

在线使用：[https://chaoxiangaoguan.github.io/digital-guitar/](https://chaoxiangaoguan.github.io/digital-guitar/)

---

## 功能概览

### 自由弹奏模式

- 6弦 × 15品 指板，从上到下为一弦到六弦
- 左侧空弦按钮（虚线表示），与指板弦线对齐
- 点击任意位置播放对应音高，出现蓝色亮点（1秒后消失）
- 多个声音可同时播放（模拟和弦效果）
- 快速连续点击同一位置，每次都重新播放

### 练习模式（11种）

| 分组 | 类型 | 答题方式 |
|------|------|----------|
| 指板训练 | 指板亮点 → 音名 | 根据蓝色亮点与同步播放的音高选择音名 |
| 指板训练 | 音名 → 全部指板位置 | 在指定把位找出全部同名位置，手动提交 |
| 练耳训练 | 高低比较 | 顺序听两个音，选择更高 / 相同 / 更低 |
| 练耳训练 | 同音匹配 → 指板位置 | 试听三个候选亮点，选择与目标完全相同的音高 |
| 练耳训练 | 音程听辨 | 选择具体音程，支持入门与进阶题库 |
| 练耳训练 | 大三 / 小三和弦辨别 | 听三和弦并判断性质 |
| 练耳训练 | 听音高 → 指板自由定位 | 进阶选修：仅凭听觉点击任意相同 MIDI 音高位置 |
| 练耳训练 | 听音高 → 音名 + 指板位置 | 选音名按钮 + 点击指板位置，两者都选后自动提交 |
| 和弦训练 | 和弦 → 指板位置 | 点击真实指法中的发声位置，手动提交 |
| 和弦训练 | 指板按和弦 → 和弦名 | 根据完整指法选择和弦名 |
| 和弦训练 | 听和弦 → 和弦名 | 听和弦并选择具体名称 |

**练习特性**：
- 即时反馈：答对直接下一题，答错显示正确答案并在指板标出正确位置
- 统计信息：实时显示答题数、正确数、正确率
- 把位范围选择：全部 / 第一把位(空弦、1-4品) / 第二把位(5-8品) / 第三把位(9-12品)
- “音名 → 全部指板位置”使用独立范围：第一把位包含空弦，仅提供第一、第二、第三把位
- “同音匹配 → 指板位置”提供入门与进阶级别，候选点点击后可试听，手动提交答案
- 练习类型可直接切换，无需返回主界面
- 需要点击指板作答的题型中，点击品位和空弦都会发声
- 非标准调弦下禁用三种和弦练习
- 学习记录保存累计统计与最近 20 条错题
- 每种题型保留最近 20 次结果；达到 20 题且正确率至少 80% 时标记“已掌握”
- 推荐学习路径从高低比较开始，所有训练仍可自由进入

### 设置

- 音名显示切换（默认隐藏）
- 音名格式：自然音 (C D E F G A B) 或 带八度 (C4 D4 E4)
- 音量控制
- 主题风格：木质纹理 / 金属纹理
- 调弦设置：预设 Standard / Drop D / Open G + 自定义

---

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
# 浏览器访问 http://localhost:5173/

# 运行测试
npm test

# 构建生产版本
npm run build
```

---

## 技术栈

| 层级 | 技术 | 用途 |
|------|------|------|
| 框架 | React 19 + TypeScript | UI 组件与类型安全 |
| 构建 | Vite 8 | 开发服务器与打包 |
| 音频 | soundfont-player | 加载 SoundFont 音色播放 MIDI |
| 持久化 | localStorage | 保存用户设置 |
| 测试 | Vitest + Testing Library | 单元测试 |

---

## 项目结构

```
digital guitar/
├── index.html                          # 入口 HTML
├── package.json                        # 依赖与脚本
├── vite.config.ts                      # Vite 构建配置
├── vitest.config.ts                    # 测试配置
├── tsconfig.json                       # TypeScript 项目引用
│
├── plans/
│   └── digital-guitar-spec.md          # 需求规格说明书
│
├── docs/
│   └── API.md                          # API 参考文档
│
└── src/
    ├── main.tsx                        # React 入口
    ├── App.tsx                         # 根组件，协调所有子组件和 Hook
    ├── App.css                         # 全局样式导入
    ├── index.css                       # CSS 重置
    │
    ├── components/                     # UI 组件
    │   ├── Fretboard.tsx               # 指板网格（6弦×15品）
    │   ├── FretCell.tsx                # 空弦与普通品位共享的交互单元
    │   ├── GuitarAudioProvider.tsx     # 全应用共享音频服务
    │   ├── NoteButtons.tsx             # 音名选择按钮 (C/D/E/F/G/A/B)
    │   ├── ChordButtons.tsx            # 和弦名选择按钮（大三/小三/七）
    │   ├── PracticeMode.tsx            # 练习模式主组件
    │   ├── PracticeStats.tsx           # 练习统计显示
    │   ├── SettingsModal.tsx           # 设置弹窗
    │   └── TuningModal.tsx             # 调弦设置弹窗
    │
    ├── hooks/                          # 自定义 Hook
    │   ├── useGuitarAudio.ts           # 音频加载与播放
    │   ├── usePractice.ts              # 练习状态机（题目、验证、统计）
    │   └── useSettings.ts              # 设置读写与 localStorage 持久化
    │
    ├── utils/                          # 纯函数工具
    │   ├── note.ts                     # MIDI ↔ 音名转换
    │   ├── tuning.ts                   # 调弦配置定义
    │   ├── chord.ts                    # 和弦定义、位置计算
    │   └── practice.ts                 # 题目生成与答案验证
    │
    ├── styles/
    │   └── fretboard.css               # 指板、练习模式、弹窗等全部样式
    │
    └── __tests__/
        ├── note.test.ts                # 音符工具测试
        └── chord.test.ts               # 和弦工具测试
```

---

## 架构设计

### 组件层级

```
App
├── PracticeMode（练习模式时显示）
│   ├── 练习类型下拉切换器
│   ├── 把位范围选择器
│   ├── 题目区域
│   ├── PracticeStats（统计信息）
│   ├── NoteButtons（音名按钮）
│   └── ChordButtons（和弦名按钮）
├── Fretboard（始终显示）
│   └── FretCell × 96（6 个空弦 + 90 个品位）
└── SettingsModal（设置弹窗）
    └── TuningModal（调弦弹窗）
```

### 数据流

项目有 3 个核心 Hook 和 1 个音频 Provider，各司其职：

```
useSettings（设置层）
├── 从 localStorage 加载/保存设置
├── 提供调弦、音量、主题、音名显示模式
└── 任何设置变更自动持久化

GuitarAudioProvider + useGuitarAudio（音频层）
├── 初始化 AudioContext
├── 加载 SoundFont（acoustic_guitar_nylon）
├── 提供 playNote(midi)、playChord(midiNotes[]) 和可取消的 playSequence(midiNotes[])
└── 全应用共享一个实例，音量由 settings.volume 控制

usePractice（练习状态机）
├── 管理：isActive, practiceType, question, stats, feedback
├── 生成题目：根据练习类型、调弦、把位范围
├── 验证答案：比较用户输入与正确答案
└── 反馈机制：答对自动下一题，答错显示正确答案
```

**App.tsx 的协调逻辑**：
1. 将 `settings.tuning` 传给 `usePractice` 和 `Fretboard`
2. 将 `settings.volume` 传给 `GuitarAudioProvider`
3. 将统一的 `FretClick` 事件交给 `usePractice` 控制器处理
4. 通过当前题目、反馈和用户选择派生指板高亮状态

### 关键设计决策

| 决策 | 原因 |
|------|------|
| 类型导入用 `import type` | TypeScript 编译时擦除接口，Vite 要求显式声明 |
| 高亮由练习状态派生 | 避免依赖强制重挂载刷新指板 |
| App 直接持有练习控制器 | 统一路由指板点击，避免跨组件 ref 回调 |
| SoundFont 动态导入 | soundfont-player 是 CommonJS 模块，需要 `import()` 转换 |
| 全应用共享一个音频 Provider | 避免重复加载 SoundFont，并让音量设置立即生效 |
| 音量乘以 3 | SoundFont 默认音量偏低，放大 3 倍达到舒适听感 |
| 空弦弦序反转显示 | tuning.strings 存储顺序是 6弦→1弦，显示需要 1弦→6弦 |

---

## 数据模型

### MIDI 音符编号

MIDI 编号是项目的底层数据基础：

- **标准调弦**：E2=40, A2=45, D3=50, G3=55, B3=59, E4=64
- **计算规则**：`MIDI = (八度+1) × 12 + 半音索引`，其中 C=0, C♯=1, D=2, ..., B=11
- **品的计算**：`某品MIDI = 空弦MIDI + 品号`

### 音名映射

```
半音索引:  0   1   2   3   4   5   6   7   8   9   10  11
完整音名:  C   C♯  D   D♯  E   F   F♯  G   G♯  A   A♯  B
自然大调:  C   C   D   D   E   F   F   G   G   A   A   B
```

### 调弦配置

```typescript
interface Tuning {
  id: string;
  name: string;
  strings: [number, number, number, number, number, number];
}
```

### 和弦定义

```typescript
interface Chord {
  root: NoteName;           // 根音 (C/D/E/F/G/A/B)
  type: ChordType;          // 大三/小三/七
  name: string;             // 显示名 (C, Am, G7)
  intervals: number[];      // 音程（半音数），如大三=[0,4,7]
  tier: 'beginner' | 'full';
  fingerings: ChordFingering[]; // 真实六弦指法，null=闷弦，0=空弦
}
```

---

## 练习模式详解

### 出题逻辑

- **音符题目**：在指定把位范围内，随机选择一个自然大调音符的 MIDI 编号，计算其在指板上的位置
- **和弦题目**：默认从 14 个入门和弦中随机选择，可切换完整 21 和弦题库；答案来自标准调弦真实指法库
- **唯一标识**：每道题有递增的 `id`，确保 React effect 总是触发

### 评判标准

- **音名**：必须完全一致（C 答成 D 算错）
- **指板位置**：接受任意能产生正确 MIDI 编号的位置。例如播放 F4，在 1弦1品(F4) 或 2弦6品(F4) 点击都算正确；点 F3 或 F5 算错
- **和弦位置**：手动提交，空弦也需要选择，闷弦无需选择；匹配任意已录入的真实指法即可
- **和弦名**：必须完全一致（C 答成 Cm 算错）

### 交互流程

```
选择练习类型
    ↓
生成题目 + 设置高亮 + 播放音频（如需要）
    ↓
用户作答（点击音名按钮 / 点击指板位置）
    ↓
验证答案
    ├── 正确 → 显示"正确" → 500ms后自动下一题
    └── 错误 → 显示正确答案 + 指板标出正确位置 → 点击"下一题"继续
    ↓
更新统计（答题数、正确数、正确率）
```

---

## 扩展指南

### 添加新的练习类型

1. 在 `src/utils/practice.ts` 的 `PracticeType` 联合类型中添加新类型
2. 在 `PRACTICE_TYPE_NAMES` 中添加中文名
3. 在 `generateQuestion()` 中添加分支，调用新的题目生成函数
4. 在 `PracticeMode.tsx` 的 `renderQuestion()` 和 `renderAnswerInput()` 中添加对应 UI
5. 在 `usePractice.ts` 中添加对应的提交函数

### 添加新的调弦预设

1. 在 `src/utils/tuning.ts` 中定义新的 `Tuning` 对象
2. 添加到 `PRESET_TUNINGS` 数组
3. `TuningModal.tsx` 会自动根据预设数组渲染按钮

### 添加新的主题风格

1. 在 `useSettings.ts` 的 `Settings` 接口中扩展 `theme` 类型
2. 在 `fretboard.css` 中添加对应的 CSS 规则（如 `.metal .fretboard { ... }`）
3. 在 `SettingsModal.tsx` 的主题选择下拉菜单中添加选项

### 替换音色

在 `GuitarAudioProvider.tsx` 中修改 `soundfont.instrument()` 的第二个参数：

```typescript
// 可选音色：acoustic_guitar_steel, electric_guitar_clean, piano 等
const instrument = await Soundfont.instrument(audioContext, 'acoustic_guitar_steel');
```

---

## 已知限制与待改进

| 限制 | 说明 |
|------|------|
| 音色单一 | 当前使用尼龙弦吉他 SoundFont，可替换为其他音色 |
| 和弦指法范围 | 已内置 21 个标准调弦常用指法；非标准调弦暂不开放和弦练习 |
| 练习记录粒度 | 本地保存累计摘要与最近 20 条错题，不保存完整历史曲线 |
| 无升降号练习 | 练习答案按钮只有自然音 (C/D/E/F/G/A/B) |

---

## 测试

```bash
# 运行所有测试
npm test

# 监听模式（文件变化自动重跑）
npm run test:watch
```

测试覆盖：
- `note.test.ts`：MIDI ↔ 音名转换、自然大调音符范围过滤
- `chord.test.ts`：真实和弦指法、音程、题库和位置验证
- `settings.test.ts`、`tuning.test.ts`：设置迁移与调弦预设
- `usePractice.test.ts`、`practice-summary.test.ts`：状态机定时器与学习记录
- `fretboard.test.tsx`、`guitar-audio-provider.test.tsx`：空弦交互与共享音频服务

---

## 许可证

仅供个人学习使用。
