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

interface Board {
  name: string;
  description: string;
}

const seedBoards = async () => {
  const boardsCollection = db.collection('boards');
  console.log('Seeding boards...');

  const boards: Board[] = [
    {
      name: 'Travel Tips',
      description: 'Share and find tips for traveling in Vietnam.',
    },
    {
      name: 'Food & Restaurants',
      description: 'Discuss the best food and restaurants in Vietnam.',
    },
    {
      name: 'Accommodation',
      description: 'Recommendations for hotels, hostels, and other places to stay.',
    },
  ];

  for (const board of boards) {
    try {
      await boardsCollection.add(board);
      console.log(`Added board: ${board.name}`);
    } catch (error) {
      console.error(`Error adding board ${board.name}:`, error);
    }
  }

  console.log('Board seeding complete.');
};

seedBoards().catch(console.error);
