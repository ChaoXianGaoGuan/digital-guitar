import React from 'react';
import { ALL_CHORDS } from '../utils/chord';
import type { Chord } from '../utils/chord';

interface ChordButtonsProps {
  onSelect: (chord: Chord) => void;
  disabled?: boolean;
  selectedChord?: Chord | null;
}

export const ChordButtons: React.FC<ChordButtonsProps> = ({
  onSelect,
  disabled = false,
  selectedChord = null
}) => {
  // 按类型分组和弦
  const majorChords = ALL_CHORDS.filter(c => c.type === 'major');
  const minorChords = ALL_CHORDS.filter(c => c.type === 'minor');
  const dominant7Chords = ALL_CHORDS.filter(c => c.type === 'dominant7');

  return (
    <div className="chord-buttons">
      <h3>选择和弦</h3>
      
      {/* 大三和弦 */}
      <div className="chord-group">
        <h4>大三和弦</h4>
        <div className="button-grid">
          {majorChords.map(chord => (
            <button
              type="button"
              key={chord.name}
              className={`chord-button ${selectedChord?.name === chord.name ? 'selected' : ''}`}
              onClick={() => onSelect(chord)}
              disabled={disabled}
            >
              {chord.name}
            </button>
          ))}
        </div>
      </div>

      {/* 小三和弦 */}
      <div className="chord-group">
        <h4>小三和弦</h4>
        <div className="button-grid">
          {minorChords.map(chord => (
            <button
              type="button"
              key={chord.name}
              className={`chord-button ${selectedChord?.name === chord.name ? 'selected' : ''}`}
              onClick={() => onSelect(chord)}
              disabled={disabled}
            >
              {chord.name}
            </button>
          ))}
        </div>
      </div>

      {/* 七和弦 */}
      <div className="chord-group">
        <h4>七和弦</h4>
        <div className="button-grid">
          {dominant7Chords.map(chord => (
            <button
              type="button"
              key={chord.name}
              className={`chord-button ${selectedChord?.name === chord.name ? 'selected' : ''}`}
              onClick={() => onSelect(chord)}
              disabled={disabled}
            >
              {chord.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
