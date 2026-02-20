import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, User, Building2, Upload, Loader2, Save } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

export default function Profile() {
  const navigate = useNavigate();
  const { t, language, isRtl } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [businessProfile, setBusinessProfile] = useState(null);
  const [avatar, setAvatar] = useState(null);

  const [userForm, setUserForm] = useState({
    full_name: '',
    phone: '',
    birth_date: '',
    gender: ''
  });

  const [businessForm, setBusinessForm] = useState({
    business_name: '',
    business_type: '',
    industry: '',
    country: '',
    city: '',
    company_size: '',
    website: '',
    social_platforms: [],
    current_challenges: '',
    goals: '',
    monthly_budget: '',
    target_audience: '',
    competitors: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setUserForm({
        full_name: currentUser.full_name || '',
        phone: currentUser.phone || '',
        birth_date: currentUser.birth_date || '',
        gender: currentUser.gender || ''
      });
      setAvatar(currentUser.avatar_url);

      const profiles = await base44.entities.BusinessProfile.filter({ user_email: currentUser.email });
      if (profiles.length > 0) {
        setBusinessProfile(profiles[0]);
        setBusinessForm({
          business_name: profiles[0].business_name || '',
          business_type: profiles[0].business_type || '',
          industry: profiles[0].industry || '',
          country: profiles[0].country || '',
          city: profiles[0].city || '',
          company_size: profiles[0].company_size || '',
          website: profiles[0].website || '',
          social_platforms: profiles[0].social_platforms || [],
          current_challenges: profiles[0].current_challenges || '',
          goals: profiles[0].goals || '',
          monthly_budget: profiles[0].monthly_budget || '',
          target_audience: profiles[0].target_audience || '',
          competitors: profiles[0].competitors || ''
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setAvatar(file_url);
        await base44.auth.updateMe({ avatar_url: file_url });
      } catch (error) {
        console.error('Error uploading:', error);
      }
    }
  };

  const handleSaveUser = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe(userForm);
      await base44.entities.ActivityLog.create({
        user_email: user.email,
        action: 'profile_update',
        details: 'Updated personal profile'
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBusiness = async () => {
    setSaving(true);
    try {
      if (businessProfile) {
        await base44.entities.BusinessProfile.update(businessProfile.id, businessForm);
      } else {
        await base44.entities.BusinessProfile.create({
          ...businessForm,
          user_email: user.email
        });
      }
      await base44.entities.ActivityLog.create({
        user_email: user.email,
        action: 'profile_update',
        details: 'Updated business profile'
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
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
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(createPageUrl('Chat'))}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
          {language === 'ar' ? 'العودة' : 'Back'}
        </button>

        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">{t('profile')}</h1>

        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="bg-white dark:bg-slate-800 p-1 rounded-lg">
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {language === 'ar' ? 'الملف الشخصي' : 'Personal'}
            </TabsTrigger>
            <TabsTrigger value="business" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              {t('businessSetup')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>{language === 'ar' ? 'المعلومات الشخصية' : 'Personal Information'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1995AD] to-[#A1D6E2] flex items-center justify-center overflow-hidden">
                      {avatar ? (
                        <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl text-white font-semibold">
                          {userForm.full_name?.[0]?.toUpperCase() || 'U'}
                        </span>
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 w-8 h-8 bg-[#1995AD] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#1995AD]/90 transition-colors">
                      <Upload className="w-4 h-4 text-white" />
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    </label>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{userForm.full_name}</p>
                    <p className="text-sm text-slate-500">{user?.email}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('fullName')}</Label>
                    <Input
                      value={userForm.full_name}
                      onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('phone')}</Label>
                    <Input
                      value={userForm.phone}
                      onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('birthDate')}</Label>
                    <Input
                      type="date"
                      value={userForm.birth_date}
                      onChange={(e) => setUserForm({ ...userForm, birth_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('gender')}</Label>
                    <Select value={userForm.gender} onValueChange={(v) => setUserForm({ ...userForm, gender: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">{t('male')}</SelectItem>
                        <SelectItem value="female">{t('female')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={handleSaveUser} disabled={saving} className="bg-[#1995AD] hover:bg-[#1995AD]/90">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  {t('save')}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="business">
            <Card>
              <CardHeader>
                <CardTitle>{t('businessSetup')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('businessName')}</Label>
                    <Input
                      value={businessForm.business_name}
                      onChange={(e) => setBusinessForm({ ...businessForm, business_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('businessType')}</Label>
                    <Input
                      value={businessForm.business_type}
                      onChange={(e) => setBusinessForm({ ...businessForm, business_type: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('industry')}</Label>
                    <Input
                      value={businessForm.industry}
                      onChange={(e) => setBusinessForm({ ...businessForm, industry: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('country')}</Label>
                    <Input
                      value={businessForm.country}
                      onChange={(e) => setBusinessForm({ ...businessForm, country: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('city')}</Label>
                    <Input
                      value={businessForm.city}
                      onChange={(e) => setBusinessForm({ ...businessForm, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('companySize')}</Label>
                    <Select value={businessForm.company_size} onValueChange={(v) => setBusinessForm({ ...businessForm, company_size: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1-10</SelectItem>
                        <SelectItem value="11-50">11-50</SelectItem>
                        <SelectItem value="51-200">51-200</SelectItem>
                        <SelectItem value="201-500">201-500</SelectItem>
                        <SelectItem value="500+">500+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('website')}</Label>
                    <Input
                      value={businessForm.website}
                      onChange={(e) => setBusinessForm({ ...businessForm, website: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('monthlyBudget')}</Label>
                    <Input
                      value={businessForm.monthly_budget}
                      onChange={(e) => setBusinessForm({ ...businessForm, monthly_budget: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('targetAudience')}</Label>
                  <Textarea
                    value={businessForm.target_audience}
                    onChange={(e) => setBusinessForm({ ...businessForm, target_audience: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('currentChallenges')}</Label>
                  <Textarea
                    value={businessForm.current_challenges}
                    onChange={(e) => setBusinessForm({ ...businessForm, current_challenges: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('goals')}</Label>
                  <Textarea
                    value={businessForm.goals}
                    onChange={(e) => setBusinessForm({ ...businessForm, goals: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('competitors')}</Label>
                  <Textarea
                    value={businessForm.competitors}
                    onChange={(e) => setBusinessForm({ ...businessForm, competitors: e.target.value })}
                    rows={3}
                  />
                </div>

                <Button onClick={handleSaveBusiness} disabled={saving} className="bg-[#1995AD] hover:bg-[#1995AD]/90">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  {t('saveProfile')}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}