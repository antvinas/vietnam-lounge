// src/features/Sponsor/api/sponsor.api.ts
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "@/lib/firebase";

const API_BASE: string = (import.meta as any).env?.VITE_API_BASE_URL || "/api";

function joinUrl(base: string, path: string) {
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

async function authedFetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const user = getAuth().currentUser;
  if (!user) throw new Error("Not authenticated");
  const token = await user.getIdToken();

  const url = joinUrl(API_BASE, path);
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...(init?.headers ? (init.headers as Record<string, string>) : {}),
  };
  if (init?.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";

  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const j = await res.json();
      if (j?.error) msg = String(j.error);
    } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

/**
 * 광고주 신청 폼 전송 (User)
 */
export async function submitSponsorRequest(form: {
  businessName: string;
  ownerName: string;
  contactEmail: string;
  contactPhone?: string;
  spotId?: string;
  sponsorLevel: "banner" | "slider" | "infeed";
  message?: string;
}) {
  const ref = collection(db, "sponsorRequests");
  await addDoc(ref, { ...form, status: "pending", createdAt: serverTimestamp() });
  return { success: true };
}

/**
 * 광고 신청 목록 조회 (Admin) - ✅ admin router로 통일
 */
export async function fetchSponsorRequests(status: "all" | "pending" | "approved" | "expired" = "all") {
  return await authedFetchJson<any[]>(`/admin/sponsors/requests?status=${encodeURIComponent(status)}`);
}

/**
 * 광고 통계 조회 (Admin) - ✅ admin router + 토큰 포함
 */
export async function fetchSponsorStats(days = 30) {
  return await authedFetchJson<any[]>(`/admin/sponsors/stats?days=${encodeURIComponent(String(days))}`);
}

/**
 * 광고 승인 (Admin)
 */
export async function approveSponsorRequest(requestId: string, untilDate: string) {
  return await authedFetchJson<{ ok: boolean }>(`/admin/sponsors/requests/${encodeURIComponent(requestId)}/approve`, {
    method: "POST",
    body: JSON.stringify({ untilDate }),
  });
}

/**
 * 광고 강제 종료 (Admin)
 */
export async function expireSponsor(requestId: string) {
  return await authedFetchJson<{ ok: boolean }>(`/admin/sponsors/requests/${encodeURIComponent(requestId)}/expire`, {
    method: "POST",
  });
}
