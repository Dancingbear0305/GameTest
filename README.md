# 未命名計畫 · 第一位角色日夜流程

React + TypeScript strict + Vite 的單人文字互動框架。沒有後端、資料庫、帳號或付費 API。本階段只做一位角色，從第一天夜晚開始，到第一次白天結束、進入下一個夜晚為止。

**劇情、正式台詞、角色設定與特徵描述由專案作者填寫。** 現有文字與剪影僅為中立測試資料，不隨機生成角色特徵，也不揭露角色身分。

## 啟動、測試與建置

建議 Node.js 24、npm 11：

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

`dev` 與 `preview` 顯示的本機位址可供瀏覽器測試；雲端沙箱如限制監聽埠或下載套件，請使用環境提供的權限流程。`npm run test:watch` 可持續執行測試。

## 遊戲流程

| 階段 | 可以執行的操作 | 行動規則 |
| --- | --- | --- |
| 第一天夜晚・門外 | 對話、放進來、趕走 | 無調查或開槍；夜晚行動顯示 0，僅於白天可用 |
| 第一天白天・屋內 | 自主選擇已放進來的角色 | 白天開始取得 3 次行動 |
| 白天・對話 | 反覆交談、返回屋內 | 不扣行動 |
| 白天・互動 | 調查頭部、眼睛、手部 | 每個部位 1 次行動；已調查的部位停用，不重複收費 |
| 白天・互動 | 對角色開槍 | 先確認，可取消；暫定不扣行動，確認後角色消失，不提供身分判定 |
| 行動耗盡 | 自動結束白天 | 第三次調查直接進入下一個夜晚，仍顯示最後一次觀察 |
| 屋內無人 | 結束白天 | 趕走或開槍後提供此選項，避免無人可互動時卡住 |

放進來與趕走都會立即結束第一個夜晚、進入白天。第一天白天結束後天數變為 2、階段為夜晚，顯示測試結束畫面；**不會開始第二位來訪者或額外劇情**。

專注度、工具、物品、線索清單、調查筆記與手動推進階段的測試面板均已移除。介面只保留行動次數、「對話」與「互動」，並提供當前流程需要的選擇。

## 操作與介面

- 電腦版（寬度大於 760px）左側為加大的角色場景、右側為對話與選項；圖片等比例顯示，長對話捲動時場景保留在旁。手機維持上方場景、下方全寬對話，長文字自然向下延伸。
- Tab / Shift+Tab 移動焦點；Enter / Space 啟動按鈕。
- 「對話／互動」分頁支援左右方向鍵、Home、End。夜晚僅有對話分頁。
- 焦點不在控制項時，1–9 選擇一般分支（不含分頁內操作）；Space / Enter 完成逐字文字；Esc 回主選單。
- 存檔與設定使用原生 `dialog`，支援焦點限制、Esc 關閉與焦點恢復。
- 設定可關閉掃描線、顆粒、暗角與背景動態，調整文字大小及速度。遵循系統 `prefers-reduced-motion`。
- 第一位角色已接上專案作者提供的圖片；其餘場景仍為 CSS 佔位，無音樂或音效。

## 存檔

自動存檔與三格手動存檔，皆儲存完整狀態及時間。讀檔不重跑節點進入效果，因此不會重複扣行動、重置日間行動或重複開槍。重新整理後從主選單「繼續遊戲」恢復。

- 存檔格式：`{ version: 2, savedAt: ISO時間, state: GameState }`。
- 新遊戲僅取代自動存檔；已有進度時確認。手動欄位的覆蓋與刪除各自需要確認。
- 舊版 UI 測試的 v0/v1 存檔不適用目前規則，不自動遷移或刪除；畫面會提示開始新遊戲。要重用舊手動欄位，可先在面板刪除該欄位再儲存。
- 驗證節點、階段、資料型別、非負整數行動、NPC 與觀察部位參照、節點進入條件及結局一致性。容量不足、瀏覽器存取拒絕、無效 JSON 均回報錯誤並保留原資料。
- 只儲存在目前瀏覽器與網域，清除網站資料會清除進度，沒有跨裝置同步。同一網域的不同子目錄共享 localStorage；部署多款遊戲時應改用不同的 `text-adventure:` 前綴。

## 專案結構

```text
src/
  components/     場景、角色操作分類、選項按鈕、對話框
  screens/        主選單、遊戲、存讀檔、設定
  engine/         條件判斷、效果、節點跳轉、資料驗證
  systems/        存檔、跨日狀態
  context/        Context + useReducer、自動存檔
  data/story.json 角色、固定特徵、選項、分支、階段與自動轉換
  types/game.ts   JSON 與 GameState 型別
  hooks/          逐字效果與設定
  styles/         響應式介面與特效
  assets/         素材使用說明
  utils/          靜態素材 base 路徑
tests/engine.test.ts
.github/workflows/deploy.yml
```

`GameState` 保留 `currentNodeId`、`currentPhase`、`day`、`resources.actions`、內部 `flags`、`npcStates`、`lastObservation`、`decisionHistory`、`visitedNodes`、`endingId`。不再保存專注度、工具、物品或線索清單。旗標僅供分支判斷；`lastObservation` 僅記住最近觀察的角色與部位 ID，實際特徵文字來自固定 JSON。

## 如何填寫劇情與固定特徵

編輯 `src/data/story.json`，不需要更動 React 元件：

| 位置 | 用途 |
| --- | --- |
| `npcs[0]` | 第一個角色的名稱、簡介、圖片 |
| `npcs[0].features` | 每個部位唯一 `id`、顯示 `label`、固定 `text` |
| `night-answer.text` | 夜晚對話 |
| `day-answer.text` | 白天對話 |
| 節點的 `choices` | 按選擇導向不同節點、設定旗標或角色狀態 |
| `config.phases` | 夜晚、白天及白天開始時的行動重置事件 |
| `config.transitions` | 白天行動為 0 時，自動進入結束節點 |

不存「隨機特徵」或自動分配真偽；開槍結果不揭露身分。之後可由作者使用固定劇情與旗標安排不同後果。

### 新增對話分支

在 `nodes` 新增節點，例如：

```json
{
  "id": "day-answer-2",
  "type": "dialogue",
  "speaker": "測試角色",
  "npcId": "first",
  "text": "［由作者填寫的對話。］",
  "conditions": { "op": "phase", "value": "day" },
  "choices": [
    { "id": "reply-a", "label": "測試回答 A", "next": "day-person", "effects": [{ "type": "flag", "key": "reply-a", "value": true }] },
    { "id": "reply-b", "label": "測試回答 B", "next": "day-person" }
  ]
}
```

再將既有選項的 `next` 指向此 ID。節點 `id` 必須全域唯一，選項 ID 在同一節點內唯一。`id`、`type`、`text` 必填；其他欄位見 `types/game.ts`。

- `category: "dialogue"` 置於對話；`"interaction"` 置於互動；`"decision"` 為分類下方一直可見的流程決定。未設定分類的選項直接顯示。
- 節點種類：`narration`、`dialogue`、`choice`、`investigation`、`decision`、`event`、`ending`。
- 一般節點的 `next` 產生「繼續」；`event.next` 自動執行，`choices` 優先。
- `conditions` 控制選項顯示與節點進入；`enabledWhen` 控制是否可按，`lockedReason` 提供說明。
- 複合條件：`and` / `or` 搭配 `conditions` 陣列、`not` 搭配 `condition`。
- 數值條件：`eq`、`ne`、`gt`、`lt`、`gte`、`lte`，`group` 為 `resources`。
- 狀態條件：`flag` + `key`；`phase` + `value`；`npc` + `npcId` / `key` / `value`。
- 效果：`add` / `set` 更新行動資源、`flag` 設定或移除旗標、`npc` 更新角色狀態、`observe` 記錄觀察部位、`phase` 切換階段、`newDay` 跨日、`event` 執行指定事件效果。
- `event` 效果會檢查事件條件，只執行其 `effects`，不沿用 `next`。
- 每次選擇先執行效果與目標節點，再檢查自動轉換；整筆成功才更新狀態。自動節點、遞迴事件、自動階段轉換都有上限，錯誤時保留原狀態。

### 後續新增角色

本階段只有 `first`。日後新增角色時：在 `npcs` 增加唯一 ID 與固定 `features`；在屋內節點新增「選擇角色」選項，並以 `npc` 條件確認其 `presence` 為 `inside`。為新角色建立對話、調查與開槍分支，不要重用第一位角色的狀態 ID。共用 UI 會依節點 `npcId` 顯示對應角色。

### 圖片

JSON 的 `background`、`character`、NPC `image` 使用相對 `public/` 的路徑，如 `characters/first.webp`，不要加開頭 `/`；`assetUrl()` 會套用 Vite base。背景、角色與效果各自分層，沒有圖片時使用 CSS 佔位畫面。目前第一位角色圖片為 `public/characters/first.png`，保留原始內容並等比例顯示，夜晚及白天對話共用此圖片；開槍移除角色後不再顯示。

## GitHub Pages

1. 推送到 `main`。
2. Repository → Settings → Pages → Source 選 **GitHub Actions**。
3. `.github/workflows/deploy.yml` 執行 `npm ci`、單元測試、正式建置、部署 `dist`。也可手動 Run workflow。
4. Workflow 從 repository 名稱自動產生 `VITE_BASE_PATH`，不寫死帳號或專案名稱。
5. 若部署帳號首頁或自訂網域根目錄，將 workflow 的 `VITE_BASE_PATH` 改為 `/`；非 `main` 請自行調整觸發分支。

手動指定子目錄：

```sh
VITE_BASE_PATH=/your-repository/ npm run build
```

預設 base 為 `./`。不使用路徑路由，所有畫面都在單一入口切換，重新整理不需要伺服器 rewrite。設定好 Pages 後，推送才會透過 workflow 更新網站；本次本機修改不等於已發布。

## 驗證與範圍

單元測試涵蓋：比較與複合條件、第一晚不能調查、接納／拒絕轉白天、免費對話、固定部位、三次行動結束白天、開槍確認／取消／移除、空屋出口、循環與壞資料防護、存檔往返、版本拒絕與儲存失敗。

Chromium 已實測：夜晚／白天／結束流程、兩種接待決定、開槍與取消、調查中存讀檔、重新整理、不重複扣行動、最後觀察顯示，以及桌面的左右分欄、390px／320px 的下方對話區。瀏覽器腳本為環境內臨時驗證，不新增專案依賴。

尚未實作：正式劇情與美術音效、第二個夜晚的可玩流程、第二位角色、跨裝置存檔、完整舊版遷移。尚未實測 Safari、Firefox、實體手機與螢幕閱讀器。
