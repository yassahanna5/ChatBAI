import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MessageSquarePlus, History, Settings, User, Bell, CreditCard, LogOut, Moon, Sun, Languages, Shield, X, Edit2, Save, Camera, Loader2 } from 'lucide-react';
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
  const fileInputRef = useRef(null);
  
  // State for profile editing
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    birth_date: user?.birth_date || '',
    avatar_url: user?.avatar_url || '',
    business_name: user?.business_name || '',
    business_type: user?.business_type || '',
    country: user?.country || '',
    city: user?.city || '',
    gender: user?.gender || '',
    industry: user?.industry || '',
    company_size: user?.company_size || '',
    website: user?.website || '',
    monthly_budget: user?.monthly_budget || '',
    target_audience: user?.target_audience || '',
    current_challenges: user?.current_challenges || '',
    goals: user?.goals || '',
    competitors: user?.competitors || '',
    social_platforms: user?.social_platforms || ''
  });

  useEffect(() => {
    setProfileForm({
      full_name: user?.full_name || '',
      phone: user?.phone || '',
      birth_date: user?.birth_date || '',
      avatar_url: user?.avatar_url || '',
      business_name: user?.business_name || '',
      business_type: user?.business_type || '',
      country: user?.country || '',
      city: user?.city || '',
      gender: user?.gender || '',
      industry: user?.industry || '',
      company_size: user?.company_size || '',
      website: user?.website || '',
      monthly_budget: user?.monthly_budget || '',
      target_audience: user?.target_audience || '',
      current_challenges: user?.current_challenges || '',
      goals: user?.goals || '',
      competitors: user?.competitors || '',
      social_platforms: user?.social_platforms || ''
    });
  }, [user]);

  const handleProfileUpdate = async () => {
    const success = await onUpdateProfile(profileForm);
    if (success) {
      setEditingProfile(false);
      setShowProfileModal(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      // تحويل الصورة إلى Base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result;
        
        // تحديث الصورة في النموذج
        setProfileForm({ ...profileForm, avatar_url: base64String });
        
        // حفظ الصورة مباشرة (اختياري - لو عايز تحفظ فوراً)
        // await onUpdateProfile({ avatar_url: base64String });
        
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadingImage(false);
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

  // تنسيق التاريخ للعرض
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(
      language === 'ar' ? 'ar-EG' : 'en-US',
      { year: 'numeric', month: 'long', day: 'numeric' }
    );
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
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingProfile 
                ? (language === 'ar' ? 'تعديل الملف الشخصي' : 'Edit Profile')
                : (language === 'ar' ? 'الملف الشخصي' : 'Profile')
              }
            </DialogTitle>
          </DialogHeader>
          
          {!editingProfile ? (
            // عرض الملف الشخصي (كل البيانات)
            <div className="space-y-6 py-4">
              {/* صورة البروفايل */}
              <div className="flex justify-center">
                {user?.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt={user.full_name} 
                    className="w-32 h-32 rounded-full object-cover border-4 border-[#1995AD]/20"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#1995AD] to-[#A1D6E2] flex items-center justify-center text-white text-4xl font-bold">
                    {getInitials(user?.full_name)}
                  </div>
                )}
              </div>

              {/* بيانات المستخدم الأساسية */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">{language === 'ar' ? 'الاسم الكامل' : 'Full Name'}</Label>
                  <p className="text-slate-900 dark:text-white p-2 bg-slate-100 dark:bg-slate-800 rounded">
                    {user?.full_name || '-'}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Email</Label>
                  <p className="text-slate-900 dark:text-white p-2 bg-slate-100 dark:bg-slate-800 rounded">
                    {user?.email || '-'}
                  </p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">{language === 'ar' ? 'رقم الهاتف' : 'Phone'}</Label>
                  <p className="text-slate-900 dark:text-white p-2 bg-slate-100 dark:bg-slate-800 rounded">
                    {user?.phone || '-'}
                  </p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">{language === 'ar' ? 'تاريخ الميلاد' : 'Birth Date'}</Label>
                  <p className="text-slate-900 dark:text-white p-2 bg-slate-100 dark:bg-slate-800 rounded">
                    {user?.birth_date ? formatDate(user.birth_date) : '-'}
                  </p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">{language === 'ar' ? 'النوع' : 'Gender'}</Label>
                  <p className="text-slate-900 dark:text-white p-2 bg-slate-100 dark:bg-slate-800 rounded">
                    {user?.gender === 'male' ? (language === 'ar' ? 'ذكر' : 'Male') : 
                     user?.gender === 'female' ? (language === 'ar' ? 'أنثى' : 'Female') : '-'}
                  </p>
                </div>
              </div>

              {/* بيانات العمل */}
              {(user?.business_name || user?.industry || user?.company_size) && (
                <>
                  <h3 className="font-semibold text-slate-900 dark:text-white pt-2 border-t">
                    {language === 'ar' ? 'معلومات العمل' : 'Business Information'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {user?.business_name && (
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-500">{language === 'ar' ? 'اسم الشركة' : 'Company Name'}</Label>
                        <p className="text-slate-900 dark:text-white p-2 bg-slate-100 dark:bg-slate-800 rounded">
                          {user.business_name}
                        </p>
                      </div>
                    )}
                    
                    {user?.industry && (
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-500">{language === 'ar' ? 'المجال' : 'Industry'}</Label>
                        <p className="text-slate-900 dark:text-white p-2 bg-slate-100 dark:bg-slate-800 rounded">
                          {user.industry}
                        </p>
                      </div>
                    )}

                    {user?.company_size && (
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-500">{language === 'ar' ? 'حجم الشركة' : 'Company Size'}</Label>
                        <p className="text-slate-900 dark:text-white p-2 bg-slate-100 dark:bg-slate-800 rounded">
                          {user.company_size}
                        </p>
                      </div>
                    )}

                    {user?.website && (
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-500">{language === 'ar' ? 'الموقع الإلكتروني' : 'Website'}</Label>
                        <p className="text-slate-900 dark:text-white p-2 bg-slate-100 dark:bg-slate-800 rounded">
                          <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-[#1995AD] hover:underline">
                            {user.website}
                          </a>
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* الموقع */}
              {(user?.country || user?.city) && (
                <>
                  <h3 className="font-semibold text-slate-900 dark:text-white pt-2 border-t">
                    {language === 'ar' ? 'الموقع' : 'Location'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {user?.country && (
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-500">{language === 'ar' ? 'الدولة' : 'Country'}</Label>
                        <p className="text-slate-900 dark:text-white p-2 bg-slate-100 dark:bg-slate-800 rounded">
                          {user.country}
                        </p>
                      </div>
                    )}
                    
                    {user?.city && (
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-500">{language === 'ar' ? 'المدينة' : 'City'}</Label>
                        <p className="text-slate-900 dark:text-white p-2 bg-slate-100 dark:bg-slate-800 rounded">
                          {user.city}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* أهداف وتحديات */}
              {(user?.goals || user?.current_challenges || user?.target_audience) && (
                <>
                  <h3 className="font-semibold text-slate-900 dark:text-white pt-2 border-t">
                    {language === 'ar' ? 'الأهداف والتحديات' : 'Goals & Challenges'}
                  </h3>
                  <div className="space-y-4">
                    {user?.goals && (
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-500">{language === 'ar' ? 'الأهداف' : 'Goals'}</Label>
                        <p className="text-slate-900 dark:text-white p-2 bg-slate-100 dark:bg-slate-800 rounded">
                          {user.goals}
                        </p>
                      </div>
                    )}
                    
                    {user?.current_challenges && (
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-500">{language === 'ar' ? 'التحديات الحالية' : 'Current Challenges'}</Label>
                        <p className="text-slate-900 dark:text-white p-2 bg-slate-100 dark:bg-slate-800 rounded">
                          {user.current_challenges}
                        </p>
                      </div>
                    )}

                    {user?.target_audience && (
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-500">{language === 'ar' ? 'الجمهور المستهدف' : 'Target Audience'}</Label>
                        <p className="text-slate-900 dark:text-white p-2 bg-slate-100 dark:bg-slate-800 rounded">
                          {user.target_audience}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            // نموذج تعديل الملف الشخصي
            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
              {/* صورة البروفايل مع إمكانية التعديل */}
              <div className="flex justify-center">
                <div className="relative">
                  {profileForm.avatar_url ? (
                    <img 
                      src={profileForm.avatar_url} 
                      alt="Avatar" 
                      className="w-32 h-32 rounded-full object-cover border-4 border-[#1995AD]/20"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#1995AD] to-[#A1D6E2] flex items-center justify-center text-white text-4xl font-bold">
                      {getInitials(profileForm.full_name)}
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="absolute bottom-0 right-0 w-10 h-10 bg-[#1995AD] rounded-full flex items-center justify-center hover:bg-[#148095] transition-colors disabled:opacity-50"
                  >
                    {uploadingImage ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5 text-white" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label>{language === 'ar' ? 'النوع' : 'Gender'}</Label>
                  <select
                    value={profileForm.gender}
                    onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <option value="">{language === 'ar' ? 'اختر' : 'Select'}</option>
                    <option value="male">{language === 'ar' ? 'ذكر' : 'Male'}</option>
                    <option value="female">{language === 'ar' ? 'أنثى' : 'Female'}</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'اسم الشركة' : 'Company Name'}</Label>
                  <Input
                    value={profileForm.business_name}
                    onChange={(e) => setProfileForm({ ...profileForm, business_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'نوع النشاط' : 'Business Type'}</Label>
                  <Input
                    value={profileForm.business_type}
                    onChange={(e) => setProfileForm({ ...profileForm, business_type: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'المجال' : 'Industry'}</Label>
                  <Input
                    value={profileForm.industry}
                    onChange={(e) => setProfileForm({ ...profileForm, industry: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'حجم الشركة' : 'Company Size'}</Label>
                  <select
                    value={profileForm.company_size}
                    onChange={(e) => setProfileForm({ ...profileForm, company_size: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <option value="">{language === 'ar' ? 'اختر' : 'Select'}</option>
                    <option value="1-10">1-10</option>
                    <option value="11-50">11-50</option>
                    <option value="51-200">51-200</option>
                    <option value="201-500">201-500</option>
                    <option value="500+">500+</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'الموقع الإلكتروني' : 'Website'}</Label>
                  <Input
                    value={profileForm.website}
                    onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                    placeholder="https://example.com"
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

              <div className="space-y-2">
                <Label>{language === 'ar' ? 'الجمهور المستهدف' : 'Target Audience'}</Label>
                <Input
                  value={profileForm.target_audience}
                  onChange={(e) => setProfileForm({ ...profileForm, target_audience: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>{language === 'ar' ? 'التحديات الحالية' : 'Current Challenges'}</Label>
                <Input
                  value={profileForm.current_challenges}
                  onChange={(e) => setProfileForm({ ...profileForm, current_challenges: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>{language === 'ar' ? 'الأهداف' : 'Goals'}</Label>
                <Input
                  value={profileForm.goals}
                  onChange={(e) => setProfileForm({ ...profileForm, goals: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>{language === 'ar' ? 'المنافسون' : 'Competitors'}</Label>
                <Input
                  value={profileForm.competitors}
                  onChange={(e) => setProfileForm({ ...profileForm, competitors: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>{language === 'ar' ? 'منصات التواصل الاجتماعي' : 'Social Media'}</Label>
                <Input
                  value={profileForm.social_platforms}
                  onChange={(e) => setProfileForm({ ...profileForm, social_platforms: e.target.value })}
                  placeholder={language === 'ar' ? 'مثال: Instagram, LinkedIn' : 'e.g. Instagram, LinkedIn'}
                />
              </div>

              <div className="space-y-2">
                <Label>{language === 'ar' ? 'الميزانية الشهرية' : 'Monthly Budget'}</Label>
                <Input
                  value={profileForm.monthly_budget}
                  onChange={(e) => setProfileForm({ ...profileForm, monthly_budget: e.target.value })}
                  placeholder="e.g. 5000 USD"
                />
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2">
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
                      business_type: user?.business_type || '',
                      country: user?.country || '',
                      city: user?.city || '',
                      gender: user?.gender || '',
                      industry: user?.industry || '',
                      company_size: user?.company_size || '',
                      website: user?.website || '',
                      monthly_budget: user?.monthly_budget || '',
                      target_audience: user?.target_audience || '',
                      current_challenges: user?.current_challenges || '',
                      goals: user?.goals || '',
                      competitors: user?.competitors || '',
                      social_platforms: user?.social_platforms || ''
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

