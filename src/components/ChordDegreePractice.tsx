import { useEffect, useRef, useState } from 'react';
import { Fretboard } from './Fretboard';
import { useGuitarAudio } from '../hooks/useGuitarAudio';
import { getPracticeMastery } from '../hooks/usePracticeSummary';
import type { PracticeController } from '../hooks/usePractice';
import type { Settings } from '../hooks/useSettings';
import { getFingeringMidiNotes, getFingeringPositions } from '../utils/chord';
import { CHROMATIC_NAMES } from '../utils/note';
import { DEGREE_KEYS, PROGRESSIONS, degreeChord, triadFingering, triadName, validProgression } from '../utils/chordDegree';
import type { DegreeKey, Triad, TriadQuality } from '../utils/chordDegree';

type Mode = 'chord-degree' | 'chord-progression';
type Answer = { root: number | null; quality: TriadQuality | null };
const blank = (): Answer => ({ root: null, quality: null });
const pick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];
const STORAGE = 'digital-guitar-custom-progressions-v1';
function loadCustom(): string[] { try { const v: unknown = JSON.parse(localStorage.getItem(STORAGE) || '[]'); return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && validProgression(x)) : []; } catch { return []; } }
function asTriad(a: Answer): Triad | null { return a.root === null || a.quality === null ? null : { root: a.root, quality: a.quality }; }
interface Props { settings: Settings; practice: PracticeController; onClose: () => void }
export function ChordDegreePractice({ settings, practice, onClose }: Props) {
  const { playChord, status } = useGuitarAudio();
  const [mode, setMode] = useState<Mode>('chord-degree');
  const [keys, setKeys] = useState<DegreeKey[]>(['C']);
  const [degrees, setDegrees] = useState([1, 2, 3, 4, 5, 6, 7]);
  const [custom, setCustom] = useState<string[]>(loadCustom);
  const [selectedProgressions, setSelectedProgressions] = useState<string[]>(PROGRESSIONS);
  const [input, setInput] = useState('');
  const [question, setQuestion] = useState<{ key: DegreeKey; sequence: string } | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [active, setActive] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [shown, setShown] = useState<Triad | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const stop = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);
  const toggle = <T,>(value: T, current: T[], setter: (values: T[]) => void) => setter(current.includes(value) ? current.filter(x => x !== value) : [...current, value]);
  const show = (chord: Triad) => { setShown(chord); playChord(getFingeringMidiNotes(triadFingering(chord))); };
  const start = () => {
    if (!keys.length || (mode === 'chord-degree' ? !degrees.length : !selectedProgressions.length)) return;
    stop(); const sequence = mode === 'chord-degree' ? String(pick(degrees)) : pick(selectedProgressions);
    setQuestion({ key: pick(keys), sequence }); setAnswers(Array.from(sequence, blank)); setActive(0); setSubmitted(false); setShown(null);
  };
  const change = (patch: Partial<Answer>) => {
    if (submitted) return;
    stop(); const next = answers.map((a, i) => i === active ? { ...a, ...patch } : a); setAnswers(next);
    const chord = asTriad(next[active]); if (chord) show(chord); else setShown(null);
  };
  const correct = question ? [...question.sequence].map(d => degreeChord(question.key, Number(d))) : [];
  const submit = () => {
    if (!question || submitted || answers.some(a => !asTriad(a))) return;
    stop(); const right = answers.every((a, i) => triadName(asTriad(a)!) === triadName(correct[i]));
    practice.recordAnswer(mode, `${question.key}大调 ${question.sequence}`, correct.map(triadName).join(' – '), right, `${mode}:${question.key}`); setSubmitted(true);
  };
  const playAll = () => { stop(); correct.forEach((chord, i) => { timers.current.push(setTimeout(() => { setActive(i); show(chord); }, i * 1100)); }); };
  const addCustom = () => { const value = input.trim(); if (!validProgression(value)) return; const next = [...new Set([...custom, value])]; setCustom(next); setSelectedProgressions([...new Set([...selectedProgressions, value])]); try { localStorage.setItem(STORAGE, JSON.stringify(next)); } catch { /* storage unavailable */ } setInput(''); };
  const removeCustom = (value: string) => { const next = custom.filter(x => x !== value); setCustom(next); if (!PROGRESSIONS.includes(value)) setSelectedProgressions(selectedProgressions.filter(x => x !== value)); try { localStorage.setItem(STORAGE, JSON.stringify(next)); } catch { /* storage unavailable */ } };
  const fingering = shown ? triadFingering(shown) : null;
  const mastery = question ? getPracticeMastery(practice.summary, `${mode}:${question.key}`) : null;
  return <section className="practice-mode degree-panel">
    <h2>和弦级数与走向</h2>
    <div className="degree-controls"><button type="button" onClick={() => { stop(); onClose(); }}>返回自由弹奏</button><button type="button" onClick={() => { stop(); setQuestion(null); setShown(null); setMode('chord-degree'); }}>单级训练</button><button type="button" onClick={() => { stop(); setQuestion(null); setShown(null); setMode('chord-progression'); }}>走向训练</button></div>
    {!question ? <>
      <h3>{mode === 'chord-degree' ? '单级训练' : '走向训练'}</h3>
      <p>累计 {practice.summary.byType[mode].total} 题，正确 {practice.summary.byType[mode].correct} 题</p>
      <fieldset><legend>选择大调</legend>{DEGREE_KEYS.map(k => <label key={k}><input type="checkbox" checked={keys.includes(k)} onChange={() => toggle(k, keys, setKeys)} />{k}</label>)}</fieldset>
      {mode === 'chord-degree' ? <fieldset><legend>选择级数</legend>{[1,2,3,4,5,6,7].map(d => <label key={d}><input type="checkbox" checked={degrees.includes(d)} onChange={() => toggle(d, degrees, setDegrees)} />{d}</label>)}</fieldset> : <fieldset><legend>选择走向</legend>{[...new Set([...PROGRESSIONS, ...custom])].map(p => <span key={p}><label><input type="checkbox" checked={selectedProgressions.includes(p)} onChange={() => toggle(p, selectedProgressions, setSelectedProgressions)} />{p}</label>{custom.includes(p) && !PROGRESSIONS.includes(p) && <button type="button" onClick={() => removeCustom(p)}>删除 {p}</button>}</span>)}<div><label>自定义走向 <input value={input} onChange={e => setInput(e.target.value)} placeholder="例如 1564" /></label><button type="button" onClick={addCustom} disabled={!validProgression(input.trim())}>添加</button><small>使用 1–7，最多 32 位</small></div></fieldset>}
      <button type="button" disabled={!keys.length || status !== 'ready' || (mode === 'chord-degree' ? !degrees.length : !selectedProgressions.length)} onClick={start}>开始练习</button>
    </> : <>
      <h3>{question.key} 大调 · {mode === 'chord-degree' ? `第 ${question.sequence} 级` : question.sequence}</h3>
      {mastery && <p>{question.key} 调最近 {mastery.answered}/20 题，正确率 {Math.round(mastery.accuracy * 100)}% {mastery.mastered ? '· 已掌握' : ''}</p>}
      <div className="degree-controls">{answers.map((answer, i) => { const chord = asTriad(answer); const right = chord && triadName(chord) === triadName(correct[i]); return <button type="button" key={i} aria-pressed={active === i} className={submitted ? right ? 'right' : 'wrong' : ''} onClick={() => { stop(); setActive(i); if (chord) show(chord); else setShown(null); }}>{question.sequence[i]}级：{chord ? triadName(chord) : '待选择'}{submitted ? right ? ' ✓' : ' ✗' : ''}</button>; })}</div>
      {!submitted && <><p>选择根音与和弦性质：</p><div className="degree-controls">{CHROMATIC_NAMES.map((n, i) => <button type="button" key={n} aria-pressed={answers[active]?.root === i} onClick={() => change({ root: i })}>{n}</button>)}</div><div className="degree-controls">{(['major','minor','dim'] as const).map((q, i) => <button type="button" key={q} aria-pressed={answers[active]?.quality === q} onClick={() => change({ quality: q })}>{['大三','小三','减三'][i]}</button>)}</div></>}
      {submitted && <div>{correct.map((chord, i) => <div key={i}>{question.sequence[i]}级：你的答案 {triadName(asTriad(answers[i])!)}；正确答案 {triadName(chord)} <button type="button" onClick={() => { stop(); setActive(i); show(asTriad(answers[i])!); }}>试听你的答案</button> <button type="button" onClick={() => { stop(); setActive(i); show(chord); }}>试听正确答案</button></div>)}</div>}
      <div className="degree-controls">{shown && <button type="button" onClick={() => { stop(); show(shown); }}>重听 {triadName(shown)}</button>}{!submitted ? <button type="button" onClick={submit} disabled={answers.some(a => !asTriad(a))}>提交答案</button> : <><button type="button" onClick={playAll}>播放正确走向</button><button type="button" onClick={start}>下一题</button><button type="button" onClick={() => { stop(); setQuestion(null); setShown(null); }}>更改练习设置</button></>}</div>
    </>}
    {shown && fingering && <p>{triadName(shown)} 指法（六弦到一弦）：{fingering.frets.map(f => f === null ? '×' : f).join(' ')}</p>}
    <Fretboard tuning={settings.tuning} showNoteNames={settings.showNoteNames} noteDisplayMode={settings.noteDisplayMode} highlights={fingering ? getFingeringPositions(fingering).map(position => ({ position, tone: 'red' as const })) : []} showClickFeedback={false} onPositionClick={() => {}} />
  </section>;
}
