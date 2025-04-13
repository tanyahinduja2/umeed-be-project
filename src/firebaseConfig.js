import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAX7HNnbX3wFBjPkblXyX-x7xqP4k5gyEw",
  authDomain: "umeed-be-project.firebaseapp.com",
  projectId: "umeed-be-project",
  storageBucket: "umeed-be-project.firebasestorage.app",
  messagingSenderId: "876616642344",
  appId: "1:876616642344:web:71f8918d5de47261f62a1d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
export const db = getFirestore(app);

export { auth, provider, signInWithPopup };
