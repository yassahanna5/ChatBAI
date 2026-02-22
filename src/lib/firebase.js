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
console.log('🔥 Firebase config:', firebaseConfig);
const app = initializeApp(firebaseConfig);
console.log('🔥 Firebase app initialized:', app);

const database = getDatabase(app);
console.log('🔥 Database URL:', database._repo?.info_?.databaseURL || 'URL not available');

// Reviews functions
export const reviewsRef = ref(database, 'reviews');
console.log('🔥 Reviews ref path:', reviewsRef.toString());

export const saveReview = async (reviewData) => {
  console.log('📤 Attempting to save review to Firebase...');
  console.log('📤 Review data received:', reviewData);
  console.log('📤 Reviews ref path:', reviewsRef.toString());
  
  try {
    const newReviewRef = push(reviewsRef);
    console.log('📤 New review key generated:', newReviewRef.key);
    
    // التأكد من أن جميع الحقول المطلوبة موجودة
    const dataToSave = {
      user_name: reviewData.user_name || 'Anonymous',
      job_title: reviewData.job_title || 'User',
      rating: reviewData.rating || 5,
      review_text: reviewData.review_text || '',
      user_email: reviewData.user_email || 'anonymous@example.com',
      createdAt: new Date().toISOString(),  // هذا هو المطلوب في القواعد
      is_approved: true  // هذا حقل إضافي
    };
    
    console.log('📤 Data to save:', dataToSave);
    console.log('📤 Data keys:', Object.keys(dataToSave));
    
    // التحقق من وجود جميع الحقول المطلوبة
    const requiredFields = ['user_name', 'job_title', 'rating', 'review_text', 'user_email', 'createdAt'];
    const missingFields = requiredFields.filter(field => !dataToSave.hasOwnProperty(field));
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    await set(newReviewRef, dataToSave);
    console.log('✅ Review saved successfully! ID:', newReviewRef.key);
    
    return { success: true, id: newReviewRef.key };
  } catch (error) {
    console.error('❌ Firebase error details:');
    console.error('❌ Error message:', error.message);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Full error object:', error);
    
    // رسالة خطأ مخصصة
    if (error.code === 'PERMISSION_DENIED') {
      throw new Error('صلاحية الوصول مرفوضة. تأكد من قواعد قاعدة البيانات');
    } else if (error.code === 'NETWORK_ERROR') {
      throw new Error('خطأ في الشبكة. تأكد من اتصالك بالإنترنت');
    } else {
      throw error;
    }
  }
};

export const fetchApprovedReviews = async (limit = 10) => {
  console.log('📥 Fetching approved reviews from Firebase...');
  try {
    const reviewsQuery = query(
      reviewsRef,
      orderByChild('createdAt'),
      limitToLast(limit)
    );
    
    console.log('📥 Query created');
    const snapshot = await get(reviewsQuery);
    console.log('📥 Snapshot exists:', snapshot.exists());
    console.log('📥 Snapshot size:', snapshot.size);
    
    const reviews = [];
    
    snapshot.forEach((childSnapshot) => {
      console.log('📥 Found review:', childSnapshot.key, childSnapshot.val());
      reviews.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });
    
    console.log('📥 Total reviews found:', reviews.length);
    // ترتيب من الأحدث إلى الأقدم
    const reversed = reviews.reverse();
    console.log('📥 Returning reviews:', reversed);
    return reversed;
    
  } catch (error) {
    console.error('❌ Error fetching reviews from Firebase:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error code:', error.code);
    return [];
  }
};

export default database;
