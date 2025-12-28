// apps/web/src/features/User/api/user.api.ts
import { getAuth } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  limit,
} from "firebase/firestore";
import { deleteUser } from "firebase/auth";
import { db } from "@/lib/firebase";

export type UserProfile = {
  uid: string;
  email: string;
  displayName?: string | null;
  nickname?: string;
  photoURL?: string | null;
  phoneNumber?: string | null;
  providerId?: string | null;
  createdAt?: any;
  updatedAt?: any;
  lastLoginAt?: any;

  // 운영/권한 필드(읽기는 가능해도, 클라 write는 rules에서 차단)
  role?: string;
  roles?: any;
  isAdmin?: boolean;
  status?: string;
  adminMemo?: string;
};

export type FavoriteItem = {
  id: string; // spotId
  spotType: "spots" | "adult_spots";
  createdAt?: any;
};

export type UserActivitySummary = {
  favoriteCount: number;
  reviewCount: number;
  couponCount: number;
};

function requireAuth() {
  const auth = getAuth();
  const u = auth.currentUser;
  if (!u) throw new Error("로그인이 필요합니다.");
  return u;
}

/**
 * ✅ 내 프로필: Firestore users/{uid}
 * - 문서 없으면 생성
 * - /users 문서는 "프로필"만 저장 (운영/권한 필드는 Functions/Claims로 관리)
 */
export async function getMyProfile(): Promise<UserProfile> {
  const authUser = requireAuth();
  const uid = authUser.uid;

  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const nickname =
      authUser.displayName ??
      (authUser.email ? authUser.email.split("@")[0] : "User");

    const base: any = {
      uid,
      email: authUser.email ?? "",
      nickname,
      displayName: authUser.displayName ?? nickname,
      photoURL: authUser.photoURL ?? null,
      phoneNumber: authUser.phoneNumber ?? null,
      providerId: authUser.providerData?.[0]?.providerId ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    };

    await setDoc(ref, base, { merge: true });
    return base as UserProfile;
  }

  // 로그인/접속 시각만 갱신
  await setDoc(
    ref,
    { lastLoginAt: serverTimestamp(), updatedAt: serverTimestamp() },
    { merge: true }
  );

  const data: any = snap.data() || {};
  return data as UserProfile;
}

export async function updateMyProfile(
  payload: Partial<UserProfile>
): Promise<UserProfile> {
  const authUser = requireAuth();
  const uid = authUser.uid;

  const ref = doc(db, "users", uid);

  // ✅ 운영/권한 필드 제거(클라에서 쓰기 금지)
  const sanitized: any = { ...(payload as any) };
  [
    "role",
    "roles",
    "isAdmin",
    "status",
    "adminMemo",
    "bannedAt",
    "deletedAt",
    "deletedReason",
    "deletedBy",
  ].forEach((k) => {
    if (k in sanitized) delete sanitized[k];
  });

  await updateDoc(ref, { ...sanitized, updatedAt: serverTimestamp() } as any);

  const snap = await getDoc(ref);
  return (snap.data() || {}) as UserProfile;
}

export async function deleteMyAccount(): Promise<void> {
  const authUser = requireAuth();
  const uid = authUser.uid;

  // Firestore 문서 삭제(필요 없으면 rules에서 delete를 false로 바꿔도 됨)
  await deleteDoc(doc(db, "users", uid));

  // Firebase Auth 계정 삭제
  await deleteUser(authUser);
}

/**
 * ✅ Settings.tsx 호환용 (named export)
 * - 기존 Settings 페이지에서 withdrawUser()를 import 하고 있으므로
 *   deleteMyAccount()를 그대로 연결해줌.
 */
export async function withdrawUser(): Promise<void> {
  return deleteMyAccount();
}

export async function addFavorite(
  spotId: string,
  spotType: FavoriteItem["spotType"]
): Promise<void> {
  const authUser = requireAuth();
  await setDoc(doc(db, "users", authUser.uid, "favorites", spotId), {
    id: spotId,
    spotType,
    createdAt: serverTimestamp(),
  });
}

export async function getMyFavorites(): Promise<FavoriteItem[]> {
  const authUser = requireAuth();
  const snap = await getDocs(
    query(
      collection(db, "users", authUser.uid, "favorites"),
      orderBy("createdAt", "desc")
    )
  );
  const results: FavoriteItem[] = [];
  snap.forEach((d) => {
    const data: any = d.data();
    results.push({
      id: d.id,
      spotType: data.spotType,
      createdAt: data.createdAt,
    });
  });
  return results;
}

export async function removeFavorite(spotId: string): Promise<void> {
  const authUser = requireAuth();
  await deleteDoc(doc(db, "users", authUser.uid, "favorites", spotId));
}

/**
 * ✅ 내 활동 요약
 * - favorites: count
 * - reviews: reviews 컬렉션 userId 기준 count (없으면 0)
 * - coupons: 아직 없으면 0
 */
export async function getUserActivitySummary(): Promise<UserActivitySummary> {
  const authUser = requireAuth();
  const uid = authUser.uid;

  const favCol = collection(db, "users", uid, "favorites");
  const favCountSnap = await getCountFromServer(favCol);
  const favoriteCount = Number(favCountSnap.data().count ?? 0);

  let reviewCount = 0;
  try {
    const reviewsCol = collection(db, "reviews");
    const reviewCountSnap = await getCountFromServer(
      query(reviewsCol, where("userId", "==", uid))
    );
    reviewCount = Number(reviewCountSnap.data().count ?? 0);
  } catch {
    reviewCount = 0;
  }

  const couponCount = 0;
  return { couponCount, favoriteCount, reviewCount };
}
