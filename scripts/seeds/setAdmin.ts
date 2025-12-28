// scripts/setAdmin.ts
import * as admin from "firebase-admin";
import * as path from "path";
import * as fs from "fs";

type Role = "user" | "admin" | "superAdmin";

function normalizeRole(raw: string | undefined): Role {
  const r = String(raw || "").toLowerCase().trim();
  if (r === "user") return "user";
  if (r === "admin") return "admin";
  if (r === "superadmin" || r === "super_admin" || r === "super-admin" || r === "superadmin") return "superAdmin";
  if (r === "superadmin" || r === "superadmin") return "superAdmin";
  if (r === "superadmin") return "superAdmin";
  if (r === "superadmin") return "superAdmin";
  if (r === "superadmin") return "superAdmin";
  if (r === "superadmin") return "superAdmin";
  // allow exact
  if (raw === "superAdmin") return "superAdmin";
  throw new Error(`Invalid role: ${raw}. Use user|admin|superAdmin`);
}

function buildClaims(role: Role, prev: Record<string, any>) {
  const next = { ...prev };

  if (role === "user") {
    next.admin = false;
    next.superAdmin = false;
    next.role = "user";
  } else if (role === "admin") {
    next.admin = true;
    next.superAdmin = false;
    next.role = "admin";
  } else {
    next.admin = true;
    next.superAdmin = true;
    next.role = "superAdmin";
  }

  return next;
}

// ✅ 사용법:
// 1) serviceAccountKey.json 을 프로젝트 루트에 둔다
// 2) ts-node로 실행:
//    npx ts-node scripts/setAdmin.ts admin@vnlounge.com superAdmin
//
// 또는 환경변수로도 가능:
//    TARGET_EMAIL=admin@vnlounge.com TARGET_ROLE=superAdmin npx ts-node scripts/setAdmin.ts
const argEmail = process.argv[2];
const argRole = process.argv[3];

const TARGET_EMAIL = (process.env.TARGET_EMAIL || argEmail || "").trim();
const TARGET_ROLE = normalizeRole(process.env.TARGET_ROLE || argRole || "superAdmin");

if (!TARGET_EMAIL) {
  console.error("❌ TARGET_EMAIL is required.");
  console.error("👉 Usage: npx ts-node scripts/setAdmin.ts <email> <role>");
  console.error("   role: user | admin | superAdmin");
  process.exit(1);
}

// ✅ 서비스 계정 키 파일 경로
const serviceAccountPath = path.resolve(__dirname, "../serviceAccountKey.json");

if (!fs.existsSync(serviceAccountPath)) {
  console.error("❌ [Error] serviceAccountKey.json 파일을 찾을 수 없습니다.");
  console.error("👉 프로젝트 루트 폴더에 Firebase 서비스 계정 키를 위치시켜 주세요.");
  console.error(`   Expected: ${serviceAccountPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

async function grantRoleByEmail(email: string, role: Role) {
  const auth = admin.auth();
  const db = admin.firestore();

  console.log(`\n🔎 Target: ${email}`);
  console.log(`🎯 Role: ${role}`);

  const user = await auth.getUserByEmail(email);
  const prevClaims = (user.customClaims ?? {}) as Record<string, any>;
  const nextClaims = buildClaims(role, prevClaims);

  // ✅ Custom Claims 적용
  await auth.setCustomUserClaims(user.uid, nextClaims);

  // ✅ Firestore 표시용 업데이트 (권한 판정에는 사용하지 않음)
  try {
    await db
      .collection("users")
      .doc(user.uid)
      .set(
        {
          email: user.email ?? email,
          role: role === "superAdmin" ? "admin" : role, // UI 호환
          roleClaims: role,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: "bootstrap-script",
        },
        { merge: true }
      );
  } catch (e) {
    console.warn("⚠️ [Warning] users 문서 업데이트 실패(무시 가능):", e);
  }

  // ✅ 감사 로그
  try {
    await db.collection("admin_audit").add({
      action: "bootstrapRole",
      actorUid: "bootstrap-script",
      actorEmail: null,
      targetUid: user.uid,
      targetEmail: user.email ?? email,
      prevClaims: {
        admin: prevClaims?.admin ?? false,
        superAdmin: prevClaims?.superAdmin ?? false,
        role: prevClaims?.role ?? null,
      },
      nextClaims: {
        admin: nextClaims.admin ?? false,
        superAdmin: nextClaims.superAdmin ?? false,
        role: nextClaims.role ?? null,
      },
      role,
      at: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (e) {
    console.warn("⚠️ [Warning] admin_audit 로그 적재 실패(무시 가능):", e);
  }

  console.log(`\n✅ Done. ${email} => ${role}`);
  console.log("ℹ️ 로그인 중이었다면, 해당 계정은 로그아웃/로그인(또는 토큰 갱신) 후 claims가 반영됩니다.");
}

grantRoleByEmail(TARGET_EMAIL, TARGET_ROLE)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ [Error] Role bootstrap failed:", err);
    process.exit(1);
  });
