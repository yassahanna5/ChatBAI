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

// ==================== تهيئة كائن base44 مخصص (بدون استخدام SDK للمصادقة) ====================

export const base44 = {
  auth: {
    me: async () => {
      try {
        const url = `${BASE_URL}/api/apps/${APP_ID}/entities/User/me`;
        console.log('📡 Fetching current user from:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'api_key': API_KEY,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.error('❌ User API response not OK:', response.status, response.statusText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ User fetched:', data);
        return data;
        
      } catch (error) {
        console.error('❌ Error fetching current user:', error);
        throw error;
      }
    },
    
    isAuthenticated: async () => {
      try {
        const user = await base44.auth.me();
        return !!user;
      } catch {
        return false;
      }
    },
    
    logout: async () => {
      // لا حاجة لتسجيل خروج مع API key
      console.log('Logout called');
      return true;
    }
  },
  
  entities: {}
};

// ==================== دوال Plan Entity ====================

export const fetchPlans = async (filters = {}) => {
  try {
    const url = `${BASE_URL}/api/apps/${APP_ID}/entities/Plan`;
    console.log('📡 Fetching plans from:', url);
    
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
    console.log('📡 Fetching plan by id from:', url);
    
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
    console.log('📡 Fetching subscriptions from:', url);
    
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
    console.log('📡 Creating subscription at:', url);
    
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
    console.log('📡 Updating subscription at:', url);
    
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
    console.log('📡 Deleting subscription at:', url);
    
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
    console.log('📡 Creating notification at:', url);
    
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

// ==================== دوال ActivityLog Entity ====================

export const createActivityLog = async (logData) => {
  try {
    const url = `${BASE_URL}/api/apps/${APP_ID}/entities/ActivityLog`;
    console.log('📡 Creating activity log at:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'api_key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(logData)
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
    
  } catch (error) {
    console.error('Error creating activity log:', error);
    return null;
  }
};

// ==================== دوال User Entity ====================

base44.entities.User = {
  me: async () => {
    return base44.auth.me();
  },
  
  filter: async (query) => {
    try {
      const queryString = encodeURIComponent(JSON.stringify(query));
      const url = `${BASE_URL}/api/apps/${APP_ID}/entities/User?q=${queryString}`;
      console.log('📡 Fetching users from:', url);
      
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
      
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      return [];
    }
  }
};

// ==================== دوال Review Entity ====================

base44.entities.Review = {
  filter: async (query, sort = '-created_date', limit = 10) => {
    try {
      const queryString = encodeURIComponent(JSON.stringify(query));
      const url = `${BASE_URL}/api/apps/${APP_ID}/entities/Review?q=${queryString}&sort=${sort}&limit=${limit}`;
      
      console.log('📡 Fetching reviews from:', url);
      
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
      
    } catch (error) {
      console.error('❌ Error fetching reviews:', error);
      return [];
    }
  },
  
  create: async (reviewData) => {
    try {
      const url = `${BASE_URL}/api/apps/${APP_ID}/entities/Review`;
      console.log('📡 Creating review at:', url);
      
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
      
    } catch (error) {
      console.error('❌ Error creating review:', error);
      throw error;
    }
  }
};

// ==================== دوال Notification Entity (للكشف) ====================

base44.entities.Notification = {
  filter: async (query) => {
    try {
      const queryString = encodeURIComponent(JSON.stringify(query));
      const url = `${BASE_URL}/api/apps/${APP_ID}/entities/Notification?q=${queryString}`;
      console.log('📡 Fetching notifications from:', url);
      
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
      
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      return [];
    }
  },
  
  create: createNotification
};

// ==================== دوال Subscription Entity (للكشف) ====================

base44.entities.Subscription = {
  filter: fetchSubscriptions,
  create: createSubscription,
  update: updateSubscription,
  delete: deleteSubscription
};

// ==================== دوال Plan Entity (للكشف) ====================

base44.entities.Plan = {
  filter: fetchPlans,
  getById: fetchPlanById
};

console.log('✅ base44.entities ready with:', Object.keys(base44.entities));
