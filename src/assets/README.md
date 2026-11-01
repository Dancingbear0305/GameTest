# 素材分層

目前所有場景與角色佔位圖皆由 `Scene.tsx` 搭配 CSS 產生，未使用第三方美術。

可匯入打包素材至此資料夾；JSON 指定的圖片則放在 `public/` 下，路徑使用 `backgrounds/example.webp` 或 `characters/example.webp`，由 `assetUrl()` 自動套用 Vite base。

圖片在 `scene-background` 與 `scene-character` 各自顯示；`scene-atmosphere` 與 `screen-effects` 負責獨立特效。
