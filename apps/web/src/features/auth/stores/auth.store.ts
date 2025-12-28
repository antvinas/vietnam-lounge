// apps/web/src/features/auth/stores/auth.store.ts
// ✅ 운영 표준: Firebase custom claims가 단일 진실(Single Source of Truth)
// - 라우터/마이페이지/어드민 권한 판단은 claims(admin/superAdmin)만 신뢰
// - claims 변경(권한 부여/회수)은 “토큰 갱신”이 일어나야 반영되므로 onIdTokenChanged로 동기화

import { create } from "zustand";
import {
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signOut,
  getIdTokenResult,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export type AppRole = "admin" | "user";

export type AuthClaims = Record<string, unknown> & {
  admin?: boolean;
  superAdmin?: boolean;
  /** legacy 호환 (setRole에서 같이 세팅) */
  isAdmin?: boolean;
  /** 표시용(판정은 admin/superAdmin boolean이 기준) */
  role?: string;
};

export type AppUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: AppRole; // UI 편의(= claims 기반 파생값)
  claims: AuthClaims;
};

type AuthState = {
  initialized: boolean;
  loading: boolean;
  isLoggedIn: boolean;
  user: AppUser | null;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
  /** 강제로 토큰 갱신해서 최신 custom claims를 다시 끌어오기 */
  refreshClaims: () => Promise<void>;
  bootstrap: () => void;
};

let bootstrapped = false;
let unsubscribe: null | (() => void) = null;

function isAdminClaims(claims?: AuthClaims | null): boolean {
  if (!claims) return false;

  // ✅ 단일 기준: boolean claims
  if (claims.superAdmin === true) return true;
  if (claims.admin === true) return true;

  // legacy/fallback
  if (claims.isAdmin === true) return true;
  if (claims.role === "admin" || claims.role === "superAdmin") return true;

  return false;
}

function computeRoleFromClaims(claims: AuthClaims): AppRole {
  return isAdminClaims(claims) ? "admin" : "user";
}

function mapUser(fbUser: FirebaseUser, claims: AuthClaims): AppUser {
  return {
    uid: fbUser.uid,
    email: fbUser.email,
    displayName: fbUser.displayName,
    role: computeRoleFromClaims(claims),
    claims,
  };
}

function isEmptyObject(obj: unknown): boolean {
  return !!obj && typeof obj === "object" && Object.keys(obj as any).length === 0;
}

async function safeGetClaims(fbUser: FirebaseUser, forceRefresh = false): Promise<AuthClaims> {
  // onIdTokenChanged 콜백 내부에서는 forceRefresh=false로만 호출하는 걸 권장(루프/중복 갱신 방지)
  try {
    const r = await getIdTokenResult(fbUser, forceRefresh);
    return (r?.claims ?? {}) as AuthClaims;
  } catch {
    // forceRefresh가 실패하면 캐시 토큰으로 한번 더 시도
    try {
      const r = await getIdTokenResult(fbUser);
      return (r?.claims ?? {}) as AuthClaims;
    } catch {
      return {} as AuthClaims;
    }
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  initialized: false,
  loading: false,
  isLoggedIn: false,
  user: null,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // ✅ 실제 user/claims 세팅은 onIdTokenChanged에서 처리
    } catch (e) {
      const msg = e instanceof Error ? e.message : "로그인에 실패했습니다.";
      set({ error: msg, loading: false });
      throw e;
    }
  },

  logout: async () => {
    set({ loading: true, error: null });
    try {
      await signOut(auth);
      // ✅ onIdTokenChanged에서 상태 정리
    } finally {
      // signOut 실패해도 UX가 멈추지 않게
      set({ loading: false });
    }
  },

  getIdToken: async (forceRefresh = false) => {
    const u = auth.currentUser;
    if (!u) return null;
    return await u.getIdToken(forceRefresh);
  },

  refreshClaims: async () => {
    const fbUser = auth.currentUser;
    if (!fbUser) return;

    set({ loading: true, error: null });
    try {
      const claims = await safeGetClaims(fbUser, true);

      // claims를 못 가져온(네트워크/권한 이슈 등) 경우에는 “마지막 정상 claims”를 유지
      const current = get().user;
      const effectiveClaims =
        isEmptyObject(claims) && current?.uid === fbUser.uid && current.claims
          ? (current.claims as AuthClaims)
          : claims;

      set({
        initialized: true,
        loading: false,
        isLoggedIn: true,
        user: mapUser(fbUser, effectiveClaims),
        error: null,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "claims 갱신 실패";
      // ✅ 일시적 실패로 admin이 user처럼 보이는 것 방지 → 기존 user 유지
      set({ loading: false, error: msg, initialized: true });
    }
  },

  bootstrap: () => {
    if (bootstrapped) return;
    bootstrapped = true;

    set({ loading: true, error: null });

    // ✅ claims(토큰) 변화까지 잡기 위해 onIdTokenChanged 사용
    unsubscribe = onIdTokenChanged(auth, async (fbUser) => {
      try {
        if (!fbUser) {
          set({
            initialized: true,
            loading: false,
            isLoggedIn: false,
            user: null,
            error: null,
          });
          return;
        }

        const wasInitialized = get().initialized;
        if (!wasInitialized) set({ loading: true, error: null });

        const claims = await safeGetClaims(fbUser, false);

        // claims를 못 가져온 경우에는 “마지막 정상 claims”를 유지
        const current = get().user;
        const effectiveClaims =
          isEmptyObject(claims) && current?.uid === fbUser.uid && current.claims
            ? (current.claims as AuthClaims)
            : claims;

        set({
          initialized: true,
          loading: false,
          isLoggedIn: true,
          user: mapUser(fbUser, effectiveClaims),
          error: null,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "인증 상태 동기화 실패";

        // ✅ Firebase는 로그인 상태일 수 있으므로, 앱이 "로그아웃"처럼 보이게 만들지 말자
        const fbUser = auth.currentUser;
        if (fbUser) {
          const current = get().user;
          set({
            initialized: true,
            loading: false,
            isLoggedIn: true,
            user: current?.uid === fbUser.uid ? current : mapUser(fbUser, {} as AuthClaims),
            error: msg,
          });
        } else {
          set({
            initialized: true,
            loading: false,
            isLoggedIn: false,
            user: null,
            error: msg,
          });
        }
      }
    });
  },
}));

export function disposeAuthListener() {
  unsubscribe?.();
  unsubscribe = null;
  bootstrapped = false;
}
