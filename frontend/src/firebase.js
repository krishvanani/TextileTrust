import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// HARDCODED CONFIG FOR TESTING ONLY
// This GUARANTEES the React app is sending the exact string to Firebase, 
// completely bypassing any Vite `.env` caching bugs.
const firebaseConfig = {
  apiKey: "AIzaSyB3zoaaYxH7MAnV8lW1Y72tMcf0V5sym88",
  authDomain: "texotrust-v2.firebaseapp.com",
  projectId: "texotrust-v2",
  storageBucket: "texotrust-v2.firebasestorage.app",
  messagingSenderId: "963807949211",
  appId: "1:963807949211:web:308e3e4b3d38e0eb52b13e",
  measurementId: "G-D5KZF6H11E"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
