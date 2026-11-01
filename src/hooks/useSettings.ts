import { useState } from 'react';
import type { Settings } from '../types/game';
const key = 'text-adventure:settings';
const defaults: Settings = { effects: true, textSize: 'normal', textSpeed: 'normal' };
function load(): Settings {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? 'null');
    if (typeof value !== 'object' || !value) return defaults;
    const s = value as Partial<Settings>;
    return { effects: typeof s.effects === 'boolean' ? s.effects : true, textSize: s.textSize === 'large' ? 'large' : 'normal', textSpeed: s.textSpeed === 'instant' || s.textSpeed === 'slow' ? s.textSpeed : 'normal' };
  } catch { return defaults; }
}
export function useSettings() {
  const [settings, setSettings] = useState(load);
  const [settingsError, setError] = useState<string | null>(null);
  function updateSettings(next: Settings) {
    setSettings(next);
    try { localStorage.setItem(key, JSON.stringify(next)); setError(null); }
    catch { setError('設定已於本次套用，但無法儲存至瀏覽器。'); }
  }
  return { settings, updateSettings, settingsError };
}
