import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase"; // ✅ Firestore 초기화 (apps/web/src/lib/firebase.ts)

// ================== 타입 정의 ==================
export interface ScheduleItem {
  id: string;
  time: string;
  place: string;
  memo: string;
}

export interface Plan {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  schedule: ScheduleItem[];
  createdAt?: any;
  updatedAt?: any;
}

export interface PlanUpdateData extends Partial<Omit<Plan, "id">> {
  planId: string;
}

// ================== CRUD 함수 ==================

/**
 * Fetches all travel plans for the current user.
 */
export const getUserPlans = async (): Promise<Plan[]> => {
  const snap = await getDocs(collection(db, "plans"));
  return snap.docs.map(
    (docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Plan)
  );
};

/**
 * Fetches a single travel plan by its ID.
 */
export const getPlanById = async (planId: string): Promise<Plan> => {
  const ref = doc(db, "plans", planId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    throw new Error("Plan not found");
  }
  return { id: snap.id, ...snap.data() } as Plan;
};

/**
 * Creates a new travel plan.
 */
export const createPlan = async (
  planData: Omit<Plan, "id">
): Promise<Plan> => {
  const ref = await addDoc(collection(db, "plans"), {
    ...planData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const snap = await getDoc(ref);
  return { id: snap.id, ...snap.data() } as Plan;
};

/**
 * Updates an existing travel plan.
 */
export const updatePlan = async (
  updateData: PlanUpdateData
): Promise<Plan> => {
  const { planId, ...data } = updateData;
  const ref = doc(db, "plans", planId);

  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });

  const snap = await getDoc(ref);
  return { id: snap.id, ...snap.data() } as Plan;
};
