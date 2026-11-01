import { createContext, useContext, useEffect, useReducer, useState, type ReactNode } from 'react';
import { story } from '../data';
import { choose, createGame, validateStory } from '../engine/story';
import { writeSave } from '../systems/save';
import type { GameState } from '../types/game';

type Action = { type: 'new' } | { type: 'load'; state: GameState } | { type: 'choose'; id: string };
interface Session { game: GameState | null; error: string | null }
const dataErrors = validateStory(story);
function reducer(session: Session, action: Action): Session {
  try {
    if (dataErrors.length) throw new Error(dataErrors.join(' '));
    if (action.type === 'new') return { game: createGame(story), error: null };
    if (action.type === 'load') return { game: action.state, error: null };
    if (!session.game) return session;
    return { game: choose(session.game, action.id, story), error: null };
  } catch (error) { return { ...session, error: error instanceof Error ? error.message : '發生未知錯誤。' }; }
}
interface ContextValue extends Session { dispatch: React.Dispatch<Action>; saveError: string | null; lastSaved: string | null }
const Context = createContext<ContextValue | null>(null);
export function GameProvider({ children }: { children: ReactNode }) {
  const [session, dispatch] = useReducer(reducer, { game: null, error: dataErrors.join(' ') || null });
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  useEffect(() => {
    if (!session.game) return;
    const result = writeSave('auto', session.game, story);
    setSaveError(result.ok ? null : result.error);
    if (result.ok) setLastSaved(result.value.savedAt);
  }, [session.game]);
  return <Context.Provider value={{ ...session, dispatch, saveError, lastSaved }}>{children}</Context.Provider>;
}
export function useGame() {
  const context = useContext(Context);
  if (!context) throw new Error('GameProvider 未初始化。');
  return context;
}
