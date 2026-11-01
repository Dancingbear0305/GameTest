# 素材分層

場景與備用角色剪影由 `Scene.tsx` 搭配 CSS 產生。第一位角色使用專案作者上傳的圖片，原檔移至 `public/characters/first.png`，由 `src/data/story.json` 的 NPC `image` 引用；圖片內容保持原樣。

可匯入打包素材至此資料夾；JSON 指定的圖片則放在 `public/` 下，路徑使用 `backgrounds/example.webp` 或 `characters/example.webp`，由 `assetUrl()` 自動套用 Vite base。

圖片在 `scene-background` 與 `scene-character` 各自顯示；`scene-atmosphere` 與 `screen-effects` 負責獨立特效。
