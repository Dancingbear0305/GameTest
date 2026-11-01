import type { Condition, GameState } from '../types/game';

export function checkCondition(condition: Condition | undefined, state: GameState): boolean {
  if (!condition) return true;
  switch (condition.op) {
    case 'and': return condition.conditions.every(c => checkCondition(c, state));
    case 'or': return condition.conditions.some(c => checkCondition(c, state));
    case 'not': return !checkCondition(condition.condition, state);
    case 'flag': return state.flags.includes(condition.key);
    case 'item': return state.inventory.includes(condition.key);
    case 'clue': return state.clues.includes(condition.key);
    default: {
      const value = state[condition.group][condition.key];
      if (value === undefined) return false;
      switch (condition.op) {
        case 'eq': return value === condition.value;
        case 'ne': return value !== condition.value;
        case 'gt': return value > condition.value;
        case 'lt': return value < condition.value;
        case 'gte': return value >= condition.value;
        case 'lte': return value <= condition.value;
      }
    }
  }
}
