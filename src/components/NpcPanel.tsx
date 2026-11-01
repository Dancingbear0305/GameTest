import { useState } from 'react';
import type { GameState, NpcData } from '../types/game';
import { ChoiceButton } from './ChoiceButton';
const tabs = [{ id: 'questions', label: '對話' }, { id: 'investigations', label: '調查' }, { id: 'interactions', label: '互動' }] as const;
export function NpcPanel({ npc, state, onChoose, active }: { npc: NpcData; state: GameState; onChoose: (id: string) => void; active: boolean }) {
  const [tab, setTab] = useState<typeof tabs[number]['id']>('questions');
  return <section className="npc-panel" aria-labelledby="npc-title">
    <div className="panel-caption"><span>互動對象</span><span className="status-dot" /></div>
    <div className="npc-identity"><div className="npc-avatar" aria-hidden="true">◉</div><div><span className="eyebrow">{npc.designation}</span><h2 id="npc-title">{npc.name}</h2></div><span className="tag">佔位</span></div>
    <p className="npc-description">{npc.description}</p>
    <div className="npc-tabs" role="tablist" aria-label="NPC 操作分類">{tabs.map(t => <button key={t.id} role="tab" id={`tab-${t.id}`} aria-selected={tab === t.id} aria-controls="npc-actions" tabIndex={tab === t.id ? 0 : -1} onKeyDown={e => {
      const current = tabs.findIndex(item => item.id === t.id);
      const next = e.key === 'ArrowRight' ? (current + 1) % tabs.length : e.key === 'ArrowLeft' ? (current + tabs.length - 1) % tabs.length : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : -1;
      if (next < 0) return;
      e.preventDefault(); setTab(tabs[next].id); document.getElementById(`tab-${tabs[next].id}`)?.focus();
    }} onClick={() => setTab(t.id)}>{t.label}</button>)}</div>
    <div id="npc-actions" role="tabpanel" aria-labelledby={`tab-${tab}`} className="npc-actions">{active ? npc[tab].map(c => <ChoiceButton key={c.id} choice={c} state={state} onChoose={onChoose} />) : <p className="muted compact">請先完成目前的對話或選擇。</p>}</div>
    <div className="npc-decision">{active ? <ChoiceButton choice={npc.decision} state={state} onChoose={onChoose} /> : <span className="muted compact">互動暫停中</span>}</div>
  </section>;
}
