// apps/web/src/api/plan.api.ts
// CRUD + 메모 확장 + updatedAt=serverTimestamp 유지
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/config/firebase";

export type ChecklistItem = { id: string; text: string; done: boolean };

export type PlanItem = {
  id: string;
  type: "place" | "move" | "note";
  title: string;
  start?: string; // ISO
  end?: string; // ISO
  location?: { lat: number; lng: number };
  cost?: number;
  // 확장 메모 필드
  notesHtml?: string;
  images?: string[];
  checklist?: ChecklistItem[];
  tags?: string[];
  meta?: Record<string, unknown>;
  // 이동 정보
  mode?: "walk" | "transit" | "grab";
  etaMin?: number;
  distanceKm?: number;
};

export type Plan = {
  id: string;
  ownerId: string;
  title: string;
  dateRange?: { start: string; end: string };
  schedule: PlanItem[];
  budget?: {
    currency: string;
    total: number;
    byCategory?: Record<string, number>;
  };
  city?: string;
  country?: string;
  nightMode?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type CreatePlanInput = Omit<Plan, "id" | "createdAt" | "updatedAt">;
export type UpdatePlanInput = { planId: string } & Partial<CreatePlanInput>;

const PLANS = "plans";

export async function getUserPlans(uid?: string): Promise<Plan[]> {
  if (!uid) return [];
  const q = query(
    collection(db, PLANS),
    where("ownerId", "==", uid),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Plan, "id">) }));
}

export async function getPlanById(planId: string): Promise<Plan | null> {
  const ref = doc(db, PLANS, planId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<Plan, "id">) };
}

export async function createPlan(data: CreatePlanInput): Promise<string> {
  const ref = await addDoc(collection(db, PLANS), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updatePlan(input: UpdatePlanInput): Promise<void> {
  const { planId, ...patch } = input;
  const ref = doc(db, PLANS, planId);
  await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() });
}

export async function deletePlan(planId: string): Promise<void> {
  await deleteDoc(doc(db, PLANS, planId));
}
