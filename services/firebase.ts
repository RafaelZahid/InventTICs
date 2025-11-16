import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDQuxdiil-yhdRoQYf8yAPMB0khRRXILbU",
  authDomain: "inventics-94ad0.firebaseapp.com",
  projectId: "inventics-94ad0",
  storageBucket: "inventics-94ad0.firebasestorage.app",
  messagingSenderId: "182592417890",
  appId: "1:182592417890:web:c368939fdfafecc409613b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Exporta los servicios que usarás en tu aplicación
export const auth = getAuth(app);
export const db = getFirestore(app);
