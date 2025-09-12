import * as admin from 'firebase-admin';

// --- Firebase Admin SDK Initialization ---
// This script requires a Firebase service account to interact with your project.
// 1. Go to your Firebase project settings -> Service accounts.
// 2. Click "Generate new private key" and save the JSON file securely.
// 3. Set the GOOGLE_APPLICATION_CREDENTIALS environment variable to the file path.
// 
// Example (Linux/macOS):
// export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/serviceAccountKey.json"
// 
// Example (Windows PowerShell):
// $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\your\serviceAccountKey.json"

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

const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

const migrateSlugs = async () => {
  const spotsCollection = db.collection('spots');
  console.log('Starting slug migration for spots...');

  try {
    const snapshot = await spotsCollection.get();
    if (snapshot.empty) {
      console.log('No documents found in spots collection.');
      return;
    }

    let migratedCount = 0;
    for (const doc of snapshot.docs) {
      const spot = doc.data();
      const name = spot.name;

      if (name && !spot.slug) {
        const slug = generateSlug(name);
        await doc.ref.update({ slug });
        console.log(`Migrated spot: ${name} -> ${slug}`);
        migratedCount++;
      }
    }

    console.log(`Slug migration complete. Migrated ${migratedCount} documents.`);
  } catch (error) {
    console.error('Error during slug migration:', error);
  }
};

migrateSlugs().catch(console.error);
