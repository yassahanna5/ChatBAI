// src/pages/Plans.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Zap, ArrowLeft, Loader2, AlertCircle, CreditCard } from 'lucide-react';

// استيراد جميع الدوال من base44Client
import { 
  fetchPlans, 
  fetchSubscriptions,
  createSubscription,
  updateSubscription,
  createNotification,
  createActivityLog,
  checkAuth 
} from '@/api/base44Client';

// استيراد المكونات
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/components/LanguageContext';
import { createPageUrl } from '@/utils';

// روابط الدفع المباشرة من PayPal
const PAYPAL_SUBSCRIPTION_LINKS = {
  starter: 'https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-0F579510S2934014XNGLV4MQ',
  professional: 'https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-0AH73100CS833334CNGLV6XY',
  pro: 'https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-31815547WW6875814NGLWAHQ',
  enterprise: 'https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-97834349U9403535ENGLWBFI'
};

export default function Plans() {
  const navigate = useNavigate();
  const { t, language, isRtl } = useLanguage();
  
  // حالات الصفحة
  const [plans, setPlans] = useState([]);
  const [user, setUser] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscribing, setSubscribing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // تحميل البيانات عند بدء الصفحة
  useEffect(() => {
    loadData();
  }, []);

  // دالة تحميل البيانات
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('بدء تحميل البيانات...');
      
      // 1. التحقق من المستخدم
      const currentUser = await checkAuth();
      console.log('المستخدم الحالي:', currentUser);
      setUser(currentUser);

      // 2. جلب جميع الخطط النشطة
      console.log('جاري جلب الخطط...');
      const allPlans = await fetchPlans({ is_active: true });
      console.log('الخطط المستلمة:', allPlans);
      
      // ترتيب الخطط حسب حقل order
      const sortedPlans = allPlans.sort((a, b) => (a.order || 0) - (b.order || 0));
      setPlans(sortedPlans);

      // 3. جلب اشتراكات المستخدم إذا كان موجوداً
      if (currentUser?.email) {
        console.log('جاري جلب اشتراكات المستخدم:', currentUser.email);
        const subscriptions = await fetchSubscriptions({ 
          user_email: currentUser.email, 
          status: 'active' 
        });
        
        console.log('الاشتراكات المستلمة:', subscriptions);
        
        if (subscriptions.length > 0) {
          setCurrentSubscription(subscriptions[0]);
        }
      }

    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
      setError(language === 'ar' 
        ? 'حدث خطأ في تحميل البيانات' 
        : 'Error loading data'
      );
    } finally {
      setLoading(false);
    }
  };

  // دالة فتح رابط الدفع المباشر
  const handleSubscribeClick = (plan) => {
    if (!user) {
      alert(language === 'ar' ? 'يرجى تسجيل الدخول أولاً' : 'Please login first');
      return;
    }

    if (currentSubscription && currentSubscription.plan_id !== 'free') {
      alert(language === 'ar' 
        ? 'لديك اشتراك نشط بالفعل' 
        : 'You already have an active subscription'
      );
      return;
    }

    // 🔍 للتشخيص - شوف قيمة plan.id
    console.log('🔍 Selected plan ID:', plan.id);
    console.log('🔍 Available links:', Object.keys(PAYPAL_SUBSCRIPTION_LINKS));
    
    // محاولة الحصول على الرابط بعدة طرق
    let paypalLink = PAYPAL_SUBSCRIPTION_LINKS[plan.id];
    
    // إذا لم يجد، جرب بأسماء بديلة
    if (!paypalLink) {
      // خريطة للأسماء البديلة
      const alternativeNames = {
        'starter': ['starter', 'basic', 'Starter'],
        'professional': ['professional', 'Professional', 'pro'],
        'pro': ['pro', 'Pro', 'professional'],
        'enterprise': ['enterprise', 'Enterprise', 'business']
      };
      
      // ابحث في الأسماء البديلة
      for (const [key, alternatives] of Object.entries(alternativeNames)) {
        if (alternatives.includes(plan.id) || alternatives.includes(plan.name_en?.toLowerCase())) {
          paypalLink = PAYPAL_SUBSCRIPTION_LINKS[key];
          console.log(`✅ Found alternative match: ${key} for ${plan.id}`);
          break;
        }
      }
    }
    
    if (!paypalLink) {
      console.error('❌ No PayPal link found for plan:', plan);
      alert(language === 'ar' 
        ? `رابط الدفع غير متوفر لهذه الخطة: ${plan.id} - ${plan.name_en}` 
        : `Payment link not available for this plan: ${plan.id} - ${plan.name_en}`
      );
      return;
    }

    // فتح نافذة الدفع
    window.open(paypalLink, '_blank');
    
    alert(language === 'ar' 
      ? '✅ تم فتح صفحة الدفع. بعد إتمام الدفع، ارجع إلى الموقع وسيتم تفعيل اشتراكك تلقائياً.' 
      : '✅ Payment page opened. After completing payment, return to the site and your subscription will be activated automatically.'
    );
    
    setSelectedPlan(plan);
    
    // هنا يمكنك إضافة منطق للتحقق من الدفع بعد العودة
    // (سيحتاج إلى webhook من PayPal)
  };

  // عرض شاشة التحميل
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F1F1F2] via-white to-[#A1D6E2]/20 dark:from-slate-950 dark:via-slate-900 dark:to-[#1995AD]/20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#1995AD] mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">
            {language === 'ar' ? 'جاري تحميل الباقات...' : 'Loading plans...'}
          </p>
        </div>
      </div>
    );
  }

  // عرض رسالة خطأ
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F1F1F2] via-white to-[#A1D6E2]/20 dark:from-slate-950 dark:via-slate-900 dark:to-[#1995AD]/20">
        <div className="text-center max-w-md mx-auto p-6 bg-white dark:bg-slate-800 rounded-xl shadow-xl">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {language === 'ar' ? 'خطأ' : 'Error'}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
          <Button onClick={loadData}>
            {language === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-[#F1F1F2] via-white to-[#A1D6E2]/20 dark:from-slate-950 dark:via-slate-900 dark:to-[#1995AD]/20 py-12 px-6 ${isRtl ? 'rtl' : 'ltr'}`}>
      <div className="max-w-6xl mx-auto">
        
        {/* رسالة نجاح */}
        <AnimatePresence>
          {paymentSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
            >
              <Check className="w-5 h-5" />
              {language === 'ar' ? 'تم الاشتراك بنجاح!' : 'Subscription successful!'}
            </motion.div>
          )}
        </AnimatePresence>

        {/* زر العودة */}
        <button
          onClick={() => navigate(createPageUrl('Chat'))}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-8 transition-colors group"
        >
          <ArrowLeft className={`w-5 h-5 transition-transform group-hover:-translate-x-1 ${isRtl ? 'rotate-180 group-hover:translate-x-1' : ''}`} />
          {language === 'ar' ? 'العودة للمحادثة' : 'Back to Chat'}
        </button>

        {/* معلومات المستخدم */}
        {user && (
          <div className="mb-4 text-right">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {language === 'ar' ? 'مرحباً' : 'Welcome'}, {user.email}
            </p>
          </div>
        )}

        {/* العنوان */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            {language === 'ar' ? 'اختر الباقة المناسبة لك' : 'Choose Your Plan'}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            {language === 'ar' 
              ? 'كل 2 نقاط = سؤال واحد. اختر الباقة التي تناسب احتياجاتك.'
              : 'Every 2 credits = 1 question. Choose the plan that fits your needs.'}
          </p>
        </div>

        {/* عرض الخطط */}
        {plans.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 dark:text-slate-400">
              {language === 'ar' 
                ? 'لا توجد خطط متاحة حالياً' 
                : 'No plans available at the moment'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan, index) => {
              const isCurrentPlan = currentSubscription?.plan_id === plan.id;
              const isYearly = plan.billing_cycle === 'yearly';
              
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <Card className={`relative overflow-hidden h-full flex flex-col ${
                    isYearly 
                      ? 'border-2 border-[#1995AD] shadow-xl shadow-[#1995AD]/20' 
                      : 'border border-slate-200 dark:border-slate-700 hover:border-[#1995AD]/50 transition-colors'
                  } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}>
                    
                    {/* شارة "الأفضل قيمة" للخطط السنوية */}
                    {isYearly && !isCurrentPlan && (
                      <div className="absolute top-0 right-0 bg-gradient-to-r from-[#1995AD] to-[#A1D6E2] text-white text-xs px-3 py-1 rounded-bl-lg">
                        {language === 'ar' ? 'الأفضل قيمة' : 'Best Value'}
                      </div>
                    )}
                    
                    {/* شارة "الباقة الحالية" */}
                    {isCurrentPlan && (
                      <div className="absolute top-0 left-0 bg-green-500 text-white text-xs px-3 py-1 rounded-br-lg">
                        {language === 'ar' ? 'باقتك الحالية' : 'Current Plan'}
                      </div>
                    )}
                    
                    <div className="p-6 flex-1">
                      {/* اسم الخطة */}
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                        {language === 'ar' ? plan.name_ar : plan.name_en}
                      </h3>
                      
                      {/* السعر */}
                      <div className="flex items-baseline gap-1 mb-4">
                        <span className="text-4xl font-bold text-slate-900 dark:text-white">
                          ${plan.price}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">
                          /{plan.billing_cycle === 'yearly' 
                            ? (language === 'ar' ? 'سنوياً' : 'year') 
                            : (language === 'ar' ? 'شهرياً' : 'month')}
                        </span>
                      </div>

                      {/* المميزات الأساسية */}
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-2 text-sm">
                          <Zap className="w-4 h-4 text-[#1995AD]" />
                          <span className="text-slate-700 dark:text-slate-300">
                            {plan.credits} {language === 'ar' ? 'نقطة' : 'credits'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-500" />
                          <span className="text-slate-700 dark:text-slate-300">
                            {Math.floor(plan.credits / 2)} {language === 'ar' ? 'سؤال' : 'questions'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-500" />
                          <span className="text-slate-700 dark:text-slate-300">
                            {plan.tokens_per_question} {language === 'ar' ? 'توكن لكل سؤال' : 'tokens/question'}
                          </span>
                        </div>
                      </div>

                      {/* المميزات التفصيلية */}
                      <div className="space-y-2 mb-4">
                        {(language === 'ar' ? plan.features_ar : plan.features_en)?.map((feature, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* زر الاشتراك */}
                    <div className="p-6 pt-0">
                      <Button
                        onClick={() => handleSubscribeClick(plan)}
                        disabled={isCurrentPlan || subscribing}
                        className={`w-full ${
                          isCurrentPlan 
                            ? 'bg-green-500 hover:bg-green-600 text-white cursor-default' 
                            : isYearly
                              ? 'bg-[#1995AD] hover:bg-[#1995AD]/90 text-white'
                              : 'border-[#1995AD] text-[#1995AD] hover:bg-[#1995AD] hover:text-white'
                        }`}
                        variant={isYearly && !isCurrentPlan ? 'default' : 'outline'}
                      >
                        {subscribing && selectedPlan?.id === plan.id ? (
                          <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                        ) : isCurrentPlan ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            {language === 'ar' ? 'مشترك حالياً' : 'Subscribed'}
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4 mr-2" />
                            {language === 'ar' ? 'اشترك عبر PayPal' : 'Subscribe with PayPal'}
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}