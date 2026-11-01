export type Comparison = 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte';
export type NumericGroup = 'playerStats' | 'resources';
export type Condition =
  | { op: Comparison; group: NumericGroup; key: string; value: number }
  | { op: 'flag' | 'item' | 'clue'; key: string }
  | { op: 'and' | 'or'; conditions: Condition[] }
  | { op: 'not'; condition: Condition };

export type Effect =
  | { type: 'add' | 'set'; group: NumericGroup; key: string; value: number }
  | { type: 'flag'; key: string; value: boolean }
  | { type: 'item' | 'clue'; key: string; remove?: boolean }
  | { type: 'npc'; npcId: string; key: string; value: boolean | number | string }
  | { type: 'event'; eventId: string }
  | { type: 'phase'; phase: string }
  | { type: 'newDay' };

export interface Choice {
  id: string;
  label: string;
  next?: string;
  conditions?: Condition;
  enabledWhen?: Condition;
  lockedReason?: string;
  effects?: Effect[];
}
export type NodeType = 'narration' | 'dialogue' | 'choice' | 'investigation' | 'decision' | 'event' | 'ending';
export interface StoryNode {
  id: string;
  type: NodeType;
  speaker?: string;
  text: string;
  background?: string;
  character?: string;
  npcId?: string;
  choices?: Choice[];
  conditions?: Condition;
  effects?: Effect[];
  next?: string;
  tags?: string[];
}
export interface GameState {
  currentNodeId: string;
  currentPhase: string;
  day: number;
  playerStats: Record<string, number>;
  resources: Record<string, number>;
  inventory: string[];
  clues: string[];
  flags: string[];
  npcStates: Record<string, Record<string, boolean | number | string>>;
  decisionHistory: { nodeId: string; choiceId: string; day: number }[];
  visitedNodes: string[];
  endingId: string | null;
}
export interface NpcData {
  id: string;
  name: string;
  designation: string;
  image?: string;
  description: string;
  questions: Choice[];
  investigations: Choice[];
  interactions: Choice[];
  decision: Choice;
}
export interface GameConfig {
  initialNodeId: string;
  initialPhase: string;
  phases: { id: string; label: string; eventId?: string }[];
  dailyResources: Record<string, number>;
  initialStats: Record<string, number>;
  initialResources: Record<string, number>;
  statLabels: Record<string, string>;
  resourceLabels: Record<string, string>;
  clueLabels: Record<string, string>;
  itemLabels: Record<string, string>;
}
export interface StoryData { nodes: StoryNode[]; npcs: NpcData[]; config: GameConfig }
export interface Settings { effects: boolean; textSize: 'normal' | 'large'; textSpeed: 'instant' | 'slow' | 'normal' }
