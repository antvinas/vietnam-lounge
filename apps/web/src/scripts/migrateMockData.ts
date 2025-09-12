import { collection, addDoc } from "firebase/firestore";
import { db } from "../lib/firebase"; // Adjust the path as needed

// --- Type Definitions ---
interface Spot {
    name: string;
    description: string;
    address: string;
}

interface Event {
    name: string;
    description: string;
    date: string;
    location: string;
}

interface Nightlife {
    name: string;
    description: string;
    address: string;
    category: string;
}

// --- Mock Data ---
const mockSpots: Spot[] = [
    {
        name: "Ben Thanh Market",
        description: "A large marketplace in the center of Ho Chi Minh City, Vietnam. One of the earliest surviving structures in Saigon.",
        address: "Ben Thanh, District 1, Ho Chi Minh City, Vietnam",
    },
    {
        name: "Cu Chi Tunnels",
        description: "An immense network of connecting tunnels located in the Củ Chi District of Ho Chi Minh City (Saigon), Vietnam.",
        address: "Phu Hiep, Cu Chi, Ho Chi Minh City, Vietnam",
    },
    {
        name: "War Remnants Museum",
        description: "A war museum at 28 Vo Van Tan, in District 3, Ho Chi Minh City, Vietnam.",
        address: "28 Vo Van Tan, Ward 6, District 3, Ho Chi Minh City, Vietnam",
    },
];

const mockEvents: Event[] = [
    {
        name: "Saigon International Food Fair",
        description: "Experience a variety of international and local cuisines from top chefs.",
        date: "2024-10-26T10:00:00",
        location: "Le Van Tam Park, District 1, HCMC"
    },
    {
        name: "Ho Chi Minh City International Marathon",
        description: "Annual marathon event attracting runners from all over the world.",
        date: "2024-12-15T04:00:00",
        location: "District 1, Ho Chi Minh City"
    },
];

const mockNightlife: Nightlife[] = [
    {
        name: "Lush Saigon",
        description: "One of the oldest and most popular nightclubs in Ho Chi Minh City.",
        address: "2 Ly Tu Trong, Ben Nghe, District 1, HCMC",
        category: "club"
    },
    {
        name: "Chill Skybar",
        description: "A rooftop bar offering stunning panoramic views of the city skyline.",
        address: "AB Tower, 76A Le Lai, Ben Thanh, District 1, HCMC",
        category: "bar"
    },
    {
        name: "The Rabbit Hole Irish Bar",
        description: "A cozy underground Irish pub with a wide selection of beers.",
        address: "138 Nam Ky Khoi Nghia, Ben Nghe, District 1, HCMC",
        category: "bar"
    }
];

// --- Migration Functions ---

const migrateCollection = async (collectionName: string, data: (Spot | Event | Nightlife)[]) => {
  const collRef = collection(db, collectionName);
  let successCount = 0;

  console.log(`Migrating data to ${collectionName}...`);
  for (const item of data) {
    try {
      await addDoc(collRef, item);
      successCount++;
    } catch (error) {
      console.error(`Error migrating item in ${collectionName}: ${item.name}`, error);
    }
  }
  console.log(`Successfully migrated ${successCount} out of ${data.length} items to ${collectionName}.`);
};


const migrateAll = async () => {
    console.log('Starting data migration...');
    await migrateCollection("spots", mockSpots);
    await migrateCollection("events", mockEvents);
    await migrateCollection("nightlife", mockNightlife);
    console.log('All mock data has been migrated.');
};

// Run the migration
migrateAll().then(() => {
    console.log('Migration process finished successfully.');
    process.exit(0);
}).catch(error => {
    console.error('An error occurred during the migration process:', error);
    process.exit(1);
});
