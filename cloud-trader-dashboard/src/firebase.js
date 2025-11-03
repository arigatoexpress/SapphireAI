import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
const isConfigValid = Object.values(firebaseConfig).every((value) => typeof value === 'string' && value.trim().length > 0);
let app = null;
let auth = null;
let googleProvider = null;
let firebaseError = null;
if (isConfigValid) {
    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        googleProvider = new GoogleAuthProvider();
    }
    catch (error) {
        firebaseError = 'Failed to initialise Firebase';
        if (import.meta.env.DEV) {
            console.warn('[firebase]', firebaseError, error);
        }
    }
}
else {
    firebaseError = 'Firebase configuration missing';
    if (import.meta.env.DEV) {
        console.warn('[firebase]', firebaseError, firebaseConfig);
    }
}
export const firebaseEnabled = Boolean(app && auth && googleProvider);
export const firebaseInitError = firebaseError;
export { auth, googleProvider };
export default app;
