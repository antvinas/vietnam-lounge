// apps/web/src/features/admin/hooks/useRowSelection.ts
import { useCallback, useEffect, useMemo, useState } from "react";

type Options = {
  /**
   * visibleIds가 바뀔 때 선택된 항목을 자동으로 정리(prune)할지
   * - true: 화면에서 사라진 id는 선택에서 제거 (필터/검색과 궁합 좋음)
   * - false: 선택 유지 (페이지네이션/탭 이동에도 선택 유지 가능)
   */
  pruneOnVisibleChange?: boolean;

  /** 초기 선택 id들 */
  initialSelectedIds?: string[];
};

export function useRowSelection(visibleIds: string[], options: Options = {}) {
  const { pruneOnVisibleChange = false, initialSelectedIds = [] } = options;

  const [selected, setSelected] = useState<Set<string>>(() => new Set(initialSelectedIds));

  // visibleIds 변화 시 prune 옵션이 켜져있으면 선택 정리
  useEffect(() => {
    if (!pruneOnVisibleChange) return;

    const visible = new Set(visibleIds);
    setSelected((prev) => {
      let changed = false;
      const next = new Set<string>();
      prev.forEach((id) => {
        if (visible.has(id)) next.add(id);
        else changed = true;
      });
      return changed ? next : prev;
    });
  }, [visibleIds, pruneOnVisibleChange]);

  const selectedIds = useMemo(() => Array.from(selected), [selected]);
  const selectedCount = selected.size;

  const visibleSet = useMemo(() => new Set(visibleIds), [visibleIds]);

  const visibleSelectedCount = useMemo(() => {
    let c = 0;
    selected.forEach((id) => {
      if (visibleSet.has(id)) c += 1;
    });
    return c;
  }, [selected, visibleSet]);

  const areAllVisibleSelected = visibleIds.length > 0 && visibleSelectedCount === visibleIds.length;
  const areSomeVisibleSelected = visibleSelectedCount > 0 && visibleSelectedCount < visibleIds.length;

  const isSelected = useCallback((id: string) => selected.has(id), [selected]);

  const setChecked = useCallback((id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  const setSelectedIds = useCallback((ids: string[]) => setSelected(new Set(ids)), []);

  const selectVisibleAll = useCallback(() => {
    setSelected((prev) => {
      const next = new Set(prev);
      visibleIds.forEach((id) => next.add(id));
      return next;
    });
  }, [visibleIds]);

  const deselectVisibleAll = useCallback(() => {
    setSelected((prev) => {
      const next = new Set(prev);
      visibleIds.forEach((id) => next.delete(id));
      return next;
    });
  }, [visibleIds]);

  const toggleVisibleAll = useCallback(() => {
    if (areAllVisibleSelected) deselectVisibleAll();
    else selectVisibleAll();
  }, [areAllVisibleSelected, deselectVisibleAll, selectVisibleAll]);

  /** ✅ header checkbox에서 바로 쓰기 좋게 */
  const getHeaderCheckboxState = useCallback(() => {
    return {
      checked: areAllVisibleSelected,
      indeterminate: areSomeVisibleSelected,
      disabled: visibleIds.length === 0,
    };
  }, [areAllVisibleSelected, areSomeVisibleSelected, visibleIds.length]);

  return {
    // data
    selectedIds,
    selectedCount,

    visibleSelectedCount,
    areAllVisibleSelected,
    areSomeVisibleSelected,

    // ops
    isSelected,
    setChecked,
    toggle,
    clear,
    setSelectedIds,
    selectVisibleAll,
    deselectVisibleAll,
    toggleVisibleAll,

    // ui helpers
    getHeaderCheckboxState,
  };
}