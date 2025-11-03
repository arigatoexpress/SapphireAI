import { type FirebaseApp } from 'firebase/app';
import { GoogleAuthProvider, type Auth } from 'firebase/auth';
declare let app: FirebaseApp | null;
declare let auth: Auth | null;
declare let googleProvider: GoogleAuthProvider | null;
export declare const firebaseEnabled: boolean;
export declare const firebaseInitError: string | null;
export { auth, googleProvider };
export default app;
