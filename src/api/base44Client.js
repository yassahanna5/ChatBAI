// src/api/base44Client.js
import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

// استخدام المتغيرات البيئية مع fallback
const BASE_URL = import.meta.env.VITE_BASE44_APP_BASE_URL || appBaseUrl || 'https://app.base44.com';
const APP_ID = import.meta.env.VITE_BASE44_APP_ID || appId || '698092d9355e78e06e2f8424';
const API_KEY = '46d61c5092864feab81ac3a4d2fe3261';

// تحديد الـ redirect URL المناسب حسب البيئة
const getRedirectUrl = () => {
  // في بيئة Vercel
  if (import.meta.env.VERCEL_URL) {
    return `https://${import.meta.env.VERCEL_URL}`;
  }
  // في بيئة Netlify
  if (import.meta.env.NETLIFY) {
    return import.meta.env.URL || `https://${import.meta.env.NETLIFY_URL}`;
  }
  // في بيئة التطوير المحلي
  if (import.meta.env.DEV) {
    return 'http://localhost:5173';
  }
  // الرجوع إلى المتغير البيئي أو domain افتراضي
  return import.meta.env.VITE_APP_URL || window.location.origin;
};

console.log('Base44 Config:', { BASE_URL, APP_ID, redirectUrl: getRedirectUrl() });

// إنشاء client مع المصادقة المطلوبة
export const base44 = createClient({
  appId: APP_ID,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl: BASE_URL,
  redirectUrl: getRedirectUrl() // إضافة redirect URL
});

// ==================== نظام المصادقة ====================

// متغير عام لتخزين المستخدم الحالي
let currentUserCache = null;
let authCheckPromise = null;

// التحقق من المستخدم الحالي
export const checkAuth = async (forceRefresh = false) => {
  if (authCheckPromise && !forceRefresh) {
    return authCheckPromise;
  }

  if (currentUserCache && !forceRefresh) {
    console.log('Returning cached user:', currentUserCache.email);
    return currentUserCache;
  }

  authCheckPromise = (async () => {
    try {
      console.log('Fetching user from base44...');
      
      const user = await base44.auth.me();
      
      if (user && user.email) {
        currentUserCache = user;
        
        const userData = {
          email: user.email,
          name: user.name || user.email.split('@')[0],
          role: user.role || 'user'
        };
        
        sessionStorage.setItem('base44_user', JSON.stringify(userData));
        console.log('User authenticated and cached:', user.email);
        return user;
      }
      
      currentUserCache = null;
      sessionStorage.removeItem('base44_user');
      return null;
      
    } catch (error) {
      console.log('User not authenticated:', error.message);
      
      try {
        const cachedUser = sessionStorage.getItem('base44_user');
        if (cachedUser) {
          const userData = JSON.parse(cachedUser);
          currentUserCache = userData;
          console.log('Restored user from session:', userData.email);
          return userData;
        }
      } catch (e) {
        sessionStorage.removeItem('base44_user');
      }
      
      currentUserCache = null;
      return null;
    } finally {
      authCheckPromise = null;
    }
  })();

  return authCheckPromise;
};

// ==================== دوال Plan Entity ====================

// جلب جميع الخطط
export const fetchPlans = async (filters = {}) => {
  try {
    console.log('Fetching plans with filters:', filters);
    
    const url = `${BASE_URL}/api/apps/${APP_ID}/entities/Plan`;
    console.log('Fetching from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'api_key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Plans fetched successfully:', data);
    
    let plansArray = Array.isArray(data) ? data : [];
    
    if (filters.is_active !== undefined) {
      plansArray = plansArray.filter(plan => plan.is_active === filters.is_active);
    }
    
    return plansArray;
    
  } catch (error) {
    console.error('Error fetching plans:', error);
    return [];
  }
};

// جلب خطة محددة بالـ ID
export const fetchPlanById = async (planId) => {
  try {
    const url = `${BASE_URL}/api/apps/${APP_ID}/entities/Plan/${planId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'api_key': API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
    
  } catch (error) {
    console.error('Error fetching plan:', error);
    return null;
  }
};

// ==================== دوال Subscription Entity ====================

// جلب الاشتراكات
export const fetchSubscriptions = async (filters = {}) => {
  try {
    console.log('Fetching subscriptions with filters:', filters);
    
    const url = `${BASE_URL}/api/apps/${APP_ID}/entities/Subscription`;
    console.log('Fetching from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'api_key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Subscriptions fetched:', data);
    
    let subsArray = Array.isArray(data) ? data : [];
    
    if (filters.user_email) {
      subsArray = subsArray.filter(sub => sub.user_email === filters.user_email);
    }
    if (filters.status) {
      subsArray = subsArray.filter(sub => sub.status === filters.status);
    }
    
    return subsArray;
    
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return [];
  }
};

// إنشاء اشتراك جديد
export const createSubscription = async (subscriptionData) => {
  try {
    console.log('Creating subscription:', subscriptionData);
    
    const url = `${BASE_URL}/api/apps/${APP_ID}/entities/Subscription`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'api_key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscriptionData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Subscription created successfully:', data);
    return data;
    
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
};

// تحديث اشتراك
export const updateSubscription = async (subscriptionId, updateData) => {
  try {
    console.log('Updating subscription:', subscriptionId, updateData);
    
    const url = `${BASE_URL}/api/apps/${APP_ID}/entities/Subscription/${subscriptionId}`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'api_key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Subscription updated successfully:', data);
    return data;
    
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
};

// حذف اشتراك
export const deleteSubscription = async (subscriptionId) => {
  try {
    const url = `${BASE_URL}/api/apps/${APP_ID}/entities/Subscription/${subscriptionId}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'api_key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    console.log('Subscription deleted successfully');
    return true;
    
  } catch (error) {
    console.error('Error deleting subscription:', error);
    return false;
  }
};

// ==================== دوال Notification Entity ====================

// إنشاء إشعار
export const createNotification = async (notificationData) => {
  try {
    const url = `${BASE_URL}/api/apps/${APP_ID}/entities/Notification`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'api_key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(notificationData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// ==================== دوال ActivityLog Entity ====================

// تسجيل نشاط
export const createActivityLog = async (logData) => {
  try {
    const url = `${BASE_URL}/api/apps/${APP_ID}/entities/ActivityLog`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'api_key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(logData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('Error creating activity log:', error);
    return null;
  }
};
