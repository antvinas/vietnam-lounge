import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  updateProfile, 
  sendPasswordResetEmail
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db, googleProvider, facebookProvider } from "@/lib/firebase";

export interface RegisterParams {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    role?: string;
  };
}

// 1. 이메일 회원가입
export const registerUser = async ({ email, password, name }: RegisterParams): Promise<AuthResponse> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await updateProfile(user, { displayName: name });

  // Firestore에 유저 정보 저장
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email: user.email,
    displayName: name,
    grade: "Explorer",
    role: "user",
    createdAt: new Date().toISOString(),
    favorites: [] // 찜 목록 초기화
  });

  return {
    user: {
      uid: user.uid,
      email: user.email,
      displayName: name,
      photoURL: user.photoURL,
      role: "user",
    },
  };
};

// 2. 이메일 로그인
export const loginUser = async ({ email, password }: Omit<RegisterParams, "name">): Promise<AuthResponse> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  const userDoc = await getDoc(doc(db, "users", user.uid));
  const userData = userDoc.data();

  return {
    user: {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      role: userData?.role || "user",
    },
  };
};

// 3. 소셜 로그인 (구글/페이스북)
export const loginWithSocial = async (providerName: "google" | "facebook"): Promise<AuthResponse> => {
  const provider = providerName === "google" ? googleProvider : facebookProvider;
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  // DB에 유저 정보가 없으면 새로 생성 (최초 로그인 시)
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      grade: "Explorer",
      role: "user",
      createdAt: new Date().toISOString(),
      favorites: []
    });
  }

  return {
    user: {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      role: "user",
    },
  };
};

// 4. 로그아웃
export const logoutUser = async () => {
  await signOut(auth);
};

// 5. 비밀번호 재설정
export const resetPassword = async (email: string) => {
  await sendPasswordResetEmail(auth, email);
};