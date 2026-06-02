import { useEffect, useRef, useState } from 'react';
import type { Settings } from '../hooks/useSettings';
import type { Tuning } from '../utils/tuning';
import { TuningModal } from './TuningModal';

interface SettingsModalProps {
  settings: Settings;
  onClose: () => void;
  onUpdateSettings: (updates: Partial<Settings>) => void;
  onSetTuning: (tuning: Tuning) => void;
}

export function SettingsModal({
  settings,
  onClose,
  onUpdateSettings,
  onSetTuning
}: SettingsModalProps) {
  const [showTuningModal, setShowTuningModal] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showTuningModal) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    modalRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [onClose, showTuningModal]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={modalRef}
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        tabIndex={-1}
        onClick={event => event.stopPropagation()}
      >
        <h2 id="settings-title">设置</h2>

        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.showNoteNames}
              onChange={event => onUpdateSettings({ showNoteNames: event.target.checked })}
            />
            显示音名
          </label>
        </div>

        {settings.showNoteNames && (
          <div className="setting-item">
            <label htmlFor="note-display-mode">音名格式</label>
            <select
              id="note-display-mode"
              value={settings.noteDisplayMode}
              onChange={event => onUpdateSettings({ noteDisplayMode: event.target.value as 'natural' | 'octave' })}
            >
              <option value="natural">自然音 (C D E F G A B)</option>
              <option value="octave">带八度 (C4 D4 E4)</option>
            </select>
          </div>
        )}

        <div className="setting-item">
          <label htmlFor="volume">音量</label>
          <input
            id="volume"
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.volume}
            onChange={event => onUpdateSettings({ volume: parseFloat(event.target.value) })}
          />
          <span>{Math.round(settings.volume * 100)}%</span>
        </div>

        <div className="setting-item">
          <label htmlFor="theme">主题风格</label>
          <select
            id="theme"
            value={settings.theme}
            onChange={event => onUpdateSettings({ theme: event.target.value as 'wood' | 'metal' })}
          >
            <option value="wood">木质纹理</option>
            <option value="metal">金属纹理</option>
          </select>
        </div>

        <div className="setting-item">
          <label>调弦</label>
          <button type="button" onClick={() => setShowTuningModal(true)}>
            {settings.tuning.name}
          </button>
        </div>

        <button type="button" className="close-button" onClick={onClose}>关闭</button>

        {showTuningModal && (
          <TuningModal
            currentTuning={settings.tuning}
            onClose={() => setShowTuningModal(false)}
            onSelectTuning={onSetTuning}
          />
        )}
      </div>
    </div>
  );
}
