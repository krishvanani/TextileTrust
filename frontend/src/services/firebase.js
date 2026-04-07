// Firebase Client SDK Configuration
import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB9gygMqZTUf7JdJVc0H4_NcyR18ggCmWs",
  authDomain: "texotrust.firebaseapp.com",
  projectId: "texotrust",
  storageBucket: "texotrust.firebasestorage.app",
  messagingSenderId: "261225342961",
  appId: "1:261225342961:web:92d672a82a2be61fa28650",
  measurementId: "G-0P4360V535"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Force reCAPTCHA language to English
auth.languageCode = 'en';

/**
 * Sets up an invisible reCAPTCHA verifier on the given button element.
 * Call this before sending OTP.
 */
const setupRecaptcha = (elementId) => {
  // Clear any previous verifier
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch {
      // ignore cleanup errors
    }
    window.recaptchaVerifier = null;
  }

  window.recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved — will proceed with sendOTP
    },
    'expired-callback': () => {
      // Reset reCAPTCHA if it expires
      console.log('reCAPTCHA expired. Please try again.');
    }
  });

  return window.recaptchaVerifier;
};

/**
 * Send OTP to the given phone number.
 * @param {string} phoneNumber — Must include country code, e.g. "+919876543210"
 * @returns {Promise<ConfirmationResult>}
 */
const sendOTP = async (phoneNumber) => {
  const appVerifier = window.recaptchaVerifier;
  if (!appVerifier) {
    throw new Error('reCAPTCHA not initialized. Call setupRecaptcha first.');
  }
  const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
  return confirmationResult;
};

/**
 * After OTP is verified via confirmationResult.confirm(code),
 * get the Firebase ID token to send to backend.
 */
const getFirebaseIdToken = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('No authenticated Firebase user');
  }
  return await currentUser.getIdToken(true);
};

/**
 * Sign out the Firebase user (cleanup after registration)
 */
const firebaseSignOut = async () => {
  try {
    await auth.signOut();
  } catch {
    // ignore
  }
};

export { auth, setupRecaptcha, sendOTP, getFirebaseIdToken, firebaseSignOut };
export default app;
