// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAes56LIY2c2dYaYfMmDC1XO0mV7zUwRa0",
  authDomain: "vietnam-lounge.firebaseapp.com",
  projectId: "vietnam-lounge",
  storageBucket: "vietnam-lounge.appspot.com",
  messagingSenderId: "979462787131",
  appId: "1:979462787131:web:fe4f964949fccfe2478c1e",
  measurementId: "G-9YM6EHPQE3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Connect to emulators if in development mode
if (import.meta.env.DEV) {
  console.log("Development mode: Connecting to Firebase emulators.");
  connectAuthEmulator(auth, "http://localhost:9099");
  connectFirestoreEmulator(db, 'localhost', 8080);
}

export { app, auth, db, storage };
