import * as admin from 'firebase-admin';
import * as path from 'path';
import { seedEvents } from './events';
import { seedSpots } from './spots';
// import { seedPlans } from './plans'; // 나중에 추가

// 🔑 서비스 계정 키 로드 (경로 주의: scripts/seeds/ -> ../../serviceAccountKey.json)
const serviceAccount = require(path.resolve(__dirname, '../../../serviceAccountKey.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function runSeeds() {
  try {
    console.log("🌱 Starting Database Seed...");
    
    // 원하는 시딩 작업만 주석 해제해서 사용 가능
    await seedEvents(db);
    await seedSpots(db);
    // await seedPlans(db);

    console.log("✨ All seeds completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    process.exit(1);
  }
}

runSeeds();