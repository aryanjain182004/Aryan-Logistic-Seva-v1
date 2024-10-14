// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc } from "firebase/firestore"; // Import Firestore functions
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"; // Import Auth functions
import { getAnalytics } from "firebase/analytics"; // Import Analytics

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBpM4k1GtX0JOSxfj8DpyhnPPla9Gb4MxI",
    authDomain: "logistic-app-d0009.firebaseapp.com",
    projectId: "logistic-app-d0009",
    storageBucket: "logistic-app-d0009.appspot.com",
    messagingSenderId: "435480514385",
    appId: "1:435480514385:web:e5eb535828224360d88d70",
    measurementId: "G-9K0LMETM7F"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Auth
const db = getFirestore(app); // Initialize Firestore
const auth = getAuth(app); // Initialize Auth

// Optional: Initialize Analytics (remove if not used)
const analytics = getAnalytics(app);

// Export the db and auth instances along with auth functions
export { db, auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, collection, getDocs, addDoc }; // Export necessary functions
