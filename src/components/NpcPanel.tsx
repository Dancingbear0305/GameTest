import { useState } from 'react';
import type { Choice, GameState } from '../types/game';
import { ChoiceButton } from './ChoiceButton';
const categories = [{ id: 'dialogue', label: '對話' }, { id: 'interaction', label: '互動' }] as const;
export function NpcPanel({ choices, state, onChoose }: { choices: Choice[]; state: GameState; onChoose: (id: string) => void }) {
  const tabs = categories.filter(t => choices.some(c => c.category === t.id));
  const [selected, setSelected] = useState<string>('dialogue');
  const current = tabs.find(t => t.id === selected) ?? tabs[0];
  return <section className="npc-panel" aria-label="角色操作">
    {current && <><div className="npc-tabs" role="tablist" aria-label="角色操作分類">{tabs.map((t, index) => <button key={t.id} role="tab" id={`tab-${t.id}`} aria-selected={current.id === t.id} aria-controls="npc-actions" tabIndex={current.id === t.id ? 0 : -1} onKeyDown={e => {
      const next = e.key === 'ArrowRight' ? (index + 1) % tabs.length : e.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : -1;
      if (next < 0) return;
      e.preventDefault(); setSelected(tabs[next].id); document.getElementById(`tab-${tabs[next].id}`)?.focus();
    }} onClick={() => setSelected(t.id)}>{t.label}</button>)}</div>
    <div id="npc-actions" role="tabpanel" aria-labelledby={`tab-${current.id}`} className="npc-actions">{choices.filter(c => c.category === current.id).map(c => <ChoiceButton key={c.id} choice={c} state={state} onChoose={onChoose} />)}</div></>}
    <div className="npc-decision">{choices.filter(c => c.category === 'decision').map(c => <ChoiceButton key={c.id} choice={c} state={state} onChoose={onChoose} />)}</div>
  </section>;
}
