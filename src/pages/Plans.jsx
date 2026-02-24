// src/pages/Plans.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Zap, ArrowLeft, Loader2, AlertCircle, CreditCard } from 'lucide-react';

// استيراد دوال Firebase
import { 
  getAllPlans,
  getCurrentUser,
  getUserSubscription,
  createSubscription,
  updateSubscriptionCredits,
  createUserNotification,
  logActivity,
  getUnreadNotificationsCount
} from '@/lib/firebase';

// استيراد المكونات
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/components/LanguageContext';
import { createPageUrl } from '@/utils';

// روابط الدفع المباشرة من PayPal مع معرفات الخطط
const PAYPAL_PLANS = {
  starter: {
    link: 'https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-0F579510S2934014XNGLV4MQ',
    plan_id: 'P-0F579510S2934014XNGLV4MQ'
  },
  professional: {
    link: 'https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-0AH73100CS833334CNGLV6XY',
    plan_id: 'P-0AH73100CS833334CNGLV6XY'
  },
  pro: {
    link: 'https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-31815547WW6875814NGLWAHQ',
    plan_id: 'P-31815547WW6875814NGLWAHQ'
  },
  enterprise: {
    link: 'https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-97834349U9403535ENGLWBFI',
    plan_id: 'P-97834349U9403535ENGLWBFI'
  }
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
  const [unreadCount, setUnreadCount] = useState(0);

  // دالة للتحقق من أن الاشتراك لا يزال نشطاً
  const checkSubscriptionActive = (subscription) => {
    if (!subscription) return false;
    
    // التحقق من حالة الاشتراك
    if (subscription.status !== 'active') return false;
    
    // التحقق من تاريخ الانتهاء
    if (subscription.end_date) {
      const endDate = new Date(subscription.end_date);
      const now = new Date();
      if (endDate < now) return false;
    }
    
    return true;
  };

  // تحميل البيانات عند بدء الصفحة
  useEffect(() => {
    loadData();
  }, []);

  // دالة تحميل البيانات من Firebase
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📥 بدء تحميل البيانات من Firebase...');
      
      // 1. التحقق من المستخدم الحالي من sessionStorage
      const currentUser = getCurrentUser();
      console.log('👤 المستخدم الحالي:', currentUser);
      setUser(currentUser);

      // 2. جلب جميع الخطط من Firebase
      console.log('📋 جاري جلب الخطط...');
      const allPlans = await getAllPlans();
      console.log('📦 الخطط المستلمة:', allPlans);
      
      // فلترة الخطط النشطة فقط
      const activePlans = allPlans.filter(plan => plan.is_active === true);
      
      // ترتيب الخطط حسب حقل order
      const sortedPlans = activePlans.sort((a, b) => (a.order || 0) - (b.order || 0));
      setPlans(sortedPlans);

      // 3. جلب اشتراك المستخدم إذا كان موجوداً
      if (currentUser?.email) {
        console.log('🔍 جاري جلب اشتراك المستخدم:', currentUser.email);
        const subscription = await getUserSubscription(currentUser.email);
        
        console.log('📦 الاشتراك المستلم:', subscription);
        
        if (subscription && checkSubscriptionActive(subscription)) {
          setCurrentSubscription(subscription);
        }
        
        // جلب عدد الإشعارات غير المقروءة
        const count = await getUnreadNotificationsCount(currentUser.email);
        setUnreadCount(count);
      }

    } catch (error) {
      console.error('❌ خطأ في تحميل البيانات:', error);
      setError(language === 'ar' 
        ? 'حدث خطأ في تحميل البيانات' 
        : 'Error loading data'
      );
    } finally {
      setLoading(false);
    }
  };

  // دالة للبحث عن خطة PayPal المناسبة
  const findPayPalPlan = (plan) => {
    // البحث المباشر بالـ id
    if (PAYPAL_PLANS[plan.id]) {
      return PAYPAL_PLANS[plan.id];
    }
    
    // البحث بالاسم الإنجليزي
    for (const [key, value] of Object.entries(PAYPAL_PLANS)) {
      if (plan.name_en?.toLowerCase().includes(key) || 
          key.includes(plan.name_en?.toLowerCase())) {
        return value;
      }
    }
    
    // البحث بالاسم العربي
    const arabicNames = {
      starter: ['بداية', 'أساسية'],
      professional: ['احترافية', 'متقدمة'],
      pro: ['محترف', 'متقدم'],
      enterprise: ['مؤسسات', 'شركات']
    };
    
    for (const [key, alternatives] of Object.entries(arabicNames)) {
      if (alternatives.some(name => plan.name_ar?.includes(name))) {
        return PAYPAL_PLANS[key];
      }
    }
    
    return null;
  };

  // دالة فتح رابط الدفع المباشر
  const handleSubscribeClick = async (plan) => {
    if (!user) {
      alert(language === 'ar' ? 'يرجى تسجيل الدخول أولاً' : 'Please login first');
      navigate(createPageUrl('SignIn'));
      return;
    }

    // التحقق من وجود اشتراك نشط
    if (currentSubscription && checkSubscriptionActive(currentSubscription)) {
      alert(language === 'ar' 
        ? 'لديك اشتراك نشط بالفعل. لا يمكنك الاشتراك في باقة جديدة حتى ينتهي اشتراكك الحالي.' 
        : 'You already have an active subscription. You cannot subscribe to a new plan until your current subscription expires.'
      );
      return;
    }

    // البحث عن خطة PayPal المناسبة
    const paypalPlan = findPayPalPlan(plan);
    
    if (!paypalPlan) {
      console.error('❌ No PayPal plan found for:', plan);
      alert(language === 'ar' 
        ? `رابط الدفع غير متوفر لهذه الخطة: ${plan.name_ar || plan.name_en}` 
        : `Payment link not available for this plan: ${plan.name_en}`
      );
      return;
    }

    setSelectedPlan(plan);
    setSubscribing(true);

    try {
      // ✅ 1. إنشاء اشتراك في Firebase بحالة pending
      console.log('📝 Creating pending subscription...');
      const subscriptionData = {
        user_email: user.email,
        plan_id: plan.id,
        plan_name: language === 'ar' ? plan.name_ar : plan.name_en,
        credits_total: plan.credits,
        credits_used: 0,
        tokens_per_question: plan.tokens_per_question || 500,
        start_date: new Date().toISOString(),
        end_date: plan.billing_cycle === 'yearly' 
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending', // pending حتى يتم تأكيد الدفع
        amount_paid: plan.price,
        paypal_plan_id: paypalPlan.plan_id
      };
      
      const newSub = await createSubscription(subscriptionData);
      
      if (newSub.success) {
        console.log('✅ Pending subscription created with ID:', newSub.id);
        
        // ✅ 2. إنشاء إشعار للمستخدم
        await createUserNotification({
          user_email: user.email,
          type: 'subscription',
          title_en: 'Payment Initiated',
          title_ar: 'بدأ عملية الدفع',
          message_en: `You have initiated payment for the ${plan.name_en} plan. Your subscription will be activated once payment is confirmed.`,
          message_ar: `لقد بدأت عملية دفع لباقة ${plan.name_ar || plan.name_en}. سيتم تفعيل اشتراكك بعد تأكيد الدفع.`
        });
        
        // ✅ 3. تسجيل النشاط
        await logActivity({
          action: 'subscription_initiated',
          user_email: user.email,
          details: `User initiated payment for plan: ${plan.name_en} (ID: ${plan.id})`
        });
        
        // ✅ 4. فتح نافذة الدفع
        window.open(paypalPlan.link, '_blank');
        
        // ✅ 5. عرض رسالة نجاح
        setPaymentSuccess(true);
        setTimeout(() => setPaymentSuccess(false), 5000);
        
        alert(language === 'ar' 
          ? '✅ تم فتح صفحة الدفع. سيتم تفعيل اشتراكك تلقائياً بعد تأكيد الدفع.' 
          : '✅ Payment page opened. Your subscription will be activated automatically after payment confirmation.'
        );
        
        // إعادة تحميل البيانات بعد 10 ثواني (للتحقق من تحديث الاشتراك)
        setTimeout(() => {
          loadData();
        }, 10000);
        
      } else {
        throw new Error('Failed to create subscription');
      }
      
    } catch (error) {
      console.error('❌ Error during subscription:', error);
      alert(language === 'ar' 
        ? 'حدث خطأ في عملية الاشتراك' 
        : 'Error during subscription process'
      );
    } finally {
      setSubscribing(false);
    }
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
              {language === 'ar' ? 'تم بدء عملية الدفع بنجاح!' : 'Payment initiated successfully!'}
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
            {currentSubscription && (
              <div className="mt-1">
                <p className="text-xs text-green-600 dark:text-green-400">
                  {language === 'ar' ? 'باقتك الحالية:' : 'Your current plan:'} {currentSubscription.plan_name}
                </p>
                {currentSubscription.end_date && (
                  <p className="text-xs text-slate-500">
                    {language === 'ar' ? 'تنتهي في:' : 'Expires:'} {new Date(currentSubscription.end_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
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
              const isCurrentPlan = currentSubscription?.plan_id === plan.id && checkSubscriptionActive(currentSubscription);
              const isYearly = plan.billing_cycle === 'yearly';
              const isDisabled = isCurrentPlan || subscribing;
              
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
                        disabled={isDisabled}
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
