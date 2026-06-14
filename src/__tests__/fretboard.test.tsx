import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Fretboard } from '../components/Fretboard';
import { STANDARD_TUNING } from '../utils/tuning';

describe('Fretboard', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('submits open strings with fret zero', () => {
    const onPositionClick = vi.fn();
    render(
      <Fretboard
        tuning={STANDARD_TUNING}
        showNoteNames={false}
        noteDisplayMode="natural"
        onPositionClick={onPositionClick}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '6弦 空弦 E' }));
    expect(onPositionClick).toHaveBeenCalledWith({
      position: { string: 0, fret: 0 },
      midi: 40
    });
  });

  it('renders highlighted open strings and fretted notes', () => {
    render(
      <Fretboard
        tuning={STANDARD_TUNING}
        showNoteNames={false}
        noteDisplayMode="natural"
        highlights={[
          { position: { string: 0, fret: 0 }, tone: 'selected' },
          { position: { string: 5, fret: 1 }, tone: 'selected' }
        ]}
        onPositionClick={() => undefined}
      />
    );

    expect(screen.getByRole('button', { name: '6弦 空弦 E' })).toHaveClass('highlighted');
    expect(screen.getByRole('button', { name: '1弦 1品 F' })).toHaveClass('highlighted');
  });

  it('uses the shared fret-cell layers for open strings and fretted notes', () => {
    render(
      <Fretboard
        tuning={STANDARD_TUNING}
        showNoteNames
        noteDisplayMode="natural"
        onPositionClick={() => undefined}
      />
    );

    const openString = screen.getByRole('button', { name: '6弦 空弦 E' });
    const frettedNote = screen.getByRole('button', { name: '6弦 1品 F' });
    fireEvent.click(openString);
    fireEvent.click(frettedNote);

    expect(openString).toHaveClass('fret-cell');
    expect(frettedNote).toHaveClass('fret-cell');
    expect(openString.querySelector('.note-name')?.nextElementSibling).toHaveClass('red-dot');
    expect(frettedNote.querySelector('.note-name')?.nextElementSibling).toHaveClass('red-dot');
  });

  it('restarts open-string click feedback timing on repeated clicks', () => {
    vi.useFakeTimers();
    render(
      <Fretboard
        tuning={STANDARD_TUNING}
        showNoteNames={false}
        noteDisplayMode="natural"
        onPositionClick={() => undefined}
      />
    );

    const openString = screen.getByRole('button', { name: '6弦 空弦 E' });
    fireEvent.click(openString);
    act(() => vi.advanceTimersByTime(900));
    fireEvent.click(openString);
    act(() => vi.advanceTimersByTime(200));
    expect(openString.querySelector('.red-dot')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(800));
    expect(openString.querySelector('.red-dot')).not.toBeInTheDocument();
  });

  it('renders guitar landmarks and makes low strings visually thicker', () => {
    const { container } = render(
      <Fretboard
        tuning={STANDARD_TUNING}
        showNoteNames={false}
        noteDisplayMode="natural"
        onPositionClick={() => undefined}
      />
    );

    expect(container.querySelector('.fret-nut')).toBeInTheDocument();
    expect(container.querySelectorAll('.fret-marker')).toHaveLength(7);
    expect(screen.getByRole('button', { name: '6弦 空弦 E' })).toHaveStyle({
      '--string-width': '3.1px'
    });
    expect(screen.getByRole('button', { name: '1弦 空弦 E' })).toHaveStyle({
      '--string-width': '1px'
    });
  });

  it('uses semantic highlight tones for prompts and correct answers', () => {
    const { rerender } = render(
      <Fretboard
        tuning={STANDARD_TUNING}
        showNoteNames={false}
        noteDisplayMode="natural"
        highlights={[{ position: { string: 0, fret: 0 }, tone: 'prompt' }]}
        onPositionClick={() => undefined}
      />
    );
    const openString = screen.getByRole('button', { name: '6弦 空弦 E' });
    expect(openString.querySelector('.red-dot')).toHaveClass('dot-prompt');

    rerender(
      <Fretboard
        tuning={STANDARD_TUNING}
        showNoteNames={false}
        noteDisplayMode="natural"
        highlights={[{ position: { string: 0, fret: 0 }, tone: 'correct' }]}
        onPositionClick={() => undefined}
      />
    );
    expect(openString.querySelector('.red-dot')).toHaveClass('dot-correct');
  });

  it('uses correct over selected over prompt when highlights overlap', () => {
    render(
      <Fretboard
        tuning={STANDARD_TUNING}
        showNoteNames={false}
        noteDisplayMode="natural"
        highlights={[
          { position: { string: 0, fret: 0 }, tone: 'prompt' },
          { position: { string: 0, fret: 0 }, tone: 'selected' },
          { position: { string: 0, fret: 0 }, tone: 'correct' }
        ]}
        onPositionClick={() => undefined}
      />
    );
    expect(screen.getByRole('button', { name: '6弦 空弦 E' }).querySelector('.red-dot'))
      .toHaveClass('dot-correct');
  });
});
