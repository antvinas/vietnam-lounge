/* WAI-ARIA Combobox/Listbox 헬퍼. aria-activedescendant 패턴 */
/* 참고: APG Combobox/Listbox 패턴. */
type ComboArgs = {
  expanded: boolean;
  activeId?: string;
  listboxId: string;
  labelledBy?: string;
  autocomplete?: "list" | "both" | "inline" | "none";
};

export function getComboboxProps(a: ComboArgs) {
  return {
    role: "combobox",
    "aria-expanded": a.expanded,
    "aria-controls": a.listboxId,
    "aria-autocomplete": a.autocomplete ?? "list",
    ...(a.labelledBy ? { "aria-labelledby": a.labelledBy } : {}),
    ...(a.expanded && a.activeId ? { "aria-activedescendant": a.activeId } : {}),
  } as const;
}

export function getListboxProps(id: string, multiselectable = false) {
  return {
    id,
    role: "listbox",
    ...(multiselectable ? { "aria-multiselectable": true } : {}),
  } as const;
}

export function getOptionProps(id: string, selected: boolean) {
  return {
    id,
    role: "option",
    "aria-selected": selected,
    tabIndex: -1, // 포커스는 combobox에 유지
  } as const;
}

/** 키보드 이동 유틸: 위/아래, Home/End */
export function moveIndex(len: number, cur: number, key: string) {
  if (len <= 0) return -1;
  switch (key) {
    case "ArrowUp":
      return (cur - 1 + len) % len;
    case "ArrowDown":
      return (cur + 1) % len;
    case "Home":
      return 0;
    case "End":
      return len - 1;
    default:
      return cur;
  }
}
