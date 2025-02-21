import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDt_1EMRJCaGPL1pSwiV3irf3PYEn_Aqoo",
  authDomain: "btchat-79878.firebaseapp.com",
  projectId: "btchat-79878",
  storageBucket: "btchat-79878.firebasestorage.app",
  messagingSenderId: "350854039852",
  appId: "1:350854039852:web:8840223e9fdf2309814489",
  measurementId: "G-48CG94170G"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);