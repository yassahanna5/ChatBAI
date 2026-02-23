import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MessageSquarePlus, History, Settings, User, Bell, CreditCard, LogOut, Moon, Sun, Languages, Shield, X, Edit2, Save, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
  onUpdateProfile,
  unreadNotifications,
  onClose
}) {
  const isAdmin = user?.role === 'admin';
  const { t, language, changeLanguage, isRtl } = useLanguage();
  const { darkMode, toggleDarkMode } = useTheme();
  
  // State for profile editing
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    birth_date: user?.birth_date || '',
    avatar_url: user?.avatar_url || '',
    business_name: user?.business_name || '',
    country: user?.country || '',
    city: user?.city || ''
  });

  const handleProfileUpdate = async () => {
    const success = await onUpdateProfile(profileForm);
    if (success) {
      setEditingProfile(false);
      setShowProfileModal(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`w-72 h-full bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col ${isRtl ? 'border-l border-r-0' : ''}`}>
      {/* Close Button - Mobile Only */}
      {onClose && (
        <button
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 z-50 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <X className="w-5 h-5" />
        </button>
      )}
      
      {/* User Info - قابل للنقر لتعديل البروفايل */}
      <div 
        className="p-4 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        onClick={() => setShowProfileModal(true)}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            {user?.avatar_url ? (
              <img 
                src={user.avatar_url} 
                alt={user.full_name} 
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1995AD] to-[#A1D6E2] flex items-center justify-center text-white font-semibold">
                {getInitials(user?.full_name)}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#1995AD] rounded-full flex items-center justify-center">
              <Edit2 className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-900 dark:text-white truncate">{user?.full_name || 'User'}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
        <div className="text-xs px-2 py-1 bg-[#A1D6E2]/30 dark:bg-[#1995AD]/50 text-[#1995AD] dark:text-[#A1D6E2] rounded-full inline-block">
          {subscription?.plan_name || 'Free Trial'}
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

      {/* Chat History */}
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
                {new Date(conv.createdAt || conv.created_date).toLocaleDateString()}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Actions */}
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

      {/* Profile Edit Modal */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingProfile 
                ? (language === 'ar' ? 'تعديل الملف الشخصي' : 'Edit Profile')
                : (language === 'ar' ? 'الملف الشخصي' : 'Profile')
              }
            </DialogTitle>
          </DialogHeader>
          
          {!editingProfile ? (
            // عرض الملف الشخصي
            <div className="space-y-4 py-4">
              <div className="flex justify-center">
                {user?.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt={user.full_name} 
                    className="w-24 h-24 rounded-full object-cover border-4 border-[#1995AD]/20"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1995AD] to-[#A1D6E2] flex items-center justify-center text-white text-3xl font-bold">
                    {getInitials(user?.full_name)}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'الاسم' : 'Name'}</Label>
                <p className="text-slate-900 dark:text-white p-2 bg-slate-100 dark:bg-slate-800 rounded">
                  {user?.full_name}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Email</Label>
                <p className="text-slate-900 dark:text-white p-2 bg-slate-100 dark:bg-slate-800 rounded">
                  {user?.email}
                </p>
              </div>
              
              {user?.phone && (
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'الهاتف' : 'Phone'}</Label>
                  <p className="text-slate-900 dark:text-white p-2 bg-slate-100 dark:bg-slate-800 rounded">
                    {user.phone}
                  </p>
                </div>
              )}
              
              {user?.birth_date && (
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'تاريخ الميلاد' : 'Birth Date'}</Label>
                  <p className="text-slate-900 dark:text-white p-2 bg-slate-100 dark:bg-slate-800 rounded">
                    {new Date(user.birth_date).toLocaleDateString()}
                  </p>
                </div>
              )}
              
              {user?.business_name && (
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'الشركة' : 'Company'}</Label>
                  <p className="text-slate-900 dark:text-white p-2 bg-slate-100 dark:bg-slate-800 rounded">
                    {user.business_name}
                  </p>
                </div>
              )}
            </div>
          ) : (
            // نموذج تعديل الملف الشخصي
            <div className="space-y-4 py-4">
              <div className="flex justify-center">
                <div className="relative">
                  {profileForm.avatar_url ? (
                    <img 
                      src={profileForm.avatar_url} 
                      alt="Avatar" 
                      className="w-24 h-24 rounded-full object-cover border-4 border-[#1995AD]/20"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1995AD] to-[#A1D6E2] flex items-center justify-center text-white text-3xl font-bold">
                      {getInitials(profileForm.full_name)}
                    </div>
                  )}
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-[#1995AD] rounded-full flex items-center justify-center">
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'الاسم الكامل' : 'Full Name'}</Label>
                <Input
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'رقم الهاتف' : 'Phone'}</Label>
                <Input
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'تاريخ الميلاد' : 'Birth Date'}</Label>
                <Input
                  type="date"
                  value={profileForm.birth_date}
                  onChange={(e) => setProfileForm({ ...profileForm, birth_date: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'الشركة' : 'Company'}</Label>
                <Input
                  value={profileForm.business_name}
                  onChange={(e) => setProfileForm({ ...profileForm, business_name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'الدولة' : 'Country'}</Label>
                <Input
                  value={profileForm.country}
                  onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'المدينة' : 'City'}</Label>
                <Input
                  value={profileForm.city}
                  onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            {!editingProfile ? (
              <>
                <Button variant="outline" onClick={() => setShowProfileModal(false)}>
                  {language === 'ar' ? 'إغلاق' : 'Close'}
                </Button>
                <Button 
                  onClick={() => {
                    setEditingProfile(true);
                    setProfileForm({
                      full_name: user?.full_name || '',
                      phone: user?.phone || '',
                      birth_date: user?.birth_date || '',
                      avatar_url: user?.avatar_url || '',
                      business_name: user?.business_name || '',
                      country: user?.country || '',
                      city: user?.city || ''
                    });
                  }}
                  className="bg-[#1995AD] hover:bg-[#1995AD]/90"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'تعديل' : 'Edit'}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setEditingProfile(false)}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button 
                  onClick={handleProfileUpdate}
                  className="bg-[#1995AD] hover:bg-[#1995AD]/90"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'حفظ' : 'Save'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
