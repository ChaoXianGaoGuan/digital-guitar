import { useState, useEffect, useCallback } from 'react';
import type { Tuning } from '../utils/tuning';
import { createCustomTuning, PRESET_TUNINGS, STANDARD_TUNING } from '../utils/tuning';

// 设置接口
export interface Settings {
  showNoteNames: boolean;
  noteDisplayMode: 'natural' | 'octave'; // 自然音 或 带八度
  volume: number;
  theme: 'wood' | 'metal';
  tuning: Tuning;
}

// 默认设置
export const DEFAULT_SETTINGS: Settings = {
  showNoteNames: false,
  noteDisplayMode: 'natural',
  volume: 0.5,
  theme: 'wood',
  tuning: STANDARD_TUNING
};

// localStorage key
export const SETTINGS_KEY = 'digital-guitar-settings-v2';
export const LEGACY_SETTINGS_KEY = 'digital-guitar-settings';

// 从localStorage加载设置
function normalizeTuning(value: unknown): Tuning | null {
  if (!value || typeof value !== 'object') return null;
  const tuning = value as Partial<Tuning>;
  if (!Array.isArray(tuning.strings)
    || tuning.strings.length !== 6
    || !tuning.strings.every(midi => Number.isInteger(midi) && midi >= 0 && midi <= 127)) {
    return null;
  }

  const strings = [...tuning.strings] as Tuning['strings'];
  const preset = PRESET_TUNINGS.find(candidate => (
    candidate.strings.every((midi, index) => midi === strings[index])
  ));
  if (preset) return preset;

  return createCustomTuning(
    strings,
    typeof tuning.name === 'string' ? tuning.name : undefined
  );
}

function clampVolume(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.min(1, value))
    : DEFAULT_SETTINGS.volume;
}

export function loadSettings(): Settings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
      ?? localStorage.getItem(LEGACY_SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // 验证并合并默认值
      return {
        showNoteNames: typeof parsed.showNoteNames === 'boolean'
          ? parsed.showNoteNames
          : DEFAULT_SETTINGS.showNoteNames,
        noteDisplayMode: parsed.noteDisplayMode === 'octave' || parsed.noteDisplayMode === 'natural'
          ? parsed.noteDisplayMode
          : DEFAULT_SETTINGS.noteDisplayMode,
        volume: clampVolume(parsed.volume),
        theme: parsed.theme === 'metal' || parsed.theme === 'wood'
          ? parsed.theme
          : DEFAULT_SETTINGS.theme,
        tuning: normalizeTuning(parsed.tuning) ?? DEFAULT_SETTINGS.tuning
      };
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
  return DEFAULT_SETTINGS;
}

// 保存设置到localStorage
function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

interface UseSettingsReturn {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
  setShowNoteNames: (show: boolean) => void;
  setNoteDisplayMode: (mode: 'natural' | 'octave') => void;
  setVolume: (volume: number) => void;
  setTheme: (theme: 'wood' | 'metal') => void;
  setTuning: (tuning: Tuning) => void;
  resetToDefault: () => void;
}

export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  // 当设置变化时保存到localStorage
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // 更新设置
  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  // 设置音名显示
  const setShowNoteNames = useCallback((show: boolean) => {
    setSettings(prev => ({ ...prev, showNoteNames: show }));
  }, []);

  // 设置音名显示模式
  const setNoteDisplayMode = useCallback((mode: 'natural' | 'octave') => {
    setSettings(prev => ({ ...prev, noteDisplayMode: mode }));
  }, []);

  // 设置音量
  const setVolume = useCallback((volume: number) => {
    setSettings(prev => ({ ...prev, volume: clampVolume(volume) }));
  }, []);

  // 设置主题
  const setTheme = useCallback((theme: 'wood' | 'metal') => {
    setSettings(prev => ({ ...prev, theme }));
  }, []);

  // 设置调弦
  const setTuning = useCallback((tuning: Tuning) => {
    setSettings(prev => ({ ...prev, tuning }));
  }, []);

  // 重置为默认设置
  const resetToDefault = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return {
    settings,
    updateSettings,
    setShowNoteNames,
    setNoteDisplayMode,
    setVolume,
    setTheme,
    setTuning,
    resetToDefault
  };
}
