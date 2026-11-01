import { useEffect, useState } from 'react';
import type { Settings } from '../types/game';
export function useTypewriter(text: string, speed: Settings['textSpeed']) {
  const [count, setCount] = useState(0);
  const [skip, setSkip] = useState(false);
  useEffect(() => {
    setCount(0); setSkip(false);
    if (speed === 'instant' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setSkip(true); return; }
    const timer = window.setInterval(() => setCount(n => {
      if (n >= text.length) window.clearInterval(timer);
      return n + 1;
    }), speed === 'slow' ? 55 : 22);
    return () => window.clearInterval(timer);
  }, [text, speed]);
  return { display: skip ? text : text.slice(0, count), complete: skip || count >= text.length, finish: () => setSkip(true) };
}
