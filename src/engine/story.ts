import type { Choice, Effect, GameState, StoryData, StoryNode } from '../types/game';
import { checkCondition } from './conditions';
import { newDay } from '../systems/time';

function requireNode(data: StoryData, id: string): StoryNode {
  const node = data.nodes.find(n => n.id === id);
  if (!node) throw new Error(`找不到節點：${id}`);
  return node;
}
function unique(values: string[], key: string, remove = false) {
  return remove ? values.filter(v => v !== key) : [...new Set([...values, key])];
}
export function applyEffects(state: GameState, effects: Effect[], data: StoryData, depth = 0): GameState {
  if (depth > 32) throw new Error('事件觸發超過安全上限，請檢查循環。');
  let result = structuredClone(state);
  for (const effect of effects) {
    switch (effect.type) {
      case 'add': case 'set': {
        const value = effect.type === 'set' ? effect.value : (result[effect.group][effect.key] ?? 0) + effect.value;
        if (!Number.isFinite(value) || (effect.group === 'resources' && value < 0)) throw new Error('資源不足或數值無效。');
        result[effect.group][effect.key] = value;
        break;
      }
      case 'flag': result.flags = unique(result.flags, effect.key, !effect.value); break;
      case 'item': result.inventory = unique(result.inventory, effect.key, effect.remove); break;
      case 'clue': result.clues = unique(result.clues, effect.key, effect.remove); break;
      case 'npc': result.npcStates[effect.npcId] = { ...result.npcStates[effect.npcId], [effect.key]: effect.value }; break;
      case 'event': {
        const event = requireNode(data, effect.eventId);
        if (event.type !== 'event') throw new Error('指定節點不是事件。');
        if (checkCondition(event.conditions, result)) result = applyEffects(result, event.effects ?? [], data, depth + 1);
        break;
      }
      case 'phase': {
        const phase = data.config.phases.find(p => p.id === effect.phase);
        if (!phase) throw new Error('無效的階段。');
        result.currentPhase = phase.id;
        if (phase.eventId) result = applyEffects(result, [{ type: 'event', eventId: phase.eventId }], data, depth + 1);
        break;
      }
      case 'newDay':
        result = newDay(result, data.config);
        { const phase = data.config.phases.find(p => p.id === result.currentPhase);
          if (phase?.eventId) result = applyEffects(result, [{ type: 'event', eventId: phase.eventId }], data, depth + 1); }
        break;
    }
  }
  return result;
}
export function enterNode(state: GameState, id: string, data: StoryData): GameState {
  let result = structuredClone(state);
  let target = id;
  for (let hops = 0; hops < 32; hops++) {
    const node = requireNode(data, target);
    if (!checkCondition(node.conditions, result)) throw new Error(`節點進入條件未滿足：${target}`);
    result = { ...result, currentNodeId: target, visitedNodes: unique(result.visitedNodes, target), endingId: node.type === 'ending' ? target : null };
    result = applyEffects(result, node.effects ?? [], data);
    if (node.type !== 'event' || !node.next) return result;
    target = node.next;
  }
  throw new Error('自動跳轉超過安全上限，請檢查節點循環。');
}
export function createGame(data: StoryData): GameState {
  return enterNode({ currentNodeId: data.config.initialNodeId, currentPhase: data.config.initialPhase, day: 1,
    playerStats: { ...data.config.initialStats }, resources: { ...data.config.initialResources }, inventory: [], clues: [], flags: [],
    npcStates: {}, decisionHistory: [], visitedNodes: [], endingId: null }, data.config.initialNodeId, data);
}
export function availableChoices(state: GameState, data: StoryData): Choice[] {
  const node = requireNode(data, state.currentNodeId);
  if (node.type === 'ending') return [];
  if (node.choices) return node.choices;
  if (node.next) return [{ id: 'continue', label: '繼續', next: node.next }];
  const npc = data.npcs.find(n => n.id === node.npcId);
  return npc ? [...npc.questions, ...npc.investigations, ...npc.interactions, npc.decision] : [];
}
export function choose(state: GameState, choiceId: string, data: StoryData): GameState {
  const choice = availableChoices(state, data).find(c => c.id === choiceId);
  if (!choice || !checkCondition(choice.conditions, state) || !checkCondition(choice.enabledWhen, state)) throw new Error('此選項目前無法執行。');
  let result = applyEffects(state, choice.effects ?? [], data);
  result.decisionHistory.push({ nodeId: state.currentNodeId, choiceId, day: state.day });
  if (choice.next) result = enterNode(result, choice.next, data);
  return result;
}
export function validateStory(data: StoryData): string[] {
  const errors: string[] = [];
  const ids = new Set(data.nodes.map(n => n.id));
  if (ids.size !== data.nodes.length) errors.push('節點 ID 重複。');
  const ref = (id: string | undefined) => { if (id && !ids.has(id)) errors.push(`節點不存在：${id}`); };
  const effects = (list: Effect[] = []) => list.forEach(e => {
    if (e.type === 'event') { ref(e.eventId); if (data.nodes.find(n => n.id === e.eventId)?.type !== 'event') errors.push(`事件類型錯誤：${e.eventId}`); }
    if (e.type === 'phase' && !data.config.phases.some(p => p.id === e.phase)) errors.push(`階段不存在：${e.phase}`);
  });
  const choices = (list: Choice[] = []) => {
    if (new Set(list.map(c => c.id)).size !== list.length) errors.push('選項 ID 重複。');
    list.forEach(c => { ref(c.next); effects(c.effects); });
  };
  ref(data.config.initialNodeId);
  if (!data.config.phases.some(p => p.id === data.config.initialPhase)) errors.push('初始階段不存在。');
  if (new Set(data.npcs.map(n => n.id)).size !== data.npcs.length) errors.push('NPC ID 重複。');
  if (new Set(data.config.phases.map(p => p.id)).size !== data.config.phases.length) errors.push('階段 ID 重複。');
  data.config.phases.forEach(p => ref(p.eventId));
  data.nodes.forEach(n => {
    if (!n.id || typeof n.text !== 'string') errors.push('節點缺少必要資料。');
    if (!n.next && !n.npcId && !n.choices?.length && n.type !== 'ending' && n.type !== 'event') errors.push(`節點缺少後續操作：${n.id}`);
    if (n.npcId && !data.npcs.some(npc => npc.id === n.npcId)) errors.push(`NPC 不存在：${n.npcId}`);
    ref(n.next); effects(n.effects); choices(n.choices);
  });
  data.npcs.forEach(n => choices([...n.questions, ...n.investigations, ...n.interactions, n.decision]));
  return errors;
}
