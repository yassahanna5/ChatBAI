import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, LogIn, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { signInWithEmail } from '@/lib/firebase';

export default function SignIn() {
  const navigate = useNavigate();
  const { t, language, isRtl } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSignIn = async (e) => {
    e.preventDefault();
    
    // ✅ تنظيف البيانات قبل الإرسال
    const email = formData.email.trim().toLowerCase();
    const password = formData.password.trim();
    
    if (!email || !password) {
      setError(language === 'ar' ? 'البريد الإلكتروني وكلمة المرور مطلوبان' : 'Email and password are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔑 Attempting sign in with:', email);
      
      const result = await signInWithEmail(email, password);
      
      if (result.success) {
        console.log('✅ Sign in successful:', result.user);  // 👈 result.user مش result.profile
        
        // تخزين بيانات المستخدم في sessionStorage
        sessionStorage.setItem('currentUser', JSON.stringify({
          email: result.user.email,
          full_name: result.user.full_name,
          id: result.user.id,
          role: result.user.role || 'user'
        }));
        
        alert(language === 'ar' 
          ? `مرحباً ${result.user.full_name}! تم تسجيل الدخول بنجاح.` 
          : `Welcome ${result.user.full_name}! You have successfully signed in.`);
        
        // توجيه الأدمن للوحة التحكم والمستخدم العادي للدردشة
        if (result.user.role === 'admin') {
          navigate(createPageUrl('Admin'));
        } else {
          navigate(createPageUrl('Chat'));
        }
      } else {
        setError(result.error || (language === 'ar' ? 'بريد إلكتروني أو كلمة مرور غير صحيحة' : 'Invalid email or password'));
      }
    } catch (error) {
      console.error('❌ Sign in error:', error);
      setError(language === 'ar' ? 'حدث خطأ في تسجيل الدخول' : 'An error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-[#F1F1F2] via-white to-[#A1D6E2]/20 dark:from-slate-950 dark:via-slate-900 dark:to-[#1995AD]/20 py-12 px-6 ${isRtl ? 'rtl' : 'ltr'}`}>
      <div className="max-w-md mx-auto">
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
            <span className="text-2xl font-bold bg-gradient-to-r from-[#1995AD] to-[#A1D6E2] bg-clip-text text-transparent">
              ChatBAI
            </span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            {t('signIn')}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {language === 'ar' ? 'سجل دخولك للوصول إلى لوحة التحكم' : 'Sign in to access your dashboard'}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="w-5 h-5" />
              {t('signIn')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-6">
              
              {/* عرض رسالة الخطأ إن وجدت */}
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">{t('email')} *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={language === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('password')} *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={language === 'ar' ? 'أدخل كلمة المرور' : 'Enter your password'}
                  disabled={loading}
                  required
                />
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#1995AD] hover:bg-[#1995AD]/90 h-12 text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    {language === 'ar' ? 'جاري تسجيل الدخول...' : 'Signing in...'}
                  </>
                ) : (
                  t('signIn')
                )}
              </Button>

              <div className="text-center pt-4 border-t">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {language === 'ar' ? 'ليس لديك حساب؟' : "Don't have an account?"}{' '}
                  <button
                    type="button"
                    onClick={() => navigate(createPageUrl('Register'))}
                    className="text-[#1995AD] hover:text-[#1995AD]/80 font-medium"
                  >
                    {t('signUp')}
                  </button>
                </p>
              </div>

            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
