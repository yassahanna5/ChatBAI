// src/lib/firebase.js
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, set, query, orderByChild, limitToLast, get, remove, update } from 'firebase/database';

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

// ==================== Reviews Functions ====================
export const reviewsRef = ref(database, 'reviews');
console.log('🔥 Reviews ref path:', reviewsRef.toString());

export const saveReview = async (reviewData) => {
  console.log('📤 Attempting to save review to Firebase...');
  console.log('📤 Review data received:', reviewData);
  console.log('📤 Reviews ref path:', reviewsRef.toString());
  
  try {
    const newReviewRef = push(reviewsRef);
    console.log('📤 New review key generated:', newReviewRef.key);
    
    const dataToSave = {
      user_name: reviewData.user_name || 'Anonymous',
      job_title: reviewData.job_title || 'User',
      rating: reviewData.rating || 5,
      review_text: reviewData.review_text || '',
      user_email: reviewData.user_email || 'anonymous@example.com',
      createdAt: new Date().toISOString(),
      is_approved: true
    };
    
    console.log('📤 Data to save:', dataToSave);
    
    const requiredFields = ['user_name', 'job_title', 'rating', 'review_text', 'user_email', 'createdAt'];
    const missingFields = requiredFields.filter(field => !dataToSave.hasOwnProperty(field));
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    await set(newReviewRef, dataToSave);
    console.log('✅ Review saved successfully! ID:', newReviewRef.key);
    
    return { success: true, id: newReviewRef.key };
  } catch (error) {
    console.error('❌ Firebase error details:', error);
    throw error;
  }
};

export const fetchApprovedReviews = async (limit = 10) => {
  console.log('📥 Fetching approved reviews from Firebase...');
  try {
    const snapshot = await get(reviewsRef);
    
    console.log('📥 Snapshot exists:', snapshot.exists());
    console.log('📥 Snapshot size:', snapshot.size);
    
    const reviews = [];
    
    snapshot.forEach((childSnapshot) => {
      const review = childSnapshot.val();
      console.log('📥 Found review:', childSnapshot.key, review);
      
      if (review.is_approved === true || review.is_approved === 'true') {
        reviews.push({
          id: childSnapshot.key,
          ...review
        });
      }
    });
    
    console.log('📥 Total approved reviews found:', reviews.length);
    
    // ترتيب يدوي حسب createdAt (من الأحدث إلى الأقدم)
    const sortedReviews = reviews.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateB - dateA;
    });
    
    // أخذ آخر limit تقييم
    const limitedReviews = sortedReviews.slice(0, limit);
    
    console.log('📥 Returning reviews:', limitedReviews);
    return limitedReviews;
    
  } catch (error) {
    console.error('❌ Error fetching reviews from Firebase:', error);
    return [];
  }
};

// ==================== Profiles Functions ====================
export const profilesRef = ref(database, 'profiles');
console.log('🔥 Profiles ref path:', profilesRef.toString());

// دالة لحفظ ملف شخصي جديد (Register)
export const saveProfile = async (profileData) => {
  console.log('👤 Attempting to save profile to Firebase...');
  console.log('👤 Profile data received:', profileData);
  console.log('👤 Profiles ref path:', profilesRef.toString());
  
  try {
    // التحقق من أن الايميل غير مسجل مسبقاً
    const existingProfile = await getProfileByEmail(profileData.email);
    if (existingProfile) {
      throw new Error('Email already exists');
    }
    
    const newProfileRef = push(profilesRef);
    console.log('👤 New profile key generated:', newProfileRef.key);
    
    // تحديد إذا كان هذا هو حساب الأدمن
    const isAdmin = profileData.email.toLowerCase() === 'admin2030@gmail.com';
    
    const dataToSave = {
      email: profileData.email,
      password: profileData.password,
      full_name: profileData.full_name,
      phone: profileData.phone || '',
      gender: profileData.gender || '',
      role: isAdmin ? 'admin' : 'user', // إضافة حقل الدور
      business_name: profileData.business_name || '',
      business_type: profileData.business_type || '',
      industry: profileData.industry || '',
      country: profileData.country || '',
      city: profileData.city || '',
      company_size: profileData.company_size || '',
      website: profileData.website || '',
      monthly_budget: profileData.monthly_budget || '',
      target_audience: profileData.target_audience || '',
      current_challenges: profileData.current_challenges || '',
      goals: profileData.goals || '',
      competitors: profileData.competitors || '',
      social_platforms: profileData.social_platforms || '',
      createdAt: new Date().toISOString(),
      lastLogin: null
    };
    
    console.log('👤 Data to save:', dataToSave);
    
    await set(newProfileRef, dataToSave);
    console.log('✅ Profile saved successfully! ID:', newProfileRef.key);
    
    return { 
      success: true, 
      id: newProfileRef.key,
      email: profileData.email,
      full_name: profileData.full_name,
      role: dataToSave.role
    };
    
  } catch (error) {
    console.error('❌ Firebase error details:', error);
    throw error;
  }
};

// دالة لجلب ملف شخصي بالبريد الإلكتروني
export const getProfileByEmail = async (email) => {
  console.log('🔍 Checking if email exists:', email);
  try {
    const snapshot = await get(profilesRef);
    
    if (!snapshot.exists()) {
      console.log('🔍 No profiles found');
      return null;
    }
    
    let foundProfile = null;
    
    snapshot.forEach((childSnapshot) => {
      const profile = childSnapshot.val();
      if (profile.email && profile.email.toLowerCase() === email.toLowerCase()) {
        foundProfile = {
          id: childSnapshot.key,
          ...profile
        };
      }
    });
    
    console.log('🔍 Email check result:', foundProfile ? 'Found' : 'Not found');
    return foundProfile;
    
  } catch (error) {
    console.error('❌ Error checking email:', error);
    throw error;
  }
};

// دالة لجلب كل الملفات الشخصية (للوحة التحكم)
export const getAllProfiles = async () => {
  console.log('👥 Fetching all profiles...');
  try {
    const snapshot = await get(profilesRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const profiles = [];
    snapshot.forEach((childSnapshot) => {
      const profile = childSnapshot.val();
      profiles.push({
        id: childSnapshot.key,
        ...profile
      });
    });
    
    console.log('👥 Total profiles found:', profiles.length);
    return profiles;
    
  } catch (error) {
    console.error('❌ Error fetching profiles:', error);
    return [];
  }
};

// دالة لتسجيل الدخول
export const signInWithEmail = async (email, password) => {
  console.log('🔑 Attempting to sign in with email:', email);
  try {
    const snapshot = await get(profilesRef);
    
    if (!snapshot.exists()) {
      console.log('🔑 No profiles found');
      return { success: false, error: 'Invalid email or password' };
    }
    
    let foundProfile = null;
    
    snapshot.forEach((childSnapshot) => {
      const profile = childSnapshot.val();
      if (profile.email && profile.email.toLowerCase() === email.toLowerCase()) {
        foundProfile = {
          id: childSnapshot.key,
          ...profile
        };
      }
    });
    
    if (!foundProfile) {
      console.log('🔑 Email not found');
      return { success: false, error: 'Invalid email or password' };
    }
    
    // التحقق من كلمة المرور
    if (foundProfile.password !== password) {
      console.log('🔑 Password incorrect');
      return { success: false, error: 'Invalid email or password' };
    }
    
    console.log('✅ Sign in successful for:', email);
    
    // تحديث آخر تسجيل دخول
    try {
      const profileRef = ref(database, `profiles/${foundProfile.id}`);
      await update(profileRef, {
        lastLogin: new Date().toISOString()
      });
    } catch (updateError) {
      console.warn('⚠️ Could not update last login:', updateError);
    }
    
    // إزالة كلمة المرور من البيانات المرتجعة للأمان
    const { password: _, ...safeProfile } = foundProfile;
    
    return { 
      success: true, 
      profile: safeProfile
    };
    
  } catch (error) {
    console.error('❌ Sign in error:', error);
    return { success: false, error: error.message };
  }
};

// ==================== Admin Dashboard Functions ====================

// Plans CRUD
export const plansRef = ref(database, 'plans');

export const getAllPlans = async () => {
  try {
    const snapshot = await get(plansRef);
    if (!snapshot.exists()) return [];
    
    const plans = [];
    snapshot.forEach((childSnapshot) => {
      plans.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });
    return plans;
  } catch (error) {
    console.error('Error fetching plans:', error);
    return [];
  }
};

export const createPlan = async (planData) => {
  try {
    const newPlanRef = push(plansRef);
    const dataToSave = {
      ...planData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await set(newPlanRef, dataToSave);
    return { success: true, id: newPlanRef.key };
  } catch (error) {
    console.error('Error creating plan:', error);
    throw error;
  }
};

export const updatePlan = async (planId, planData) => {
  try {
    const planRef = ref(database, `plans/${planId}`);
    const dataToSave = {
      ...planData,
      updatedAt: new Date().toISOString()
    };
    await update(planRef, dataToSave);
    return { success: true };
  } catch (error) {
    console.error('Error updating plan:', error);
    throw error;
  }
};

export const deletePlan = async (planId) => {
  try {
    const planRef = ref(database, `plans/${planId}`);
    await remove(planRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting plan:', error);
    throw error;
  }
};

// Subscriptions CRUD
export const subscriptionsRef = ref(database, 'subscriptions');

export const getAllSubscriptions = async () => {
  try {
    const snapshot = await get(subscriptionsRef);
    if (!snapshot.exists()) return [];
    
    const subscriptions = [];
    snapshot.forEach((childSnapshot) => {
      subscriptions.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });
    return subscriptions;
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return [];
  }
};

export const createSubscription = async (subscriptionData) => {
  try {
    const newSubRef = push(subscriptionsRef);
    const dataToSave = {
      ...subscriptionData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await set(newSubRef, dataToSave);
    return { success: true, id: newSubRef.key };
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
};

export const updateSubscription = async (subId, subData) => {
  try {
    const subRef = ref(database, `subscriptions/${subId}`);
    const dataToSave = {
      ...subData,
      updatedAt: new Date().toISOString()
    };
    await update(subRef, dataToSave);
    return { success: true };
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
};

export const deleteSubscription = async (subId) => {
  try {
    const subRef = ref(database, `subscriptions/${subId}`);
    await remove(subRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting subscription:', error);
    throw error;
  }
};

// Payments CRUD
export const paymentsRef = ref(database, 'payments');

export const getAllPayments = async () => {
  try {
    const snapshot = await get(paymentsRef);
    if (!snapshot.exists()) return [];
    
    const payments = [];
    snapshot.forEach((childSnapshot) => {
      payments.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });
    return payments;
  } catch (error) {
    console.error('Error fetching payments:', error);
    return [];
  }
};

export const createPayment = async (paymentData) => {
  try {
    const newPaymentRef = push(paymentsRef);
    const dataToSave = {
      ...paymentData,
      createdAt: new Date().toISOString()
    };
    await set(newPaymentRef, dataToSave);
    return { success: true, id: newPaymentRef.key };
  } catch (error) {
    console.error('Error creating payment:', error);
    throw error;
  }
};

export const updatePayment = async (paymentId, paymentData) => {
  try {
    const paymentRef = ref(database, `payments/${paymentId}`);
    await update(paymentRef, paymentData);
    return { success: true };
  } catch (error) {
    console.error('Error updating payment:', error);
    throw error;
  }
};

export const deletePayment = async (paymentId) => {
  try {
    const paymentRef = ref(database, `payments/${paymentId}`);
    await remove(paymentRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting payment:', error);
    throw error;
  }
};

// Activity Logs
export const activityLogsRef = ref(database, 'activity_logs');

export const logActivity = async (activityData) => {
  try {
    const newLogRef = push(activityLogsRef);
    const dataToSave = {
      ...activityData,
      timestamp: new Date().toISOString()
    };
    await set(newLogRef, dataToSave);
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

export const getActivityLogs = async (limit = 50) => {
  try {
    const snapshot = await get(activityLogsRef);
    if (!snapshot.exists()) return [];
    
    const logs = [];
    snapshot.forEach((childSnapshot) => {
      logs.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });
    
    // ترتيب من الأحدث
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return [];
  }
};

// دالة لجلب إحصائيات لوحة التحكم
export const getAdminStats = async () => {
  try {
    const profiles = await getAllProfiles();
    const payments = await getAllPayments();
    const subscriptions = await getAllSubscriptions();
    const plans = await getAllPlans();
    const reviews = await fetchApprovedReviews(100);
    
    // حساب إجمالي المدفوعات
    const totalPayments = payments.reduce((sum, payment) => {
      return sum + (parseFloat(payment.amount) || 0);
    }, 0);
    
    // الخطط النشطة
    const activePlans = plans.filter(plan => plan.is_active === true || plan.is_active === 'true').length;
    
    // الاشتراكات النشطة
    const activeSubscriptions = subscriptions.filter(sub => 
      sub.status === 'active' || sub.status === 'Active'
    ).length;
    
    return {
      totalUsers: profiles.length,
      totalPayments: totalPayments.toFixed(2),
      activePlans: activePlans,
      activeSubscriptions: activeSubscriptions,
      totalReviews: reviews.length,
      totalVisits: 135, // ده ثابت مؤقتاً، ممكن تجيبه من analytics
      uniqueVisitors: profiles.length, // تقريباً
      avgVisitDuration: '4m 32s' // ثابت مؤقتاً
    };
  } catch (error) {
    console.error('Error getting admin stats:', error);
    return {
      totalUsers: 0,
      totalPayments: 0,
      activePlans: 0,
      activeSubscriptions: 0,
      totalReviews: 0,
      totalVisits: 0,
      uniqueVisitors: 0,
      avgVisitDuration: '0m 0s'
    };
  }
};

export default database;
