import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type MotionCtx = { motion: boolean; toggle: () => void };

const Ctx = createContext<MotionCtx>({ motion: true, toggle: () => {} });

const KEY = 'smh-motion';

function initial(): boolean {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'on') return true;
    if (saved === 'off') return false;
  } catch {
    /* storage unavailable */
  }
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function MotionProvider({ children }: { children: ReactNode }) {
  const [motion, setMotion] = useState(initial);

  useEffect(() => {
    document.documentElement.dataset.motion = motion ? 'on' : 'off';
  }, [motion]);

  const toggle = useCallback(() => {
    setMotion((m) => {
      const next = !m;
      try {
        localStorage.setItem(KEY, next ? 'on' : 'off');
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ motion, toggle }), [motion, toggle]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useMotion = () => useContext(Ctx);
