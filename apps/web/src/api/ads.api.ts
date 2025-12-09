/**
 * 광고 로그 API
 */
import { collection, addDoc, serverTimestamp, getDocs, orderBy, query, limit } from "firebase/firestore";
import { auth, db } from "@/config/firebase";

const ADS_LOG_COLLECTION = "ads_logs";

async function writeLog(type: "view" | "click", spotId: string, sponsorLevel?: string) {
  try {
    await addDoc(collection(db, ADS_LOG_COLLECTION), {
      type,
      spotId,
      sponsorLevel: sponsorLevel || null,
      userId: auth.currentUser?.uid || null,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
      referrer: document.referrer || null,
    });
  } catch (err) {
    console.error(`[ads.api] ${type} log error:`, err);
  }
}

export async function logSponsorView(spotId: string, sponsorLevel?: string) {
  await writeLog("view", spotId, sponsorLevel);
}

export async function logSponsorClick(spotId: string, sponsorLevel?: string) {
  await writeLog("click", spotId, sponsorLevel);
}

export async function getRecentAdLogs(limitCount = 50) {
  try {
    const q = query(collection(db, ADS_LOG_COLLECTION), orderBy("timestamp", "desc"), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("getRecentAdLogs error:", err);
    return [];
  }
}
