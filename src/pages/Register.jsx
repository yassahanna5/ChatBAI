import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Bot, ArrowRight, ArrowLeft, Home } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

export default function Register() {
  const navigate = useNavigate();
  const { t, language, isRtl } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  const [personalData, setPersonalData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    gender: ''
  });

  const [businessData, setBusinessData] = useState({
    business_name: '',
    business_type: '',
    industry: '',
    country: '',
    city: '',
    company_size: '',
    website: '',
    social_platforms: '',
    current_challenges: '',
    goals: '',
    monthly_budget: '',
    target_audience: '',
    competitors: ''
  });

  const handleRegister = async () => {
    if (!personalData.email || !personalData.password || !personalData.full_name) {
      alert(language === 'ar' ? 'يرجى إدخال جميع البيانات المطلوبة' : 'Please fill all required fields');
      return;
    }

    // Validate business data
    if (!businessData.business_name || !businessData.business_type || !businessData.industry || 
        !businessData.country || !businessData.city || !businessData.company_size || 
        !businessData.monthly_budget || !businessData.target_audience || 
        !businessData.current_challenges || !businessData.goals || !businessData.competitors) {
      alert(language === 'ar' ? 'يرجى إكمال جميع بيانات الشركة المطلوبة' : 'Please complete all required company fields');
      return;
    }

    setLoading(true);
    try {
      // Store only business data and non-sensitive personal info temporarily
      const registrationData = {
        personal: {
          full_name: personalData.full_name,
          phone: personalData.phone,
          gender: personalData.gender
        },
        business: businessData,
        timestamp: new Date().toISOString()
      };
      
      // Store data WITHOUT password for security
      localStorage.setItem('pendingRegistration', JSON.stringify(registrationData));
      
      alert(language === 'ar' 
        ? 'تم حفظ بياناتك. سيتم توجيهك لإنشاء الحساب.'
        : 'Your data has been saved. You will be redirected to create account.');
      
      // Redirect to Base44 auth system
      base44.auth.redirectToLogin(createPageUrl('Chat'));
      
    } catch (error) {
      console.error('Error:', error);
      alert(language === 'ar' ? 'حدث خطأ' : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-[#F1F1F2] via-white to-[#A1D6E2]/20 dark:from-slate-950 dark:via-slate-900 dark:to-[#1995AD]/20 py-12 px-6 ${isRtl ? 'rtl' : 'ltr'}`}>
      <div className="max-w-2xl mx-auto">
        {/* زر العودة إلى الصفحة الرئيسية */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-8 transition-colors group"
        >
          <ArrowLeft className={`w-5 h-5 transition-transform group-hover:-translate-x-1 ${isRtl ? 'rotate-180 group-hover:translate-x-1' : ''}`} />
          {language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <img
              src="/assets/images/logo.jpg" 
              alt="ChatBAI Logo"
              className="w-12 h-12 object-contain rounded-lg"
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-[#1995AD] to-[#A1D6E2] bg-clip-text text-transparent">
              ChatBAI
            </span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            {step === 1 ? t('createAccount') : (language === 'ar' ? 'بيانات الشركة' : 'Company Data')}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {language === 'ar' ? 'املأ بياناتك للبدء' : 'Fill your details to get started'}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{step === 1 ? (language === 'ar' ? 'البيانات الشخصية' : 'Personal Information') : t('businessSetup')}</span>
              <span className="text-sm text-slate-500">
                {language === 'ar' ? `الخطوة ${step} من 2` : `Step ${step} of 2`}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 1 ? (
              <>
                <div className="space-y-2">
                  <Label>{t('fullName')} *</Label>
                  <Input
                    value={personalData.full_name}
                    onChange={(e) => setPersonalData({ ...personalData, full_name: e.target.value })}
                    placeholder={language === 'ar' ? 'أدخل الاسم الكامل' : 'Enter full name'}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('email')} *</Label>
                  <Input
                    type="email"
                    value={personalData.email}
                    onChange={(e) => setPersonalData({ ...personalData, email: e.target.value })}
                    placeholder={language === 'ar' ? 'أدخل البريد الإلكتروني' : 'Enter email'}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('password')} *</Label>
                  <Input
                    type="password"
                    value={personalData.password}
                    onChange={(e) => setPersonalData({ ...personalData, password: e.target.value })}
                    placeholder={language === 'ar' ? 'أدخل كلمة المرور' : 'Enter password'}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('phone')}</Label>
                  <Input
                    value={personalData.phone}
                    onChange={(e) => setPersonalData({ ...personalData, phone: e.target.value })}
                    placeholder={language === 'ar' ? 'أدخل رقم الهاتف' : 'Enter phone number'}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('gender')}</Label>
                  <Select value={personalData.gender} onValueChange={(v) => setPersonalData({ ...personalData, gender: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'ar' ? 'اختر النوع' : 'Select gender'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">{t('male')}</SelectItem>
                      <SelectItem value="female">{t('female')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={() => setStep(2)} className="w-full bg-[#1995AD] hover:bg-[#1995AD]/90">
                  {language === 'ar' ? 'التالي' : 'Next'}
                  <ArrowRight className={`w-4 h-4 ${isRtl ? 'mr-2 rotate-180' : 'ml-2'}`} />
                </Button>
              </>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('businessName')} *</Label>
                    <Input
                      required
                      value={businessData.business_name}
                      onChange={(e) => setBusinessData({ ...businessData, business_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('businessType')} *</Label>
                    <Input
                      required
                      value={businessData.business_type}
                      onChange={(e) => setBusinessData({ ...businessData, business_type: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('industry')} *</Label>
                    <Input
                      required
                      value={businessData.industry}
                      onChange={(e) => setBusinessData({ ...businessData, industry: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('country')} *</Label>
                    <Input
                      required
                      value={businessData.country}
                      onChange={(e) => setBusinessData({ ...businessData, country: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('city')} *</Label>
                    <Input
                      required
                      value={businessData.city}
                      onChange={(e) => setBusinessData({ ...businessData, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('companySize')} *</Label>
                    <Select required value={businessData.company_size} onValueChange={(v) => setBusinessData({ ...businessData, company_size: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'ar' ? 'اختر الحجم' : 'Select size'} />
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
                      value={businessData.website}
                      onChange={(e) => setBusinessData({ ...businessData, website: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('monthlyBudget')} *</Label>
                    <Input
                      required
                      value={businessData.monthly_budget}
                      onChange={(e) => setBusinessData({ ...businessData, monthly_budget: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('targetAudience')} *</Label>
                  <Textarea
                    required
                    value={businessData.target_audience}
                    onChange={(e) => setBusinessData({ ...businessData, target_audience: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('currentChallenges')} *</Label>
                  <Textarea
                    required
                    value={businessData.current_challenges}
                    onChange={(e) => setBusinessData({ ...businessData, current_challenges: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('goals')} *</Label>
                  <Textarea
                    required
                    value={businessData.goals}
                    onChange={(e) => setBusinessData({ ...businessData, goals: e.target.value })}
                    placeholder={language === 'ar' ? 'مبيعات، براند، عملاء...' : 'Sales, Brand, Customers...'}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('competitors')} *</Label>
                  <Textarea
                    required
                    value={businessData.competitors}
                    onChange={(e) => setBusinessData({ ...businessData, competitors: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    <ArrowLeft className={`w-4 h-4 ${isRtl ? 'ml-2 rotate-180' : 'mr-2'}`} />
                    {language === 'ar' ? 'السابق' : 'Back'}
                  </Button>
                  <Button onClick={handleRegister} disabled={loading} className="flex-1 bg-[#1995AD] hover:bg-[#1995AD]/90">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {t('createAccount')}
                  </Button>
                </div>
              </>
            )}

            <div className="text-center pt-4 border-t">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t('alreadyHaveAccount')}{' '}
                <button
                  onClick={() => base44.auth.redirectToLogin(createPageUrl('Chat'))}
                  className="text-[#1995AD] hover:text-[#1995AD]/80 font-medium"
                >
                  {t('signIn')}
                </button>
              </p>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}