import { Scene } from '../components/Scene';
export function MainMenu({ canContinue, onNew, onContinue, onOpen }: { canContinue: boolean; onNew: () => void; onContinue: () => void; onOpen: (page: 'saves' | 'settings' | 'credits') => void }) {
  return <main className="main-menu">
    <Scene menu />
    <header className="menu-top"><a className="wordmark" href="#" onClick={e => e.preventDefault()}><span className="brand-symbol">◈</span> 未命名計畫</a><span className="build-label">開發版本 <b>0.1</b></span></header>
    <div className="menu-content"><div className="eyebrow"><span className="status-dot" /> 文字互動框架 / 第一階段</div><h1>未命名<span>計畫<span className="title-dot">.</span></span></h1><p className="menu-subtitle">每一次選擇，都留下紀錄。</p><p className="menu-description">介面與系統測試<br />所有人物、場景與事件皆為中立佔位資料。</p>
      <nav className="menu-nav" aria-label="主選單">
        <button className="menu-primary" onClick={onNew}><span className="menu-index">01</span>開始新遊戲<span className="menu-arrow">→</span></button>
        <button disabled={!canContinue} onClick={onContinue}><span className="menu-index">02</span>繼續遊戲<span className="menu-detail">{canContinue ? '返回最近進度' : '尚無進度'}</span></button>
        <button onClick={() => onOpen('saves')}><span className="menu-index">03</span>讀取存檔</button>
        <button onClick={() => onOpen('settings')}><span className="menu-index">04</span>設定</button>
        <button onClick={() => onOpen('credits')}><span className="menu-index">05</span>製作資訊</button>
      </nav>
    </div>
    <div className="menu-scene-note"><span className="note-line" /><p>測試環境 001<br /><small>尚未載入正式劇情</small></p></div>
    <footer className="menu-footer"><span>單人文字冒險 <i /> 本機儲存</span><span>建議佩戴耳機<span className="footer-note">／目前版本無音效</span></span><span>繁體中文 <span className="status-dot" /></span></footer>
  </main>;
}
