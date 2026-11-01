// Validate external JSON before the typed engine reads it. No executable story code.
import type { StoryData } from '../types/game';
const record = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const strings = (v: unknown) => Array.isArray(v) && v.every(x => typeof x === 'string');
const optional = (v: unknown, test: (x: unknown) => boolean) => v === undefined || test(v);
const string = (v: unknown) => typeof v === 'string';
const numericMap = (v: unknown) => record(v) && Object.values(v).every(x => typeof x === 'number' && Number.isFinite(x));
function condition(v: unknown, depth = 0): boolean {
  if (depth > 32 || !record(v)) return false;
  if (v.op === 'and' || v.op === 'or') return Array.isArray(v.conditions) && v.conditions.every(c => condition(c, depth + 1));
  if (v.op === 'not') return condition(v.condition, depth + 1);
  if (v.op === 'flag') return string(v.key);
  if (v.op === 'phase') return string(v.value);
  if (v.op === 'npc') return string(v.npcId) && string(v.key) && ['string', 'number', 'boolean'].includes(typeof v.value);
  return ['eq', 'ne', 'gt', 'lt', 'gte', 'lte'].includes(String(v.op)) && v.group === 'resources' && string(v.key) && typeof v.value === 'number' && Number.isFinite(v.value);
}
function effect(v: unknown): boolean {
  if (!record(v)) return false;
  switch (v.type) {
    case 'add': case 'set': return v.group === 'resources' && string(v.key) && typeof v.value === 'number' && Number.isFinite(v.value);
    case 'flag': return string(v.key) && typeof v.value === 'boolean';
    case 'observe': return string(v.npcId) && string(v.featureId);
    case 'npc': return string(v.npcId) && string(v.key) && ['string', 'number', 'boolean'].includes(typeof v.value);
    case 'event': return string(v.eventId);
    case 'phase': return string(v.phase);
    case 'newDay': return true;
    default: return false;
  }
}
const effects = (v: unknown) => Array.isArray(v) && v.every(effect);
function choice(v: unknown): boolean {
  return record(v) && string(v.id) && string(v.label) && optional(v.next, string) && optional(v.conditions, condition) && optional(v.enabledWhen, condition) && optional(v.lockedReason, string) && optional(v.effects, effects) && optional(v.category, x => ['dialogue', 'interaction', 'decision'].includes(String(x)));
}
const choices = (v: unknown) => Array.isArray(v) && v.every(choice) && new Set(v.map(c => (c as { id: string }).id)).size === v.length;
function node(v: unknown): boolean {
  return record(v) && string(v.id) && string(v.text) && ['narration', 'dialogue', 'choice', 'investigation', 'decision', 'event', 'ending'].includes(String(v.type))
    && ['speaker', 'background', 'character', 'npcId', 'next'].every(k => optional(v[k], string)) && optional(v.tags, strings)
    && optional(v.conditions, condition) && optional(v.effects, effects) && optional(v.choices, choices);
}
const labelMap = (v: unknown) => record(v) && Object.values(v).every(string);
export function isStoryData(v: unknown): v is StoryData {
  if (!record(v) || !record(v.config) || !Array.isArray(v.nodes) || !v.nodes.every(node) || !Array.isArray(v.npcs)) return false;
  const c = v.config;
  return string(c.initialNodeId) && string(c.initialPhase) && Array.isArray(c.phases) && c.phases.length > 0 && c.phases.every(p => record(p) && string(p.id) && string(p.label) && optional(p.eventId, string))
    && ['dailyResources', 'initialResources'].every(k => numericMap(c[k]))
    && labelMap(c.resourceLabels)
    && Array.isArray(c.transitions) && c.transitions.every(t => record(t) && condition(t.conditions) && string(t.next))
    && v.npcs.every(n => record(n) && string(n.id) && string(n.name) && string(n.designation) && string(n.description) && optional(n.image, string) && Array.isArray(n.features) && n.features.every(f => record(f) && string(f.id) && string(f.label) && string(f.text)));
}
