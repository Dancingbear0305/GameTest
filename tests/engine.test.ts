import { describe, expect, it } from 'vitest';
import { story } from '../src/data';
import { isStoryData } from '../src/engine/validateData';
import { checkCondition } from '../src/engine/conditions';
import { applyEffects, choose, createGame, enterNode, validateStory } from '../src/engine/story';
import { decodeSave, readSave, writeSave } from '../src/systems/save';
import type { Condition, StoryData } from '../src/types/game';

const fresh = () => createGame(story);
function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return { get length() { return map.size; }, clear: () => map.clear(), getItem: k => map.get(k) ?? null,
    key: i => [...map.keys()][i] ?? null, removeItem: k => { map.delete(k); }, setItem: (k, v) => { map.set(k, v); } };
}
describe('條件判斷', () => {
  it.each([['eq', 3, true], ['ne', 3, false], ['gt', 2, true], ['lt', 4, true], ['gte', 3, true], ['lte', 3, true]] as const)('%s 比較', (op, value, expected) => {
    expect(checkCondition({ op, group: 'resources', key: 'actions', value }, fresh())).toBe(expected);
  });
  it('支援巢狀 AND / OR / NOT、旗標、物品與線索', () => {
    const s = { ...fresh(), flags: ['f'], inventory: ['i'], clues: ['c'] };
    const c: Condition = { op: 'and', conditions: [{ op: 'flag', key: 'f' }, { op: 'item', key: 'i' }, { op: 'clue', key: 'c' }, { op: 'not', condition: { op: 'flag', key: 'missing' } }, { op: 'or', conditions: [{ op: 'flag', key: 'missing' }, { op: 'flag', key: 'f' }] }] };
    expect(checkCondition(c, s)).toBe(true);
    expect(checkCondition({ op: 'eq', group: 'resources', key: 'missing', value: 0 }, s)).toBe(false);
  });
});
describe('效果與時間系統', () => {
  it('不修改原狀態，物品與旗標不重複，支援移除', () => {
    const original = fresh();
    const s = applyEffects(original, [{ type: 'add', group: 'resources', key: 'actions', value: -1 }, { type: 'set', group: 'playerStats', key: 'focus', value: 80 }, { type: 'flag', key: 'x', value: true }, { type: 'flag', key: 'x', value: true }, { type: 'item', key: 'item' }, { type: 'clue', key: 'clue' }, { type: 'npc', npcId: 'test-npc', key: 'asked', value: true }], story);
    expect(s.resources.actions).toBe(2); expect(original.resources.actions).toBe(3); expect(s.flags).toEqual(['x']);
    expect(s.playerStats.focus).toBe(80); expect(s.npcStates['test-npc'].asked).toBe(true);
    const removed = applyEffects(s, [{ type: 'flag', key: 'x', value: false }, { type: 'item', key: 'item', remove: true }, { type: 'clue', key: 'clue', remove: true }], story);
    expect(removed.flags).toEqual([]); expect(removed.inventory).toEqual([]); expect(removed.clues).toEqual([]);
  });
  it('資源不足時整筆交易失敗', () => {
    const s = fresh(); expect(() => applyEffects(s, [{ type: 'flag', key: 'x', value: true }, { type: 'add', group: 'resources', key: 'tools', value: -2 }], story)).toThrow('資源不足'); expect(s.flags).toEqual([]);
  });
  it('切換階段觸發指定事件，新的一天重置行動', () => {
    const s = applyEffects(fresh(), [{ type: 'phase', phase: 'review' }, { type: 'add', group: 'resources', key: 'actions', value: -2 }], story);
    expect(s.flags).toContain('phase-tested'); expect(s.currentPhase).toBe('review');
    const next = applyEffects(s, [{ type: 'newDay' }], story);
    expect(next.day).toBe(2); expect(next.resources.actions).toBe(3); expect(next.currentPhase).toBe('inspection'); expect(next.flags).toContain('phase-tested');
  });
});
describe('劇情引擎', () => {
  it('所有內建資料參照有效', () => expect(validateStory(story)).toEqual([]));
  it('完成調查、解鎖與線索分支', () => {
    let s = fresh();
    expect(() => choose(s, 'record', story)).toThrow();
    s = choose(s, 'inspect', story); expect(s.flags).toContain('inspected'); expect(s.clues).toContain('test-clue'); expect(s.resources.actions).toBe(2);
    s = choose(s, 'continue', story); expect(() => choose(s, 'inspect', story)).toThrow();
    s = choose(s, 'judge', story); s = choose(s, 'evidence', story);
    expect(s.endingId).toBe('ending-b'); expect(s.decisionHistory.at(-1)?.choiceId).toBe('evidence');
  });
  it.each([['accept', 'ending-a'], ['reject', 'ending-c']])('其他分支 %s', (choice, ending) => {
    expect(choose(choose(fresh(), 'judge', story), choice, story).endingId).toBe(ending);
  });
  it('隱藏選項不能透過指定 ID 繞過', () => expect(() => choose(choose(fresh(), 'judge', story), 'evidence', story)).toThrow());
  it('避免無效節點及不滿足條件的跳轉', () => {
    expect(() => enterNode(fresh(), 'missing', story)).toThrow('找不到節點');
    expect(() => enterNode(fresh(), 'record', story)).toThrow('條件');
    const bad = structuredClone(story); bad.nodes[0].next = 'missing'; expect(validateStory(bad)).toContain('節點不存在：missing');
  });
  it('攔截自動跳轉與效果事件的循環', () => {
    const loop: StoryData = structuredClone(story);
    loop.nodes.push({ id: 'loop', type: 'event', text: '', next: 'loop' });
    expect(() => enterNode(fresh(), 'loop', loop)).toThrow('安全上限');
    loop.nodes.push({ id: 'recursive', type: 'event', text: '', effects: [{ type: 'event', eventId: 'recursive' }] });
    expect(() => applyEffects(fresh(), [{ type: 'event', eventId: 'recursive' }], loop)).toThrow('安全上限');
  });
});
describe('本機存檔', () => {
  it('完整往返存讀，手動存檔不受新遊戲與自動存檔影響', () => {
    const storage = memoryStorage(); const s = choose(fresh(), 'inspect', story);
    expect(writeSave('1', s, story, storage).ok).toBe(true); writeSave('auto', fresh(), story, storage);
    const saved = readSave('1', story, storage); expect(saved.ok && saved.value?.state).toEqual(s);
    expect(readSave('2', story, storage)).toEqual({ ok: true, value: null });
  });
  it('支援已知舊版本，拒絕未知新版本', () => {
    expect(decodeSave(JSON.stringify({ version: 0, timestamp: new Date().toISOString(), state: fresh() }), story).ok).toBe(true);
    expect(decodeSave(JSON.stringify({ version: 99, savedAt: new Date().toISOString(), state: fresh() }), story).ok).toBe(false);
  });
  it('拒絕損壞 JSON、無效狀態、節點與時間', () => {
    expect(decodeSave('{bad', story).ok).toBe(false);
    for (const state of [{ ...fresh(), currentNodeId: 'missing' }, { ...fresh(), resources: { actions: -1 } }, { ...fresh(), day: 0 }, { ...fresh(), flags: [3] }, { ...fresh(), endingId: 'ending-a' }]) {
      expect(decodeSave(JSON.stringify({ version: 1, savedAt: new Date().toISOString(), state }), story).ok).toBe(false);
    }
    expect(decodeSave(JSON.stringify({ version: 1, savedAt: 'invalid', state: fresh() }), story).ok).toBe(false);
  });
  it('妥善回報存取被拒與容量不足', () => {
    const storage = memoryStorage(); storage.setItem = () => { throw new Error('QuotaExceededError'); }; storage.getItem = () => { throw new Error('SecurityError'); };
    expect(writeSave('auto', fresh(), story, storage).ok).toBe(false); expect(readSave('auto', story, storage).ok).toBe(false);
  });
});

describe('外部 JSON 資料驗證', () => {
  it('拒絕缺欄位、無效條件與不支援效果', () => {
    expect(isStoryData(story)).toBe(true);
    expect(isStoryData({ nodes: [] })).toBe(false);
    const invalid = structuredClone(story) as unknown as { nodes: { effects: unknown[] }[] };
    invalid.nodes[0].effects = [{ type: 'execute', code: 'invalid' }];
    expect(isStoryData(invalid)).toBe(false);
  });
});
