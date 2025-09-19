
import * as admin from 'firebase-admin';
import { spots } from './data/spots'; // Reverted back to original import

// Initialize Firebase Admin SDK
// When FIRESTORE_EMULATOR_HOST is set, the Admin SDK automatically connects to the emulator.
// No credentials are needed for the emulator.
console.log('Attempting to initialize Firebase Admin SDK...');
if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log(`Found FIRESTORE_EMULATOR_HOST: ${process.env.FIRESTORE_EMULATOR_HOST}`);
    // Check if the app is already initialized to prevent errors on hot-reloads
    if (!admin.apps.length) {
        admin.initializeApp({
            projectId: 'vietnam-lounge-471209', // Use the correct project ID for emulator
        });
        console.log('✅ Initialized Admin SDK in EMULATOR mode.');
    }
} else {
    console.error('PRODUCTION MODE: Service account not configured. Seeding is only supported for emulators in this setup.');
    process.exit(1);
}

const db = admin.firestore();

const seedSpots = async () => {
  console.log('🌱 Seeding spots...');
  const spotsCollection = db.collection('spots');

  for (const spot of spots) {
    try {
      const docRef = spotsCollection.doc(spot.id);
      await docRef.set(spot);
      console.log(`✅ Added spot: ${spot.name}`);
    } catch (error) {
      console.error(`❌ Error adding spot ${spot.name}:`, error);
    }
  }

  console.log('🎉 Spot seeding complete.');
};

seedSpots().then(() => {
  console.log('Seeding finished, exiting...');
  process.exit(0);
}).catch(error => {
  console.error('Unhandled error during seeding:', error);
  process.exit(1);
});
