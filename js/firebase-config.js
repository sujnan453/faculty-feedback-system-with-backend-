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
    addDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA6Nr81548vWJiEPdltuIFtNyEpwc0RjcE",
    authDomain: "faculty-feedback-system-f4a83.firebaseapp.com",
    projectId: "faculty-feedback-system-f4a83",
    storageBucket: "faculty-feedback-system-f4a83.firebasestorage.app",
    messagingSenderId: "784604808754",
    appId: "1:784604808754:web:6035f842b92ae5bdda5e2b"
};

// Initialize Firebase
let app;
let db;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log('✅ Firebase initialized successfully');
    console.log('📊 Using Firestore Database');
} catch (error) {
    console.error('❌ Firebase initialization error:', error);
    throw error;
}

// Export Firestore utilities
export {
    db,
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
    addDoc
};