import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  projectId: "orthopedic-follow-app",
  appId: "1:192242963646:web:da9559c2002d3204afbaef",
  storageBucket: "orthopedic-follow-app.firebasestorage.app",
  apiKey: "AIzaSyAsulAzqIQx52uC9vLuU4Fs_hmsTVhBnPc",
  authDomain: "orthopedic-follow-app.firebaseapp.com",
  messagingSenderId: "192242963646",
  measurementId: "G-678MJNB5DJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
