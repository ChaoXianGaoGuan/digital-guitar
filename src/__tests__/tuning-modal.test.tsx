import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TuningModal } from '../components/TuningModal';
import { STANDARD_TUNING } from '../utils/tuning';

describe('TuningModal', () => {
  it('renders preset labels from tuning data and displays musical sharp signs', () => {
    render(
      <TuningModal
        currentTuning={STANDARD_TUNING}
        onClose={vi.fn()}
        onSelectTuning={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: 'Open G (D-G-D-G-B-D)' })).toBeInTheDocument();
    expect(screen.getAllByRole('option', { name: 'F♯2' })).toHaveLength(6);
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(
      <TuningModal
        currentTuning={STANDARD_TUNING}
        onClose={onClose}
        onSelectTuning={vi.fn()}
      />
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
