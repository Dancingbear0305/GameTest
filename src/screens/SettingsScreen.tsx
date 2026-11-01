import type { Settings } from '../types/game';
export function SettingsScreen({ settings, onChange, error }: { settings: Settings; onChange: (s: Settings) => void; error: string | null }) {
  return <div className="settings-screen"><p className="panel-intro">調整閱讀與視覺體驗。設定會自動儲存。</p>
    <label className="setting-row"><span><strong>螢幕視覺效果</strong><small>掃描線、顆粒、暗角與微弱光影動態</small></span><input type="checkbox" role="switch" checked={settings.effects} onChange={e => onChange({ ...settings, effects: e.target.checked })} /></label>
    <label className="setting-row"><span><strong>文字大小</strong><small>調整對話與選項的閱讀大小</small></span><select value={settings.textSize} onChange={e => onChange({ ...settings, textSize: e.target.value === 'large' ? 'large' : 'normal' })}><option value="normal">標準</option><option value="large">加大</option></select></label>
    <label className="setting-row"><span><strong>文字顯示速度</strong><small>也可按「顯示完整文字」略過逐字效果</small></span><select value={settings.textSpeed} onChange={e => onChange({ ...settings, textSpeed: e.target.value as Settings['textSpeed'] })}><option value="slow">緩慢</option><option value="normal">標準</option><option value="instant">立即顯示</option></select></label>
    <p className="settings-note">遵循系統「減少動態效果」偏好。<br />目前版本無音效或音樂，不需調整音量。</p>{error && <p className="error-text" role="alert">{error}</p>}
  </div>;
}
