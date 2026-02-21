// src/lib/firebase.js
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, set, query, orderByChild, limitToLast, get } from 'firebase/database';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDk5QbyeNDIDRLjRVogztRW4HsW20GkUh4",
  authDomain: "ai-project-12198.firebaseapp.com",
  databaseURL: "https://ai-project-12198-default-rtdb.firebaseio.com",
  projectId: "ai-project-12198",
  storageBucket: "ai-project-12198.firebasestorage.app",
  messagingSenderId: "502404077059",
  appId: "1:502404077059:web:1bffe5ee10b15f3478e036",
  measurementId: "G-KDWSQ8YH4J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Reviews functions
export const reviewsRef = ref(database, 'reviews');

export const saveReview = async (reviewData) => {
  try {
    const newReviewRef = push(reviewsRef);
    await set(newReviewRef, {
      ...reviewData,
      createdAt: new Date().toISOString(),
      is_approved: true
    });
    return { success: true, id: newReviewRef.key };
  } catch (error) {
    console.error('Error saving review to Firebase:', error);
    throw error;
  }
};

export const fetchApprovedReviews = async (limit = 10) => {
  try {
    const reviewsQuery = query(
      reviewsRef,
      orderByChild('createdAt'),
      limitToLast(limit)
    );
    
    const snapshot = await get(reviewsQuery);
    const reviews = [];
    
    snapshot.forEach((childSnapshot) => {
      reviews.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });
    
    // ترتيب من الأحدث إلى الأقدم
    return reviews.reverse();
  } catch (error) {
    console.error('Error fetching reviews from Firebase:', error);
    return [];
  }
};

export default database;
