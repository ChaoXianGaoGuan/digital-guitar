import { AnchoredChordEditor } from './AnchoredChordEditor';
import { useEffect, useState } from 'react';
import type { PracticeController } from '../hooks/usePractice';
import { useGuitarAudio } from '../hooks/useGuitarAudio';
import { getPracticeMastery } from '../hooks/usePracticeSummary';
import { getFingeringMidiNotes } from '../utils/chord';
import {
  canStartHarmony, completeAnswer, HARMONY_KEYS, POP_PROGRESSIONS,
  sameTriad, triadFingering, triadName
} from '../utils/harmony';
import type { Triad } from '../utils/harmony';

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
          <div>
            <h2>{progression ? '流行走向设置' : '和弦级数设置'}</h2>
            <p>{progression ? '选择常见走向，练习在不同调中写出整条和弦。' : '看到调名和级数，找到它对应的顺阶三和弦。'}</p>
          </div>
          <span className="harmony-tag">不计时 · 可试听</span>
        </div>

        <div className="harmony-setup">
          <fieldset className="harmony-fieldset"><legend>大调（可多选）</legend>
            <p className="harmony-muted">可多选，每题随机抽取一个调。</p>
            <div className="harmony-key-options">{HARMONY_KEYS.map(key => (
              <button type="button" key={key} aria-pressed={config.keys.includes(key)}
                onClick={() => setHarmonyConfig({ ...config, keys: toggle(config.keys, key) })}>
                <strong>{key}</strong><span className="harmony-check" aria-hidden="true">{config.keys.includes(key) ? '✓' : '+'}</span>
              </button>
            ))}</div>
          </fieldset>

          <fieldset className="harmony-fieldset"><legend>{progression ? '练习哪些走向？' : '练习哪些级数？'}</legend>
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
      <div className="harmony-question">
        <span className="harmony-key-badge">{data.key} 大调</span>
        <h2>{progression ? data.degrees.join('') : <>第 {data.degrees[0]} 级是什么和弦？</>}</h2>
        <span className="harmony-question-detail">{progression ? `第 ${index + 1} 格 · ${answers.filter(a => completeAnswer(a)).length}/${answers.length} 已填写` : '顺阶三和弦'}</span>
        <span className="harmony-session-stat">本轮 {stats.correct} / {stats.total}</span>
        <button type="button" className="harmony-text-button" onClick={() => { stop(); editHarmonyConfig(); }}>练习设置</button>
      </div>

      {progression && <div className="harmony-answer-strip" aria-label="和弦答案">
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
      </div>}

      <AnchoredChordEditor
        root={answers[index].root} quality={answers[index].quality} locked={submitted}
        canSubmit={answers.every(a => completeAnswer(a) !== null)}
        onRoot={root => { stop(); selectHarmonyAnswer({ root }); }}
        onQuality={quality => { stop(); selectHarmonyAnswer({ quality }); }}
        onSubmit={() => { stop(); submitHarmony(); }}
      />
      <div className="harmony-result-slot">
      {submitted && <div className={`harmony-result ${feedback === 'correct' ? 'is-right' : 'is-wrong'}`} role="status">
        <strong>{feedback === 'correct' ? '✓ 回答正确，正在进入下一题…' : '↺ 再巩固一下'}</strong>
        {feedback === 'wrong' && <span>{progression ? `${rightCount}/${answers.length} 个和弦正确，点击卡片查看答案。` : `正确答案：${triadName(correct)}`}</span>}
      </div>}
      </div>

      <div className="harmony-answer-footer">
        <div className="harmony-preview-title"><span className="harmony-red-indicator" aria-hidden="true" /><span>{preview ? source === 'answer' ? '已选' : '正确答案' : '已选'}</span><strong>{preview ? triadName(preview) : '—'}</strong></div>
        <button type="button" className="harmony-listen" disabled={!preview || status !== 'ready'} onClick={() => preview && listen(preview, source === 'answer' ? 'answer' : 'correct')}>↻ 试听</button>
        <span className="harmony-frets" aria-label="指法，六弦到一弦">{fingering ? fingering.frets.map(f => f === null ? '×' : f).join(' · ') : '选择根音和性质'}</span>
        <div className="harmony-submit-actions">
          {feedback === 'wrong' ? <>
            <button type="button" disabled={status !== 'ready' || !answer} onClick={() => answer && listen(answer, 'answer')}>听我的答案</button>
            <button type="button" disabled={status !== 'ready'} onClick={() => listen(correct, 'correct')}>听正确答案</button>
            {progression && <button type="button" disabled={status !== 'ready'} onClick={playing ? stop : playProgression}>{playing ? '■ 停止播放' : '▷ 播放正确走向'}</button>}
            <button type="button" className="harmony-primary" onClick={() => { stop(); nextQuestion(); }}>下一题 →</button>
          </> : feedback === 'correct' ? <span className="harmony-muted">自动切题中…</span> : null}
        </div>
      </div>
      {feedback === 'wrong' && <p className="harmony-mastery">{data.key} 调掌握度：{mastery.answered}/20 · {Math.round(mastery.accuracy * 100)}%{mastery.mastered ? ' · 已掌握' : ''}</p>}
    </div>
  );
}
