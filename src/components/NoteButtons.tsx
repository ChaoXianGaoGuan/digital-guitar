import React from 'react';
import { NOTE_NAMES } from '../utils/note';
import type { NoteName } from '../utils/note';

interface NoteButtonsProps {
  onSelect: (note: NoteName) => void;
  disabled?: boolean;
  selectedNote?: NoteName | null;
}

export const NoteButtons: React.FC<NoteButtonsProps> = ({
  onSelect,
  disabled = false,
  selectedNote = null
}) => {
  return (
    <div className="note-buttons">
      <h3>选择音名</h3>
      <div className="button-grid">
        {NOTE_NAMES.map(note => (
          <button
            type="button"
            key={note}
            className={`note-button ${selectedNote === note ? 'selected' : ''}`}
            onClick={() => onSelect(note)}
            disabled={disabled}
          >
            {note}
          </button>
        ))}
      </div>
    </div>
  );
};
