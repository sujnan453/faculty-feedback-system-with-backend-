/**
 * Firebase Configuration and Initialization
 * Provides Firestore Database connection for Faculty Feedback System
 */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    addDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Firebase configuration - NEW DATABASE
const firebaseConfig = {
    apiKey: "AIzaSyDeGUGOcI4feLdhBIeEyiW8sT7wdh410Zk",
    authDomain: "faculty-feedback-system-3fdff.firebaseapp.com",
    projectId: "faculty-feedback-system-3fdff",
    storageBucket: "faculty-feedback-system-3fdff.firebasestorage.app",
    messagingSenderId: "300532791766",
    appId: "1:300532791766:web:c3ac24897824e0b814cc77"
};

// Initialize Firebase
let app;
let db;
let auth;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    console.log('✅ Firebase initialized successfully');
    console.log('📊 Using Firestore Database');
    console.log('🔐 Firebase Authentication enabled');
} catch (error) {
    console.error('❌ Firebase initialization error:', error);
    throw error;
}

// Export Firestore utilities
export {
    db,
    auth,
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    addDoc,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail
};