import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Bell, Check, Loader2 } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { Button } from '@/components/ui/button';

export default function Notifications() {
  const navigate = useNavigate();
  const { language, isRtl } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const user = await base44.auth.me();
      const notifs = await base44.entities.Notification.filter({ user_email: user.email }, '-created_date');
      setNotifications(notifs);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notif) => {
    await base44.entities.Notification.update(notif.id, { is_read: true });
    setNotifications(notifications.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
  };

  const markAllAsRead = async () => {
    for (const notif of notifications.filter(n => !n.is_read)) {
      await base44.entities.Notification.update(notif.id, { is_read: true });
    }
    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'welcome': return '👋';
      case 'subscription': return '✨';
      case 'credits': return '💎';
      default: return '📢';
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1995AD]" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#F1F1F2] dark:bg-slate-900 py-8 px-6 ${isRtl ? 'rtl' : 'ltr'}`}>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(createPageUrl('Chat'))}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
            {language === 'ar' ? 'العودة' : 'Back'}
          </button>
          
          {notifications.some(n => !n.is_read) && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <Check className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all as read'}
            </Button>
          )}
        </div>

        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3">
          <Bell className="w-8 h-8" />
          {language === 'ar' ? 'الإشعارات' : 'Notifications'}
        </h1>

        <div className="space-y-4">
          {notifications.length === 0 ? (
            <Card className="p-8 text-center">
              <Bell className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">
                {language === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}
              </p>
            </Card>
          ) : (
            notifications.map((notif) => (
              <Card
                key={notif.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  !notif.is_read ? 'bg-[#A1D6E2]/20 dark:bg-[#1995AD]/20 border-[#1995AD]/30 dark:border-[#A1D6E2]/30' : ''
                }`}
                onClick={() => markAsRead(notif)}
              >
                <div className="flex items-start gap-4">
                  <span className="text-2xl">{getTypeIcon(notif.type)}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {language === 'ar' ? notif.title_ar : notif.title_en}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                      {language === 'ar' ? notif.message_ar : notif.message_en}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                      {new Date(notif.created_date).toLocaleString()}
                    </p>
                  </div>
                  {!notif.is_read && (
                    <div className="w-3 h-3 rounded-full bg-[#1995AD]" />
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}