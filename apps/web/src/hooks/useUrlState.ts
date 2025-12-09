// 키 기반 + 객체 기반 모두 지원. 동일값 비교로 루프 차단.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Serializer<T> = (v: T) => string | null;
type Parser<T> = (s: string | null) => T;
export type UseUrlStateOptions<T> = {
  defaultValue: T;
  persistKey?: string;
  debounceMs?: number;
  mode?: "replace" | "push";
  serialize?: Serializer<T>;
  parse?: Parser<T>;
};

const debounce = <A extends any[]>(fn: (...a: A) => void, ms = 0) => {
  let t: number | undefined;
  return (...a: A) => { if (t) clearTimeout(t); t = window.setTimeout(() => fn(...a), ms); };
};
const setParam = (u: URL, k: string, v: string | null) =>
  v == null || v === "" ? u.searchParams.delete(k) : u.searchParams.set(k, v);

/* 키 기반 */
function useUrlKeyState<T = string>(key: string, opts: UseUrlStateOptions<T>) {
  const {
    defaultValue,
    persistKey,
    debounceMs = 0,
    mode = "replace",
    serialize = (v) => (v == null ? null : String(v)),
    parse = (s) => (s == null ? (defaultValue as any) : (s as any)),
  } = opts;
  const first = useRef(true);
  const initial: T = useMemo(() => {
    const url = new URL(window.location.href);
    const q = url.searchParams.get(key);
    if (q != null) return parse(q);
    if (persistKey) {
      const raw = window.localStorage.getItem(persistKey);
      if (raw != null) return parse(raw);
    }
    return defaultValue;
  }, [key, parse, defaultValue, persistKey]);
  const [value, _set] = useState<T>(initial);

  const commitUrl = useMemo(
    () =>
      debounce((next: T) => {
        const url = new URL(window.location.href);
        const s = serialize(next);
        const prev = url.searchParams.get(key);
        if ((prev ?? "") === (s ?? "")) return;
        setParam(url, key, s);
        const fn = mode === "push" ? window.history.pushState : window.history.replaceState;
        fn.call(window.history, {}, "", url.toString());
      }, debounceMs),
    [key, mode, serialize, debounceMs]
  );
  const commitStorage = useCallback((next: T) => {
    if (!persistKey) return;
    const s = serialize(next);
    const prev = window.localStorage.getItem(persistKey);
    if ((prev ?? "") === (s ?? "")) return;
    if (s == null) window.localStorage.removeItem(persistKey);
    else window.localStorage.setItem(persistKey, s);
  }, [persistKey, serialize]);

  const setValue = useCallback((next: T | ((v: T) => T)) => {
    _set((prev) => {
      const v = typeof next === "function" ? (next as any)(prev) : next;
      if (Object.is(v, prev)) return prev;
      commitUrl(v);
      commitStorage(v);
      return v;
    });
  }, [commitUrl, commitStorage]);

  useEffect(() => {
    const onPop = () => {
      const url = new URL(window.location.href);
      const s = url.searchParams.get(key);
      const parsed = parse(s);
      _set((prev) => (Object.is(prev, parsed) ? prev : parsed));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [key, parse]);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    commitUrl(value);
    commitStorage(value);
  }, [value, commitUrl, commitStorage]);

  return [value, setValue] as const;
}

/* 객체 기반 */
type Dict = Record<string, string | undefined>;
const parseSearch = (): Dict => {
  const p = new URLSearchParams(window.location.search);
  const o: Dict = {}; p.forEach((v, k) => (o[k] = v)); return o;
};
const stringify = (obj: Dict) => {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => { if (v != null && v !== "") p.set(k, v); });
  const s = p.toString(); return s ? `?${s}` : "";
};
function useUrlDictState<T extends Dict>(defaults: T) {
  const [state, setState] = useState<T>({ ...defaults, ...parseSearch() } as T);
  useEffect(() => {
    const onPop = () => {
      const cur = parseSearch();
      setState((prev) => {
        const next = { ...defaults, ...cur } as T;
        return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
      });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [defaults]);

  const apply = useCallback((patch: Partial<T>, replace = false) => {
    const next = { ...(state as Dict), ...(patch as Dict) };
    const url = window.location.pathname + stringify(next);
    if (replace) window.history.replaceState({}, "", url);
    else window.history.pushState({}, "", url);
    setState(next as T);
  }, [state]);

  return [state, apply] as const;
}

/* 공개 API 오버로드 */
export function useUrlState<T = string>(key: string, opts: UseUrlStateOptions<T>): readonly [T, (next: T | ((v: T) => T)) => void];
export function useUrlState<T extends Dict>(defaults: T): readonly [T, (patch: Partial<T>, replace?: boolean) => void];
export function useUrlState(a: any, b?: any) {
  if (typeof a === "string") return useUrlKeyState(a, b);
  return useUrlDictState(a);
}
export default useUrlState;
