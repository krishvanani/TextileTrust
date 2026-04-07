const admin = require('firebase-admin');

// Initialize Firebase Admin SDK using environment variables
// On Render, set these env vars from your Firebase Service Account JSON
const serviceAccount = {
  type: 'service_account',
  project_id: process.env.FIREBASE_PROJECT_ID || 'texotrust',
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || '',
  private_key: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL || '',
  client_id: process.env.FIREBASE_CLIENT_ID || '',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: process.env.FIREBASE_CERT_URL || '',
};

// Only initialize if we have proper credentials
let firebaseAdmin = null;

try {
  if (serviceAccount.client_email && serviceAccount.private_key) {
    // Check if already initialized
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    firebaseAdmin = admin;
    console.log('✅ Firebase Admin SDK initialized successfully');
  } else {
    console.warn('⚠️  Firebase Admin SDK credentials not configured. Phone verification will be skipped.');
  }
} catch (error) {
  console.error('❌ Firebase Admin SDK initialization error:', error.message);
}

/**
 * Verify a Firebase ID token and return the decoded token.
 * @param {string} idToken — The Firebase ID token from the client
 * @returns {Promise<object|null>} Decoded token or null if verification fails
 */
const verifyFirebaseToken = async (idToken) => {
  if (!firebaseAdmin) {
    console.warn('Firebase Admin not initialized — skipping token verification');
    return null;
  }

  try {
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Firebase token verification failed:', error.message);
    throw new Error('Invalid phone verification token');
  }
};

module.exports = { verifyFirebaseToken, firebaseAdmin };
