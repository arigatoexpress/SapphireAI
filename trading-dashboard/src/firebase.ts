// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyC60XD3QEdZdLFisXsGekrwIF66I0uh-Jo",
    authDomain: "sapphire-479610.firebaseapp.com",
    projectId: "sapphire-479610",
    storageBucket: "sapphire-479610.firebasestorage.app",
    messagingSenderId: "267358751314",
    appId: "1:267358751314:web:4bda7e310604a455d22d8b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
