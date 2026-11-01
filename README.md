# 未命名計畫 · 網頁文字互動遊戲框架

React + TypeScript strict + Vite。第一階段以 **可操作的 UI 與中立測試流程** 為交付範圍，沒有正式劇情、人物設定或世界觀，沒有後端、帳號、付費 API 或即時生成內容。

## 本機啟動

建議 Node.js 24（CI 使用同版本），npm 11。

```sh
npm ci
npm run dev
```

終端機會顯示開發伺服器位址。其他命令：

```sh
npm test            # 核心單元測試
npm run test:watch  # 開發時持續測試
npm run build      # TypeScript strict 檢查 + 正式建置到 dist/
npm run preview    # 檢查正式建置
```

開發伺服器預設監聽所有介面；需要僅限本機時使用 `npm run dev -- --host 127.0.0.1`。雲端執行環境如有沙箱網路限制，啟動監聽埠與下載套件需要使用該環境支援的權限流程。

## 目前可以測試什麼

1. 主選單 →「開始新遊戲」，顯示測試 NPC 與分層場景。
2. 在「對話」詢問問題、逐句對話，再返回。
3. 切到「調查」：「查詢測試紀錄」最初停用；「檢查測試項目」消耗 1 次行動、設定 `inspected` 旗標並取得測試線索。
4. 按「繼續」返回後，紀錄解鎖，重複調查停用。
5. 「互動」可消耗 1 個工具取得測試文件。
6. 「進行最終判斷」：通過 → 結局 A；根據線索 → 結局 B（調查後才顯示）；不通過 → 結局 C。
7. 使用右上「存檔 / 讀檔」儲存三個手動欄位；重新整理回主選單後「繼續遊戲」載入自動存檔。
8. 「系統測試工具」能切換階段、觸發階段事件、開始新一天並重置每日行動。
9. 設定可關閉全部螢幕特效、調整對話與選項文字大小、改變逐字速度。遵循 `prefers-reduced-motion`，不使用閃爍效果。

新遊戲會取代**自動存檔**，已有進度時需確認；不會覆蓋手動欄位。覆蓋手動存檔與刪除都需確認。資料只保留在目前瀏覽器與網域；清除網站資料會清除進度。GitHub Pages 同一網域不同子目錄的應用共享 localStorage，目前使用 `text-adventure:` 前綴；若同網域部署多款遊戲，請先替換前綴避免互相覆蓋。

## 操作與無障礙

- Tab / Shift+Tab 切換焦點，Enter / Space 啟動按鈕。
- NPC 分頁支援方向鍵、Home、End；Tab 進入目前分頁。
- 焦點不在控制項時，1–9 選擇目前劇情分支；Space / Enter 完成逐字文字；Esc 回主選單。
- 對話框使用原生 `dialog`，限制焦點於面板內，Esc 關閉並恢復原焦點。
- 所有動畫皆能關閉，系統減少動態偏好也會停用動畫與逐字效果。
- 對話、提問、調查與判斷直接浮現在場景內，角色靠左、選項靠右；調查筆記預設收合在場景下方。手機保留場景內互動，支援直向捲動。

## 目錄

```text
.github/workflows/deploy.yml  GitHub Pages 建置與部署
src/
  assets/                    素材使用說明（目前為純 CSS）
  components/                Scene、NpcPanel、ChoiceButton、Modal
  context/GameContext.tsx    Context + useReducer、錯誤回報、自動存檔
  data/story.json            節點、NPC、階段、數值、資源與中文標籤
  data/index.ts              資料載入與格式錯誤的安全備援畫面
  engine/
    conditions.ts            統一條件判斷
    story.ts                 效果、跳轉、選項、圖形參照驗證
    validateData.ts          外部 JSON 結構驗證
  hooks/                     設定持久化、逐字顯示
  screens/                   主選單、遊戲、存讀檔、設定
  styles/global.css          響應式介面、分層場景、可關閉特效
  systems/                   存檔與時間系統
  types/game.ts              所有劇情與遊戲狀態型別
  utils/assets.ts            子目錄部署的素材路徑處理
  App.tsx                    畫面與系統面板切換
  main.tsx                   入口
tests/engine.test.ts         核心系統測試
```

NPC 與調查不另設複雜框架：資料定義於 JSON，操作與劇情選項共用 `Choice`、條件與效果引擎，避免 UI 重複寫遊戲規則。

## 加入 NPC

在 `src/data/story.json` 的 `npcs` 陣列新增唯一 `id`，填入 `name`、`designation`、`description`、可選 `image`，以及 `questions`、`investigations`、`interactions` 和 `decision`。前三者為選項陣列，`decision` 為一個選項。範例：

```json
{
  "id": "test-npc-2",
  "name": "測試 NPC 2",
  "designation": "NPC－002",
  "description": "中立測試對象。",
  "questions": [{ "id": "ask-2", "label": "詢問測試問題", "next": "test-answer-2" }],
  "investigations": [],
  "interactions": [],
  "decision": { "id": "judge-2", "label": "進行測試判斷", "next": "decision" }
}
```

同時建立 `test-answer-2` 節點；在 NPC 的入口節點填入 `npcId: "test-npc-2"`。入口不設 `choices` 或 `next` 時，NPC 操作面板自動啟用；對話過程則由目前節點的選項控制，防止同時執行其他調查。各 NPC 的操作 ID 必須在該 NPC 內唯一。

## 加入劇情節點

`nodes` 是平坦陣列，`id` 必須全域唯一。支援 `narration`、`dialogue`、`choice`、`investigation`、`decision`、`event`、`ending`。

```json
{
  "id": "test-answer-2",
  "type": "dialogue",
  "speaker": "測試 NPC 2",
  "npcId": "test-npc-2",
  "text": "這是中立測試回應。",
  "choices": [
    {
      "id": "return",
      "label": "返回測試入口",
      "next": "start",
      "effects": [{ "type": "flag", "key": "asked-2", "value": true }]
    }
  ]
}
```

- `id`、`type`、`text` 必填，其餘 `speaker`、`background`、`character`、`npcId`、`choices`、`conditions`、`effects`、`next`、`tags` 選填。
- 一般節點的 `next` 產生「繼續」按鈕；只有 `event` 的 `next` 自動跳轉。`choices` 優先於 `next`。
- `effects` 在每次進入節點時執行；一次性行為應搭配旗標與停用條件，避免重新進入時重複取得資源。
- `ending` 設定 `endingId`，顯示結束操作，不再提供一般選項。
- `conditions` 控制節點進入資格，或選項是否顯示；`enabledWhen` 控制選項是否可按，`lockedReason` 為鎖定說明。
- 無效的節點、條件或資源消耗會保留操作前狀態並顯示錯誤。自動跳轉和遞迴事件各有 32 層上限。
- 外部 JSON 先驗證形狀與可用運算，再驗證節點參照、NPC 和 ID；格式缺漏時顯示安全備援畫面。

### 條件

```json
{
  "op": "and",
  "conditions": [
    { "op": "flag", "key": "inspected" },
    { "op": "gte", "group": "resources", "key": "actions", "value": 1 },
    { "op": "not", "condition": { "op": "item", "key": "used-item" } }
  ]
}
```

數值運算：`eq`、`ne`、`gt`、`lt`、`gte`、`lte`；組合：`and`、`or`、`not`；持有狀態：`flag`、`item`、`clue`。`or` 也使用 `conditions` 陣列。未知數值欄位的比較為不成立，不假設為 0。

### 效果

| type | 用途與欄位 |
| --- | --- |
| `add` / `set` | `group: playerStats / resources`、`key`、`value`；負的 add 消耗資源，資源不能小於 0 |
| `flag` | `key`、`value: true / false`，設定或移除旗標 |
| `item` / `clue` | `key`，可加 `remove: true`；重複取得不重複儲存 |
| `npc` | `npcId`、`key`、`value`，更新 NPC 狀態 |
| `event` | `eventId`，若該事件的條件成立，執行其效果；不使用該事件的 next 跳轉 |
| `phase` | `phase`，切換到配置階段並執行它的 `eventId` 效果 |
| `newDay` | 天數 +1、回到初始階段、按 `dailyResources` 重置每日資源，再執行初始階段事件 |

階段與初始數值都在 `config`。`playerStats` 和 `resources` 是可擴充鍵值表，UI 依標籤設定顯示。跨日保留旗標、線索、物品與 NPC 狀態；若未來需要每日清理其他狀態，應在時間系統增加明確的可配置規則。

### 素材

JSON 中的 `background`、`character` 與 NPC `image` 使用相對 `public/` 路徑，例如 `characters/test.webp`，不加開頭 `/`。`assetUrl()` 套用 Vite base；亦可使用 Vite import 將素材放在 `src/assets/`。目前沒有正式圖片、音樂或音效；所有佔位場景均為 CSS。

## 存檔格式與相容性

儲存 `{ version: 1, savedAt: ISO時間, state: 完整GameState }`。目前另支援已知 v0 格式的 `timestamp` → `savedAt` 遷移；未知版本不自動轉換。驗證狀態型別、階段與節點存在性、結局一致性、有限數值與非負資源。JSON 解析、容量與存取錯誤均顯示提示，不會自行刪除損壞資料。若未來刪除已使用的節點 ID，需要增加遷移策略。

## GitHub Pages 部署

1. 將此專案推送至 GitHub 的 `main` 分支。
2. Repository → Settings → Pages → Build and deployment → Source 選擇 **GitHub Actions**。
3. `.github/workflows/deploy.yml` 在推送 `main` 或手動執行時，以 `npm ci` 安裝、執行測試及正式建置，再部署 `dist`。
4. Workflow 以 `${{ github.event.repository.name }}` 自動產生 `VITE_BASE_PATH`，沒有寫死帳號或專案名稱。
5. 帳號首頁儲存庫（`帳號.github.io`）或自訂網域部署於 `/` 時，將 workflow 的 `VITE_BASE_PATH` 改成 `/`；其他非 `main` 分支需調整觸發分支。

手動建置到子目錄：

```sh
VITE_BASE_PATH=/your-repository/ npm run build
```

未設定時預設 `./` 相對資源。應用不使用路徑路由，各遊戲畫面都在同一個 `index.html` 內切換，因此重新整理 `/your-repository/` 不需要伺服器 rewrite，也不會因劇情頁面路徑出現 404。資產會套用同一 base。請不要把 `src` 或 `node_modules` 當部署成品。

**此工作階段只建立部署流程，沒有推送或實際發布 GitHub Pages。**

## 驗證範圍與後續階段

已加入核心單元測試：六種比較、複合條件、效果交易、資源不足、時間重置、事件循環防護、無效節點、三種分支、完整存檔、版本遷移、損壞資料與儲存失敗。

另以 Chromium 實測開發版及 `/GameTest/` 子目錄正式建置（包含重新整理與 NPC 方向鍵分頁）：主選單、新遊戲、調查解鎖、手動儲存、重新整理繼續、結局 B、讀檔、設定持久化與 390px 手機排版；瀏覽器檢查腳本為本次環境的臨時驗證，未增加專案開發依賴。

後續尚未完成（不影響本階段 UI 測試）：

- 正式劇情、人物、世界觀、正式美術、音效與音樂，皆刻意留白。
- 較完整的調查筆記詳情、對話回顧與章節管理。
- 每日旗標／NPC 狀態清理等更進階的時間規則。
- 實際 GitHub Pages 發布與線上驗收。
- Safari、Firefox、實體手機、螢幕閱讀器與完整無障礙稽核尚未實測。
- 存檔匯出／匯入、跨裝置同步、任意版本遷移不在本階段範圍。
