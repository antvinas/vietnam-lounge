import { useCallback, useMemo, useState } from 'react';

export default function useSelection<T extends { id: string }>(items: T[]) {
  const [set, setSet] = useState<Set<string>>(new Set());

  const isSelected = useCallback((id: string) => set.has(id), [set]);

  const toggle = useCallback((id: string) => {
    setSet((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }, []);

  const selectOnly = useCallback((id: string) => setSet(new Set([id])), []);
  const selectMany = useCallback((ids: string[]) => setSet(new Set(ids)), []);
  const clear = useCallback(() => setSet(new Set()), []);
  const size = set.size;

  const selected = useMemo(() => items.filter((x) => set.has(x.id)), [items, set]);

  return { selected, selectedIds: set, size, isSelected, toggle, selectOnly, selectMany, clear };
}
