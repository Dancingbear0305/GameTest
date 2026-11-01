import { useState } from 'react';
import { useGame } from './context/GameContext';
import { useSettings } from './hooks/useSettings';
import { story } from './data';
import { readSave } from './systems/save';
import { Modal } from './components/Modal';
import { GameScreen } from './screens/GameScreen';
import { MainMenu } from './screens/MainMenu';
import { SaveScreen } from './screens/SaveScreen';
import { SettingsScreen } from './screens/SettingsScreen';

type Panel = 'saves' | 'settings' | 'credits' | 'new' | null;
export default function App() {
  const [screen, setScreen] = useState<'menu' | 'game'>('menu');
  const [panel, setPanel] = useState<Panel>(null);
  const [notice, setNotice] = useState('');
  const { game, dispatch, error } = useGame();
  const { settings, updateSettings, settingsError } = useSettings();
  const auto = readSave('auto', story);
  function newGame() {
    if (game || (auto.ok && auto.value) || !auto.ok) setPanel('new');
    else begin();
  }
  function begin() { dispatch({ type: 'new' }); setScreen('game'); setPanel(null); setNotice(''); }
  function resume() {
    if (game) { setScreen('game'); return; }
    const save = readSave('auto', story);
    if (save.ok && save.value) { dispatch({ type: 'load', state: save.value.state }); setScreen('game'); setNotice(''); }
    else setNotice(save.ok ? '尚無可繼續的進度。' : save.error);
  }
  return <div className={`app ${settings.effects ? 'effects-on' : 'effects-off'} text-${settings.textSize}`}>
    {screen === 'menu' ? <MainMenu canContinue={Boolean(game || (auto.ok && auto.value))} onNew={newGame} onContinue={resume} onOpen={setPanel} /> : <GameScreen settings={settings} onMenu={() => setScreen('menu')} onSaves={() => setPanel('saves')} onSettings={() => setPanel('settings')} onRestart={newGame} />}
    {screen === 'menu' && (notice || error || !auto.ok) && <p className="menu-notice" role="alert">{notice || error || (!auto.ok ? auto.error : '')}</p>}
    <div className="screen-effects" aria-hidden="true"><div className="scanlines" /><div className="grain" /><div className="vignette" /></div>
    {panel && <Modal title={{ saves: '存檔與讀檔', settings: '設定', credits: '製作資訊', new: '開始新的測試？' }[panel]} onClose={() => setPanel(null)}>
      {panel === 'saves' && <SaveScreen onLoaded={() => { setScreen('game'); setPanel(null); }} />}
      {panel === 'settings' && <SettingsScreen settings={settings} onChange={updateSettings} error={settingsError} />}
      {panel === 'credits' && <div className="credits"><span className="eyebrow">未命名計畫 / 0.1.0</span><h3>文字互動遊戲框架</h3><p>第一階段：UI 與核心系統測試。</p><p>使用 React、TypeScript 與 Vite 建立。所有內容均為中立佔位資料，尚無正式角色、劇情或世界觀。</p><p>介面中的場景、角色剪影與特效以 CSS 繪製，未使用第三方遊戲素材。無音樂與音效。</p></div>}
      {panel === 'new' && <div className="confirm-panel"><p>目前進度與自動存檔將由新的測試取代。三個手動存檔會保留。</p><p className="muted">需要保留目前進度時，請先取消並手動存檔。</p><div className="ending-actions"><button className="primary-button" onClick={begin}>開始新遊戲</button><button className="secondary-button" onClick={() => setPanel(null)}>取消</button></div></div>}
    </Modal>}
  </div>;
}
