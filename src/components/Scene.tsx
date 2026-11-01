import type { NpcData, StoryNode } from '../types/game';
import { assetUrl } from '../utils/assets';
export function Scene({ node, npc, menu = false }: { node?: StoryNode; npc?: NpcData; menu?: boolean }) {
  const background = assetUrl(node?.background);
  const character = assetUrl(node?.character || npc?.image);
  return <div className={`scene ${menu ? 'scene-menu' : ''}`} aria-label={menu ? '抽象測試場景' : '場景與角色顯示區'} role="img">
    <div className="scene-background" style={background ? { backgroundImage: `url("${background}")` } : undefined} />
    <div className="scene-architecture"><div className="door-frame"><div className="door-inner" /><div className="door-light" /></div><div className="floor-lines" /></div>
    <div className="scene-character">{character ? <img src={character} alt={npc?.name ?? '角色佔位圖'} /> : npc && <div className="silhouette"><div className="silhouette-head" /><div className="silhouette-body" /></div>}</div>
    <div className="scene-atmosphere" />
    {!menu && <><span className="scene-label">場景 01 <span>／</span> 中立測試空間</span><span className="scene-coordinate">背景・角色・效果分層</span><span className="crosshair crosshair-tl" /><span className="crosshair crosshair-br" /></>}
    {npc && <div className="subject-marker"><span className="status-dot" /><span>{npc.designation}</span><small>角色圖像佔位</small></div>}
  </div>;
}
