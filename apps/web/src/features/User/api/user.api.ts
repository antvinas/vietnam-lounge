import { doc, getDoc, updateDoc, collection, query, where, getDocs, deleteDoc, arrayRemove } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile, deleteUser } from "firebase/auth";
import { db, auth, storage } from "@/lib/firebase";

// ── 타입 정의 ──
export interface UserProfile {
  id: string;
  nickname: string;
  email: string;
  avatar?: string;
  bio?: string;
  grade?: string;
  joinDate?: string;
  role?: string;
}

export interface FavoriteSpot {
  id: string;
  name: string;
  address?: string;
  category?: string;
  image?: string;
  mode: 'explorer' | 'nightlife';
}

export interface UserProfileUpdateParams {
  nickname: string;
  bio?: string;
  avatar?: string;
}

export interface Coupon {
  id: string;
  title: string;
  description: string;
  expiryDate: string;
  isUsed: boolean;
  type: 'discount' | 'free' | 'vip'; 
  discountRate?: number;
  spotName?: string;
}

export interface UserActivitySummary {
  couponCount: number;
  favoriteCount: number;
  reviewCount: number;
  nextGradeProgress: number;
  nextGradeName: string;
}

const DEFAULT_AVATAR = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

// ── API 함수들 ──

// 1. 내 프로필 가져오기
export const getUserProfile = async (): Promise<UserProfile | null> => {
  const user = auth.currentUser;
  if (!user) return null;

  const docRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    const displayGrade = data.role === 'admin' ? 'ADMINISTRATOR' : (data.grade || "Explorer");
    
    // ✅ 이름이 없으면 이메일 ID 부분 사용
    const fallbackName = user.email ? user.email.split('@')[0] : "Guest";

    return {
      id: user.uid,
      nickname: data.displayName || user.displayName || fallbackName, 
      email: user.email || "",
      avatar: data.photoURL || user.photoURL || DEFAULT_AVATAR,
      bio: data.bio || "베트남의 밤을 즐기는 여행자",
      grade: displayGrade,
      joinDate: data.createdAt ? data.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
      role: data.role || "user"
    };
  }
  return null;
};

// 2. 프로필 수정
export const updateUserProfile = async (params: UserProfileUpdateParams): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error("로그인이 필요합니다.");

  await updateProfile(user, {
    displayName: params.nickname,
    photoURL: params.avatar
  });

  const updates: any = {
    displayName: params.nickname,
    bio: params.bio,
  };
  if (params.avatar) updates.photoURL = params.avatar;

  await updateDoc(doc(db, "users", user.uid), updates);
};

// 3. 이미지 업로드
export const uploadProfileImage = async (file: File): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error("로그인이 필요합니다.");

  const storageRef = ref(storage, `profile_images/${user.uid}_${Date.now()}`);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
};

// 4. 관심 장소
export const getMyFavorites = async (): Promise<FavoriteSpot[]> => {
  const user = auth.currentUser;
  if (!user) return [];

  const userDoc = await getDoc(doc(db, "users", user.uid));
  const favoriteIds: string[] = userDoc.data()?.favorites || [];

  if (favoriteIds.length === 0) return [];

  try {
    const spotsRef = collection(db, "spots");
    const q = query(spotsRef, where("__name__", "in", favoriteIds.slice(0, 10)));
    const querySnapshot = await getDocs(q);

    const spots: FavoriteSpot[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      spots.push({
        id: doc.id,
        name: data.name,
        address: data.address || data.location || "Vietnam",
        category: data.category,
        image: data.images?.[0] || "",
        mode: data.isAdult ? 'nightlife' : 'explorer',
      });
    });
    return spots;
  } catch (e) {
    console.error("찜 목록 로드 실패:", e);
    return []; 
  }
};

// 5. 찜 삭제
export const removeFavorite = async (spotId: string): Promise<boolean> => {
  const user = auth.currentUser;
  if (!user) return false;

  const userRef = doc(db, "users", user.uid);
  try {
    await updateDoc(userRef, {
      favorites: arrayRemove(spotId)
    });
    return true;
  } catch (e) {
    console.error("찜 삭제 실패:", e);
    return false;
  }
};

// 6. 탈퇴
export const withdrawUser = async (): Promise<boolean> => {
  const user = auth.currentUser;
  if (!user) return false;
  try {
    await deleteDoc(doc(db, "users", user.uid));
    await deleteUser(user);
    return true;
  } catch (error) {
    console.error("탈퇴 실패:", error);
    throw error;
  }
};

// 7. 활동 요약 (Mock)
export const getUserActivitySummary = async (): Promise<UserActivitySummary> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        couponCount: 0,
        favoriteCount: 0,
        reviewCount: 2, // Mock 개수
        nextGradeProgress: 10,
        nextGradeName: "Insider"
      });
    }, 400);
  });
};

// 8. 쿠폰 (Mock)
export const getMyCoupons = async (): Promise<Coupon[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: "c1", title: "가입 환영 쿠폰", description: "10% 할인", expiryDate: "2024.12.31", isUsed: false, type: "discount", spotName: "System" },
      ]);
    }, 500);
  });
};