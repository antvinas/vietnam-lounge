import { useCallback, useRef } from 'react';

export default function usePrefetch(loader: () => Promise<unknown>) {
  const done = useRef(false);
  return useCallback(() => {
    if (done.current) return;
    loader().finally(() => {
      done.current = true;
    });
  }, [loader]);
}
