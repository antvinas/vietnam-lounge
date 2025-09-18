import { createRequire } from "module";
import admin from "firebase-admin";

// ✅ JSON을 안전하게 import (ESM + ts-node 호환)
const require = createRequire(import.meta.url);
const serviceAccount = require("../../serviceAccountKey.json");

try {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase Admin SDK initialized with Service Account");
  }
} catch (error) {
  console.error("❌ SDK initialization failed:", error);
  process.exit(1);
}

const db = admin.firestore();

interface Spot {
  name: string;
  description: string;
  address: string;
  rating: number;
  imageUrl: string;
}

const seedSpots = async () => {
  const spotsCollection = db.collection("spots");
  console.log("🌱 Seeding spots...");

  const spots: Spot[] = [
    {
      name: "Ben Thanh Market",
      description:
        "A large marketplace in the center of Ho Chi Minh City, Vietnam. One of the earliest surviving structures in Saigon.",
      address: "Ben Thanh, District 1, Ho Chi Minh City, Vietnam",
      rating: 4.2,
      imageUrl: "https://picsum.photos/400/300?random=1",
    },
    {
      name: "Cu Chi Tunnels",
      description:
        "An immense network of connecting tunnels located in the Củ Chi District of Ho Chi Minh City (Saigon), Vietnam.",
      address: "Phu Hiep, Cu Chi, Ho Chi Minh City, Vietnam",
      rating: 4.7,
      imageUrl: "https://picsum.photos/400/300?random=2",
    },
    {
      name: "War Remnants Museum",
      description:
        "A war museum at 28 Vo Van Tan, in District 3, Ho Chi Minh City, Vietnam.",
      address: "28 Vo Van Tan, Ward 6, District 3, Ho Chi Minh City, Vietnam",
      rating: 4.5,
      imageUrl: "https://picsum.photos/400/300?random=3",
    },
    {
      name: "Hoan Kiem Lake",
      description:
        "A freshwater lake in the historical center of Hanoi, the capital city of Vietnam.",
      address: "Hang Trong, Hoan Kiem, Hanoi, Vietnam",
      rating: 4.6,
      imageUrl: "https://picsum.photos/400/300?random=4",
    },
  ];

  for (const spot of spots) {
    try {
      await spotsCollection.add(spot);
      console.log(`✅ Added spot: ${spot.name}`);
    } catch (error) {
      console.error(`❌ Error adding spot ${spot.name}:`, error);
    }
  }

  console.log("🎉 Spot seeding complete.");
};

seedSpots().catch(console.error);
