import { useEffect } from 'react';
import type { ChordCurriculum, FretboardPosition } from '../utils/chord';
import type { GuitarAudioStatus } from '../context/guitarAudioContext';
import { getPracticeMastery } from '../hooks/usePracticeSummary';
import type { PracticeController } from '../hooks/usePractice';
import { useGuitarAudio } from '../hooks/useGuitarAudio';
import type {
  ChordQuality,
  FretRange,
  IntervalCurriculum,
  IntervalId,
  SamePitchCurriculum,
  PitchDirection,
  PositionSearchRange,
  PracticeType
} from '../utils/practice';
import {
  ADVANCED_INTERVALS,
  BEGINNER_INTERVALS,
  FRET_RANGE_NAMES,
  INTERVAL_NAMES,
  PRACTICE_TYPE_NAMES
} from '../utils/practice';
import {
  PRACTICE_CATALOG,
  PRACTICE_CATEGORIES,
  PRACTICE_CATEGORY_NAMES,
  RECOMMENDED_LESSONS,
  practiceRequiresAudio
} from '../utils/practiceCatalog';
import type { Tuning } from '../utils/tuning';
import { isStandardTuning } from '../utils/tuning';
import type { MajorKey, MajorScalePatternId } from '../utils/majorScalePattern';
import {
  MAJOR_KEYS,
  MAJOR_KEY_SCALE_NOTES,
  MAJOR_SCALE_PATTERNS,
  MAJOR_SCALE_PATTERN_NAMES
} from '../utils/majorScalePattern';
import { ChordButtons } from './ChordButtons';
import { LearningRecord } from './LearningRecord';
import { NoteButtons } from './NoteButtons';
import { PracticeStats } from './PracticeStats';

interface PracticeModeProps {
  tuning: Tuning;
  audioStatus: GuitarAudioStatus;
  practice: PracticeController;
  onStop: () => void;
}

function isChordPractice(type: PracticeType): boolean {
  return type === 'chord-to-position'
    || type === 'position-to-chord'
    || type === 'listen-to-chord';
}

function requiresStandardTuning(type: PracticeType): boolean {
  return isChordPractice(type) || type === 'major-scale-pattern-note-name';
}

function formatPosition(position: FretboardPosition): string {
  return `${6 - position.string}弦 ${position.fret === 0 ? '空弦' : `${position.fret}品`}`;
}

function formatPositions(positions: FretboardPosition[]): string {
  return positions.map(formatPosition).join('、');
}

function formatProgress(answered: number, accuracy: number, mastered: boolean): string {
  if (mastered) return `已掌握 · ${Math.round(accuracy * 100)}%`;
  return `${answered} / 20 · ${Math.round(accuracy * 100)}%`;
}

export function PracticeMode({ tuning, audioStatus, practice, onStop }: PracticeModeProps) {
  const { playNote, playChord, playSequence, stopSequence } = useGuitarAudio();
  const supportsChordPractice = isStandardTuning(tuning);
  const {
    isActive,
    practiceType,
    question,
    stats,
    feedback,
    fretRange,
    positionSearchRange,
    chordCurriculum,
    intervalCurriculum,
    samePitchCurriculum,
    majorKey,
    scalePatternId,
    correctAnswer,
    summary,
    selectedNote,
    selectedPosition,
    selectedChord,
    selectedChordPositions,
    selectedNotePositions,
    selectedCandidatePosition,
    playbackMidiNotes,
    playbackKind,
    startPractice,
    setFretRange,
    setPositionSearchRange,
    setChordCurriculum,
    setIntervalCurriculum,
    setSamePitchCurriculum,
    setMajorKey,
    setScalePattern,
    selectNote,
    selectChord,
    clearChordPositions,
    clearNotePositions,
    clearCandidatePosition,
    submitChordPositions,
    submitNotePositions,
    submitPitchDirection,
    submitInterval,
    submitChordQuality,
    submitSamePitchMatch,
    submitMajorScalePatternNoteName,
    nextQuestion,
    clearSummary
  } = practice;

  const replay = () => {
    if (audioStatus !== 'ready' || playbackMidiNotes.length === 0) return;
    if (playbackKind === 'sequence') playSequence(playbackMidiNotes);
    else if (playbackKind === 'chord') playChord(playbackMidiNotes);
    else playNote(playbackMidiNotes[0]);
  };

  useEffect(() => {
    stopSequence();
    if (audioStatus === 'ready' && playbackMidiNotes.length > 0) {
      if (playbackKind === 'sequence') playSequence(playbackMidiNotes);
      else if (playbackKind === 'chord') playChord(playbackMidiNotes);
      else playNote(playbackMidiNotes[0]);
    }
    return stopSequence;
  }, [
    audioStatus,
    playbackKind,
    playbackMidiNotes,
    playChord,
    playNote,
    playSequence,
    question?.id,
    stopSequence
  ]);

  const isTypeDisabled = (type: PracticeType) => (
    (requiresStandardTuning(type) && !supportsChordPractice)
      || (practiceRequiresAudio(type) && audioStatus !== 'ready')
  );

  const handleStop = () => {
    stopSequence();
    onStop();
  };

  if (!isActive || !practiceType || !question) {
    const recommended = RECOMMENDED_LESSONS.find(lesson => (
      !getPracticeMastery(summary, lesson.progressKey).mastered
    ));
    return (
      <section className="practice-mode">
        <h2>选择练习类型</h2>
        {recommended && (
          <div className="recommended-lesson">
            <strong>推荐下一课</strong>
            <span>{recommended.label}</span>
          </div>
        )}
        {!supportsChordPractice && <p className="practice-notice">和弦练习与大调指型练习目前仅支持标准调弦。</p>}
        {audioStatus !== 'ready' && <p className="practice-notice">音频尚未就绪，听音练习暂不可用。</p>}
        {PRACTICE_CATEGORIES.map(category => (
          <section className="practice-category" key={category}>
            <h3>{PRACTICE_CATEGORY_NAMES[category]}</h3>
            <div className="practice-types">
              {PRACTICE_CATALOG.filter(entry => entry.category === category).map(entry => {
                const progressKey = entry.type === 'interval-identification'
                  ? 'interval-identification:beginner'
                  : entry.type === 'same-pitch-matching'
                    ? 'same-pitch-matching:beginner'
                  : entry.type;
                const mastery = getPracticeMastery(summary, progressKey);
                return (
                  <button
                    type="button"
                    className="practice-type-card"
                    key={entry.type}
                    aria-label={PRACTICE_TYPE_NAMES[entry.type]}
                    disabled={isTypeDisabled(entry.type)}
                    onClick={() => startPractice(entry.type)}
                  >
                    <strong>{PRACTICE_TYPE_NAMES[entry.type]}{entry.advanced ? ' · 进阶' : ''}</strong>
                    <span>{entry.description}</span>
                    <small>{formatProgress(mastery.answered, mastery.accuracy, mastery.mastered)}</small>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
        <LearningRecord summary={summary} onClear={clearSummary} />
        <button type="button" onClick={handleStop}>返回自由弹奏</button>
      </section>
    );
  }

  const renderReplayButton = () => (
    <button type="button" className="replay-btn" disabled={audioStatus !== 'ready'} onClick={replay}>
      重新听音
    </button>
  );

  const renderQuestion = () => {
    switch (practiceType) {
      case 'pitch-direction':
        return <><p>听两个音，判断第二个音相对第一个音的高低。</p>{renderReplayButton()}</>;
      case 'reference-pitch-to-position':
        return <><p>听目标音，在指板上自由点击任意一个相同 MIDI 音高的位置。</p>{renderReplayButton()}</>;
      case 'same-pitch-matching':
        return (
          <>
            <p>听目标音，再试听三个候选亮点，选择音高完全相同的位置。</p>
            {renderReplayButton()}
            <p>{selectedCandidatePosition ? `已选：${formatPosition(selectedCandidatePosition)}` : '尚未选择候选位置'}</p>
            <div className="inline-actions">
              <button type="button" onClick={clearCandidatePosition}>清除选择</button>
              <button type="button" className="submit-answer" onClick={() => submitSamePitchMatch()}>提交答案</button>
            </div>
          </>
        );
      case 'interval-identification':
        return (
          <>
            <p>听两个音，判断音程。当前方向：{question.intervalDirection === 'descending' ? '下行' : '上行'}。</p>
            {renderReplayButton()}
          </>
        );
      case 'chord-quality':
        return <><p>听和弦，判断它是大三和弦还是小三和弦。</p>{renderReplayButton()}</>;
      case 'note-to-name-and-position':
        return (
          <>
            <p>听音高，选择音名并在指板上找到位置。</p>
            {renderReplayButton()}
            {selectedNote && !selectedPosition && <p className="hint">已选音名：{selectedNote}，请点击指板位置</p>}
            {selectedPosition && !selectedNote && <p className="hint">已选位置，请选择音名</p>}
          </>
        );
      case 'position-to-name':
        return (
          <>
            <p>指板上出现了一个亮点，并播放对应音高，请说出它的音名。</p>
            {renderReplayButton()}
          </>
        );
      case 'note-name-to-all-positions':
        return (
          <>
            <p>请找出当前把位内所有 <strong>{question.correctNoteName}</strong> 音位置。</p>
            <p>已选 {selectedNotePositions.length} 个位置</p>
            {selectedNotePositions.length > 0 && (
              <p className="hint">当前选择：{formatPositions(selectedNotePositions)}</p>
            )}
            <div className="inline-actions">
              <button type="button" onClick={clearNotePositions}>清除选择</button>
              <button type="button" className="submit-answer" onClick={() => submitNotePositions()}>提交答案</button>
            </div>
          </>
        );
      case 'major-scale-pattern-note-name':
        return (
          <>
            <p>
              当前为 <strong>{majorKey} 大调</strong> · <strong>{MAJOR_SCALE_PATTERN_NAMES[scalePatternId]}</strong>。
              指板浅色区域是该指型，蓝色亮点是本题目标音。
            </p>
            <p>请选择这个位置在 {majorKey} 大调里的音名。</p>
            {question.scalePattern && (
              <p className="hint">覆盖品位：{question.scalePattern.startFret} - {question.scalePattern.endFret} 品</p>
            )}
          </>
        );
      case 'chord-to-position':
        return (
          <>
            <p>请在指板上按出这个和弦：</p>
            <p className="chord-name">{question.chord?.name}</p>
            <p>点击需要发声的弦位，包括空弦。再次点击可取消，闷弦无需选择。</p>
            <p>已选 {selectedChordPositions.length} 个位置</p>
            <div className="inline-actions">
              <button type="button" onClick={clearChordPositions}>清除选择</button>
              <button type="button" className="submit-answer" onClick={() => submitChordPositions()}>提交答案</button>
            </div>
          </>
        );
      case 'position-to-chord':
        return <p>指板上出现了和弦，请说出它的名称。</p>;
      case 'listen-to-chord':
        return <><p>听和弦，选择和弦名。</p>{renderReplayButton()}</>;
    }
  };

  const renderEarAnswers = () => {
    if (practiceType === 'pitch-direction') {
      const answers: Array<[PitchDirection, string]> = [['higher', '更高'], ['same', '相同'], ['lower', '更低']];
      return answers.map(([value, label]) => (
        <button type="button" key={value} disabled={feedback !== 'none'} onClick={() => submitPitchDirection(value)}>{label}</button>
      ));
    }
    if (practiceType === 'interval-identification') {
      const intervals = intervalCurriculum === 'beginner' ? BEGINNER_INTERVALS : ADVANCED_INTERVALS;
      return intervals.map((interval: IntervalId) => (
        <button type="button" key={interval} disabled={feedback !== 'none'} onClick={() => submitInterval(interval)}>
          {INTERVAL_NAMES[interval]}
        </button>
      ));
    }
    if (practiceType === 'chord-quality') {
      const qualities: Array<[ChordQuality, string]> = [['major', '大三和弦'], ['minor', '小三和弦']];
      return qualities.map(([value, label]) => (
        <button type="button" key={value} disabled={feedback !== 'none'} onClick={() => submitChordQuality(value)}>{label}</button>
      ));
    }
    return null;
  };

  return (
    <section className="practice-mode">
      <div className="practice-mode-switcher">
        <label htmlFor="practice-type">练习类型：</label>
        <select id="practice-type" value={practiceType} onChange={event => startPractice(event.target.value as PracticeType)}>
          {PRACTICE_CATEGORIES.map(category => (
            <optgroup key={category} label={PRACTICE_CATEGORY_NAMES[category]}>
              {PRACTICE_CATALOG.filter(entry => entry.category === category).map(entry => (
                <option key={entry.type} value={entry.type} disabled={isTypeDisabled(entry.type)}>
                  {PRACTICE_TYPE_NAMES[entry.type]}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {(practiceType === 'position-to-name'
        || practiceType === 'note-to-name-and-position'
        || practiceType === 'same-pitch-matching'
        || practiceType === 'reference-pitch-to-position') && (
        <div className="practice-mode-switcher">
          <label htmlFor="fret-range">练习范围：</label>
          <select id="fret-range" value={fretRange} onChange={event => setFretRange(event.target.value as FretRange)}>
            {Object.entries(FRET_RANGE_NAMES).map(([range, name]) => <option key={range} value={range}>{name}</option>)}
          </select>
        </div>
      )}

      {practiceType === 'note-name-to-all-positions' && (
        <div className="practice-mode-switcher">
          <label htmlFor="position-search-range">练习范围：</label>
          <select id="position-search-range" value={positionSearchRange} onChange={event => setPositionSearchRange(event.target.value as PositionSearchRange)}>
            <option value="1st">第一把位 (空弦、1-4品)</option>
            <option value="2nd">第二把位 (5-8品)</option>
            <option value="3rd">第三把位 (9-12品)</option>
          </select>
        </div>
      )}

      {practiceType === 'interval-identification' && (
        <div className="practice-mode-switcher">
          <label htmlFor="interval-curriculum">音程级别：</label>
          <select id="interval-curriculum" value={intervalCurriculum} onChange={event => setIntervalCurriculum(event.target.value as IntervalCurriculum)}>
            <option value="beginner">入门</option>
            <option value="advanced">进阶</option>
          </select>
        </div>
      )}

      {practiceType === 'same-pitch-matching' && (
        <div className="practice-mode-switcher">
          <label htmlFor="same-pitch-curriculum">同音匹配级别：</label>
          <select id="same-pitch-curriculum" value={samePitchCurriculum} onChange={event => setSamePitchCurriculum(event.target.value as SamePitchCurriculum)}>
            <option value="beginner">入门</option>
            <option value="advanced">进阶</option>
          </select>
        </div>
      )}

      {practiceType === 'major-scale-pattern-note-name' && (
        <>
          <div className="practice-mode-switcher">
            <label htmlFor="major-key">大调：</label>
            <select id="major-key" value={majorKey} onChange={event => setMajorKey(event.target.value as MajorKey)}>
              {MAJOR_KEYS.map(key => <option key={key} value={key}>{key} 大调</option>)}
            </select>
          </div>
          <div className="practice-mode-switcher">
            <label htmlFor="scale-pattern">指型：</label>
            <select id="scale-pattern" value={scalePatternId} onChange={event => setScalePattern(event.target.value as MajorScalePatternId)}>
              {MAJOR_SCALE_PATTERNS.map(patternId => (
                <option key={patternId} value={patternId}>{MAJOR_SCALE_PATTERN_NAMES[patternId]}</option>
              ))}
            </select>
          </div>
        </>
      )}

      {isChordPractice(practiceType) && (
        <div className="practice-mode-switcher">
          <label htmlFor="chord-curriculum">和弦题库：</label>
          <select id="chord-curriculum" value={chordCurriculum} onChange={event => setChordCurriculum(event.target.value as ChordCurriculum)}>
            <option value="beginner">入门</option>
            <option value="all">全部 21 个</option>
          </select>
        </div>
      )}

      <PracticeStats stats={stats} />
      <div className="question-area">
        <h3>{PRACTICE_TYPE_NAMES[practiceType]}</h3>
        <div className="question-content">{renderQuestion()}</div>
      </div>

      <div className="answer-area">
        {(practiceType === 'note-to-name-and-position' || practiceType === 'position-to-name') && (
          <NoteButtons onSelect={selectNote} disabled={feedback !== 'none'} selectedNote={selectedNote} />
        )}
        {practiceType === 'major-scale-pattern-note-name' && (
          <div className="note-buttons">
            <div className="button-grid">
              {MAJOR_KEY_SCALE_NOTES[majorKey].map(noteName => (
                <button
                  type="button"
                  key={noteName}
                  className="note-button"
                  disabled={feedback !== 'none'}
                  onClick={() => submitMajorScalePatternNoteName(noteName)}
                >
                  {noteName}
                </button>
              ))}
            </div>
          </div>
        )}
        {(practiceType === 'position-to-chord' || practiceType === 'listen-to-chord') && (
          <ChordButtons onSelect={selectChord} disabled={feedback !== 'none'} selectedChord={selectedChord} />
        )}
        {renderEarAnswers()}
      </div>

      {feedback === 'correct' && <div className="feedback correct"><p>正确！</p></div>}
      {feedback === 'wrong' && (
        <div className="feedback wrong">
          <p>错误！</p>
          {correctAnswer?.noteName && <p>正确答案：{correctAnswer.noteName}</p>}
          {correctAnswer?.scaleNoteName && <p>正确答案：{correctAnswer.scaleNoteName}</p>}
          {correctAnswer?.chordName && <p>正确答案：{correctAnswer.chordName}</p>}
          {correctAnswer?.pitchDirection && <p>正确答案：{{ higher: '更高', same: '相同', lower: '更低' }[correctAnswer.pitchDirection]}</p>}
          {correctAnswer?.interval && <p>正确答案：{INTERVAL_NAMES[correctAnswer.interval]}</p>}
          {correctAnswer?.chordQuality && <p>正确答案：{correctAnswer.chordQuality === 'major' ? '大三和弦' : '小三和弦'}</p>}
          {correctAnswer?.position && <p>正确位置：{formatPosition(correctAnswer.position)}</p>}
          {correctAnswer?.positions && <p>正确位置：{formatPositions(correctAnswer.positions)}</p>}
          {correctAnswer?.selectedPositions && (
            <p>你提交的位置：{correctAnswer.selectedPositions.length > 0
              ? formatPositions(correctAnswer.selectedPositions)
              : '未选择任何位置'}</p>
          )}
          {correctAnswer?.missingPositions && correctAnswer.missingPositions.length > 0 && (
            <p>漏选：{formatPositions(correctAnswer.missingPositions)}</p>
          )}
          {correctAnswer?.extraPositions && correctAnswer.extraPositions.length > 0 && (
            <p>多选：{formatPositions(correctAnswer.extraPositions)}</p>
          )}
          {correctAnswer?.fingering && <p>正确指法：{correctAnswer.fingering}（6弦 → 1弦，X = 闷弦，0 = 空弦）</p>}
          <button type="button" onClick={nextQuestion}>下一题</button>
        </div>
      )}

      <LearningRecord summary={summary} onClear={clearSummary} />
      <div className="practice-controls"><button type="button" onClick={handleStop}>停止练习</button></div>
    </section>
  );
}
