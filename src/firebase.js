// firebase.js - Firebase configuration and authentication exports
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { getDatabase } from "firebase/database";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCfQhv5TYbIYlm2Tvu6tf1eeT2zvTxzYlE",
  authDomain: "gearup-typing.firebaseapp.com",
  projectId: "gearup-typing",
  storageBucket: "gearup-typing.firebasestorage.app",
  messagingSenderId: "611913132333",
  appId: "1:611913132333:web:01647ef1a7ad119d45cba4",
  measurementId: "G-2Z4LHZPK72",
  databaseURL: "https://gearup-typing-default-rtdb.firebaseio.com",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Export Firebase instances and auth functions
export {
  app,
  auth,
  database,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
};
