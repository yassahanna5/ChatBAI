import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MessageSquarePlus, History, Settings, User, Bell, CreditCard, LogOut, Moon, Sun, Languages, Shield, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '../LanguageContext';
import { useTheme } from '../ThemeContext';
import CreditsBar from './CreditsBar';

export default function ChatSidebar({ 
  user, 
  subscription,
  conversations, 
  activeConversation,
  onNewChat, 
  onSelectConversation,
  onNavigate,
  unreadNotifications,
  onClose
}) {
  // Check admin from role in database
  const isAdmin = user?.role === 'admin';
  const { t, language, changeLanguage, isRtl } = useLanguage();
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <div className={`w-72 h-full bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col ${isRtl ? 'border-l border-r-0' : ''}`}>
      {/* Close Button - Mobile Only */}
      {/*{onClose && (
        <button
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 z-50 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <X className="w-5 h-5" />
        </button>
      )}*/}
      {/* User Info */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1995AD] to-[#A1D6E2] flex items-center justify-center text-white font-semibold">
            {user?.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-900 dark:text-white truncate">{user?.full_name || 'User'}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
        <div className="text-xs px-2 py-1 bg-[#A1D6E2]/30 dark:bg-[#1995AD]/50 text-[#1995AD] dark:text-[#A1D6E2] rounded-full inline-block">
          {subscription?.plan_name || t('noPlan')}
        </div>
      </div>

      {/* Credits Bar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <CreditsBar 
          total={subscription?.credits_total || 10} 
          used={subscription?.credits_used || 0} 
        />
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <button 
          onClick={onNewChat}
          className="w-full bg-[#1995AD] hover:bg-[#1995AD]/90 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <MessageSquarePlus className="w-4 h-4" />
          {t('newChat')}
        </button>
      </div>

      {/* Chat History - Increased scroll area */}
      <div className="flex-1 overflow-y-auto px-4 pb-4" style={{ maxHeight: 'calc(100vh - 420px)' }}>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2 sticky top-0 bg-slate-50 dark:bg-slate-900 py-2">
          <History className="w-3 h-3" />
          {t('chatHistory')}
        </p>
        <div className="space-y-1">
          {conversations?.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelectConversation(conv)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeConversation?.id === conv.id
                  ? 'bg-[#A1D6E2]/30 dark:bg-[#1995AD]/50 text-[#1995AD] dark:text-[#A1D6E2]'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <p className="truncate">{conv.title || 'New Conversation'}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                {new Date(conv.created_date).toLocaleDateString()}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Actions - Scrollable */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 overflow-y-auto max-h-64">
        <div className="space-y-1">
        <button 
          onClick={() => onNavigate('Notifications')}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Bell className="w-4 h-4" />
          {t('notifications')}
          {unreadNotifications > 0 && (
            <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {unreadNotifications}
            </span>
          )}
        </button>
        <button 
          onClick={() => onNavigate('Plans')}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <CreditCard className="w-4 h-4" />
          {t('plans')}
        </button>
        <button 
          onClick={() => onNavigate('Profile')}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <User className="w-4 h-4" />
          {t('profile')}
        </button>
        <button 
          onClick={() => onNavigate('Settings')}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Settings className="w-4 h-4" />
          {t('settings')}
        </button>
        <button 
          onClick={() => onNavigate('Support')}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
            <text x="12" y="17" textAnchor="middle" fontSize="14" fontWeight="bold">?</text>
          </svg>
          {language === 'ar' ? 'الدعم الفني' : 'Support'}
        </button>
        
        {isAdmin && (
          <Link 
            to={createPageUrl('Admin')}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#1995AD] dark:text-[#A1D6E2] hover:bg-[#A1D6E2]/20 dark:hover:bg-[#1995AD]/20 rounded-lg transition-colors"
          >
            <Shield className="w-4 h-4" />
            {t('adminPanel')}
          </Link>
        )}
        
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={toggleDarkMode}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => changeLanguage(language === 'en' ? 'ar' : 'en')}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Languages className="w-4 h-4" />
            {language === 'en' ? 'عربي' : 'EN'}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}