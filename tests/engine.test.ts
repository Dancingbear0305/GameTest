import { describe, expect, it } from 'vitest';
import { story } from '../src/data';
import { isStoryData } from '../src/engine/validateData';
import { checkCondition } from '../src/engine/conditions';
import { applyEffects, availableChoices, choose, createGame, enterNode, validateStory } from '../src/engine/story';
import { decodeSave, readSave, SAVE_VERSION, validState, writeSave } from '../src/systems/save';
import type { GameState, StoryData } from '../src/types/game';

const fresh = () => createGame(story);
const admitted = () => choose(fresh(), 'admit', story);
const person = () => choose(admitted(), 'select-first', story);
const select = (s: GameState, id: string) => choose(s, id, story);
const inspect = (s: GameState, part: string) => select(s, `inspect-${part}`);
function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return { get length() { return map.size; }, clear: () => map.clear(), getItem: k => map.get(k) ?? null,
    key: i => [...map.keys()][i] ?? null, removeItem: k => { map.delete(k); }, setItem: (k, v) => { map.set(k, v); } };
}
const encode = (state: unknown, version = SAVE_VERSION) => JSON.stringify({ version, savedAt: new Date().toISOString(), state });

describe('條件與效果', () => {
  it.each([['eq', 3, true], ['ne', 3, false], ['gt', 2, true], ['lt', 4, true], ['gte', 3, true], ['lte', 3, true]] as const)('%s 比較', (op, value, expected) => {
    expect(checkCondition({ op, group: 'resources', key: 'actions', value }, admitted())).toBe(expected);
  });
  it('支援巢狀 AND / OR / NOT、階段、NPC 與旗標', () => {
    expect(checkCondition({ op: 'and', conditions: [{ op: 'phase', value: 'day' }, { op: 'npc', npcId: 'first', key: 'presence', value: 'inside' }, { op: 'not', condition: { op: 'flag', key: 'shot' } }, { op: 'or', conditions: [{ op: 'flag', key: 'admitted' }, { op: 'flag', key: 'missing' }] }] }, admitted())).toBe(true);
    expect(checkCondition({ op: 'eq', group: 'resources', key: 'missing', value: 0 }, fresh())).toBe(false);
  });
  it('效果不修改原狀態，旗標可移除；資源不足時整筆失敗', () => {
    const s = admitted();
    const next = applyEffects(s, [{ type: 'flag', key: 'x', value: true }, { type: 'flag', key: 'x', value: false }], story);
    expect(next.flags).not.toContain('x'); expect(s.resources.actions).toBe(3);
    expect(() => applyEffects(s, [{ type: 'flag', key: 'x', value: true }, { type: 'add', group: 'resources', key: 'actions', value: -4 }], story)).toThrow('資源不足');
    expect(s.flags).not.toContain('x');
  });
});

describe('第一天日夜流程', () => {
  it('只保留行動資源，第一天夜晚開始，不能調查或開槍', () => {
    const s = fresh(); expect(s.day).toBe(1); expect(s.currentPhase).toBe('night'); expect(s.resources).toEqual({ actions: 0 });
    expect(s).not.toHaveProperty('inventory'); expect(s).not.toHaveProperty('playerStats'); expect(s).not.toHaveProperty('clues');
    expect(availableChoices(s, story).map(c => c.id)).toEqual(['night-talk', 'admit', 'reject']);
    for (const id of ['inspect-head', 'shoot', 'confirm-shoot', 'select-first']) expect(() => select(s, id)).toThrow();
  });
  it('夜晚可反覆對話，不耗行動；固定回應不隨機變化', () => {
    let s = fresh();
    for (let n = 0; n < 4; n++) { s = select(s, 'night-talk'); expect(s.currentNodeId).toBe('night-answer'); s = select(s, 'continue'); }
    expect(s.currentPhase).toBe('night'); expect(s.resources.actions).toBe(0);
  });
  it.each(['admit', 'reject'])('%s 都直接進入第一天白天並取得 3 次行動', id => {
    const s = select(fresh(), id); expect(s.day).toBe(1); expect(s.currentPhase).toBe('day'); expect(s.resources.actions).toBe(3); expect(validState(s, story)).toBe(true);
    expect(s.npcStates.first.presence).toBe(id === 'admit' ? 'inside' : 'gone');
  });
  it('放進來後可選擇屋內角色，白天對話不耗行動', () => {
    let s = person();
    for (let n = 0; n < 5; n++) s = select(select(s, 'day-talk'), 'continue');
    expect(s.resources.actions).toBe(3); expect(s.currentPhase).toBe('day');
  });
  it('每部位花 1 次行動，特徵固定且不能重複收費', () => {
    let s = inspect(person(), 'head'); expect(s.resources.actions).toBe(2); expect(s.lastObservation).toEqual({ npcId: 'first', featureId: 'head' });
    s = select(s, 'continue'); expect(() => inspect(s, 'head')).toThrow();
    expect(inspect(person(), 'head').lastObservation).toEqual(s.lastObservation);
    expect(story.npcs[0].features.find(f => f.id === 'head')?.text).toContain('固定測試特徵 A');
  });
  it('第三次行動後自動進入夜晚，不丟失最後一次觀察，不生成第二角色', () => {
    let s = person();
    for (const part of ['head', 'eyes']) s = select(inspect(s, part), 'continue');
    s = inspect(s, 'hands');
    expect(s.day).toBe(2); expect(s.resources.actions).toBe(0); expect(s.currentPhase).toBe('night'); expect(s.endingId).toBe('first-day-end');
    expect(s.lastObservation?.featureId).toBe('hands'); expect(availableChoices(s, story)).toEqual([]); expect(validState(s, story)).toBe(true);
    expect(() => select(s, 'day-talk')).toThrow();
  });
  it('開槍需確認，可取消，確認後移除角色，不揭露身分', () => {
    const original = person(); const confirm = select(original, 'shoot');
    expect(confirm.npcStates.first.presence).toBe('inside'); expect(confirm.resources.actions).toBe(3);
    expect(select(confirm, 'cancel-shoot').npcStates.first.presence).toBe('inside');
    const shot = select(confirm, 'confirm-shoot');
    expect(shot.npcStates.first.presence).toBe('gone'); expect(shot.resources.actions).toBe(3); expect(shot.flags).toContain('shot');
    expect(shot.npcStates.first).not.toHaveProperty('identity');
    const empty = select(shot, 'continue'); expect(empty.currentNodeId).toBe('day-empty');
    for (const id of ['select-first', 'inspect-head', 'day-talk', 'confirm-shoot']) expect(() => select(empty, id)).toThrow();
    expect(select(empty, 'finish-day').currentPhase).toBe('night');
  });
  it('趕走後屋內無人，可結束白天而不被卡住', () => {
    const s = select(fresh(), 'reject'); expect(s.currentNodeId).toBe('day-empty');
    expect(availableChoices(s, story).map(c => c.id)).toEqual(['finish-day']);
    expect(select(s, 'finish-day').endingId).toBe('first-day-end');
  });
});

describe('劇情安全性與資料驗證', () => {
  it('資料形狀與參照皆有效，拒絕缺欄位與任意程式碼效果', () => {
    expect(isStoryData(story)).toBe(true); expect(validateStory(story)).toEqual([]); expect(isStoryData({ nodes: [] })).toBe(false);
    const bad = structuredClone(story) as unknown as { nodes: { effects: unknown[] }[] };
    bad.nodes[0].effects = [{ type: 'execute', code: 'invalid' }]; expect(isStoryData(bad)).toBe(false);
  });
  it('不存在節點、部位與不滿足條件的跳轉會失敗', () => {
    expect(() => enterNode(fresh(), 'missing', story)).toThrow('找不到節點');
    expect(() => enterNode(fresh(), 'day-person', story)).toThrow('條件');
    expect(() => applyEffects(fresh(), [{ type: 'observe', npcId: 'first', featureId: 'missing' }], story)).toThrow('部位');
    const bad = structuredClone(story); bad.nodes[0].next = 'missing'; expect(validateStory(bad)).toContain('節點不存在：missing');
  });
  it('自動事件與階段循環有上限', () => {
    const loop: StoryData = structuredClone(story);
    loop.nodes.push({ id: 'loop', type: 'event', text: '', next: 'loop' });
    expect(() => enterNode(fresh(), 'loop', loop)).toThrow('安全上限');
    loop.nodes.push({ id: 'recursive', type: 'event', text: '', effects: [{ type: 'event', eventId: 'recursive' }] });
    expect(() => applyEffects(fresh(), [{ type: 'event', eventId: 'recursive' }], loop)).toThrow('安全上限');
    loop.config.transitions = [{ conditions: { op: 'phase', value: 'day' }, next: 'day-person' }];
    expect(() => selectWithData(person(), 'day-talk', loop)).toThrow('安全上限');
  });
});
function selectWithData(s: GameState, id: string, data: StoryData) { return choose(s, id, data); }

describe('存檔 v2', () => {
  it('存讀夜晚、調查結果、開槍確認與結束狀態，不重複扣行動', () => {
    const inspected = inspect(person(), 'head'); const storage = memoryStorage();
    const ended = select(select(fresh(), 'reject'), 'finish-day');
    for (const s of [fresh(), admitted(), inspected, select(person(), 'shoot'), ended]) {
      expect(writeSave('1', s, story, storage).ok).toBe(true);
      const saved = readSave('1', story, storage); expect(saved.ok && saved.value?.state).toEqual(s);
    }
    expect(select(inspected, 'continue').resources.actions).toBe(2);
    writeSave('1', inspected, story, storage); writeSave('auto', fresh(), story, storage);
    const saved = readSave('1', story, storage); expect(saved.ok && saved.value?.state).toEqual(inspected);
    expect(readSave('2', story, storage)).toEqual({ ok: true, value: null });
  });
  it('舊測試版與未知未來版本不自動套入新規則，保留原始資料', () => {
    const storage = memoryStorage(); const old = encode(fresh(), 1); storage.setItem('text-adventure:save:1', old);
    expect(readSave('1', story, storage).ok).toBe(false); expect(storage.getItem('text-adventure:save:1')).toBe(old);
    expect(decodeSave(encode(fresh(), 99), story).ok).toBe(false);
  });
  it('拒絕損壞 JSON、不相容節點、非法階段與無效觀察', () => {
    expect(decodeSave('{bad', story).ok).toBe(false);
    for (const s of [{ ...fresh(), currentNodeId: 'missing' }, { ...person(), currentPhase: 'night' }, { ...person(), resources: { actions: 0 } }, { ...fresh(), resources: { actions: -1 } }, { ...fresh(), resources: {} }, { ...fresh(), day: 0 }, { ...fresh(), lastObservation: { npcId: 'first', featureId: 'missing' } }]) {
      expect(decodeSave(encode(s), story).ok).toBe(false);
    }
  });
  it('儲存拒絕與容量不足會回報錯誤', () => {
    const storage = memoryStorage(); storage.setItem = () => { throw new Error('QuotaExceededError'); }; storage.getItem = () => { throw new Error('SecurityError'); };
    expect(writeSave('auto', fresh(), story, storage).ok).toBe(false); expect(readSave('auto', story, storage).ok).toBe(false);
  });
});
