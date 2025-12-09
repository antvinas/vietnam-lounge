import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  query, 
  orderBy, 
  getCountFromServer,
  where
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { User } from "../types/user"; // User 타입이 없다면 any로 대체 가능하지만, 가급적 인터페이스 유지

// ── 타입 정의 ──
export interface DashboardStats {
  userCount: number;
  spotCount: number;
  eventCount: number;
}

export interface AdminSpotData {
  id?: string;
  name: string;
  description: string;
  address: string;
  category: string;
  region?: string;
  city?: string;
  images: string[];
  isAdult: boolean; // Day/Night 구분
  createdAt: string;
}

export interface AdminEventData {
  id?: string;
  name: string;
  description: string;
  date: string;
  location: string;
  createdAt: string;
}

// ── 1. 대시보드 통계 ──
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const userSnap = await getCountFromServer(collection(db, "users"));
    const spotSnap = await getCountFromServer(collection(db, "spots"));
    const eventSnap = await getCountFromServer(collection(db, "events"));
    
    return {
      userCount: userSnap.data().count,
      spotCount: spotSnap.data().count,
      eventCount: eventSnap.data().count,
    };
  } catch (e) {
    console.error(e);
    return { userCount: 0, spotCount: 0, eventCount: 0 };
  }
};

// ── 2. 유저 관리 ──
export const getUsers = async (): Promise<User[]> => {
  const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({
    id: d.id,
    name: d.data().displayName || "Unknown",
    email: d.data().email || "",
    avatar: d.data().photoURL || "",
    role: d.data().role || "user",
    status: d.data().status || "active",
    ...d.data()
  } as User));
};

export const updateUserRole = async (userId: string, newRole: "admin" | "user") => {
  await updateDoc(doc(db, "users", userId), { role: newRole });
};

export const updateUserStatus = async (userId: string, newStatus: "active" | "banned") => {
  await updateDoc(doc(db, "users", userId), { status: newStatus });
};

export const deleteUser = async (userId: string) => {
  await deleteDoc(doc(db, "users", userId));
};

// ── 3. 스팟(Day/Night) 관리 ──

// 이미지 업로드 유틸
export const uploadSpotImages = async (files: File[]): Promise<string[]> => {
  const urls: string[] = [];
  for (const file of files) {
    const storageRef = ref(storage, `spots/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);
    urls.push(url);
  }
  return urls;
};

// 스팟 추가 (Daylife & Nightlife 공용)
export const addSpot = async (data: Omit<AdminSpotData, "id" | "createdAt" | "images">, files: File[]) => {
  const imageUrls = await uploadSpotImages(files);
  
  await addDoc(collection(db, "spots"), {
    ...data,
    images: imageUrls,
    rating: 0, // 초기 평점
    reviewCount: 0,
    createdAt: new Date().toISOString(),
  });
};

// 전체 스팟 조회
export const getAllSpots = async () => {
  const q = query(collection(db, "spots"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminSpotData));
};

// 스팟 삭제
export const deleteSpot = async (spotId: string) => {
  await deleteDoc(doc(db, "spots", spotId));
};

// ── 4. 이벤트 관리 ──
export const getEvents = async () => {
  const q = query(collection(db, "events"), orderBy("date", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminEventData));
};

export const addEvent = async (data: Omit<AdminEventData, "id" | "createdAt">) => {
  await addDoc(collection(db, "events"), {
    ...data,
    createdAt: new Date().toISOString(),
  });
};

export const deleteEvent = async (eventId: string) => {
  await deleteDoc(doc(db, "events", eventId));
};