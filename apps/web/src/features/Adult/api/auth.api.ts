// apps/web/src/features/Adult/api/auth.api.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  FacebookAuthProvider,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/config/firebase";
import type { LoginCredentials, RegisterCredentials, SocialProvider } from "../types/auth.types";
import type { User } from "@/types/user";

export type RegisterParams = {
  name: string;
  email: string;
  password: string;
};

// ✅ Firestore /users/{uid} 문서는 "프로필"만 저장
function buildUserDocPayload(firebaseUser: FirebaseUser, nickname?: string) {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email ?? "",
    displayName: nickname ?? firebaseUser.displayName ?? null,
    nickname: nickname ?? firebaseUser.displayName ?? null,
    photoURL: firebaseUser.photoURL ?? null,
    phoneNumber: firebaseUser.phoneNumber ?? null,
    providerId: firebaseUser.providerData?.[0]?.providerId ?? "password",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  };
}

const ensureUserDoc = async (firebaseUser: FirebaseUser) => {
  const userDocRef = doc(db, "users", firebaseUser.uid);
  const snap = await getDoc(userDocRef);

  if (!snap.exists()) {
    await setDoc(userDocRef, buildUserDocPayload(firebaseUser), { merge: true });
  } else {
    await setDoc(
      userDocRef,
      { lastLoginAt: serverTimestamp(), updatedAt: serverTimestamp() },
      { merge: true }
    );
  }
};

const mapUser = async (firebaseUser: FirebaseUser): Promise<User> => {
  const userDocRef = doc(db, "users", firebaseUser.uid);
  const userSnapshot = await getDoc(userDocRef);
  const userData = userSnapshot.exists() ? userSnapshot.data() : {};

  return {
    id: firebaseUser.uid,
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,

    nickname: (userData as any)?.nickname || firebaseUser.displayName || undefined,
    role: (userData as any)?.role || "user",
    status: (userData as any)?.status || "active",
    isAgeVerified: (userData as any)?.isAgeVerified || false,

    phoneNumber: (userData as any)?.phoneNumber ?? firebaseUser.phoneNumber ?? null,
    providerId: (userData as any)?.providerId ?? firebaseUser.providerData?.[0]?.providerId,

    createdAt: (userData as any)?.createdAt,
    lastLoginAt: (userData as any)?.lastLoginAt,

    ...(userData as any),
  };
};

export const authApi = {
  login: async (credentials: LoginCredentials) => {
    const { email, password } = credentials;
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    await ensureUserDoc(userCredential.user);

    const user = await mapUser(userCredential.user);
    const token = await userCredential.user.getIdToken();
    return { user, token };
  },

  register: async (credentials: RegisterCredentials) => {
    const { email, password, nickname } = credentials;
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    await updateProfile(userCredential.user, { displayName: nickname });

    await setDoc(doc(db, "users", userCredential.user.uid), buildUserDocPayload(userCredential.user, nickname), {
      merge: true,
    });

    const user: User = {
      id: userCredential.user.uid,
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: nickname,
      photoURL: null,
      nickname,
      role: "user",
      status: "active",
      isAgeVerified: false,
      providerId: "password",
    };

    const token = await userCredential.user.getIdToken();
    return { user, token };
  },

  loginWithSocial: async (provider: SocialProvider) => {
    const authProvider = provider === "google" ? new GoogleAuthProvider() : new FacebookAuthProvider();
    const userCredential = await signInWithPopup(auth, authProvider);

    await ensureUserDoc(userCredential.user);

    const user = await mapUser(userCredential.user);
    const token = await userCredential.user.getIdToken();
    return { user, token };
  },

  logout: async () => {
    await signOut(auth);
  },

  getCurrentUser: async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;

    await ensureUserDoc(currentUser);
    return mapUser(currentUser);
  },
};

export const loginUser = (credentials: LoginCredentials) => authApi.login(credentials);

export const registerUser = (params: RegisterParams) =>
  authApi.register({
    email: params.email,
    password: params.password,
    nickname: params.name,
  });

export const loginWithSocial = (provider: SocialProvider) => authApi.loginWithSocial(provider);
