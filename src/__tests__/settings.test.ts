import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  LEGACY_SETTINGS_KEY,
  loadSettings,
  SETTINGS_KEY,
  useSettings
} from '../hooks/useSettings';

describe('settings persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('fills fields missing from a legacy saved value', () => {
    localStorage.setItem(LEGACY_SETTINGS_KEY, JSON.stringify({
      showNoteNames: true,
      volume: 0.8,
      theme: 'metal',
      tuning: { name: 'Legacy', strings: [40, 45, 50, 55, 59, 64] }
    }));

    expect(loadSettings()).toMatchObject({
      showNoteNames: true,
      noteDisplayMode: 'natural',
      volume: 0.8,
      theme: 'metal',
      tuning: {
        id: 'standard',
        name: 'Standard',
        strings: [40, 45, 50, 55, 59, 64]
      }
    });
  });

  it('clamps volume and rejects malformed tuning data', () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      volume: 4,
      theme: 'invalid',
      tuning: { name: 'Broken', strings: [40, 45] }
    }));

    expect(loadSettings()).toEqual({
      ...DEFAULT_SETTINGS,
      volume: 1
    });
  });

  it('prefers the v2 key and normalizes custom tuning data', () => {
    localStorage.setItem(LEGACY_SETTINGS_KEY, JSON.stringify({ volume: 0.1 }));
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      volume: 0.7,
      tuning: { name: '低音自定义', strings: [36, 43, 48, 55, 59, 64] }
    }));

    expect(loadSettings()).toMatchObject({
      volume: 0.7,
      tuning: {
        id: 'custom',
        name: '低音自定义',
        strings: [36, 43, 48, 55, 59, 64]
      }
    });
  });

  it('saves updates to the v2 storage key', () => {
    const { result } = renderHook(() => useSettings());
    act(() => result.current.setVolume(0.9));
    expect(JSON.parse(localStorage.getItem(SETTINGS_KEY)!)).toMatchObject({
      volume: 0.9,
      tuning: { id: 'standard' }
    });
  });
});
