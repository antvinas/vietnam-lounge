import * as admin from 'firebase-admin';

// --- Firebase Admin SDK Initialization ---
try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
  console.log('Firebase Admin SDK initialized successfully.');
} catch (error: any) {
  console.error(
    'SDK initialization failed. Please check that GOOGLE_APPLICATION_CREDENTIALS is set correctly.'
  );
  process.exit(1);
}

const db = admin.firestore();

interface Spot {
  name: string;
  description: string;
  address: string;
}

const seedSpots = async () => {
  const spotsCollection = db.collection('spots');
  console.log('Seeding spots...');

  const spots: Spot[] = [
    {
      name: 'Ben Thanh Market',
      description: 'A large marketplace in the center of Ho Chi Minh City, Vietnam. One of the earliest surviving structures in Saigon.',
      address: 'Ben Thanh, District 1, Ho Chi Minh City, Vietnam',
    },
    {
      name: 'Cu Chi Tunnels',
      description: 'An immense network of connecting tunnels located in the Củ Chi District of Ho Chi Minh City (Saigon), Vietnam.',
      address: 'Phu Hiep, Cu Chi, Ho Chi Minh City, Vietnam',
    },
    {
      name: 'War Remnants Museum',
      description: 'A war museum at 28 Vo Van Tan, in District 3, Ho Chi Minh City, Vietnam.',
      address: '28 Vo Van Tan, Ward 6, District 3, Ho Chi Minh City, Vietnam',
    },
    {
        name: 'Hoan Kiem Lake',
        description: 'A freshwater lake in the historical center of Hanoi, the capital city of Vietnam.',
        address: 'Hang Trong, Hoan Kiem, Hanoi, Vietnam',
    },
  ];

  for (const spot of spots) {
    try {
      await spotsCollection.add(spot);
      console.log(`Added spot: ${spot.name}`);
    } catch (error) {
      console.error(`Error adding spot ${spot.name}:`, error);
    }
  }

  console.log('Spot seeding complete.');
};

seedSpots().catch(console.error);
