import { useCallback, useState } from 'react';
import './App.css';
import { Fretboard } from './components/Fretboard';
import { GuitarAudioProvider } from './components/GuitarAudioProvider';
import { PracticeMode } from './components/PracticeMode';
import { SettingsModal } from './components/SettingsModal';
import { useGuitarAudio } from './hooks/useGuitarAudio';
import { usePractice } from './hooks/usePractice';
import type { Settings } from './hooks/useSettings';
import { useSettings } from './hooks/useSettings';
import type { FretClick } from './utils/fretboard';
import type { Tuning } from './utils/tuning';

interface DigitalGuitarAppProps {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
  setTuning: (tuning: Tuning) => void;
}

function DigitalGuitarApp({ settings, updateSettings, setTuning }: DigitalGuitarAppProps) {
  const { playNote, status, error, retry } = useGuitarAudio();
  const practice = usePractice(settings.tuning);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handlePositionClick = useCallback((click: FretClick) => {
    if (!isPracticeMode) {
      playNote(click.midi);
      return;
    }
    if (practice.handleFretboardClick(click)) playNote(click.midi);
  }, [isPracticeMode, playNote, practice]);

  const handleStopPractice = useCallback(() => {
    practice.stopPractice();
    setIsPracticeMode(false);
  }, [practice]);

  const handleSetTuning = useCallback((tuning: Tuning) => {
    practice.stopPractice();
    setIsPracticeMode(false);
    setTuning(tuning);
  }, [practice, setTuning]);

  return (
    <div className={`app ${settings.theme}`}>
      <header>
        <h1>数字吉他</h1>
        <div className="controls">
          {!isPracticeMode && (
            <button type="button" onClick={() => setIsPracticeMode(true)}>练习模式</button>
          )}
          <button type="button" onClick={() => setShowSettings(true)}>设置</button>
        </div>
      </header>

      {status !== 'ready' && (
        <div className={`audio-status ${status}`} role="status">
          <span>{status === 'loading' ? '正在加载音频，听音练习暂不可用。' : error}</span>
          {status === 'error' && <button type="button" onClick={retry}>重新加载音频</button>}
        </div>
      )}

      <main>
        {isPracticeMode && (
          <PracticeMode
            tuning={settings.tuning}
            audioStatus={status}
            practice={practice}
            onStop={handleStopPractice}
          />
        )}

        <Fretboard
          tuning={settings.tuning}
          showNoteNames={settings.showNoteNames}
          noteDisplayMode={settings.noteDisplayMode}
          highlights={isPracticeMode ? practice.fretHighlights : []}
          showClickFeedback={!isPracticeMode}
          onPositionClick={handlePositionClick}
        />
      </main>

      {showSettings && (
        <SettingsModal
          settings={settings}
          onClose={() => setShowSettings(false)}
          onUpdateSettings={updateSettings}
          onSetTuning={handleSetTuning}
        />
      )}
    </div>
  );
}

function App() {
  const { settings, updateSettings, setTuning } = useSettings();

  return (
    <GuitarAudioProvider volume={settings.volume}>
      <DigitalGuitarApp
        settings={settings}
        updateSettings={updateSettings}
        setTuning={setTuning}
      />
    </GuitarAudioProvider>
  );
}

export default App;
