import type { GameConfig, GameState } from '../types/game';

export function newDay(state: GameState, config: GameConfig): GameState {
  return { ...state, day: state.day + 1, currentPhase: config.initialPhase,
    resources: { ...state.resources, ...config.dailyResources } };
}
