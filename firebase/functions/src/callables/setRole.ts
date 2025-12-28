// firebase/functions/src/callables/setRole.ts
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

if (admin.apps.length === 0) admin.initializeApp();

type RoleInput = "user" | "admin" | "superAdmin";

type SetRolePayload = {
  /** 우선순위: targetUid */
  targetUid?: string;
  /** ✅ alias 지원: AdminRoleManager가 uid로 보냄 */
  uid?: string;
  /** 또는 email */
  email?: string;
  /** 허용: user | admin | superAdmin (대소문자/언더바/하이픈 허용) */
  role: "user" | "admin" | "superAdmin" | "superadmin" | "super_admin" | "super-admin";
  /** 감사 로그용 */
  reason?: string;
};

function normalizeRole(roleRaw: unknown): RoleInput {
  const r = String(roleRaw || "").toLowerCase().trim();
  if (r === "user") return "user";
  if (r === "admin") return "admin";
  if (r === "superadmin" || r === "super_admin" || r === "super-admin") return "superAdmin";
  throw new functions.https.HttpsError("invalid-argument", "role must be user|admin|superAdmin");
}

function isSuperAdmin(context: functions.https.CallableContext): boolean {
  const token: any = context.auth?.token ?? {};
  return token.superAdmin === true;
}

function isAdminOrSuperAdmin(context: functions.https.CallableContext): boolean {
  const token: any = context.auth?.token ?? {};
  return token.admin === true || token.superAdmin === true || token.isAdmin === true;
}

function parseCsvEmails(raw: string | undefined | null): Set<string> {
  const set = new Set<string>();
  const s = String(raw || "").trim();
  if (!s) return set;
  s.split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean)
    .forEach((x) => set.add(x));
  return set;
}

// ✅ 운영: 서버 환경변수/함수 config로만 bootstrap allowlist 관리
function getBootstrapAllowlist(): Set<string> {
  const cfg: any = functions.config?.() || {};
  const fromConfig =
    cfg?.bootstrap?.super_admin_emails ||
    cfg?.bootstrap?.superadmin_emails ||
    cfg?.bootstrap?.emails;

  const fromEnv =
    process.env.BOOTSTRAP_SUPERADMIN_EMAILS ||
    process.env.BOOTSTRAP_SUPER_ADMIN_EMAILS ||
    process.env.SUPERADMIN_BOOTSTRAP_EMAILS;

  return parseCsvEmails(fromConfig || fromEnv || "");
}

const BOOTSTRAP_DOC = admin.firestore().collection("_system").doc("admin_bootstrap");

async function isBootstrapLocked(): Promise<boolean> {
  const snap = await BOOTSTRAP_DOC.get();
  if (!snap.exists) return false;
  return snap.data()?.locked === true;
}

async function lockBootstrap(actorUid: string, actorEmail: string | null) {
  await BOOTSTRAP_DOC.set(
    {
      locked: true,
      actorUid,
      actorEmail,
      at: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

async function resolveTargetUser(payload: SetRolePayload) {
  const targetUid = (payload.targetUid || payload.uid || "").trim();
  const email = (payload.email || "").trim().toLowerCase();

  if (targetUid) {
    const user = await admin.auth().getUser(targetUid);
    return { uid: user.uid, email: user.email ?? null };
  }

  if (email) {
    const user = await admin.auth().getUserByEmail(email);
    return { uid: user.uid, email: user.email ?? null };
  }

  throw new functions.https.HttpsError("invalid-argument", "uid(targetUid) or email is required");
}

async function getCurrentClaims(uid: string) {
  const user = await admin.auth().getUser(uid);
  const claims = (user.customClaims ?? {}) as Record<string, any>;
  return { user, claims };
}

function buildNextClaims(role: RoleInput, prev: Record<string, any>) {
  const next: Record<string, any> = { ...prev };

  if (role === "user") {
    next.admin = false;
    next.superAdmin = false;
    next.role = "user";
  } else if (role === "admin") {
    next.admin = true;
    next.superAdmin = false;
    next.role = "admin";
  } else {
    next.admin = true; // ✅ superAdmin은 admin 포함
    next.superAdmin = true;
    next.role = "superAdmin";
  }

  // legacy 호환
  next.isAdmin = next.admin === true || next.superAdmin === true;

  return next;
}

export const setRole = functions.https.onCall(async (data: SetRolePayload, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Login required");
  }

  const role = normalizeRole(data?.role);
  const reason = (data?.reason || "").trim() || null;

  const target = await resolveTargetUser(data);
  const targetUid = target.uid;

  const actorUid = context.auth.uid;
  const actorEmail = String((context.auth.token as any)?.email || "").toLowerCase() || null;

  // ✅ Bootstrap 조건: (1) superAdmin 요청, (2) 자기 자신만, (3) 서버 allowlist 이메일, (4) 아직 lock 안 걸림
  const allow = getBootstrapAllowlist();
  const canBootstrap =
    role === "superAdmin" &&
    actorUid === targetUid &&
    !!actorEmail &&
    allow.has(actorEmail) &&
    !(await isBootstrapLocked());

  // 운영 정책: superAdmin만 role 변경 가능
  if (!isSuperAdmin(context) && !canBootstrap) {
    throw new functions.https.HttpsError("permission-denied", "superAdmin only");
  }

  // 자기 자신 superAdmin 해제 방지 (잠금 사고 방지)
  if (actorUid === targetUid && role !== "superAdmin") {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "You cannot remove your own superAdmin. Assign another superAdmin first."
    );
  }

  const { user: targetUser, claims: prevClaims } = await getCurrentClaims(targetUid);
  const prevRole =
    prevClaims?.role ??
    (prevClaims?.superAdmin ? "superAdmin" : prevClaims?.admin || prevClaims?.isAdmin ? "admin" : "user");

  const nextClaims = buildNextClaims(role, prevClaims);
  await admin.auth().setCustomUserClaims(targetUid, nextClaims);

  // (표시용) users/{uid} 업데이트 (권한 판정엔 사용 금지)
  try {
    await admin
      .firestore()
      .collection("users")
      .doc(targetUid)
      .set(
        {
          role: role === "superAdmin" ? "admin" : role,
          roleClaims: role,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: actorUid,
        },
        { merge: true }
      );
  } catch {
    // ignore
  }

  // ✅ bootstrap 성공 시 lock
  if (canBootstrap) {
    await lockBootstrap(actorUid, actorEmail);
  }

  // 감사 로그
  await admin.firestore().collection("admin_audit").add({
    action: "setRole",
    bootstrapped: canBootstrap,
    actorUid,
    actorEmail,
    actorIsAdmin: isAdminOrSuperAdmin(context),
    actorIsSuperAdmin: isSuperAdmin(context),
    targetUid,
    targetEmail: targetUser.email || null,
    prevRole,
    nextRole: role,
    reason,
    prevClaims: {
      admin: prevClaims?.admin ?? false,
      superAdmin: prevClaims?.superAdmin ?? false,
      isAdmin: prevClaims?.isAdmin ?? false,
      role: prevClaims?.role ?? null,
    },
    nextClaims: {
      admin: nextClaims.admin ?? false,
      superAdmin: nextClaims.superAdmin ?? false,
      isAdmin: nextClaims.isAdmin ?? false,
      role: nextClaims.role ?? null,
    },
    at: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { ok: true, targetUid, role, prevRole, bootstrapped: canBootstrap };
});
