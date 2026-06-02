import { describe, expect, it } from 'vitest';
import {
  OPEN_G_TUNING,
  STANDARD_TUNING,
  isStandardTuning
} from '../utils/tuning';

describe('tuning utils', () => {
  it('uses the six-string D-G-D-G-B-D Open G preset', () => {
    expect(OPEN_G_TUNING.strings).toEqual([38, 43, 50, 55, 59, 62]);
  });

  it('recognizes Standard tuning by note values', () => {
    expect(isStandardTuning(STANDARD_TUNING)).toBe(true);
    expect(isStandardTuning({
      id: 'custom',
      name: 'Custom Standard',
      strings: [...STANDARD_TUNING.strings]
    })).toBe(true);
    expect(isStandardTuning(OPEN_G_TUNING)).toBe(false);
  });
});
