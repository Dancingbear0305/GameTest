import type { GameState, StoryData } from '../types/game';

export const SAVE_VERSION = 1;
export const slots = ['auto', '1', '2', '3'] as const;
export type Slot = typeof slots[number];
export interface SaveData { version: number; savedAt: string; state: GameState }
export type SaveResult<T> = { ok: true; value: T } | { ok: false; error: string };
const prefix = 'text-adventure:save:';
const object = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const strings = (x: unknown): x is string[] => Array.isArray(x) && x.every(v => typeof v === 'string');
const numbers = (x: unknown): boolean => object(x) && Object.values(x).every(v => typeof v === 'number' && Number.isFinite(v));

export function validState(x: unknown, data: StoryData): x is GameState {
  if (!object(x)) return false;
  return typeof x.currentNodeId === 'string' && data.nodes.some(n => n.id === x.currentNodeId)
    && typeof x.currentPhase === 'string' && data.config.phases.some(p => p.id === x.currentPhase)
    && typeof x.day === 'number' && Number.isInteger(x.day) && x.day > 0
    && numbers(x.playerStats) && numbers(x.resources) && object(x.resources) && Object.values(x.resources).every(v => typeof v === 'number' && v >= 0)
    && strings(x.inventory) && strings(x.clues) && strings(x.flags)
    && strings(x.visitedNodes) && x.visitedNodes.every(id => data.nodes.some(n => n.id === id))
    && (x.endingId === null || (typeof x.endingId === 'string' && x.endingId === x.currentNodeId && data.nodes.some(n => n.id === x.endingId && n.type === 'ending')))
    && (data.nodes.find(n => n.id === x.currentNodeId)?.type === 'ending' ? x.endingId === x.currentNodeId : x.endingId === null)
    && object(x.npcStates) && Object.values(x.npcStates).every(s => object(s) && Object.values(s).every(v => ['boolean', 'number', 'string'].includes(typeof v) && (typeof v !== 'number' || Number.isFinite(v))))
    && Array.isArray(x.decisionHistory) && x.decisionHistory.every(h => object(h) && typeof h.nodeId === 'string' && data.nodes.some(n => n.id === h.nodeId) && typeof h.choiceId === 'string' && typeof h.day === 'number' && Number.isInteger(h.day) && h.day > 0);
}
export function decodeSave(raw: string, data: StoryData): SaveResult<SaveData> {
  try {
    const value: unknown = JSON.parse(raw);
    if (!object(value)) return { ok: false, error: '存檔格式不正確。' };
    // Version 0 used `timestamp`; migrate only this known format, never guess future versions.
    const version = value.version === 0 ? 1 : value.version;
    const savedAt = value.version === 0 ? value.timestamp : value.savedAt;
    if (version !== SAVE_VERSION) return { ok: false, error: '此存檔版本尚不相容，請保留原存檔。' };
    if (typeof savedAt !== 'string' || !Number.isFinite(Date.parse(savedAt)) || !validState(value.state, data)) return { ok: false, error: '存檔資料已損壞或與目前測試資料不相容。' };
    return { ok: true, value: { version: SAVE_VERSION, savedAt, state: value.state } };
  } catch { return { ok: false, error: '無法解析存檔，原始資料已保留。' }; }
}
export function readSave(slot: Slot, data: StoryData, storage?: Storage): SaveResult<SaveData | null> {
  try {
    const raw = (storage ?? window.localStorage).getItem(prefix + slot);
    return raw === null ? { ok: true, value: null } : decodeSave(raw, data);
  } catch { return { ok: false, error: '瀏覽器禁止讀取本機儲存空間。' }; }
}
export function writeSave(slot: Slot, state: GameState, data: StoryData, storage?: Storage): SaveResult<SaveData> {
  if (!validState(state, data)) return { ok: false, error: '遊戲狀態無效，未寫入存檔。' };
  const save = { version: SAVE_VERSION, savedAt: new Date().toISOString(), state };
  try { (storage ?? window.localStorage).setItem(prefix + slot, JSON.stringify(save)); return { ok: true, value: save }; }
  catch { return { ok: false, error: '存檔失敗：儲存空間已滿或瀏覽器禁止存取。' }; }
}
export function deleteSave(slot: Slot): SaveResult<null> {
  try { window.localStorage.removeItem(prefix + slot); return { ok: true, value: null }; }
  catch { return { ok: false, error: '無法刪除存檔，請檢查瀏覽器設定。' }; }
}
