import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBy6dShreKNYjPLUUTWYowHMJvxD_Gb6QQ",
  authDomain: "calendar-20c9f.firebaseapp.com",
  projectId: "calendar-20c9f",
  storageBucket: "calendar-20c9f.firebasestorage.app",
  messagingSenderId: "632657042224",
  appId: "1:632657042224:web:fb32c807b64999256d46f5",
  measurementId: "G-P7HQZJZ0DT"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
