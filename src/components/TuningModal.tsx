import { useEffect, useRef, useState } from 'react';
import type { AllNoteName } from '../utils/note';
import { ALL_NOTE_NAMES } from '../utils/note';
import type { Tuning } from '../utils/tuning';
import { createCustomTuning, PRESET_TUNINGS } from '../utils/tuning';

interface TuningModalProps {
  currentTuning: Tuning;
  onClose: () => void;
  onSelectTuning: (tuning: Tuning) => void;
}

function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  return `${ALL_NOTE_NAMES[midi % 12]}${octave}`;
}

function midiToDisplayName(midi: number): string {
  return ALL_NOTE_NAMES[midi % 12].replace('#', '♯');
}

function noteNameToMidi(noteName: string): number {
  const match = noteName.match(/^([A-G]#?)(\d)$/);
  if (!match) return 60;

  const note = match[1] as AllNoteName;
  const octave = parseInt(match[2]);
  const noteMap: Record<AllNoteName, number> = {
    C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5,
    'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11
  };
  return (octave + 1) * 12 + noteMap[note];
}

export function TuningModal({ currentTuning, onClose, onSelectTuning }: TuningModalProps) {
  const [customTuning, setCustomTuning] = useState<number[]>([...currentTuning.strings]);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
  }, [onClose]);

  const handleStringChange = (stringIndex: number, noteName: string) => {
    setCustomTuning(previous => (
      previous.map((midi, index) => index === stringIndex ? noteNameToMidi(noteName) : midi)
    ));
  };

  const applyCustomTuning = () => {
    onSelectTuning(createCustomTuning(customTuning as Tuning['strings']));
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={modalRef}
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tuning-title"
        tabIndex={-1}
        onClick={event => event.stopPropagation()}
      >
        <h2 id="tuning-title">调弦设置</h2>

        <div className="tuning-section">
          <h3>预设调弦</h3>
          <div className="preset-list">
            {PRESET_TUNINGS.map(preset => (
              <button
                type="button"
                key={preset.id}
                onClick={() => {
                  onSelectTuning(preset);
                  onClose();
                }}
              >
                {preset.name} ({preset.strings.map(midiToDisplayName).join('-')})
              </button>
            ))}
          </div>
        </div>

        <div className="tuning-section">
          <h3>自定义调弦</h3>
          <div className="custom-tuning">
            {['6弦', '5弦', '4弦', '3弦', '2弦', '1弦'].map((name, index) => (
              <div key={name} className="string-setting">
                <label htmlFor={`string-${index}`}>{name}</label>
                <select
                  id={`string-${index}`}
                  value={midiToNoteName(customTuning[index])}
                  onChange={event => handleStringChange(index, event.target.value)}
                >
                  {ALL_NOTE_NAMES.flatMap(note => (
                    [2, 3, 4, 5].map(octave => {
                      const fullName = `${note}${octave}`;
                      return (
                        <option key={fullName} value={fullName}>
                          {fullName.replace('#', '♯')}
                        </option>
                      );
                    })
                  ))}
                </select>
              </div>
            ))}
          </div>
          <button type="button" className="apply-button" onClick={applyCustomTuning}>
            应用自定义调弦
          </button>
        </div>

        <button type="button" className="close-button" onClick={onClose}>关闭</button>
      </div>
    </div>
  );
}
