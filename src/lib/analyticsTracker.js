// src/lib/analyticsTracker.js
import { logPageVisit } from './firebase';

// دالة لتتبع الصفحات
export const trackPageView = (pagePath) => {
  // الحصول على بيانات المستخدم من sessionStorage
  const userStr = sessionStorage.getItem('currentUser');
  const user = userStr ? JSON.parse(userStr) : null;
  
  // تسجيل الزيارة في Firebase
  logPageVisit(pagePath, user);
};

// دالة لإضافة التتبع لجميع الصفحات
export const initAnalytics = () => {
  // تتبع الصفحة الحالية
  trackPageView(window.location.pathname);
  
  // تتبع تغييرات المسار (للتطبيقات الـ SPA)
  let lastUrl = window.location.pathname;
  
  // مراقبة تغييرات الـ URL
  const observer = new MutationObserver(() => {
    if (lastUrl !== window.location.pathname) {
      lastUrl = window.location.pathname;
      trackPageView(lastUrl);
    }
  });
  
  observer.observe(document.querySelector('body'), {
    childList: true,
    subtree: true
  });
  
  // الاستماع لحدث popstate (الرجوع للأمام/الخلف)
  window.addEventListener('popstate', () => {
    if (lastUrl !== window.location.pathname) {
      lastUrl = window.location.pathname;
      trackPageView(lastUrl);
    }
  });
  
  console.log('📊 Analytics initialized');
};
