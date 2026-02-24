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
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// ==================== Users Functions ====================
export const usersRef = ref(database, 'users');

// دالة لحفظ مستخدم جديد (Register)
export const saveUser = async (userData) => {
  console.log('👤 Attempting to save user to Firebase...');
  
  try {
    // ✅ نظف البيانات قبل الحفظ
    const cleanEmail = userData.email.trim().toLowerCase();
    const cleanPassword = userData.password.trim();
    
    // التحقق من أن الايميل غير مسجل مسبقاً
    const existingUser = await getUserByEmail(cleanEmail);
    if (existingUser) {
      throw new Error('Email already exists');
    }
    
    const newUserRef = push(usersRef);
    
    // تحديد إذا كان هذا هو حساب الأدمن
    const isAdmin = cleanEmail === 'admin2030@gmail.com';
    
    const dataToSave = {
      email: cleanEmail,
      password: cleanPassword,
      full_name: userData.full_name,
      phone: userData.phone || '',
      gender: userData.gender || '',
      birth_date: userData.birth_date || '',
      avatar_url: userData.avatar_url || '',
      role: isAdmin ? 'admin' : 'user',
      free_credits_given: false,
      onboarding_completed: false,
      
      // Business data (optional)
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
      lastLogin: null
    };
    
    await set(newUserRef, dataToSave);
    console.log('✅ User saved successfully! ID:', newUserRef.key);
    
    // إنشاء إشعار ترحيبي
    await createWelcomeNotification(cleanEmail, userData.full_name);
    
    return { 
      success: true, 
      id: newUserRef.key,
      email: cleanEmail,
      full_name: userData.full_name,
      role: dataToSave.role
    };
    
  } catch (error) {
    console.error('❌ Firebase error details:', error);
    throw error;
  }
};

// دالة لجلب مستخدم بالبريد الإلكتروني
export const getUserByEmail = async (email) => {
  try {
    const cleanEmail = email.trim().toLowerCase();
    
    const snapshot = await get(usersRef);
    if (!snapshot.exists()) return null;
    
    let foundUser = null;
    
    snapshot.forEach((childSnapshot) => {
      const user = childSnapshot.val();
      if (user.email && user.email.toLowerCase() === cleanEmail) {
        foundUser = {
          id: childSnapshot.key,
          ...user
        };
      }
    });
    
    return foundUser;
    
  } catch (error) {
    console.error('❌ Error checking email:', error);
    throw error;
  }
};

// دالة لجلب كل المستخدمين (للوحة التحكم)
export const getAllUsers = async () => {
  try {
    const snapshot = await get(usersRef);
    if (!snapshot.exists()) return [];
    
    const users = [];
    snapshot.forEach((childSnapshot) => {
      const user = childSnapshot.val();
      users.push({
        id: childSnapshot.key,
        ...user
      });
    });
    
    return users;
    
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    return [];
  }
};

// دالة لتحديث بيانات المستخدم
export const updateUser = async (userId, userData) => {
  try {
    const userRef = ref(database, `users/${userId}`);
    const dataToSave = {
      ...userData,
      updatedAt: new Date().toISOString()
    };
    await update(userRef, dataToSave);
    return { success: true };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false };
  }
};

// دالة لتحديث دور المستخدم
export const updateUserRole = async (userId, newRole) => {
  try {
    const userRef = ref(database, `users/${userId}`);
    await update(userRef, { 
      role: newRole,
      updated_at: new Date().toISOString()
    });
    
    await logActivity({
      action: 'update_user_role',
      user_email: 'admin',
      details: `Updated user ${userId} role to ${newRole}`
    });
    
    const userSnapshot = await get(userRef);
    const user = userSnapshot.val();
    
    if (user && user.email) {
      await createUserNotification({
        user_email: user.email,
        type: 'system',
        title_en: 'Your account role has been updated',
        title_ar: 'تم تحديث دور حسابك',
        message_en: `Your role is now: ${newRole}`,
        message_ar: `دورك الآن: ${newRole === 'admin' ? 'مدير' : 'مستخدم'}`
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
    const existingUser = await getUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('Email already exists');
    }
    
    const newUserRef = push(usersRef);
    const dataToSave = {
      email: userData.email,
      password: userData.password,
      full_name: userData.full_name,
      phone: userData.phone || '',
      gender: userData.gender || '',
      role: userData.role || 'user',
      business_name: userData.business_name || '',
      country: userData.country || '',
      city: userData.city || '',
      createdAt: new Date().toISOString(),
      lastLogin: null,
      free_credits_given: false,
      onboarding_completed: false,
      created_by: 'admin'
    };
    
    await set(newUserRef, dataToSave);
    
    await logActivity({
      action: 'create_user',
      user_email: 'admin',
      details: `Created user: ${userData.email}`
    });
    
    await createWelcomeNotification(userData.email, userData.full_name);
    
    return { success: true, id: newUserRef.key };
    
  } catch (error) {
    console.error('Error adding user by admin:', error);
    return { success: false, error: error.message };
  }
};

// دالة لحذف مستخدم
export const deleteUser = async (userId) => {
  try {
    const userRef = ref(database, `users/${userId}`);
    const userSnapshot = await get(userRef);
    const user = userSnapshot.val();
    
    await remove(userRef);
    
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

// دالة لتسجيل الدخول
export const signInWithEmail = async (email, password) => {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    
    console.log('🔍 Searching for user with email:', cleanEmail);
    
    const user = await getUserByEmail(cleanEmail);
    
    if (!user) {
      console.log('❌ User not found');
      return { success: false, error: 'Invalid email or password' };
    }
    
    console.log('✅ User found, checking password...');
    
    if (user.password.trim() !== cleanPassword) {
      console.log('❌ Password mismatch');
      return { success: false, error: 'Invalid email or password' };
    }
    
    console.log('✅ Password correct, logging in...');
    
    const userRef = ref(database, `users/${user.id}`);
    await update(userRef, {
      lastLogin: new Date().toISOString()
    });
    
    if (!user.free_credits_given) {
      await grantFreeCredits(user.email, user.id);
    }
    
    const { password: _, ...safeUser } = user;
    
    return { 
      success: true, 
      user: safeUser
    };
    
  } catch (error) {
    console.error('❌ Sign in error:', error);
    return { success: false, error: 'An error occurred during sign in' };
  }
};

// دالة لمنح الرصيد المجاني للمستخدم الجديد
export const grantFreeCredits = async (userEmail, userId) => {
  try {
    const subscriptionData = {
      user_email: userEmail,
      plan_id: 'free_trial',
      plan_name: 'Free Trial',
      credits_total: 10,
      credits_used: 0,
      tokens_per_question: 500,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      amount_paid: 0
    };
    
    await createSubscription(subscriptionData);
    
    const userRef = ref(database, `users/${userId}`);
    await update(userRef, {
      free_credits_given: true
    });
    
    const userSnapshot = await get(userRef);
    const user = userSnapshot.val();
    
    await createCreditsNotification(userEmail, user?.full_name || 'User');
    
    return { success: true };
  } catch (error) {
    console.error('Error granting free credits:', error);
    return { success: false };
  }
};

// دالة لتحديث حالة الـ onboarding
export const completeOnboarding = async (userEmail) => {
  try {
    const user = await getUserByEmail(userEmail);
    if (!user) return { success: false };
    
    const userRef = ref(database, `users/${user.id}`);
    await update(userRef, {
      onboarding_completed: true
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return { success: false };
  }
};

// دالة لرفع صورة البروفايل (تحتاج تخزين في Firebase Storage)
export const uploadAvatar = async (userId, file) => {
  console.log('Upload avatar:', userId, file);
  return { success: true, url: 'temp_url' };
};

// دالة لتحديث صورة البروفايل
export const updateAvatar = async (userId, avatarUrl) => {
  try {
    const userRef = ref(database, `users/${userId}`);
    await update(userRef, {
      avatar_url: avatarUrl
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating avatar:', error);
    return { success: false };
  }
};

// ==================== Subscriptions Functions ====================
export const subscriptionsRef = ref(database, 'subscriptions');

export const createSubscription = async (subscriptionData) => {
  try {
    const newSubRef = push(subscriptionsRef);
    const dataToSave = {
      user_email: subscriptionData.user_email,
      plan_id: subscriptionData.plan_id,
      plan_name: subscriptionData.plan_name || '',
      credits_total: subscriptionData.credits_total || 0,
      credits_used: subscriptionData.credits_used || 0,
      tokens_per_question: subscriptionData.tokens_per_question || 500,
      start_date: subscriptionData.start_date || new Date().toISOString(),
      end_date: subscriptionData.end_date || '',
      status: subscriptionData.status || 'active',
      amount_paid: subscriptionData.amount_paid || 0,
      createdAt: new Date().toISOString()
    };
    
    await set(newSubRef, dataToSave);
    
    await createUserNotification({
      user_email: subscriptionData.user_email,
      type: 'subscription',
      title_en: 'Subscription Activated',
      title_ar: 'تم تفعيل الاشتراك',
      message_en: `Your ${dataToSave.plan_name} plan is now active with ${dataToSave.credits_total} credits.`,
      message_ar: `خطتك ${dataToSave.plan_name} أصبحت نشطة مع ${dataToSave.credits_total} رصيد.`
    });
    
    return { success: true, id: newSubRef.key };
  } catch (error) {
    console.error('❌ Error creating subscription:', error);
    throw error;
  }
};

export const getUserSubscription = async (userEmail) => {
  try {
    const snapshot = await get(subscriptionsRef);
    if (!snapshot.exists()) return null;
    
    let userSubscription = null;
    
    snapshot.forEach((childSnapshot) => {
      const sub = childSnapshot.val();
      if (sub.user_email === userEmail) {
        userSubscription = {  // ✅ بنرجع أي اشتراك للمستخدم (مهما كانت حالته)
          id: childSnapshot.key,
          ...sub
        };
      }
    });
    
    return userSubscription;
  } catch (error) {
    console.error('Error getting user subscription:', error);
    return null;
  }
};

export const updateSubscriptionCredits = async (userEmail, creditsUsed) => {
  try {
    const subscription = await getUserSubscription(userEmail);
    if (!subscription) return { success: false };
    
    const subRef = ref(database, `subscriptions/${subscription.id}`);
    await update(subRef, {
      credits_used: subscription.credits_used + creditsUsed,
      updatedAt: new Date().toISOString()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating subscription credits:', error);
    return { success: false };
  }
};

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

export const deleteSubscription = async (subId) => {
  try {
    const subRef = ref(database, `subscriptions/${subId}`);
    await remove(subRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting subscription:', error);
    return { success: false };
  }
};

// ==================== Payments Functions ====================
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
    
    await createUserNotification({
      user_email: paymentData.user_email,
      type: 'system',
      title_en: 'Payment Processed',
      title_ar: 'تمت معالجة الدفع',
      message_en: `Payment of ${paymentData.amount} ${paymentData.currency} is ${paymentData.status}`,
      message_ar: `دفعة بقيمة ${paymentData.amount} ${paymentData.currency} أصبحت ${paymentData.status === 'completed' ? 'مكتملة' : 'قيد الانتظار'}`
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
    await update(paymentRef, {
      ...paymentData,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating payment:', error);
    return { success: false };
  }
};

export const deletePayment = async (paymentId) => {
  try {
    const paymentRef = ref(database, `payments/${paymentId}`);
    await remove(paymentRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting payment:', error);
    return { success: false };
  }
};

export const getUserPayments = async (userEmail) => {
  try {
    const snapshot = await get(paymentsRef);
    if (!snapshot.exists()) return [];
    
    const payments = [];
    snapshot.forEach((childSnapshot) => {
      const payment = childSnapshot.val();
      if (payment.user_email === userEmail) {
        payments.push({
          id: childSnapshot.key,
          ...payment
        });
      }
    });
    
    return payments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error('Error getting user payments:', error);
    return [];
  }
};

// ==================== Conversations Functions ====================
export const conversationsRef = ref(database, 'conversations');

export const createConversation = async (conversationData) => {
  try {
    const newConvRef = push(conversationsRef);
    const dataToSave = {
      user_email: conversationData.user_email,
      title: conversationData.title || 'New Conversation',
      messages: conversationData.messages || [],
      is_active: true,
      createdAt: new Date().toISOString()
    };
    
    await set(newConvRef, dataToSave);
    return { success: true, id: newConvRef.key };
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};

export const getUserConversations = async (userEmail) => {
  try {
    const snapshot = await get(conversationsRef);
    if (!snapshot.exists()) return [];
    
    const conversations = [];
    snapshot.forEach((childSnapshot) => {
      const conv = childSnapshot.val();
      if (conv.user_email === userEmail) {
        conversations.push({
          id: childSnapshot.key,
          ...conv
        });
      }
    });
    
    return conversations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error('Error getting user conversations:', error);
    return [];
  }
};

export const addMessageToConversation = async (conversationId, message) => {
  try {
    const convRef = ref(database, `conversations/${conversationId}`);
    const snapshot = await get(convRef);
    
    if (!snapshot.exists()) return { success: false };
    
    const conversation = snapshot.val();
    const messages = conversation.messages || [];
    
    messages.push({
      ...message,
      timestamp: new Date().toISOString()
    });
    
    await update(convRef, {
      messages: messages,
      updatedAt: new Date().toISOString()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error adding message:', error);
    return { success: false };
  }
};

export const deleteConversation = async (conversationId) => {
  try {
    const convRef = ref(database, `conversations/${conversationId}`);
    await remove(convRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return { success: false };
  }
};

// ==================== Notifications Functions ====================
export const notificationsRef = ref(database, 'notifications');

export const createUserNotification = async (notificationData) => {
  try {
    const newNotifRef = push(notificationsRef);
    const dataToSave = {
      user_email: notificationData.user_email,
      title_en: notificationData.title_en || '',
      title_ar: notificationData.title_ar || '',
      message_en: notificationData.message_en || '',
      message_ar: notificationData.message_ar || '',
      type: notificationData.type || 'system',
      is_read: false,
      created_at: new Date().toISOString()
    };
    
    await set(newNotifRef, dataToSave);
    return { success: true, id: newNotifRef.key };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false };
  }
};

export const getUserNotifications = async (userEmail) => {
  try {
    const snapshot = await get(notificationsRef);
    if (!snapshot.exists()) return [];
    
    const notifications = [];
    snapshot.forEach((childSnapshot) => {
      const notif = childSnapshot.val();
      if (notif.user_email === userEmail) {
        notifications.push({
          id: childSnapshot.key,
          ...notif
        });
      }
    });
    
    return notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  } catch (error) {
    console.error('Error getting notifications:', error);
    return [];
  }
};

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

export const markAllNotificationsAsRead = async (userEmail) => {
  try {
    const notifications = await getUserNotifications(userEmail);
    
    for (const notif of notifications) {
      if (!notif.is_read) {
        await markNotificationAsRead(notif.id);
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error marking all as read:', error);
    return { success: false };
  }
};

export const getUnreadNotificationsCount = async (userEmail) => {
  try {
    const notifications = await getUserNotifications(userEmail);
    return notifications.filter(n => !n.is_read).length;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

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

// ==================== New Notification Functions ====================

// دالة لإنشاء إشعار ترحيبي
export const createWelcomeNotification = async (userEmail, userName) => {
  try {
    const newNotifRef = push(notificationsRef);
    const dataToSave = {
      user_email: userEmail,
      title_en: '👋 Welcome to ChatBAI!',
      title_ar: '👋 مرحباً بك في ChatBAI!',
      message_en: `Welcome ${userName}! We're excited to have you on board.`,
      message_ar: `مرحباً ${userName}! نحن متحمسون لانضمامك إلينا.`,
      type: 'welcome',
      is_read: false,
      created_at: new Date().toISOString()
    };
    
    await set(newNotifRef, dataToSave);
    console.log('✅ Welcome notification created for:', userEmail);
    return { success: true, id: newNotifRef.key };
  } catch (error) {
    console.error('Error creating welcome notification:', error);
    return { success: false };
  }
};

// دالة لإنشاء إشعار الرصيد
export const createCreditsNotification = async (userEmail, userName) => {
  try {
    const newNotifRef = push(notificationsRef);
    const dataToSave = {
      user_email: userEmail,
      title_en: '🎉 You received 10 free credits!',
      title_ar: '🎉 لقد حصلت على 10 أرصدة مجانية!',
      message_en: `Hi ${userName}! You can now ask 5 free questions. Enjoy!`,
      message_ar: `مرحباً ${userName}! يمكنك الآن طرح 5 أسئلة مجانية. استمتع!`,
      type: 'credits',
      is_read: false,
      created_at: new Date().toISOString()
    };
    
    await set(newNotifRef, dataToSave);
    console.log('✅ Credits notification created for:', userEmail);
    return { success: true, id: newNotifRef.key };
  } catch (error) {
    console.error('Error creating credits notification:', error);
    return { success: false };
  }
};

// ==================== Reviews Functions ====================
export const reviewsRef = ref(database, 'reviews');

export const saveReview = async (reviewData) => {
  try {
    const newReviewRef = push(reviewsRef);
    
    const dataToSave = {
      user_name: reviewData.user_name || 'Anonymous',
      job_title: reviewData.job_title || 'User',
      rating: reviewData.rating || 5,
      review_text: reviewData.review_text || '',
      user_email: reviewData.user_email || 'anonymous@example.com',
      createdAt: new Date().toISOString(),
      is_approved: false
    };
    
    await set(newReviewRef, dataToSave);
    
    await createUserNotification({
      user_email: 'admin',
      type: 'system',
      title_en: 'New Review Submitted',
      title_ar: 'تقييم جديد',
      message_en: `${dataToSave.user_name} submitted a new review`,
      message_ar: `قام ${dataToSave.user_name} بإرسال تقييم جديد`
    });
    
    return { success: true, id: newReviewRef.key };
  } catch (error) {
    console.error('❌ Firebase error details:', error);
    throw error;
  }
};

export const getUserReviews = async (userEmail) => {
  try {
    const snapshot = await get(reviewsRef);
    if (!snapshot.exists()) return [];
    
    const reviews = [];
    snapshot.forEach((childSnapshot) => {
      const review = childSnapshot.val();
      if (review.user_email === userEmail) {
        reviews.push({
          id: childSnapshot.key,
          ...review
        });
      }
    });
    
    return reviews;
  } catch (error) {
    console.error('Error getting user reviews:', error);
    return [];
  }
};

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
    
    return reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error('Error fetching all reviews:', error);
    return [];
  }
};

export const updateReviewApproval = async (reviewId, isApproved) => {
  try {
    const reviewRef = ref(database, `reviews/${reviewId}`);
    await update(reviewRef, { 
      is_approved: isApproved,
      updated_at: new Date().toISOString()
    });
    
    const reviewSnapshot = await get(reviewRef);
    const review = reviewSnapshot.val();
    
    if (review && review.user_email) {
      await createUserNotification({
        user_email: review.user_email,
        type: 'system',
        title_en: 'Review Status Updated',
        title_ar: 'تم تحديث حالة تقييمك',
        message_en: `Your review is now ${isApproved ? 'approved' : 'pending'}`,
        message_ar: `تقييمك الآن ${isApproved ? 'مقبول' : 'قيد المراجعة'}`
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating review approval:', error);
    return { success: false };
  }
};

export const deleteReview = async (reviewId) => {
  try {
    const reviewRef = ref(database, `reviews/${reviewId}`);
    await remove(reviewRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting review:', error);
    return { success: false };
  }
};

// ==================== Plans Functions ====================
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
    return { success: true, id: newPlanRef.key };
  } catch (error) {
    console.error('Error creating plan:', error);
    throw error;
  }
};

export const updatePlan = async (planId, planData) => {
  try {
    const planRef = ref(database, `plans/${planId}`);
    
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

// ==================== Authentication Helper ====================

export const getCurrentUser = () => {
  const userStr = sessionStorage.getItem('currentUser');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const isAuthenticated = () => {
  return !!getCurrentUser();
};

export const isAdmin = () => {
  const user = getCurrentUser();
  return user?.role === 'admin';
};

export const logout = () => {
  sessionStorage.removeItem('currentUser');
  window.location.href = '/';
};

// ==================== Analytics Functions ====================

export const logPageVisit = async (pagePath) => {
  try {
    const visitsRef = ref(database, 'analytics/visits');
    const newVisitRef = push(visitsRef);
    
    const user = getCurrentUser();
    const userAgent = navigator.userAgent;
    
    let deviceType = 'Desktop';
    let os = 'Unknown';
    
    if (/mobile/i.test(userAgent)) deviceType = 'Mobile';
    else if (/tablet/i.test(userAgent)) deviceType = 'Tablet';
    
    if (/windows/i.test(userAgent)) os = 'Windows';
    else if (/mac/i.test(userAgent)) os = 'macOS';
    else if (/linux/i.test(userAgent)) os = 'Linux';
    else if (/android/i.test(userAgent)) os = 'Android';
    else if (/ios|iphone|ipad|ipod/i.test(userAgent)) os = 'iOS';
    
    let country = localStorage.getItem('userCountry') || 'Unknown';
    if (country === 'Unknown') {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        country = data.country_name || 'Unknown';
        localStorage.setItem('userCountry', country);
      } catch (e) {}
    }
    
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('sessionId', sessionId);
      sessionStorage.setItem('sessionStart', Date.now().toString());
    }
    
    const visitData = {
      page: pagePath,
      timestamp: new Date().toISOString(),
      user_email: user?.email || 'anonymous',
      device: deviceType,
      os: os,
      country: country,
      session_id: sessionId,
      referrer: document.referrer || 'direct'
    };
    
    await set(newVisitRef, visitData);
    await updateSessionDuration(sessionId);
    
  } catch (error) {
    console.error('Error logging page visit:', error);
  }
};

const updateSessionDuration = async (sessionId) => {
  try {
    const sessionStart = sessionStorage.getItem('sessionStart');
    if (!sessionStart) return;
    
    const duration = Math.floor((Date.now() - parseInt(sessionStart)) / 1000);
    
    const sessionsRef = ref(database, 'analytics/sessions');
    const sessionRef = ref(database, `analytics/sessions/${sessionId}`);
    
    const sessionSnapshot = await get(sessionRef);
    
    if (sessionSnapshot.exists()) {
      await update(sessionRef, {
        duration: duration,
        last_activity: new Date().toISOString()
      });
    } else {
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
    
    const totalVisits = visits.length;
    const uniqueSessions = new Set(visits.map(v => v.session_id)).size;
    
    const avgDuration = sessions.length > 0 
      ? Math.floor(sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length)
      : 0;
    
    const minutes = Math.floor(avgDuration / 60);
    const seconds = avgDuration % 60;
    const avgDurationFormatted = `${minutes}m ${seconds}s`;
    
    const countries = {};
    visits.forEach(v => {
      if (v.country) countries[v.country] = (countries[v.country] || 0) + 1;
    });
    
    const topCountries = Object.entries(countries)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([country, count]) => ({
        country,
        percentage: Math.round((count / totalVisits) * 100)
      }));
    
    const devices = {};
    visits.forEach(v => {
      if (v.device) devices[v.device] = (devices[v.device] || 0) + 1;
    });
    
    const deviceStats = {};
    Object.entries(devices).forEach(([device, count]) => {
      deviceStats[device] = Math.round((count / totalVisits) * 100);
    });
    
    const osStats = {};
    visits.forEach(v => {
      if (v.os) osStats[v.os] = (osStats[v.os] || 0) + 1;
    });
    
    const osPercentages = {};
    Object.entries(osStats).forEach(([os, count]) => {
      osPercentages[os] = Math.round((count / totalVisits) * 100);
    });
    
    const pages = {};
    visits.forEach(v => {
      if (v.page) pages[v.page] = (pages[v.page] || 0) + 1;
    });
    
    const pageViews = Object.entries(pages)
      .sort((a, b) => b[1] - a[1])
      .map(([page, count]) => ({ page, count }));
    
    const maxPageViews = pageViews.length > 0 ? pageViews[0].count : 1;
    const pageViewsWithPercentage = pageViews.map(pv => ({
      ...pv,
      percentage: Math.round((pv.count / maxPageViews) * 100)
    }));
    
    return {
      totalVisits,
      uniqueVisitors: uniqueSessions,
      avgVisitDuration: avgDurationFormatted,
      visitIncrease: 12,
      uniqueIncrease: 8,
      durationIncrease: 5,
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
      topCountries: [],
      devices: {},
      osStats: {},
      pageViews: []
    };
  }
};

// ==================== Activity Logs Functions ====================
export const activityLogsRef = ref(database, 'activity_logs');

export const logActivity = async (activityData) => {
  try {
    const newLogRef = push(activityLogsRef);
    const dataToSave = {
      action: activityData.action,
      user_email: activityData.user_email || 'system',
      details: activityData.details || '',
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
    
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return [];
  }
};

// ==================== Admin Dashboard Functions ====================

export const getAdminStats = async () => {
  try {
    const [
      users,
      payments,
      subscriptions,
      plans,
      reviews,
      analyticsStats
    ] = await Promise.all([
      getAllUsers(),
      getAllPayments(),
      getAllSubscriptions(),
      getAllPlans(),
      getAllReviews(),
      getAnalyticsStats()
    ]);
    
    const totalPayments = payments.reduce((sum, payment) => {
      return sum + (parseFloat(payment.amount) || 0);
    }, 0);
    
    const activePlans = plans.filter(plan => plan.is_active === true).length;
    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active').length;
    
    return {
      totalUsers: users.length,
      totalPayments: totalPayments.toFixed(2),
      activePlans,
      activeSubscriptions,
      totalReviews: reviews.length,
      
      totalVisits: analyticsStats.totalVisits,
      uniqueVisitors: analyticsStats.uniqueVisitors,
      avgVisitDuration: analyticsStats.avgVisitDuration,
      conversionRate: analyticsStats.uniqueVisitors > 0 
        ? ((subscriptions.length / analyticsStats.uniqueVisitors) * 100).toFixed(1)
        : 0,
      
      visitIncrease: analyticsStats.visitIncrease,
      uniqueIncrease: analyticsStats.uniqueIncrease,
      durationIncrease: analyticsStats.durationIncrease,
      conversionIncrease: 2,
      
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
