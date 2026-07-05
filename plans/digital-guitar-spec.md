# 数字吉他 — Spec

## Intent
帮助用户建立"音名 ↔ 音高 ↔ 指板位置"的三角关系，以及和弦的类似对应关系，为改编歌曲（弹唱+指弹）打下基础。

## User-Facing Behaviour

### 自由弹奏模式
1. 打开页面，看到 6弦×15品 的指板，左侧有空弦按钮（虚线）
2. 点击指板上的弦段或空弦按钮，播放对应音高，出现蓝色亮点，1秒后消失
3. 多个声音可以同时响（像和弦一样）
4. 快速连续点击同一位置，每次都重新播放

### 练习模式
1. 从下拉菜单选择练习类型
2. 指板上方出现题目区域、答案按钮区域、统计信息
3. 答对 → 直接下一题
4. 答错 → 显示正确答案 + 指板标出正确位置，点击"下一题"继续
5. 练习模式下，仅需要点击指板作答的题型会响应点击并播放对应音符

### 十二种练习类型

入口分为“指板训练 / 练耳训练 / 和弦训练”，所有题型始终可自由进入。

1. **指板亮点 → 音名**：指板出现蓝色亮点并同步播放对应音高，用户点击音名按钮提交，可重新听音
2. **音名 → 全部指板位置**：显示自然音名，用户在指定把位找出全部同名位置；第一把位包含空弦，手动提交
3. **大调指型 → 音名**：选择 12 大调之一和 Mi/Sol/La/Ti/Re 指型，高亮区域后识别目标点音名；仅支持标准调弦
4. **高低比较**：顺序播放两个十二音 MIDI 音符，选择更高、相同或更低
5. **同音匹配 → 指板位置**：播放目标音，试听三个候选亮点并手动提交相同 MIDI 音高的位置
6. **音程听辨**：入门级使用六种上行音程；进阶级加入小二、小三并随机上下行
7. **大三 / 小三和弦辨别**：播放紧凑排列三和弦，仅判断性质
8. **听音高 → 指板自由定位**：进阶选修；播放一个音，点击任意相同 MIDI 音高的位置
9. **听音高 → 音名 + 指板位置**：播放声音，用户点击音名按钮 + 点击指板位置，两件事都做完后自动提交
10. **和弦 → 指板位置**：显示和弦名，点击真实指法中的发声位置，手动提交
11. **指板按和弦 → 和弦名**：指板出现多个亮点，用户点击和弦名按钮提交
12. **听和弦 → 和弦名**：播放和弦声音，用户点击和弦名按钮提交

### 设置
- 点击"设置"按钮打开弹窗
- 音名显示切换（默认隐藏）
- 音量控制
- 主题风格（木质纹理、金属纹理）
- 调弦设置（6个下拉菜单，每个列出12个半音）
- 预设调弦：标准（E-A-D-G-B-E）、Drop D（D-A-D-G-B-E）、Open G（D-G-D-G-B-D）

### 统计
- 练习模式下显示：答题数、正确数、正确率

## Technical Approach

### 项目结构
```
F:\XiaoChen\pdf\musics\digital guitar\
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── vitest.config.ts
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── components/
    │   ├── Fretboard.tsx           # 指板网格
    │   ├── FretCell.tsx            # 空弦与普通品位共享单元
    │   ├── GuitarAudioProvider.tsx # 全应用共享音频服务
    │   ├── PracticeMode.tsx        # 练习模式主组件
    │   ├── NoteButtons.tsx         # 音名按钮（C/D/E/F/G/A/B）
    │   ├── ChordButtons.tsx        # 和弦名按钮
    │   ├── PracticeStats.tsx       # 统计信息
    │   ├── SettingsModal.tsx       # 设置弹窗
    │   └── TuningModal.tsx         # 调弦弹窗
    ├── hooks/
    │   ├── useGuitarAudio.ts       # SoundFont 音频钩子
    │   ├── usePractice.ts          # 练习逻辑钩子
    │   └── useSettings.ts          # 设置持久化钩子
    ├── utils/
    │   ├── tuning.ts               # 调弦配置（标准/自定义）
    │   ├── note.ts                 # MIDI→音名转换
    │   ├── chord.ts                # 和弦定义
    │   ├── majorScalePattern.ts    # 12 大调与 Mi/Sol/La/Ti/Re 指型
    │   └── practice.ts             # 练习题目生成
    ├── __tests__/
    │   ├── Fretboard.test.tsx
    │   ├── PracticeMode.test.tsx
    │   ├── usePractice.test.ts
    │   ├── note.test.ts
    │   └── chord.test.ts
    └── styles/
        └── fretboard.css
```

### 依赖
- react, react-dom
- soundfont-player（音频播放）
- vitest, @testing-library/react, @testing-library/jest-dom（测试）

### 数据模型
```typescript
// 调弦
interface Tuning {
  id: string;
  name: string;
  strings: [number, number, number, number, number, number];
}

// 设置
interface Settings {
  showNoteNames: boolean;
  volume: number;
  theme: 'wood' | 'metal';
  tuning: Tuning;
}

// 练习类型
type PracticeType = 
  | 'note-to-name-and-position'  // 听音高→音名+指板位置
  | 'position-to-name'           // 指板亮点→音名
  | 'note-name-to-all-positions' // 音名→全部指板位置
  | 'chord-to-position'          // 和弦→指板位置
  | 'position-to-chord'          // 指板按和弦→和弦名
  | 'listen-to-chord'            // 听和弦→和弦名
  | 'pitch-direction'            // 高低比较
  | 'same-pitch-matching'        // 同音匹配→指板位置
  | 'reference-pitch-to-position'// 听音高→指板自由定位
  | 'interval-identification'    // 音程听辨
  | 'chord-quality'              // 大三/小三和弦辨别
  | 'major-scale-pattern-note-name'; // 大调指型→音名

// 练习状态
interface PracticeState {
  type: PracticeType;
  currentQuestion: Question;
  stats: { total: number; correct: number };
  feedback: 'none' | 'correct' | 'wrong';
}

// 和弦类型
type ChordType = 'major' | 'minor' | 'dominant7';
```

### 音频方案
使用 `soundfont-player` 库加载尼龙弦吉他音色 `acoustic_guitar_nylon`，通过全局 Provider 共享实例。Provider 提供单音、同时和弦与可取消的顺序播放；切题、切换范围和离开练习时清理旧序列。

### 持久化
使用 localStorage 保存设置（`digital-guitar-settings-v2`）与学习摘要（`digital-guitar-practice-summary-v1`），并兼容旧设置键迁移。摘要按题型保存最近 20 次结果，达到 20 题且正确率至少 80% 时显示“已掌握”。

## Edge Cases (Resolved)
- SoundFont 加载失败：显示错误信息
- 快速连续点击同一根弦：每次都重新播放（像现实吉他重新拨弦）
- 同时点击多个位置：多个声音同时响（像和弦）
- 练习模式下点击指板：只在需要指板输入的题型中响应，空弦和普通品位规则一致
- 和弦练习点错位置：有清除按钮可重选
- 大调指型练习：非标准调弦下禁用，答案按钮使用当前大调的真实调内音名

## Edge Cases (Deferred)
- 练习范围自定义 UI：deferred — 初版默认 C4-B4 范围，后续加范围选择器
- 和弦把位选择 UI：deferred — 初版固定低把位，后续加把位选择

## Release Plan
- Testing：Vitest + React Testing Library，自动化测试
- Testing 优先级：
  1. 练习模式正确性（题目生成、答案验证、统计）
  2. 指板交互（点击发声、蓝色亮点）
  3. 设置和持久化
- Rollout：本地开发，直接使用
- Metrics：功能正常运行
- Rollback：无（本地项目）
- Comms：无

## Open Questions
- 无
