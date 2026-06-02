import type { CSSProperties } from 'react';
import type { FretboardPosition, StringIndex } from '../utils/chord';
import type { FretClick } from '../utils/fretboard';
import type { Tuning } from '../utils/tuning';
import { FretCell } from './FretCell';

export type HighlightTone = 'selected' | 'prompt' | 'correct';

interface FretboardProps {
  tuning: Tuning;
  showNoteNames: boolean;
  noteDisplayMode: 'natural' | 'octave';
  highlightedPositions?: FretboardPosition[];
  highlightTone?: HighlightTone;
  showClickFeedback?: boolean;
  onPositionClick: (click: FretClick) => void;
}

export function Fretboard({
  tuning,
  showNoteNames,
  noteDisplayMode,
  highlightedPositions = [],
  highlightTone = 'selected',
  showClickFeedback = true,
  onPositionClick
}: FretboardProps) {
  const frets = 15;
  const strings = 6;
  const displayStrings = [...tuning.strings].reverse();
  const fretPositions = Array.from({ length: frets + 1 }, (_, fret) => (
    (1 - (2 ** (-fret / 12))) / (1 - (2 ** (-frets / 12))) * 100
  ));
  const markerFrets = [3, 5, 7, 9, 12, 15];

  const isHighlighted = (string: StringIndex, fret: number) => (
    highlightedPositions.some(position => position.string === string && position.fret === fret)
  );

  return (
    <div className="fretboard-wrapper">
      <div className="open-strings">
        {displayStrings.map((midiNote, displayIndex) => {
          const stringIndex = (strings - 1 - displayIndex) as StringIndex;
          return (
            <FretCell
              key={`open-${stringIndex}`}
              position={{ string: stringIndex, fret: 0 }}
              midi={midiNote}
              variant="open"
              showNoteName={showNoteNames}
              noteDisplayMode={noteDisplayMode}
              isHighlighted={isHighlighted(stringIndex, 0)}
              highlightTone={highlightTone}
              showClickFeedback={showClickFeedback}
              style={{
                top: `${(displayIndex / (strings - 1)) * 100}%`,
                '--string-width': `${1 + (strings - 1 - stringIndex) * 0.42}px`
              } as CSSProperties}
              onClick={onPositionClick}
            />
          );
        })}
      </div>

      <div className="fretboard">
        <div className="fret-nut" />
        {Array.from({ length: frets + 1 }, (_, fretIndex) => (
          <div
            key={`fret-${fretIndex}`}
            className="fret-wire"
            style={{ left: `${fretPositions[fretIndex]}%` }}
          />
        ))}

        <div className="fret-markers" aria-hidden="true">
          {markerFrets.flatMap(fret => {
            const left = (fretPositions[fret - 1] + fretPositions[fret]) / 2;
            return fret === 12
              ? [
                  <span key={`${fret}-top`} className="fret-marker double top" style={{ left: `${left}%` }} />,
                  <span key={`${fret}-bottom`} className="fret-marker double bottom" style={{ left: `${left}%` }} />
                ]
              : [<span key={fret} className="fret-marker" style={{ left: `${left}%` }} />];
          })}
        </div>

        {displayStrings.map((openMidi, displayIndex) => {
          const stringIndex = (strings - 1 - displayIndex) as StringIndex;
          return (
            <div
              key={`string-${stringIndex}`}
              className="string-row"
              style={{
                top: `${(displayIndex / (strings - 1)) * 100}%`,
                '--string-width': `${1 + (strings - 1 - stringIndex) * 0.42}px`
              } as CSSProperties}
            >
              <div className="string-line" />

              {Array.from({ length: frets }, (_, fretIndex) => {
                const fret = fretIndex + 1;
                const midiNote = openMidi + fret;
                return (
                  <FretCell
                    key={`${stringIndex}-${fret}`}
                    position={{ string: stringIndex, fret }}
                    midi={midiNote}
                    variant="fretted"
                    showNoteName={showNoteNames}
                    noteDisplayMode={noteDisplayMode}
                    isHighlighted={isHighlighted(stringIndex, fret)}
                    highlightTone={highlightTone}
                    showClickFeedback={showClickFeedback}
                    style={{
                      width: `${fretPositions[fret] - fretPositions[fret - 1]}%`
                    }}
                    onClick={onPositionClick}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
