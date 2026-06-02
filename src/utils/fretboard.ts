import type { FretboardPosition } from './chord';

export interface FretClick {
  position: FretboardPosition;
  midi: number;
}
