import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { FretboardPosition } from '../utils/chord';
import type { FretClick } from '../utils/fretboard';
import { midiToChromaticName, midiToFullNoteName } from '../utils/note';

interface FretCellProps {
  position: FretboardPosition;
  midi: number;
  variant: 'open' | 'fretted';
  showNoteName: boolean;
  noteDisplayMode: 'natural' | 'octave';
  isHighlighted?: boolean;
  highlightTone?: 'selected' | 'prompt' | 'correct' | 'area';
  showClickFeedback?: boolean;
  style?: CSSProperties;
  onClick: (click: FretClick) => void;
}

export function FretCell({
  position,
  midi,
  variant,
  showNoteName,
  noteDisplayMode,
  isHighlighted = false,
  highlightTone = 'selected',
  showClickFeedback = true,
  style,
  onClick
}: FretCellProps) {
  const [clickedDot, setClickedDot] = useState(false);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noteName = noteDisplayMode === 'octave'
    ? midiToFullNoteName(midi)
    : midiToChromaticName(midi);
  const showDot = (isHighlighted && highlightTone !== 'area') || clickedDot;

  useEffect(() => () => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
  }, []);

  const handleClick = () => {
    if (showClickFeedback) {
      setClickedDot(true);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = setTimeout(() => {
        feedbackTimerRef.current = null;
        setClickedDot(false);
      }, 1000);
    }
    onClick({ position, midi });
  };

  const positionLabel = position.fret === 0 ? '空弦' : `${position.fret}品`;

  return (
    <button
      type="button"
      className={`fret-cell ${variant === 'open' ? 'open-string' : 'string-segment'} ${showDot ? 'show-dot' : ''} ${isHighlighted ? `highlighted highlight-${highlightTone}` : ''}`}
      style={style}
      onClick={handleClick}
      data-string={position.string}
      data-fret={position.fret}
      data-midi={midi}
      aria-label={`${6 - position.string}弦 ${positionLabel} ${noteName}`}
    >
      {variant === 'open' && <span className="open-string-line" />}
      {showNoteName && <span className="note-name">{noteName}</span>}
      {showDot && <span className={`red-dot ${isHighlighted ? `dot-${highlightTone}` : 'dot-played'}`} />}
    </button>
  );
}
