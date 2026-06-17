import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Connection Test
import { doc, getDocFromServer } from 'firebase/firestore';
(async () => {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase: Connected successfully");
  } catch (error) {
    console.error("Firebase: Connection failed", error);
  }
})();
