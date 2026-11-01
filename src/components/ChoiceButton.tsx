import { checkCondition } from '../engine/conditions';
import type { Choice, GameState } from '../types/game';
export function ChoiceButton({ choice, state, onChoose, index }: { choice: Choice; state: GameState; onChoose: (id: string) => void; index?: number }) {
  if (!checkCondition(choice.conditions, state)) return null;
  const enabled = checkCondition(choice.enabledWhen, state);
  return <button className="choice-button" disabled={!enabled} onClick={() => onChoose(choice.id)} title={!enabled ? choice.lockedReason : undefined}>
    <span className="choice-number">{index === undefined ? (enabled ? '+' : '−') : String(index + 1).padStart(2, '0')}</span>
    <span className="choice-copy">{choice.label}{!enabled && <small>{choice.lockedReason ?? '尚未解鎖'}</small>}</span><span className="choice-arrow" aria-hidden="true">↗</span>
  </button>;
}
