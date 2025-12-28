// firebase/functions/tools/setAdminClaims.mjs
// 사용 예:
// 1) email로 superAdmin 부여
//    node firebase/functions/tools/setAdminClaims.mjs --email admin@your.com --role superadmin
// 2) uid로 admin 부여
//    node firebase/functions/tools/setAdminClaims.mjs --uid xxxxx --role admin

import admin from "firebase-admin";

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--uid") out.uid = args[++i];
    if (a === "--email") out.email = args[++i];
    if (a === "--role") out.role = args[++i];
    if (a === "--project") out.project = args[++i];
  }
  return out;
}

function normalizeRole(roleRaw) {
  const r = String(roleRaw || "admin").toLowerCase();
  if (r === "superadmin" || r === "super_admin") return "superadmin";
  if (r === "admin") return "admin";
  if (r === "user") return "user";
  throw new Error(`Invalid --role: ${roleRaw} (admin|superadmin|user)`);
}

function buildClaims(role) {
  if (role === "user") {
    return { role: "user", admin: false, isAdmin: false, superAdmin: false };
    }
  if (role === "admin") {
    return { role: "admin", admin: true, isAdmin: true, superAdmin: false };
  }
  // superadmin
  return { role: "admin", admin: true, isAdmin: true, superAdmin: true };
}

async function main() {
  const { uid, email, role: roleRaw, project } = parseArgs();
  const role = normalizeRole(roleRaw);

  if (!uid && !email) {
    throw new Error("Provide --uid or --email");
  }

  // Admin SDK init
  if (admin.apps.length === 0) {
    // 로컬/CI는 GOOGLE_APPLICATION_CREDENTIALS 필요
    // Firebase CLI 인증 환경이면 applicationDefault로 잡힘
    admin.initializeApp(
      project
        ? { projectId: project }
        : undefined
    );
  }

  let targetUid = uid;
  if (!targetUid) {
    const u = await admin.auth().getUserByEmail(String(email));
    targetUid = u.uid;
  }

  const user = await admin.auth().getUser(String(targetUid));
  const existing = user.customClaims || {};

  const nextClaims = {
    ...existing,
    ...buildClaims(role),
  };

  // role/admin/isAdmin/superAdmin은 덮어씀
  await admin.auth().setCustomUserClaims(String(targetUid), nextClaims);

  // Firestore users/{uid}도 같이 맞춰서 (프론트 보정/검색용)
  await admin.firestore().collection("users").doc(String(targetUid)).set(
    {
      role: nextClaims.role,
      admin: nextClaims.admin,
      isAdmin: nextClaims.isAdmin,
      superAdmin: nextClaims.superAdmin,
      email: user.email || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  // 적용 즉시 반영 강제(보안적으로도 권장)
  await admin.auth().revokeRefreshTokens(String(targetUid));

  console.log("✅ DONE");
  console.log({ targetUid, email: user.email, role, claims: nextClaims });
  console.log("⚠️ 대상 유저는 로그아웃/로그인 또는 토큰 강제 갱신이 필요합니다.");
}

main().catch((e) => {
  console.error("❌ FAILED:", e?.message || e);
  process.exit(1);
});
