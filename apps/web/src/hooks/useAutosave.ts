import { useEffect, useRef } from 'react';

type Options = {
  delay?: number;        // ms
  enabled?: boolean;
};

export default function useAutosave(save: () => void | Promise<void>, deps: unknown[], opts: Options = {}) {
  const { delay = 2000, enabled = true } = opts;
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      void save();
    }, delay);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, delay, ...deps]);
}
