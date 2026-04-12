import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCxzEn_TSLnk7TQAGwLyYMiEsEJUZ9jCcI",
  authDomain: "noisewatch-dadea.firebaseapp.com",
  projectId: "noisewatch-dadea",
  databaseURL: "https://noisewatch-dadea-default-rtdb.firebaseio.com",
  storageBucket: "noisewatch-dadea.firebasestorage.app",
  messagingSenderId: "110446670194",
  appId: "1:110446670194:web:fd6e85b3cc2b8b013eadeb",
  measurementId: "G-QFQSQKLSRF"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const storage = getStorage(app);

// Initialize analytics conditionally
let analytics = null;
isSupported().then(yes => {
  if (yes) analytics = getAnalytics(app);
});

export { app, db, storage, analytics };
