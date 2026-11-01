import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { story } from '../data';
import { deleteSave, readSave, slots, writeSave, type Slot } from '../systems/save';
export function SaveScreen({ onLoaded }: { onLoaded: () => void }) {
  const { game, dispatch } = useGame();
  const [revision, refresh] = useState(0);
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState<{ slot: Slot; action: 'write' | 'delete' } | null>(null);
  function save(slot: Slot) {
    if (!game) return;
    const result = writeSave(slot, game, story);
    setMessage(result.ok ? '手動存檔已儲存。' : result.error); refresh(revision + 1); setPending(null);
  }
  function remove(slot: Slot) {
    const result = deleteSave(slot); setMessage(result.ok ? '存檔已刪除。' : result.error); refresh(revision + 1); setPending(null);
  }
  return <div className="save-screen"><p className="panel-intro">進度僅儲存於此瀏覽器。開始新遊戲不會覆蓋手動存檔。</p><div className="save-list">{slots.map(slot => {
    const result = readSave(slot, story);
    const value = result.ok ? result.value : null;
    return <section className="save-slot" key={`${slot}-${revision}`} aria-label={slot === 'auto' ? '自動存檔' : `存檔欄位 ${slot}`}><div className="slot-index">{slot === 'auto' ? '自動' : `0${slot}`}</div><div className="slot-info"><h3>{slot === 'auto' ? '自動存檔' : `手動存檔 ${slot}`}</h3>{!result.ok ? <p className="error-text">{result.error}</p> : value ? <><p>第 {value.state.day} 日 · {story.config.phases.find(p => p.id === value.state.currentPhase)?.label} · {story.nodes.find(n => n.id === value.state.currentNodeId)?.speaker}</p><time dateTime={value.savedAt}>{new Date(value.savedAt).toLocaleString('zh-TW')}</time></> : <p className="muted">空白欄位</p>}</div><div className="slot-actions">
      {slot !== 'auto' && <button disabled={!game || !result.ok} onClick={() => value ? setPending({ slot, action: 'write' }) : save(slot)}>儲存</button>}
      <button disabled={!value} onClick={() => { const current = readSave(slot, story); if (current.ok && current.value) { dispatch({ type: 'load', state: current.value.state }); onLoaded(); } else setMessage(current.ok ? '存檔已不存在。' : current.error); }}>讀取</button>
      <button disabled={result.ok && !value} onClick={() => setPending({ slot, action: 'delete' })}>刪除</button>
    </div></section>;
  })}</div>{pending && <div className="inline-confirm" role="alert"><p>{pending.action === 'write' ? '確定覆蓋此手動存檔？' : '確定永久刪除此存檔？'}</p><button className="primary-button" onClick={() => pending.action === 'write' ? save(pending.slot) : remove(pending.slot)}>確定</button><button className="secondary-button" onClick={() => setPending(null)}>取消</button></div>}<p className="feedback" role="status">{message}</p></div>;
}
