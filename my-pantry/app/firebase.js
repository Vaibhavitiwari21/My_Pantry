import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCpufp2OBJIgmuw_h2wa0QIGyJZ51A3vXA",
  authDomain: "my-pantry-4c045.firebaseapp.com",
  projectId: "my-pantry-4c045",
  storageBucket: "my-pantry-4c045.appspot.com",
  messagingSenderId: "235952029505",
  appId: "1:235952029505:web:4587300cc63c38ba5b6bc0",
  measurementId: "G-X24VP70CVH"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
