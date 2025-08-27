// src/services/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; // 1. Adicione esta linha

const firebaseConfig = {
    apiKey: "AIzaSyAh4RSV0gQ1KL9-Pmu-AJ9PE5s8mLIvthw",
    authDomain: "acai-sabor-da-terra.firebaseapp.com",
    projectId: "acai-sabor-da-terra",
    storageBucket: "acai-sabor-da-terra.appspot.com",
    messagingSenderId: "251748448639",
    appId: "1:251748448639:web:af23fa70969dfdadb6024a"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app); // 2. Adicione esta linha