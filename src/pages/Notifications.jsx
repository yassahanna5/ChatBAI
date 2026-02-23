import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Bell, Check, Loader2 } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { Button } from '@/components/ui/button';
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  getCurrentUser
} from '@/lib/firebase';

export default function Notifications() {
  const navigate = useNavigate();
  const { language, isRtl } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUserAndNotifications();
  }, []);

  const loadUserAndNotifications = async () => {
    try {
      // جلب المستخدم الحالي من sessionStorage
      const currentUser = getCurrentUser();
      
      if (!currentUser) {
        // لو مش مسجل دخول، يوجه لصفحة تسجيل الدخول
        navigate(createPageUrl('SignIn'));
        return;
      }
      
      setUser(currentUser);
      await loadNotifications(currentUser.email);
    } catch (error) {
      console.error('Error loading user:', error);
      setLoading(false);
    }
  };

  const loadNotifications = async (userEmail) => {
    try {
      // جلب إشعارات المستخدم من Firebase
      const notifs = await getUserNotifications(userEmail);
      // ترتيب من الأحدث إلى الأقدم
      const sortedNotifs = notifs.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      setNotifications(sortedNotifs);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notif) => {
    try {
      await markNotificationAsRead(notif.id);
      // تحديث حالة الإشعار في الواجهة
      setNotifications(notifications.map(n => 
        n.id === notif.id ? { ...n, is_read: true } : n
      ));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      await markAllNotificationsAsRead(user.email);
      // تحديث كل الإشعارات كمقروءة
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'welcome': return '👋';
      case 'subscription': return '✨';
      case 'credits': return '💎';
      case 'system': return '📢';
      default: return '📌';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString(
      language === 'ar' ? 'ar-EG' : 'en-US',
      { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1F1F2] dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#1995AD] mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">
            {language === 'ar' ? 'جاري تحميل الإشعارات...' : 'Loading notifications...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-[#F1F1F2] via-white to-[#A1D6E2]/20 dark:from-slate-950 dark:via-slate-900 dark:to-[#1995AD]/20 py-8 px-6 ${isRtl ? 'rtl' : 'ltr'}`}>
      <div className="max-w-2xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(createPageUrl('Chat'))}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors group"
          >
            <ArrowLeft className={`w-5 h-5 transition-transform group-hover:-translate-x-1 ${isRtl ? 'rotate-180 group-hover:translate-x-1' : ''}`} />
            {language === 'ar' ? 'العودة للدردشة' : 'Back to Chat'}
          </button>
          
          {notifications.some(n => !n.is_read) && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={markAllAsRead}
              className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Check className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all as read'}
            </Button>
          )}
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1995AD] to-[#A1D6E2] flex items-center justify-center">
              <Bell className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            {language === 'ar' ? 'الإشعارات' : 'Notifications'}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {language === 'ar' 
              ? 'آخر التحديثات والإشعارات الخاصة بك' 
              : 'Your latest updates and notifications'}
          </p>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <Card className="p-12 text-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700">
              <Bell className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                {language === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                {language === 'ar' 
                  ? 'عندما تصلك إشعارات جديدة، ستظهر هنا' 
                  : 'When you get new notifications, they will appear here'}
              </p>
            </Card>
          ) : (
            notifications.map((notif) => (
              <Card
                key={notif.id}
                className={`p-5 cursor-pointer transition-all hover:shadow-lg ${
                  !notif.is_read 
                    ? 'bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/30 dark:to-slate-800 border-l-4 border-l-[#1995AD]' 
                    : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
                onClick={() => !notif.is_read && markAsRead(notif)}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                    !notif.is_read 
                      ? 'bg-[#1995AD]/10 dark:bg-[#1995AD]/20' 
                      : 'bg-slate-100 dark:bg-slate-700'
                  }`}>
                    {getTypeIcon(notif.type)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className={`font-semibold text-base ${
                        !notif.is_read 
                          ? 'text-slate-900 dark:text-white' 
                          : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        {language === 'ar' ? notif.title_ar || notif.title_en : notif.title_en}
                      </h3>
                      {!notif.is_read && (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#1995AD] flex-shrink-0 mt-1.5"></span>
                      )}
                    </div>
                    
                    <p className={`text-sm ${
                      !notif.is_read 
                        ? 'text-slate-600 dark:text-slate-300' 
                        : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {language === 'ar' ? notif.message_ar || notif.message_en : notif.message_en}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-3">
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {formatDate(notif.created_at)}
                      </p>
                      {!notif.is_read && (
                        <span className="text-xs text-[#1995AD] font-medium">
                          {language === 'ar' ? 'جديد' : 'New'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Footer with stats */}
        {notifications.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {language === 'ar' 
                ? `لديك ${notifications.length} إشعار، ${notifications.filter(n => !n.is_read).length} غير مقروء`
                : `You have ${notifications.length} notifications, ${notifications.filter(n => !n.is_read).length} unread`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
