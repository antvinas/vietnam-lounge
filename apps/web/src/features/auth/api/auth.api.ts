// apps/web/src/features/auth/api/auth.api.ts

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  GithubAuthProvider,
  signOut,
  type User as FirebaseAuthUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/config/firebase";
import type { User } from "@/types/user";
import type {
  LoginCredentials,
  RegisterCredentials,
  RegisterParams,
  SocialProvider,
} from "../types/auth.types";

export type { RegisterParams } from "../types/auth.types";

function toAppUser(uid: string, partial: Partial<User> = {}): User {
  return {
    id: uid,
    uid,
    email: partial.email ?? "",
    displayName: partial.displayName ?? null,
    photoURL: partial.photoURL ?? null,
    providerId: partial.providerId,
    role: partial.role ?? "user",
    status: partial.status ?? "active",
    createdAt: partial.createdAt,
    updatedAt: partial.updatedAt,
  };
}

// ✅ Firestore /users/{uid}에는 "프로필"만 저장
function buildUserDocPayload(u: FirebaseAuthUser, overrides: Partial<User> = {}) {
  return {
    uid: u.uid,
    email: u.email ?? overrides.email ?? "",
    displayName: overrides.displayName ?? u.displayName ?? null,
    photoURL: overrides.photoURL ?? u.photoURL ?? null,
    providerId: u.providerData?.[0]?.providerId ?? overrides.providerId ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  };
}

async function ensureUserDoc(u: FirebaseAuthUser, overrides: Partial<User> = {}) {
  const ref = doc(db, "users", u.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, buildUserDocPayload(u, overrides));
  } else {
    await setDoc(
      ref,
      { lastLoginAt: serverTimestamp(), updatedAt: serverTimestamp() },
      { merge: true }
    );
  }
}

export async function loginUser(params: LoginCredentials): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, params.email, params.password);
  const u = cred.user;

  const appUser = toAppUser(u.uid, {
    email: u.email ?? params.email,
    displayName: u.displayName ?? null,
    photoURL: u.photoURL ?? null,
    providerId: u.providerData?.[0]?.providerId,
  });

  await ensureUserDoc(u, appUser);
  return appUser;
}

export async function registerUser(params: RegisterCredentials): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, params.email, params.password);
  const u = cred.user;

  const appUser = toAppUser(u.uid, {
    email: u.email ?? params.email,
    displayName: params.displayName ?? null,
    photoURL: u.photoURL ?? null,
    providerId: u.providerData?.[0]?.providerId,
  });

  await setDoc(doc(db, "users", u.uid), buildUserDocPayload(u, appUser));
  return appUser;
}

export async function loginWithSocial(provider: SocialProvider): Promise<User> {
  const p =
    provider === "google"
      ? new GoogleAuthProvider()
      : provider === "facebook"
        ? new FacebookAuthProvider()
        : new GithubAuthProvider();

  const cred = await signInWithPopup(auth, p);
  const u = cred.user;

  const appUser = toAppUser(u.uid, {
    email: u.email ?? "",
    displayName: u.displayName ?? null,
    photoURL: u.photoURL ?? null,
    providerId: u.providerData?.[0]?.providerId,
  });

  await ensureUserDoc(u, appUser);
  return appUser;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}
