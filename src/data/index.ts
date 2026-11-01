import raw from './story.json';
import type { StoryData } from '../types/game';
import { isStoryData } from '../engine/validateData';
const candidate: unknown = raw;
// A malformed authoring file gets a safe, readable screen instead of a render crash.
const fallback: StoryData = {
  nodes: [{ id: 'invalid-data', type: 'ending', speaker: '資料載入失敗', text: '劇情資料缺少必要欄位或格式不正確。請檢查 src/data/story.json 後重新載入。' }],
  npcs: [], config: { initialNodeId: 'invalid-data', initialPhase: 'error', phases: [{ id: 'error', label: '資料錯誤' }],
    dailyResources: {}, initialStats: {}, initialResources: {}, statLabels: {}, resourceLabels: {}, clueLabels: {}, itemLabels: {} },
};
export const story: StoryData = isStoryData(candidate) ? candidate : fallback;
