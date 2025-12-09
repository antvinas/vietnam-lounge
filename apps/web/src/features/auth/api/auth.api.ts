import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  updateProfile, 
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
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

// ✅ 슈퍼 어드민 이메일 정의
const SUPER_ADMIN_EMAIL = "admin@vnlounge.com";

// 1. 이메일 회원가입
export const registerUser = async ({ email, password, name }: RegisterParams): Promise<AuthResponse> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await updateProfile(user, { displayName: name });

  // 가입 시 슈퍼 어드민 체크
  const initialRole = email === SUPER_ADMIN_EMAIL ? "admin" : "user";

  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email: user.email,
    displayName: name,
    grade: "Explorer",
    role: initialRole,
    photoURL: user.photoURL || "",
    createdAt: new Date().toISOString(),
    favorites: [] 
  });

  return {
    user: {
      uid: user.uid,
      email: user.email,
      displayName: name,
      photoURL: user.photoURL,
      role: initialRole,
    },
  };
};

// 2. 이메일 로그인 (✅ 여기가 수정되었습니다!)
export const loginUser = async ({ email, password }: Omit<RegisterParams, "name">): Promise<AuthResponse> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  const userDocRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userDocRef);

  let currentRole = "user";

  // Case 1: DB에 유저 정보가 아예 없는 경우 (복구 모드)
  if (!userDoc.exists()) {
    console.log("⚠️ 유저 정보가 DB에 없어 새로 생성합니다.");
    currentRole = user.email === SUPER_ADMIN_EMAIL ? "admin" : "user";
    
    await setDoc(userDocRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || "User",
      photoURL: user.photoURL || "",
      grade: "Explorer",
      role: currentRole,
      createdAt: new Date().toISOString(),
      favorites: []
    });
  } 
  // Case 2: DB는 있는데 관리자 권한이 누락된 경우 (업데이트 모드)
  else {
    const userData = userDoc.data();
    currentRole = userData?.role || "user";

    if (user.email === SUPER_ADMIN_EMAIL && currentRole !== "admin") {
      await updateDoc(userDocRef, { role: "admin" });
      currentRole = "admin";
      console.log("👑 슈퍼 어드민 권한이 복구되었습니다.");
    }
  }

  return {
    user: {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      role: currentRole,
    },
  };
};

// 3. 소셜 로그인
export const loginWithSocial = async (providerName: "google" | "facebook"): Promise<AuthResponse> => {
  const provider = providerName === "google" ? googleProvider : facebookProvider;
  
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    let role = "user";
    if (user.email === SUPER_ADMIN_EMAIL) role = "admin";

    // 없으면 생성
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        grade: "Explorer",
        role: role,
        createdAt: new Date().toISOString(),
        favorites: []
      });
    } else {
      // 있으면 권한 체크 후 업데이트
      const existingData = userSnap.data();
      if (user.email === SUPER_ADMIN_EMAIL && existingData.role !== "admin") {
        await updateDoc(userRef, { role: "admin" });
        role = "admin";
      } else {
        role = existingData.role || "user";
      }
    }

    return {
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: role,
      },
    };
  } catch (error) {
    console.error("Social Login Error:", error);
    throw error;
  }
};

export const logoutUser = async () => {
  await signOut(auth);
};

export const resetPassword = async (email: string) => {
  await sendPasswordResetEmail(auth, email);
};