/**
 * 광고주 신청 / 광고 데이터
 */
import { collection, addDoc, getDocs, updateDoc, doc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { db } from "@/config/firebase";

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

export async function fetchSponsorRequests() {
  const q = query(collection(db, "sponsorRequests"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function approveSponsorRequest(requestId: string, untilDate: string) {
  const ref = doc(db, "sponsorRequests", requestId);
  await updateDoc(ref, { status: "approved", sponsorUntil: untilDate });
}

export async function expireSponsor(requestId: string) {
  const ref = doc(db, "sponsorRequests", requestId);
  await updateDoc(ref, { status: "expired" });
}
