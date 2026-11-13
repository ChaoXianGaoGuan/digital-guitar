import { useEffect, useState } from 'react';
import type { PracticeController } from '../hooks/usePractice';
import { useGuitarAudio } from '../hooks/useGuitarAudio';
import { getPracticeMastery } from '../hooks/usePracticeSummary';
import { getFingeringMidiNotes } from '../utils/chord';
import { CHROMATIC_NAMES } from '../utils/note';
import {
  canStartHarmony, completeAnswer, HARMONY_KEYS, POP_PROGRESSIONS,
  QUALITY_LABELS, sameTriad, triadFingering, triadName
} from '../utils/harmony';
import type { Triad, TriadQuality } from '../utils/harmony';

interface Props { practice: PracticeController }

export function HarmonyPractice({ practice }: Props) {
  const audio = useGuitarAudio();
  const { playChord, stopSequence, status } = audio;
  const {
    question, practiceType, harmonyConfig: config, harmonyReady,
    harmonyAnswers: answers, harmonyIndex: index, harmonyPreview: preview,
    harmonyPreviewSource: source, harmonyRevision, feedback, stats,
    setHarmonyConfig, beginHarmony, selectHarmonyAnswer, focusHarmonyAnswer,
    previewHarmony, submitHarmony, editHarmonyConfig, nextQuestion,
    customProgressions, addCustomProgression, removeCustomProgression, summary
  } = practice;
  const [customInput, setCustomInput] = useState('');
  const [inputError, setInputError] = useState('');
  const [playing, setPlaying] = useState(false);
  const progression = practiceType === 'chord-progression';
  const data = question?.harmony;
  const submitted = feedback !== 'none';

  useEffect(() => {
    if (source === 'sequence') return;
    stopSequence();
    if (preview && status === 'ready') playChord(getFingeringMidiNotes(triadFingering(preview)));
  }, [preview, source, harmonyRevision, playChord, status, stopSequence]);

  useEffect(() => stopSequence, [stopSequence, question?.id]);

  const stop = () => { stopSequence(); setPlaying(false); };
  const toggle = <T,>(items: T[], item: T): T[] => items.includes(item)
    ? items.filter(value => value !== item) : [...items, item];
  const listen = (chord: Triad, which: 'answer' | 'correct') => {
    stop(); previewHarmony(chord, index, which);
  };
  const playProgression = () => {
    if (!data) return;
    stop(); setPlaying(true);
    audio.playChordSequence(data.chords.map(chord => getFingeringMidiNotes(triadFingering(chord))), {
      onStep: step => previewHarmony(data.chords[step], step, 'sequence'),
      onComplete: () => setPlaying(false)
    });
  };

  if (!harmonyReady || !data) {
    const choices = [
      ...POP_PROGRESSIONS,
      ...customProgressions.filter(p => !POP_PROGRESSIONS.some(item => item.degrees === p))
        .map(degrees => ({ degrees, name: '自定义走向', source: '' }))
    ];
    return (
      <div className="harmony-workspace">
        <div className="harmony-intro">
          <div><span className="harmony-eyebrow">和弦训练 · 准备</span>
            <h2>{progression ? '让级数连成音乐' : '把级数变成和弦'}</h2>
            <p>{progression ? '选择常见走向，练习在不同调中写出整条和弦。' : '看到调名和级数，找到它对应的顺阶三和弦。'}</p>
          </div>
          <span className="harmony-tag">不计时 · 可试听</span>
        </div>

        <div className="harmony-setup">
          <fieldset className="harmony-fieldset"><legend><span>01</span> 练习哪些调？</legend>
            <p className="harmony-muted">可多选，每题随机抽取一个调。</p>
            <div className="harmony-key-options">{HARMONY_KEYS.map(key => (
              <button type="button" key={key} aria-pressed={config.keys.includes(key)}
                onClick={() => setHarmonyConfig({ ...config, keys: toggle(config.keys, key) })}>
                <strong>{key}</strong><span>大调</span><span className="harmony-check" aria-hidden="true">{config.keys.includes(key) ? '✓' : '+'}</span>
              </button>
            ))}</div>
          </fieldset>

          <fieldset className="harmony-fieldset"><legend><span>02</span> {progression ? '练习哪些走向？' : '练习哪些级数？'}</legend>
            <p className="harmony-muted">{progression ? '每条走向保持同一个调，全部填写后提交。' : '答案需要同时包含根音和和弦性质。'}</p>
            {progression ? <div className="harmony-progression-options">{choices.map(item => (
              <div className="harmony-progression-option" key={item.degrees}>
                <button type="button" aria-pressed={config.progressions.includes(item.degrees)}
                  onClick={() => setHarmonyConfig({ ...config, progressions: toggle(config.progressions, item.degrees) })}>
                  <span className="harmony-check" aria-hidden="true">{config.progressions.includes(item.degrees) ? '✓' : '+'}</span>
                  <strong>{item.degrees}</strong><span>{item.name}</span>
                </button>
                {!item.source && <button type="button" className="harmony-delete" aria-label={`删除走向 ${item.degrees}`} onClick={() => removeCustomProgression(item.degrees)}>×</button>}
              </div>
            ))}</div> : <div className="harmony-degree-options">{[1, 2, 3, 4, 5, 6, 7].map(degree => (
              <button type="button" key={degree} aria-label={`${degree} 级`} aria-pressed={config.degrees.includes(degree)}
                onClick={() => setHarmonyConfig({ ...config, degrees: toggle(config.degrees, degree) })}>{degree}<small>级</small></button>
            ))}</div>}
          </fieldset>
        </div>

        {progression && <details className="harmony-custom"><summary>＋ 添加自己的走向</summary>
          <form onSubmit={event => {
            event.preventDefault();
            if (addCustomProgression(customInput.trim())) { setCustomInput(''); setInputError(''); }
            else setInputError('请输入 1–7 的级数，长度为 1–32 位。');
          }}>
            <label htmlFor="custom-progression">级数走向</label>
            <div><input id="custom-progression" value={customInput} onChange={e => setCustomInput(e.target.value)} placeholder="例如 1564" inputMode="numeric" aria-describedby="custom-help" />
              <button type="submit">添加走向</button></div>
            <p id="custom-help" className="harmony-muted">仅使用数字 1–7，最多 32 位；自动保存在此浏览器。</p>
            {inputError && <p role="alert">{inputError}</p>}
          </form>
        </details>}

        <div className="harmony-actions">
          <span className="harmony-muted">已选 {config.keys.length} 个调 · {progression ? config.progressions.length + ' 条走向' : config.degrees.length + ' 个级数'}</span>
          <button type="button" className="harmony-primary" disabled={status !== 'ready' || !canStartHarmony(config, progression)} onClick={beginHarmony}>开始练习 <span aria-hidden="true">→</span></button>
        </div>
        {status !== 'ready' && <p role="status" className="harmony-muted">音频就绪后即可开始练习。</p>}
      </div>
    );
  }

  const answer = completeAnswer(answers[index]);
  const correct = data.chords[index];
  const rightCount = answers.filter((a, i) => sameTriad(completeAnswer(a), data.chords[i])).length;
  const mastery = getPracticeMastery(summary, `${practiceType}:${data.key}`);
  const fingering = preview ? triadFingering(preview) : null;
  return (
    <div className="harmony-workspace">
      <div className="harmony-session-top">
        <span className="harmony-eyebrow">和弦训练 · {progression ? '流行走向' : '和弦级数'}</span>
        <button type="button" className="harmony-text-button" onClick={() => { stop(); editHarmonyConfig(); }}>调整练习</button>
      </div>
      <div className="harmony-question">
        <div><span className="harmony-key-badge">{data.key} 大调</span>
          <h2>{progression ? '写出这条和弦走向' : <>第 <em>{data.degrees[0]}</em> 级是什么和弦？</>}</h2>
          <p>{submitted ? '点击答案卡复习，试听并对照下方指板。' : progression ? '点击卡片，依次选择根音和性质。' : '选择根音和性质，听一听，再提交答案。'}</p>
        </div>
        <div className="harmony-session-stat"><strong>{stats.correct}<span> / {stats.total}</span></strong><span>本轮答对</span></div>
      </div>

      <div className={`harmony-answer-strip ${progression ? '' : 'harmony-single'}`} aria-label="和弦答案">
        {answers.map((value, i) => {
          const chord = completeAnswer(value);
          const right = sameTriad(chord, data.chords[i]);
          return <button type="button" key={i} aria-label={`第 ${i + 1} 格，${data.degrees[i]} 级，${chord ? triadName(chord) : '待填写'}`} aria-pressed={index === i}
            className={`harmony-answer-card ${submitted ? right ? 'is-right' : 'is-wrong' : ''}`} onClick={() => { stop(); focusHarmonyAnswer(i); }}>
            <span className="harmony-answer-degree">{data.degrees[i]} 级 {submitted && <span>{right ? '✓' : '✗'}</span>}</span>
            <strong>{chord ? triadName(chord) : <span className="harmony-placeholder">—</span>}</strong>
            <small>{submitted ? right ? '回答正确' : `正确：${triadName(data.chords[i])}` : chord ? '点击可修改' : '待填写'}</small>
          </button>;
        })}
      </div>

      {!submitted ? <div className="harmony-editor">
        <div className="harmony-editor-heading"><strong>{progression ? `填写第 ${index + 1} 格` : '选择你的答案'}</strong><span>{answers.filter(a => completeAnswer(a)).length} / {answers.length} 已填写</span></div>
        <fieldset><legend>根音</legend><div className="harmony-roots">{CHROMATIC_NAMES.map((root, rootIndex) => (
          <button type="button" key={root} aria-label={`根音 ${root}`} aria-pressed={answers[index].root === rootIndex} className={root.includes('♯') ? 'is-sharp' : ''}
            onClick={() => { stop(); selectHarmonyAnswer({ root: rootIndex }); }}>{root}</button>
        ))}</div></fieldset>
        <fieldset><legend>性质</legend><div className="harmony-qualities">{(['major', 'minor', 'dim'] as TriadQuality[]).map(quality => (
          <button type="button" key={quality} aria-pressed={answers[index].quality === quality} onClick={() => { stop(); selectHarmonyAnswer({ quality }); }}>
            {QUALITY_LABELS[quality]}<small>{quality === 'major' ? 'Major' : quality === 'minor' ? 'Minor · m' : 'Diminished · dim'}</small>
          </button>
        ))}</div></fieldset>
      </div> : <div className={`harmony-result ${feedback === 'correct' ? 'is-right' : 'is-wrong'}`} role="status">
        <span className="harmony-result-icon" aria-hidden="true">{feedback === 'correct' ? '✓' : '↺'}</span>
        <div><strong>{feedback === 'correct' ? '全部正确，继续保持' : '再巩固一下这道题'}</strong><p>{progression ? `${rightCount} / ${answers.length} 个和弦正确，整条全对才计为正确。` : `正确答案是 ${triadName(correct)}。`}</p></div>
      </div>}

      <div className="harmony-preview-bar">
        <div className="harmony-preview-title"><span className="harmony-red-indicator" aria-hidden="true" /><span>{preview ? source === 'answer' ? '你的答案' : '正确答案' : '指板预览'}</span><strong>{preview ? triadName(preview) : '—'}</strong></div>
        {submitted ? <div className="harmony-listen-actions"><button type="button" disabled={status !== 'ready' || !answer} onClick={() => answer && listen(answer, 'answer')}>听我的答案</button><button type="button" disabled={status !== 'ready'} onClick={() => listen(correct, 'correct')}>听正确答案</button></div>
          : <button type="button" disabled={!preview || status !== 'ready'} onClick={() => preview && listen(preview, 'answer')}>↻ 重听</button>}
        <p>{fingering ? <>六弦 → 一弦 <span className="harmony-frets">{fingering.frets.map(f => f === null ? '×' : f).join(' · ')}</span><span>红点为发声位置，× 为闷弦。</span></> : '选好根音与性质，下方指板会显示红色指法并发声。'}</p>
      </div>

      <div className="harmony-actions">
        <span className="harmony-muted">{submitted ? `${data.key} 调掌握度：${mastery.answered}/20 · ${Math.round(mastery.accuracy * 100)}%${mastery.mastered ? ' · 已掌握' : ''}` : '可随时改选，提交前不判断对错。'}</span>
        <div>{submitted ? <>
          {progression && <button type="button" className="harmony-secondary" disabled={status !== 'ready'} onClick={playing ? stop : playProgression}>{playing ? '■ 停止播放' : '▷ 播放正确走向'}</button>}
          <button type="button" className="harmony-primary" onClick={() => { stop(); nextQuestion(); }}>下一题 →</button>
        </> : <button type="button" className="harmony-primary" disabled={answers.some(a => !completeAnswer(a))} onClick={() => { stop(); submitHarmony(); }}>提交答案 →</button>}</div>
      </div>
    </div>
  );
}
