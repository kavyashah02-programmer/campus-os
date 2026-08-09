import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBZUZn5yOdwZKeuFEZV-sOtsJYig2_tuZY",
  authDomain: "student-dashboard-app-8ba0b.firebaseapp.com",
  projectId: "student-dashboard-app-8ba0b",
  storageBucket: "student-dashboard-app-8ba0b.firebasestorage.app",
  messagingSenderId: "795363800861",
  appId: "1:795363800861:web:c66d5d374cd2fe48efd3f4",
  measurementId: "G-KW5W2DVFEZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Auth and Database so other files can use them
export const auth = getAuth(app);
export const db = getFirestore(app);