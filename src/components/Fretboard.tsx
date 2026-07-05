import type { CSSProperties } from 'react';
import type { FretboardPosition, StringIndex } from '../utils/chord';
import type { FretClick } from '../utils/fretboard';
import type { Tuning } from '../utils/tuning';
import { FretCell } from './FretCell';

export type HighlightTone = 'selected' | 'prompt' | 'correct' | 'area';
export interface FretHighlight {
  position: FretboardPosition;
  tone: HighlightTone;
}

interface FretboardProps {
  tuning: Tuning;
  showNoteNames: boolean;
  noteDisplayMode: 'natural' | 'octave';
  highlights?: FretHighlight[];
  showClickFeedback?: boolean;
  onPositionClick: (click: FretClick) => void;
}

export function Fretboard({
  tuning,
  showNoteNames,
  noteDisplayMode,
  highlights = [],
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
  const areaPositions = highlights
    .filter(highlight => highlight.tone === 'area')
    .map(highlight => highlight.position);
  const areaRange = areaPositions.length > 0
    ? {
        min: Math.max(0, Math.min(...areaPositions.map(position => position.fret))),
        max: Math.min(frets, Math.max(...areaPositions.map(position => position.fret)))
      }
    : null;
  const areaFrameStart = areaRange ? fretPositions[areaRange.min === 0 ? 0 : areaRange.min - 1] : 0;
  const areaFrameEnd = areaRange ? fretPositions[areaRange.max] : 0;
  const areaFrameIncludesOpenStrings = areaRange?.min === 0;

  const getHighlightTone = (string: StringIndex, fret: number) => {
    const tones = highlights
      .filter(highlight => highlight.position.string === string && highlight.position.fret === fret)
      .map(highlight => highlight.tone);
    if (tones.includes('correct')) return 'correct';
    if (tones.includes('selected')) return 'selected';
    if (tones.includes('prompt')) return 'prompt';
    return undefined;
  };

  return (
    <div className="fretboard-wrapper">
      <div className="open-strings">
        {displayStrings.map((midiNote, displayIndex) => {
          const stringIndex = (strings - 1 - displayIndex) as StringIndex;
          const tone = getHighlightTone(stringIndex, 0);
          return (
            <FretCell
              key={`open-${stringIndex}`}
              position={{ string: stringIndex, fret: 0 }}
              midi={midiNote}
              variant="open"
              showNoteName={showNoteNames}
              noteDisplayMode={noteDisplayMode}
              isHighlighted={tone !== undefined}
              highlightTone={tone}
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
        {areaRange && (
          <div
            className={`fret-area-frame ${areaFrameIncludesOpenStrings ? 'includes-open-strings' : ''}`}
            aria-hidden="true"
            data-fret-start={areaRange.min}
            data-fret-end={areaRange.max}
            data-includes-open-strings={areaFrameIncludesOpenStrings ? 'true' : 'false'}
            style={{
              left: areaFrameIncludesOpenStrings
                ? 'calc(-1 * (var(--open-strings-width) + var(--open-strings-gap)))'
                : `${areaFrameStart}%`,
              width: areaFrameIncludesOpenStrings
                ? `calc(${areaFrameEnd}% + var(--open-strings-width) + var(--open-strings-gap))`
                : `${areaFrameEnd - areaFrameStart}%`
            }}
          />
        )}
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
                const tone = getHighlightTone(stringIndex, fret);
                return (
                  <FretCell
                    key={`${stringIndex}-${fret}`}
                    position={{ string: stringIndex, fret }}
                    midi={midiNote}
                    variant="fretted"
                    showNoteName={showNoteNames}
                    noteDisplayMode={noteDisplayMode}
                    isHighlighted={tone !== undefined}
                    highlightTone={tone}
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
