import * as admin from 'firebase-admin';

export const seedEvents = async (db: admin.firestore.Firestore) => {
  console.log("🚀 Seeding Events...");
  
  const events = [
    {
      name: "Danang International Fireworks Festival",
      description: "세계 각국의 불꽃놀이 팀이 참가하는 다낭 최대의 축제.",
      imageUrl: "https://images.unsplash.com/photo-1533230125150-5d1338dd0106?q=80&w=1000",
      date: "2024-06-08",
      endDate: new Date("2024-06-08T23:59:59"),
      location: "Han River Port",
      city: "Da Nang",
      category: "Festival",
      isAdult: false // 일반 이벤트
    },
    {
      name: "Phu Quoc Full Moon Party",
      description: "푸꾸옥 해변에서 즐기는 광란의 풀문 파티! (성인 전용)",
      imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1000",
      date: "2024-05-01",
      endDate: new Date("2024-05-01T04:00:00"),
      location: "Sunset Sanato",
      city: "Phu Quoc",
      category: "Nightlife",
      isAdult: true // 성인 이벤트
    }
  ];

  const batch = db.batch();

  for (const event of events) {
    // 성인/일반 구분하여 다른 컬렉션에 넣거나, 하나의 컬렉션에서 필드로 구분
    // 여기서는 가이드대로 컬렉션 분리 예시:
    const colName = event.isAdult ? 'adult_events' : 'events';
    const ref = db.collection(colName).doc();
    batch.set(ref, {
      ...event,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();
  console.log(`✅ ${events.length} Events inserted.`);
};