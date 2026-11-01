import { useEffect, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { story } from '../data';
import { availableChoices } from '../engine/story';
import { checkCondition } from '../engine/conditions';
import { useTypewriter } from '../hooks/useTypewriter';
import { ChoiceButton } from '../components/ChoiceButton';
import { NpcPanel } from '../components/NpcPanel';
import { Scene } from '../components/Scene';
import type { Settings } from '../types/game';

export function GameScreen({ settings, onMenu, onSaves, onSettings, onRestart }: { settings: Settings; onMenu: () => void; onSaves: () => void; onSettings: () => void; onRestart: () => void }) {
  const { game, dispatch, lastSaved, error, saveError } = useGame();
  const node = story.nodes.find(n => n.id === game?.currentNodeId);
  const npc = story.npcs.find(n => n.id === node?.npcId);
  const choices = useMemo(() => game ? availableChoices(game, story).filter(c => checkCondition(c.conditions, game)) : [], [game]);
  const text = useTypewriter(node?.text ?? '', settings.textSpeed);
  const groupedChoices = choices.some(c => c.category);
  const observation = game?.lastObservation;
  const observedNpc = story.npcs.find(n => n.id === observation?.npcId);
  const feature = observedNpc?.features.find(f => f.id === observation?.featureId);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (document.querySelector('dialog[open]') || e.altKey || e.metaKey || e.ctrlKey || e.repeat || (e.target instanceof HTMLElement && e.target.closest('button, input, select, textarea'))) return;
      if (e.key === 'Escape') onMenu();
      if (!text.complete && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); text.finish(); return; }
      if (!groupedChoices && /^[1-9]$/.test(e.key)) { const c = choices[Number(e.key) - 1]; if (c && game && checkCondition(c.enabledWhen, game)) dispatch({ type: 'choose', id: c.id }); }
    }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [choices, dispatch, game, groupedChoices, onMenu, text]);
  if (!game || !node) return <main className="fallback"><h1>無法載入目前節點</h1><button onClick={onMenu}>返回主選單</button></main>;
  const select = (id: string) => dispatch({ type: 'choose', id });
  return <main className="game-screen dialogue-game">
    <header className="game-header"><button className="wordmark wordmark-button" onClick={onMenu}><span className="brand-symbol">◈</span> 未命名計畫</button><div className="session-label"><span className="status-dot" />測試工作階段 <span className="muted">／ 001</span></div><nav aria-label="遊戲選單"><button onClick={onSaves}>存檔 / 讀檔</button><button onClick={onSettings}>設定</button><button onClick={onMenu}>主選單 <span aria-hidden="true">↗</span></button></nav></header>
    <div className="game-status"><div><span className="day-label">第 <strong>{String(game.day).padStart(2, '0')}</strong> 日</span><span className="phase-label">{story.config.phases.find(p => p.id === game.currentPhase)?.label}</span></div><div className="resources"><span>行動次數 <b>{game.resources.actions}</b>{game.currentPhase === 'night' && !game.endingId && <small>白天可用</small>}</span></div></div>
    {(error || saveError) && <p className="error-banner" role="alert">{error || saveError}</p>}
    <div className="game-layout"><div className="game-main">
      <Scene node={node} npc={npc} />
      <section className="dialogue" aria-labelledby="speaker-name"><div className="dialogue-meta"><span className="eyebrow">{node.type === 'ending' ? '流程結束' : node.type === 'investigation' ? '調查結果' : '文字紀錄'}</span><span className="node-label">節點 {String(story.nodes.indexOf(node) + 1).padStart(3, '0')}</span></div><h1 id="speaker-name">{node.speaker ?? '系統'}</h1>
        <div className="dialogue-text"><p aria-hidden="true">{text.display}<span className={!text.complete ? 'text-cursor' : 'hidden'}>▌</span></p><p className="sr-only" aria-live="polite">{node.text}</p></div>
        {feature && (node.type === 'investigation' || node.type === 'ending') && <div className="observation" role="status"><h2>{node.type === 'ending' ? '最後一次調查 · ' : ''}{feature.label}</h2><p>{feature.text}</p></div>}
        {!text.complete && <button className="skip-text" onClick={text.finish}>顯示完整文字 ↓</button>}
        {groupedChoices ? <NpcPanel key={node.id} choices={choices} state={game} onChoose={select} /> : <div className="story-choices">{choices.map((c, i) => <ChoiceButton key={c.id} choice={c} state={game} onChoose={select} index={i} />)}</div>}
        {node.type === 'ending' && <div className="ending-actions"><button className="primary-button" onClick={onSaves}>讀取存檔</button><button className="secondary-button" onClick={onRestart}>重新開始</button></div>}
      </section>
    </div></div>
    <footer className="game-footer"><span><span className={`status-dot ${saveError ? 'warning-dot' : ''}`} />{saveError ? '自動存檔失敗' : lastSaved ? '進度已自動儲存' : '尚未儲存'}</span><span>Tab 切換焦點 <i /> Enter 確認 <i /> 1–9 選擇分支</span><span>第一階段・中立測試</span></footer>
  </main>;
}
