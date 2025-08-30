import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
if (!admin.apps.length) admin.initializeApp();

export const setUserRole = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Login required");
  const requester = await admin.auth().getUser(context.auth.uid);
  const roles = (requester.customClaims?.roles as string[]) || [];
  if (!roles.includes("admin")) throw new functions.https.HttpsError("permission-denied", "Admin only");

  const { uid, roles: newRoles } = data as { uid: string; roles: string[] };
  await admin.auth().setCustomUserClaims(uid, { roles: newRoles });
  return { ok: true };
});
