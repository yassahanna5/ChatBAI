// src/api/base44Client.js
import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

// استخدام المتغيرات البيئية مع fallback
const BASE_URL = import.meta.env.VITE_BASE44_APP_BASE_URL || appBaseUrl || 'https://chatbai.base44.app';
const APP_ID = import.meta.env.VITE_BASE44_APP_ID || appId || '698092d9355e78e06e2f8424';
const API_KEY = '46d61c5092864feab81ac3a4d2fe3261';

// تحديد الـ redirect URL المناسب حسب البيئة
const getRedirectUrl = () => {
  if (window.location.hostname.includes('vercel.app')) {
    return 'https://chat-bai-ka16.vercel.app';
  }
  if (window.location.hostname.includes('netlify.app')) {
    return window.location.origin;
  }
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5173';
  }
  return import.meta.env.VITE_APP_URL || window.location.origin;
};

console.log('Base44 Config:', { 
  BASE_URL, 
  APP_ID, 
  redirectUrl: getRedirectUrl(),
  hostname: window.location.hostname 
});

// إنشاء client مع المصادقة المطلوبة
export const base44 = createClient({
  appId: APP_ID,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl: BASE_URL,
  redirectUrl: getRedirectUrl()
});

// ==================== نظام المصادقة ====================

let currentUserCache = null;
let authCheckPromise = null;

export const checkAuth = async (forceRefresh = false) => {
  if (authCheckPromise && !forceRefresh) {
    return authCheckPromise;
  }

  if (currentUserCache && !forceRefresh) {
    return currentUserCache;
  }

  authCheckPromise = (async () => {
    try {
      const user = await base44.auth.me();
      
      if (user && user.email) {
        currentUserCache = user;
        const userData = {
          email: user.email,
          name: user.name || user.email.split('@')[0],
          role: user.role || 'user'
        };
        sessionStorage.setItem('base44_user', JSON.stringify(userData));
        return user;
      }
      
      currentUserCache = null;
      sessionStorage.removeItem('base44_user');
      return null;
      
    } catch (error) {
      try {
        const cachedUser = sessionStorage.getItem('base44_user');
        if (cachedUser) {
          const userData = JSON.parse(cachedUser);
          currentUserCache = userData;
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

export const fetchPlans = async (filters = {}) => {
  try {
    const url = `${BASE_URL}/api/apps/${APP_ID}/entities/Plan`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'api_key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
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

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
    
  } catch (error) {
    console.error('Error fetching plan:', error);
    return null;
  }
};

// ==================== دوال Subscription Entity ====================

export const fetchSubscriptions = async (filters = {}) => {
  try {
    const url = `${BASE_URL}/api/apps/${APP_ID}/entities/Subscription`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'api_key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
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

export const createSubscription = async (subscriptionData) => {
  try {
    const url = `${BASE_URL}/api/apps/${APP_ID}/entities/Subscription`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'api_key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscriptionData)
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
    
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
};

export const updateSubscription = async (subscriptionId, updateData) => {
  try {
    const url = `${BASE_URL}/api/apps/${APP_ID}/entities/Subscription/${subscriptionId}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'api_key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
    
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
};

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
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return true;
    
  } catch (error) {
    console.error('Error deleting subscription:', error);
    return false;
  }
};

// ==================== دوال Notification Entity ====================

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
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
    
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

if (!base44.entities) {
  base44.entities = {};
}

// ==================== User Entity ====================

base44.entities.User = {
  me: async () => {
    const url = `${BASE_URL}/api/apps/${APP_ID}/entities/User/me`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'api_key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  },
  filter: async (query) => {
    const queryString = encodeURIComponent(JSON.stringify(query));
    const url = `${BASE_URL}/api/apps/${APP_ID}/entities/User?q=${queryString}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'api_key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }
};

// ==================== Review Entity ====================

base44.entities.Review = {
  filter: async (query, sort = '-created_date', limit = 10) => {
    const queryString = encodeURIComponent(JSON.stringify(query));
    const url = `${BASE_URL}/api/apps/${APP_ID}/entities/Review?q=${queryString}&sort=${sort}&limit=${limit}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'api_key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },
  create: async (reviewData) => {
    const url = `${BASE_URL}/api/apps/${APP_ID}/entities/Review`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'api_key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reviewData)
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  }
};

console.log('✅ base44 fully initialized');
