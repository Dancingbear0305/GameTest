export type Comparison = 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte';
export type Condition =
  | { op: Comparison; group: 'resources'; key: string; value: number }
  | { op: 'flag'; key: string }
  | { op: 'phase'; value: string }
  | { op: 'npc'; npcId: string; key: string; value: boolean | number | string }
  | { op: 'and' | 'or'; conditions: Condition[] }
  | { op: 'not'; condition: Condition };
export interface Observation { npcId: string; featureId: string }
export type Effect =
  | { type: 'add' | 'set'; group: 'resources'; key: string; value: number }
  | { type: 'flag'; key: string; value: boolean }
  | { type: 'npc'; npcId: string; key: string; value: boolean | number | string }
  | { type: 'observe'; npcId: string; featureId: string }
  | { type: 'event'; eventId: string }
  | { type: 'phase'; phase: string }
  | { type: 'newDay' };
export interface Choice {
  id: string;
  label: string;
  category?: 'dialogue' | 'interaction' | 'decision';
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
  resources: Record<string, number>;
  flags: string[];
  npcStates: Record<string, Record<string, boolean | number | string>>;
  lastObservation: Observation | null;
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
  features: { id: string; label: string; text: string }[];
}
export interface GameConfig {
  initialNodeId: string;
  initialPhase: string;
  phases: { id: string; label: string; eventId?: string }[];
  dailyResources: Record<string, number>;
  initialResources: Record<string, number>;
  resourceLabels: Record<string, string>;
  transitions: { conditions: Condition; next: string }[];
}
export interface StoryData { nodes: StoryNode[]; npcs: NpcData[]; config: GameConfig }
export interface Settings { effects: boolean; textSize: 'normal' | 'large'; textSpeed: 'instant' | 'slow' | 'normal' }
