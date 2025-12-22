// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDl1tJJSR9jM-06OputSzTMV0gUXVgZLmE",
  authDomain: "healthvault-96952.firebaseapp.com",
  projectId: "healthvault-96952",
  storageBucket: "healthvault-96952.appspot.com",
  messagingSenderId: "97245933766",
  appId: "1:97245933766:web:719493d8be512ab3f6a7c7"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
