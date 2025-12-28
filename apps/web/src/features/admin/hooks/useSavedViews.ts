import { useCallback, useEffect, useMemo, useState } from "react";

export type SavedViewScope = "admin.events";

export type SavedView = {
  id: string;
  name: string;
  /** URLSearchParams로 쓰기 좋은 쿼리스트링(leading ? 없음) */
  query: string;
  createdAt: number;
  updatedAt: number;
};

type StorageShapeV1 = {
  version: 1;
  scope: SavedViewScope;
  items: SavedView[];
};

type Options = {
  scope: SavedViewScope;
  /** 저장할 파라미터 allowlist (필터/정렬/페이지 등) */
  allowedKeys: string[];
  /** 최대 저장 개수(초과 시 오래된 것부터 제거) */
  maxItems?: number;
};

const DEFAULT_MAX = 20;

function now() {
  return Date.now();
}

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function storageKey(scope: SavedViewScope) {
  return `vn-lounge.savedViews.${scope}.v1`;
}

function makeId() {
  // 충분히 충돌 낮음 + 디버깅 쉬움
  return `sv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeQuery(query: string) {
  const p = new URLSearchParams(query.startsWith("?") ? query.slice(1) : query);

  // 키 정렬로 안정화
  const keys = Array.from(new Set(Array.from(p.keys()))).sort((a, b) => a.localeCompare(b));
  const out = new URLSearchParams();
  keys.forEach((k) => {
    const values = p.getAll(k);
    values.forEach((v) => out.append(k, v));
  });
  return out.toString();
}

/** 현재 URLSearchParams에서 allowlist 키만 뽑아서 saved view query를 만든다 */
export function buildSavedViewQueryFromParams(params: URLSearchParams, allowedKeys: string[]) {
  const out = new URLSearchParams();
  allowedKeys.forEach((k) => {
    const values = params.getAll(k);
    values.forEach((v) => {
      const vv = String(v ?? "").trim();
      if (vv) out.append(k, vv);
    });
  });
  return normalizeQuery(out.toString());
}

function readStorage(scope: SavedViewScope): StorageShapeV1 {
  try {
    const key = storageKey(scope);
    const parsed = safeJsonParse<StorageShapeV1>(localStorage.getItem(key));

    if (!parsed || parsed.version !== 1 || parsed.scope !== scope || !Array.isArray(parsed.items)) {
      return { version: 1, scope, items: [] };
    }

    const cleaned = parsed.items
      .filter((x) => x && typeof x.id === "string" && typeof x.name === "string" && typeof x.query === "string")
      .map((x) => ({
        ...x,
        query: normalizeQuery(x.query),
        createdAt: Number(x.createdAt || 0) || 0,
        updatedAt: Number(x.updatedAt || 0) || 0,
      }));

    return { version: 1, scope, items: cleaned };
  } catch {
    return { version: 1, scope, items: [] };
  }
}

function writeStorage(scope: SavedViewScope, items: SavedView[]) {
  try {
    const key = storageKey(scope);
    const payload: StorageShapeV1 = { version: 1, scope, items };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // localStorage 제한/차단 환경에서도 앱이 죽지 않게 무시
  }
}

export function useSavedViews(options: Options) {
  const { scope, allowedKeys, maxItems = DEFAULT_MAX } = options;

  const [items, setItems] = useState<SavedView[]>(() => {
    if (typeof window === "undefined") return [];
    return readStorage(scope).items;
  });

  // 다른 탭에서 변경 시 동기화
  useEffect(() => {
    if (typeof window === "undefined") return;

    const key = storageKey(scope);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return;
      const next = readStorage(scope).items;
      setItems(next);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [scope]);

  const sorted = useMemo(() => {
    // 최신 업데이트가 위로
    return [...items].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }, [items]);

  /**
   * ✅ 핵심: persist가 "배열" 또는 "업데이터 함수(prev=>next)" 둘 다 받도록
   * - 기존 코드처럼 persist에 함수를 넘기면 런타임에서 깨질 수 있었음
   */
  const persist = useCallback(
    (nextOrUpdater: SavedView[] | ((prev: SavedView[]) => SavedView[])) => {
      setItems((prev) => {
        const next = typeof nextOrUpdater === "function" ? (nextOrUpdater as any)(prev) : nextOrUpdater;
        const trimmed = Array.isArray(next) ? next.slice(0, Math.max(1, maxItems)) : prev.slice(0, maxItems);

        if (typeof window !== "undefined") writeStorage(scope, trimmed);
        return trimmed;
      });
    },
    [scope, maxItems]
  );

  const upsert = useCallback(
    (name: string, query: string, opts?: { overwriteId?: string }) => {
      const nm = String(name ?? "").trim();
      const q = normalizeQuery(query);

      if (!nm) throw new Error("name_required");
      if (!q) throw new Error("query_required");

      const t = now();

      persist((prev) => {
        const next = [...prev];

        // overwriteId가 있으면 해당 id를 갱신
        if (opts?.overwriteId) {
          const idx = next.findIndex((x) => x.id === opts.overwriteId);
          if (idx >= 0) {
            next[idx] = { ...next[idx], name: nm, query: q, updatedAt: t };
            return next;
          }
        }

        // 같은 query가 이미 존재하면 “이름만 갱신 + updatedAt 갱신” (중복 방지)
        const dupIdx = next.findIndex((x) => x.query === q);
        if (dupIdx >= 0) {
          next[dupIdx] = { ...next[dupIdx], name: nm, updatedAt: t };
          return next;
        }

        // 신규 추가
        next.unshift({
          id: makeId(),
          name: nm,
          query: q,
          createdAt: t,
          updatedAt: t,
        });

        // maxItems 초과 정리
        if (next.length > maxItems) next.length = maxItems;

        return next;
      });
    },
    [persist, maxItems]
  );

  const remove = useCallback(
    (id: string) => {
      persist((prev) => prev.filter((x) => x.id !== id));
    },
    [persist]
  );

  const rename = useCallback(
    (id: string, name: string) => {
      const nm = String(name ?? "").trim();
      if (!nm) throw new Error("name_required");

      const t = now();
      persist((prev) => prev.map((x) => (x.id === id ? { ...x, name: nm, updatedAt: t } : x)));
    },
    [persist]
  );

  const clearAll = useCallback(() => {
    persist([]);
  }, [persist]);

  const findById = useCallback(
    (id: string) => items.find((x) => x.id === id) ?? null,
    [items]
  );

  /** 현재 URLSearchParams에서 allowlist만 뽑아 저장용 query 생성 */
  const buildQueryFromParams = useCallback(
    (params: URLSearchParams) => buildSavedViewQueryFromParams(params, allowedKeys),
    [allowedKeys]
  );

  return {
    items: sorted,
    rawItems: items,

    buildQueryFromParams,

    upsert,
    remove,
    rename,
    clearAll,

    findById,
  };
}
