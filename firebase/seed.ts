import * as admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";
import * as path from "path";

if (!admin.apps.length) {
  // 🔑 루트에 있는 serviceAccountKey.json 사용
  const serviceAccount = require(path.resolve(__dirname, "../serviceAccountKey.json"));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id, // ✅ Project ID 강제 지정
  });
}

const db = admin.firestore();

async function seed() {
  try {
    const now = admin.firestore.Timestamp.now();

    // 🔹 카테고리 더미 데이터
    const categories = [
      "여행이야기",
      "동행모임",
      "맛집후기",
      "스파후기",
      "Q&A",
      "꿀팁노트",
      "자유",
    ];

    for (const name of categories) {
      await db.collection("community_categories").doc(uuidv4()).set({
        name,
        createdAt: now,
      });
    }

    // 🔹 게시글 더미 데이터
    const posts = [
      {
        title: "📌 공지사항: 베트남 라운지에 오신 걸 환영합니다!",
        content: "여기는 베트남 여행자들을 위한 커뮤니티 공간입니다. 규칙을 꼭 확인해주세요.",
        category: "공지사항",
        isNotice: true,
        isPinned: true,
      },
      {
        title: "다낭 3박 4일 여행 후기",
        content: "다낭 해변은 너무 예뻤습니다. 바나힐 꼭 가보세요!",
        category: "여행이야기",
      },
      {
        title: "호치민 맛집 추천",
        content: "분짜 맛집 발견! 진짜 현지인 느낌 가득합니다.",
        category: "맛집후기",
      },
      {
        title: "유심 구매 꿀팁",
        content: "공항보다 시내에서 사는 게 훨씬 저렴합니다.",
        category: "꿀팁노트",
      },
    ];

    for (const post of posts) {
      await db.collection("community_posts").doc(uuidv4()).set({
        ...post,
        authorName: "운영자",
        authorId: "seed_admin",
        avatar: "",
        region: "전체 지역",
        likes: 0,
        commentsCount: 0,
        viewCount: 0,
        upVotes: 0,
        downVotes: 0,
        segment: "general", // ✅ API랑 맞추기
        createdAt: now,
        updatedAt: now,
      });
    }

    console.log("✅ Seed data inserted successfully with segment!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  }
}

seed();
