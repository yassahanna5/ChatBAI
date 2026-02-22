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
      is_approved: false // Default to pending
    };
    
    console.log('📤 Data to save:', dataToSave);
    
    const requiredFields = ['user_name', 'job_title', 'rating', 'review_text', 'user_email', 'createdAt'];
    const missingFields = requiredFields.filter(field => !dataToSave.hasOwnProperty(field));
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    await set(newReviewRef, dataToSave);
    console.log('✅ Review saved successfully! ID:', newReviewRef.key);
    
    // Create notification for admin about new review
    await createNotification({
      type: 'new_review',
      user_email: 'admin',
      title: {
        en: 'New Review Submitted',
        ar: 'تقييم جديد'
      },
      message: {
        en: `${dataToSave.user_name} submitted a new review`,
        ar: `قام ${dataToSave.user_name} بإرسال تقييم جديد`
      },
      review_id: newReviewRef.key,
      user_name: dataToSave.user_name
    });
    
    return { success: true, id: newReviewRef.key };
  } catch (error) {
    console.error('❌ Firebase error details:', error);
    throw error;
  }
};

// دالة لجلب كل التقييمات (للوحة التحكم)
export const getAllReviews = async () => {
  try {
    const snapshot = await get(reviewsRef);
    if (!snapshot.exists()) return [];
    
    const reviews = [];
    snapshot.forEach((childSnapshot) => {
      reviews.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });
    
    // ترتيب من الأحدث
    return reviews.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateB - dateA;
    });
    
  } catch (error) {
    console.error('Error fetching all reviews:', error);
    return [];
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
      role: isAdmin ? 'admin' : 'user',
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
    
    // Create notification for admin about new user registration
    await createNotification({
      type: 'new_user',
      user_email: 'admin',
      title: {
        en: 'New User Registered',
        ar: 'مستخدم جديد'
      },
      message: {
        en: `${dataToSave.full_name} (${dataToSave.email}) just registered`,
        ar: `قام ${dataToSave.full_name} (${dataToSave.email}) بالتسجيل`
      },
      user_id: newProfileRef.key,
      user_name: dataToSave.full_name,
      user_email: dataToSave.email
    });
    
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

// ==================== Analytics Functions ====================

// دالة لتسجيل زيارة صفحة
export const logPageVisit = async (pagePath, userData = null) => {
  try {
    const visitsRef = ref(database, 'analytics/visits');
    const newVisitRef = push(visitsRef);
    
    // الحصول على معلومات المتصفح
    const userAgent = navigator.userAgent;
    let deviceType = 'Desktop';
    let os = 'Unknown';
    
    // تحديد نوع الجهاز
    if (/mobile/i.test(userAgent)) {
      deviceType = 'Mobile';
    } else if (/tablet/i.test(userAgent)) {
      deviceType = 'Tablet';
    }
    
    // تحديد نظام التشغيل
    if (/windows/i.test(userAgent)) {
      os = 'Windows';
    } else if (/mac/i.test(userAgent)) {
      os = 'macOS';
    } else if (/linux/i.test(userAgent)) {
      os = 'Linux';
    } else if (/android/i.test(userAgent)) {
      os = 'Android';
    } else if (/ios|iphone|ipad|ipod/i.test(userAgent)) {
      os = 'iOS';
    }
    
    // الحصول على الدولة (من API أو localStorage)
    let country = 'Unknown';
    const storedCountry = localStorage.getItem('userCountry');
    if (storedCountry) {
      country = storedCountry;
    } else {
      // محاولة الحصول على الدولة من API
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        country = data.country_name || 'Unknown';
        localStorage.setItem('userCountry', country);
      } catch (e) {
        console.warn('Could not fetch country');
      }
    }
    
    // إنشاء session ID إذا لم يكن موجوداً
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('sessionId', sessionId);
      sessionStorage.setItem('sessionStart', Date.now().toString());
    }
    
    const visitData = {
      page: pagePath,
      timestamp: new Date().toISOString(),
      user_email: userData?.email || 'anonymous',
      device: deviceType,
      os: os,
      country: country,
      session_id: sessionId,
      referrer: document.referrer || 'direct'
    };
    
    await set(newVisitRef, visitData);
    
    // تحديث مدة الجلسة
    await updateSessionDuration(sessionId);
    
  } catch (error) {
    console.error('Error logging page visit:', error);
  }
};

// دالة لتحديث مدة الجلسة
const updateSessionDuration = async (sessionId) => {
  try {
    const sessionStart = sessionStorage.getItem('sessionStart');
    if (!sessionStart) return;
    
    const duration = Math.floor((Date.now() - parseInt(sessionStart)) / 1000); // بالثواني
    
    const sessionsRef = ref(database, 'analytics/sessions');
    const sessionRef = ref(database, `analytics/sessions/${sessionId}`);
    
    const sessionSnapshot = await get(sessionRef);
    
    if (sessionSnapshot.exists()) {
      // تحديث الجلسة الموجودة
      await update(sessionRef, {
        duration: duration,
        last_activity: new Date().toISOString()
      });
    } else {
      // إنشاء جلسة جديدة
      await set(sessionRef, {
        session_id: sessionId,
        start_time: new Date(parseInt(sessionStart)).toISOString(),
        duration: duration,
        last_activity: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('Error updating session duration:', error);
  }
};

// دالة لجلب إحصائيات التحليلات للوحة التحكم
export const getAnalyticsStats = async () => {
  try {
    const visitsRef = ref(database, 'analytics/visits');
    const sessionsRef = ref(database, 'analytics/sessions');
    
    const [visitsSnapshot, sessionsSnapshot] = await Promise.all([
      get(visitsRef),
      get(sessionsRef)
    ]);
    
    const visits = [];
    if (visitsSnapshot.exists()) {
      visitsSnapshot.forEach((child) => {
        visits.push({ id: child.key, ...child.val() });
      });
    }
    
    const sessions = [];
    if (sessionsSnapshot.exists()) {
      sessionsSnapshot.forEach((child) => {
        sessions.push({ id: child.key, ...child.val() });
      });
    }
    
    // إجمالي الزيارات
    const totalVisits = visits.length;
    
    // الزوار الفريدين (حسب الـ session)
    const uniqueSessions = new Set(visits.map(v => v.session_id)).size;
    
    // متوسط مدة الزيارة
    const avgDuration = sessions.length > 0 
      ? Math.floor(sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length)
      : 0;
    
    // تحويل الثواني إلى دقائق وثواني
    const minutes = Math.floor(avgDuration / 60);
    const seconds = avgDuration % 60;
    const avgDurationFormatted = `${minutes}m ${seconds}s`;
    
    // حساب الزيادات مقارنة بالشهر الماضي (محاكاة بسيطة)
    const lastMonthVisits = Math.floor(totalVisits * 0.88);
    const visitIncreasePercent = lastMonthVisits > 0 
      ? Math.round(((totalVisits - lastMonthVisits) / lastMonthVisits) * 100)
      : 12;
    
    const lastMonthUnique = Math.floor(uniqueSessions * 0.92);
    const uniqueIncreasePercent = lastMonthUnique > 0
      ? Math.round(((uniqueSessions - lastMonthUnique) / lastMonthUnique) * 100)
      : 8;
    
    // إحصائيات الدول
    const countries = {};
    visits.forEach(v => {
      if (v.country) {
        countries[v.country] = (countries[v.country] || 0) + 1;
      }
    });
    
    // ترتيب الدول
    const topCountries = Object.entries(countries)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([country, count]) => ({
        country,
        count,
        percentage: Math.round((count / totalVisits) * 100)
      }));
    
    // إحصائيات الأجهزة
    const devices = {};
    visits.forEach(v => {
      if (v.device) {
        devices[v.device] = (devices[v.device] || 0) + 1;
      }
    });
    
    // حساب نسب الأجهزة
    const deviceStats = {};
    Object.entries(devices).forEach(([device, count]) => {
      deviceStats[device] = Math.round((count / totalVisits) * 100);
    });
    
    // إحصائيات أنظمة التشغيل
    const osStats = {};
    visits.forEach(v => {
      if (v.os) {
        osStats[v.os] = (osStats[v.os] || 0) + 1;
      }
    });
    
    // حساب نسب أنظمة التشغيل
    const osPercentages = {};
    Object.entries(osStats).forEach(([os, count]) => {
      osPercentages[os] = Math.round((count / totalVisits) * 100);
    });
    
    // إحصائيات الصفحات
    const pages = {};
    visits.forEach(v => {
      if (v.page) {
        pages[v.page] = (pages[v.page] || 0) + 1;
      }
    });
    
    const pageViews = Object.entries(pages)
      .sort((a, b) => b[1] - a[1])
      .map(([page, count]) => ({ page, count }));
    
    // حساب أعلى نسبة صفحة (للعرض النسبي)
    const maxPageViews = pageViews.length > 0 ? pageViews[0].count : 1;
    const pageViewsWithPercentage = pageViews.map(pv => ({
      ...pv,
      percentage: Math.round((pv.count / maxPageViews) * 100)
    }));
    
    return {
      totalVisits,
      uniqueVisitors: uniqueSessions,
      avgVisitDuration: avgDurationFormatted,
      visitIncrease: visitIncreasePercent,
      uniqueIncrease: uniqueIncreasePercent,
      durationIncrease: 5, // ثابت مؤقتاً
      conversionRate: uniqueSessions > 0 
        ? ((await getAllSubscriptions()).length / uniqueSessions * 100).toFixed(1)
        : 0,
      conversionIncrease: 2, // ثابت مؤقتاً
      topCountries,
      devices: deviceStats,
      osStats: osPercentages,
      pageViews: pageViewsWithPercentage
    };
    
  } catch (error) {
    console.error('Error getting analytics stats:', error);
    return {
      totalVisits: 0,
      uniqueVisitors: 0,
      avgVisitDuration: '0m 0s',
      visitIncrease: 0,
      uniqueIncrease: 0,
      durationIncrease: 0,
      conversionRate: 0,
      conversionIncrease: 0,
      topCountries: [],
      devices: {},
      osStats: {},
      pageViews: []
    };
  }
};

// ==================== Notification System ====================

export const notificationsRef = ref(database, 'notifications');

// دالة لإنشاء إشعار
export const createNotification = async (notificationData) => {
  try {
    const newNotifRef = push(notificationsRef);
    const dataToSave = {
      ...notificationData,
      is_read: false,
      created_at: new Date().toISOString()
    };
    await set(newNotifRef, dataToSave);
    return { success: true, id: newNotifRef.key };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error };
  }
};

// دالة لجلب الإشعارات (للأدمن)
export const getNotifications = async (limit = 50) => {
  try {
    const snapshot = await get(notificationsRef);
    if (!snapshot.exists()) return [];
    
    const notifications = [];
    snapshot.forEach((child) => {
      notifications.push({
        id: child.key,
        ...child.val()
      });
    });
    
    // ترتيب من الأحدث
    return notifications
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting notifications:', error);
    return [];
  }
};

// دالة لتحديث حالة الإشعار (مقروء/غير مقروء)
export const markNotificationAsRead = async (notificationId) => {
  try {
    const notifRef = ref(database, `notifications/${notificationId}`);
    await update(notifRef, { is_read: true });
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false };
  }
};

// دالة لحذف إشعار
export const deleteNotification = async (notificationId) => {
  try {
    const notifRef = ref(database, `notifications/${notificationId}`);
    await remove(notifRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting notification:', error);
    return { success: false };
  }
};

// دالة لجلب عدد الإشعارات غير المقروءة
export const getUnreadNotificationsCount = async () => {
  try {
    const snapshot = await get(notificationsRef);
    if (!snapshot.exists()) return 0;
    
    let count = 0;
    snapshot.forEach((child) => {
      if (!child.val().is_read) count++;
    });
    return count;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

// ==================== Admin Dashboard Functions ====================

// دالة لجلب إحصائيات لوحة التحكم (محدثة بالبيانات الحقيقية)
export const getAdminStats = async () => {
  try {
    // جلب كل البيانات بالتوازي
    const [
      profiles,
      payments,
      subscriptions,
      plans,
      reviews,
      analyticsStats
    ] = await Promise.all([
      getAllProfiles(),
      getAllPayments(),
      getAllSubscriptions(),
      getAllPlans(),
      getAllReviews(),
      getAnalyticsStats()
    ]);
    
    // حساب إجمالي المدفوعات
    const totalPayments = payments.reduce((sum, payment) => {
      return sum + (parseFloat(payment.amount) || 0);
    }, 0);
    
    // الخطط النشطة
    const activePlans = plans.filter(plan => plan.is_active === true).length;
    
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
      
      // Analytics data
      totalVisits: analyticsStats.totalVisits,
      uniqueVisitors: analyticsStats.uniqueVisitors,
      avgVisitDuration: analyticsStats.avgVisitDuration,
      conversionRate: analyticsStats.conversionRate,
      
      // Percentages changes
      visitIncrease: analyticsStats.visitIncrease,
      uniqueIncrease: analyticsStats.uniqueIncrease,
      durationIncrease: analyticsStats.durationIncrease,
      conversionIncrease: analyticsStats.conversionIncrease,
      
      // Detailed analytics
      topCountries: analyticsStats.topCountries,
      devices: analyticsStats.devices,
      osStats: analyticsStats.osStats,
      pageViews: analyticsStats.pageViews
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
      avgVisitDuration: '0m 0s',
      conversionRate: 0,
      visitIncrease: 0,
      uniqueIncrease: 0,
      durationIncrease: 0,
      conversionIncrease: 0,
      topCountries: [],
      devices: {},
      osStats: {},
      pageViews: []
    };
  }
};

// ==================== User Management Functions ====================

// دالة لتحديث دور المستخدم
export const updateUserRole = async (userId, newRole) => {
  try {
    const userRef = ref(database, `profiles/${userId}`);
    await update(userRef, { 
      role: newRole,
      updated_at: new Date().toISOString()
    });
    
    // تسجيل النشاط
    await logActivity({
      action: 'update_user_role',
      user_email: 'admin',
      details: `Updated user ${userId} role to ${newRole}`
    });
    
    // الحصول على بيانات المستخدم
    const userSnapshot = await get(userRef);
    const user = userSnapshot.val();
    
    // إنشاء إشعار للمستخدم
    if (user && user.email) {
      await createNotification({
        type: 'role_updated',
        user_email: user.email,
        title: {
          en: 'Your account role has been updated',
          ar: 'تم تحديث دور حسابك'
        },
        message: {
          en: `Your role is now: ${newRole}`,
          ar: `دورك الآن: ${newRole === 'admin' ? 'مدير' : 'مستخدم'}`
        },
        new_role: newRole
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating user role:', error);
    return { success: false, error };
  }
};

// دالة لإضافة مستخدم جديد (بواسطة الأدمن)
export const addUserByAdmin = async (userData) => {
  try {
    // التحقق من عدم وجود الإيميل مسبقاً
    const existingUser = await getProfileByEmail(userData.email);
    if (existingUser) {
      throw new Error('Email already exists');
    }
    
    const newUserRef = push(profilesRef);
    const dataToSave = {
      email: userData.email,
      password: userData.password,
      full_name: userData.full_name,
      phone: userData.phone || '',
      gender: userData.gender || '',
      role: userData.role || 'user',
      business_name: userData.business_name || '',
      business_type: userData.business_type || '',
      industry: userData.industry || '',
      country: userData.country || '',
      city: userData.city || '',
      company_size: userData.company_size || '',
      website: userData.website || '',
      monthly_budget: userData.monthly_budget || '',
      target_audience: userData.target_audience || '',
      current_challenges: userData.current_challenges || '',
      goals: userData.goals || '',
      competitors: userData.competitors || '',
      social_platforms: userData.social_platforms || '',
      createdAt: new Date().toISOString(),
      lastLogin: null,
      created_by: 'admin'
    };
    
    await set(newUserRef, dataToSave);
    
    // تسجيل النشاط
    await logActivity({
      action: 'create_user',
      user_email: 'admin',
      details: `Created user: ${userData.email}`
    });
    
    // إنشاء إشعار
    await createNotification({
      type: 'user_created_by_admin',
      user_email: 'admin',
      title: {
        en: 'New User Created',
        ar: 'تم إنشاء مستخدم جديد'
      },
      message: {
        en: `User ${userData.full_name} (${userData.email}) was created`,
        ar: `تم إنشاء المستخدم ${userData.full_name} (${userData.email})`
      }
    });
    
    return { success: true, id: newUserRef.key };
    
  } catch (error) {
    console.error('Error adding user by admin:', error);
    return { success: false, error: error.message };
  }
};

// دالة لحذف مستخدم
export const deleteUser = async (userId) => {
  try {
    const userRef = ref(database, `profiles/${userId}`);
    
    // الحصول على بيانات المستخدم قبل الحذف للتسجيل
    const userSnapshot = await get(userRef);
    const user = userSnapshot.val();
    
    await remove(userRef);
    
    // تسجيل النشاط
    await logActivity({
      action: 'delete_user',
      user_email: 'admin',
      details: `Deleted user: ${user?.email || userId}`
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false };
  }
};

// ==================== Plans CRUD (محدث) ====================

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
    
    // التأكد من أن المميزات مصفوفة
    const features_en = Array.isArray(planData.features_en) 
      ? planData.features_en 
      : (planData.features_en || '').split(',').map(f => f.trim()).filter(f => f);
      
    const features_ar = Array.isArray(planData.features_ar) 
      ? planData.features_ar 
      : (planData.features_ar || '').split(',').map(f => f.trim()).filter(f => f);
    
    const dataToSave = {
      name_en: planData.name_en || planData.name || '',
      name_ar: planData.name_ar || planData.name || '',
      price: parseFloat(planData.price) || 0,
      billing_cycle: planData.billing_cycle || 'monthly',
      credits: parseInt(planData.credits) || 0,
      tokens_per_question: parseInt(planData.tokens_per_question) || 500,
      features_en: features_en,
      features_ar: features_ar,
      is_active: planData.is_active !== false,
      order: parseInt(planData.order) || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await set(newPlanRef, dataToSave);
    
    // تسجيل النشاط
    await logActivity({
      action: 'create_plan',
      user_email: 'admin',
      details: `Created plan: ${dataToSave.name_en}`
    });
    
    // إنشاء إشعار
    await createNotification({
      type: 'plan_created',
      user_email: 'admin',
      title: {
        en: 'New Plan Created',
        ar: 'تم إنشاء خطة جديدة'
      },
      message: {
        en: `Plan "${dataToSave.name_en}" was created`,
        ar: `تم إنشاء خطة "${dataToSave.name_ar}"`
      }
    });
    
    return { success: true, id: newPlanRef.key };
  } catch (error) {
    console.error('Error creating plan:', error);
    throw error;
  }
};

export const updatePlan = async (planId, planData) => {
  try {
    const planRef = ref(database, `plans/${planId}`);
    
    // التأكد من أن المميزات مصفوفة
    const features_en = Array.isArray(planData.features_en) 
      ? planData.features_en 
      : (planData.features_en || '').split(',').map(f => f.trim()).filter(f => f);
      
    const features_ar = Array.isArray(planData.features_ar) 
      ? planData.features_ar 
      : (planData.features_ar || '').split(',').map(f => f.trim()).filter(f => f);
    
    const dataToSave = {
      name_en: planData.name_en || planData.name || '',
      name_ar: planData.name_ar || planData.name || '',
      price: parseFloat(planData.price) || 0,
      billing_cycle: planData.billing_cycle || 'monthly',
      credits: parseInt(planData.credits) || 0,
      tokens_per_question: parseInt(planData.tokens_per_question) || 500,
      features_en: features_en,
      features_ar: features_ar,
      is_active: planData.is_active !== false,
      order: parseInt(planData.order) || 0,
      updatedAt: new Date().toISOString()
    };
    
    await update(planRef, dataToSave);
    
    // تسجيل النشاط
    await logActivity({
      action: 'update_plan',
      user_email: 'admin',
      details: `Updated plan: ${dataToSave.name_en}`
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating plan:', error);
    throw error;
  }
};

export const deletePlan = async (planId) => {
  try {
    const planRef = ref(database, `plans/${planId}`);
    
    // الحصول على اسم الخطة للتسجيل
    const planSnapshot = await get(planRef);
    const plan = planSnapshot.val();
    
    await remove(planRef);
    
    // تسجيل النشاط
    await logActivity({
      action: 'delete_plan',
      user_email: 'admin',
      details: `Deleted plan: ${plan?.name_en || planId}`
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting plan:', error);
    throw error;
  }
};

// ==================== Subscriptions CRUD ====================

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
      user_email: subscriptionData.user_email,
      plan_id: subscriptionData.plan_id,
      status: subscriptionData.status || 'pending',
      start_date: subscriptionData.start_date || new Date().toISOString(),
      end_date: subscriptionData.end_date || '',
      payment_method: subscriptionData.payment_method || '',
      amount: parseFloat(subscriptionData.amount) || 0,
      currency: subscriptionData.currency || 'USD',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await set(newSubRef, dataToSave);
    
    // إنشاء إشعار للمشترك الجديد
    await createNotification({
      type: 'new_subscription',
      user_email: subscriptionData.user_email,
      title: {
        en: 'Subscription Created',
        ar: 'تم إنشاء اشتراك جديد'
      },
      message: {
        en: `Your subscription has been created with status: ${subscriptionData.status}`,
        ar: `تم إنشاء اشتراكك بحالة: ${subscriptionData.status === 'active' ? 'نشط' : 'قيد الانتظار'}`
      },
      subscription_id: newSubRef.key,
      plan_id: subscriptionData.plan_id
    });
    
    // إشعار للأدمن
    await createNotification({
      type: 'admin_new_subscription',
      user_email: 'admin',
      title: {
        en: 'New Subscription',
        ar: 'اشتراك جديد'
      },
      message: {
        en: `${subscriptionData.user_email} subscribed to plan ${subscriptionData.plan_id}`,
        ar: `قام ${subscriptionData.user_email} بالاشتراك في خطة ${subscriptionData.plan_id}`
      }
    });
    
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
    
    // إشعار بتحديث الاشتراك
    if (subData.status) {
      await createNotification({
        type: 'subscription_updated',
        user_email: subData.user_email || subId,
        title: {
          en: 'Subscription Updated',
          ar: 'تم تحديث الاشتراك'
        },
        message: {
          en: `Your subscription status is now: ${subData.status}`,
          ar: `حالة اشتراكك الآن: ${subData.status === 'active' ? 'نشط' : 'غير نشط'}`
        }
      });
    }
    
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

// ==================== Payments CRUD ====================

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
      user_email: paymentData.user_email,
      amount: parseFloat(paymentData.amount) || 0,
      currency: paymentData.currency || 'USD',
      status: paymentData.status || 'pending',
      payment_method: paymentData.payment_method || '',
      plan_id: paymentData.plan_id || '',
      subscription_id: paymentData.subscription_id || '',
      createdAt: new Date().toISOString()
    };
    await set(newPaymentRef, dataToSave);
    
    // إشعار بالدفع الجديد
    await createNotification({
      type: 'new_payment',
      user_email: paymentData.user_email,
      title: {
        en: 'Payment Processed',
        ar: 'تمت معالجة الدفع'
      },
      message: {
        en: `Payment of ${paymentData.amount} ${paymentData.currency} is ${paymentData.status}`,
        ar: `دفعة بقيمة ${paymentData.amount} ${paymentData.currency} أصبحت ${paymentData.status === 'completed' ? 'مكتملة' : 'قيد الانتظار'}`
      }
    });
    
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

// ==================== Review Approval Functions ====================

// دالة لتحديث حالة الموافقة على التقييم
export const updateReviewApproval = async (reviewId, isApproved) => {
  try {
    const reviewRef = ref(database, `reviews/${reviewId}`);
    await update(reviewRef, { 
      is_approved: isApproved,
      updated_at: new Date().toISOString()
    });
    
    // الحصول على بيانات التقييم
    const reviewSnapshot = await get(reviewRef);
    const review = reviewSnapshot.val();
    
    // إنشاء إشعار للمستخدم صاحب التقييم
    if (review && review.user_email) {
      await createNotification({
        type: 'review_updated',
        user_email: review.user_email,
        title: {
          en: 'Your review status has been updated',
          ar: 'تم تحديث حالة تقييمك'
        },
        message: {
          en: `Your review is now ${isApproved ? 'approved' : 'pending'}`,
          ar: `تقييمك الآن ${isApproved ? 'مقبول' : 'قيد المراجعة'}`
        },
        review_id: reviewId,
        is_approved: isApproved
      });
    }
    
    // تسجيل النشاط
    await logActivity({
      action: 'update_review_approval',
      user_email: 'admin',
      details: `Updated review ${reviewId} approval to ${isApproved}`
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating review approval:', error);
    return { success: false };
  }
};

// دالة لحذف تقييم
export const deleteReview = async (reviewId) => {
  try {
    const reviewRef = ref(database, `reviews/${reviewId}`);
    await remove(reviewRef);
    
    // تسجيل النشاط
    await logActivity({
      action: 'delete_review',
      user_email: 'admin',
      details: `Deleted review: ${reviewId}`
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting review:', error);
    return { success: false };
  }
};

// ==================== Activity Logs ====================

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

export default database;
