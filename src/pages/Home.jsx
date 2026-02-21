import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Bot, BarChart3, Target, Zap, ArrowRight, CheckCircle, TrendingUp, FileText, Lightbulb, Moon, Sun, Bell, Star, MessageCircle, Facebook, Youtube, Send, MessageSquare, ArrowLeft, LogOut, Shield } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { useTheme } from '@/components/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const { t, language, changeLanguage, isRtl } = useLanguage();
  const { darkMode, toggleDarkMode } = useTheme();
  const [user, setUser] = useState(null);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // Check if user is admin from role in database
        if (currentUser.role === 'admin') {
          setIsAdmin(true);
        }
        
        // ✅ تأكد أن notifs مصفوفة قبل استخدام .length
        const notifs = await base44.entities.Notification.filter({ user_email: currentUser.email, is_read: false });
        setUnreadNotifs(Array.isArray(notifs) ? notifs.length : 0);
      }
    } catch (error) {
      console.error('Auth error:', error);
      setUnreadNotifs(0);
    }
  };

  const handleLogout = async () => {
    try {
      await base44.auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const features = [
    { 
      icon: BarChart3, 
      title: language === 'ar' ? 'تحليل السوق' : 'Market Analysis', 
      desc: language === 'ar' ? 'وصف السوق، المنافسين، Buyer Persona، مشاكل الجمهور، فرص النمو' : 'Market description, competitors, Buyer Persona, audience problems, growth opportunities' 
    },
    { 
      icon: Target, 
      title: language === 'ar' ? 'استراتيجية التسويق' : 'Marketing Strategy', 
      desc: language === 'ar' ? 'القنوات المناسبة، نوع المحتوى، خطة شهرية، Funnel تسويقي' : 'Suitable channels, content type, monthly plan, marketing funnel' 
    },
    { 
      icon: Zap, 
      title: language === 'ar' ? 'توليد المحتوى' : 'Content Generator', 
      desc: language === 'ar' ? 'بوستات سوشيال، سكربت ريلز/تيك توك، إعلانات ممولة، أفكار محتوى' : 'Social posts, Reels/TikTok scripts, paid ads, content ideas' 
    },
    { 
      icon: TrendingUp, 
      title: language === 'ar' ? 'التحليلات والتقارير' : 'Analytics & Reports', 
      desc: language === 'ar' ? 'تحليل الأداء، قراءة الأرقام، نقاط القوة والضعف' : 'Performance analysis, metrics reading, strengths and weaknesses' 
    },
    { 
      icon: Lightbulb, 
      title: language === 'ar' ? 'التحسين والتطوير' : 'Optimization', 
      desc: language === 'ar' ? 'توصيات ذكية، أفكار تحسين، خطة الشهر القادم' : 'Smart recommendations, improvement ideas, next month plan' 
    },
  ];

  const [reviews, setReviews] = useState([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const approvedReviews = await base44.entities.Review.filter({ is_approved: true }, '-created_date', 10);
      // ✅ تأكد أن البيانات مصفوفة
      setReviews(Array.isArray(approvedReviews) ? approvedReviews : []);
    } catch (error) {
      console.error('Error loading reviews:', error);
      setReviews([]); // ✅ مصفوفة فارغة في حالة الخطأ
    }
  };

  const nextReview = () => {
    if (Array.isArray(reviews) && reviews.length > 0) {
      setCurrentReviewIndex((prev) => (prev + 1) % reviews.length);
    }
  };

  const prevReview = () => {
    if (Array.isArray(reviews) && reviews.length > 0) {
      setCurrentReviewIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-[#F1F1F2] via-white to-[#A1D6E2]/20 dark:from-slate-950 dark:via-slate-900 dark:to-[#1995AD]/20 ${isRtl ? 'rtl' : 'ltr'}`}>
      {/* Navigation - Responsive Navbar مع الحفاظ على نفس التصميم */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            
            {/* Logo - نفس التصميم بدون تغيير */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <img 
                src="/assets/images/logo.jpg"
                alt="ChatBAI Logo"
                className="w-10 h-10 object-contain rounded-lg"
              />
              <span className="text-xl font-bold bg-gradient-to-r from-[#1995AD] to-[#A1D6E2] bg-clip-text text-transparent whitespace-nowrap">
                ChatBAI
              </span>
            </div>
            
            {/* Actions - متجاوب مع الحفاظ على نفس الأحجام والألوان */}
            <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar">
              
              {/* Dark Mode Toggle - نفس التصميم */}
              <button
                onClick={toggleDarkMode}
                className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Notifications - للمستخدم المسجل */}
              {user && (
                <Link 
                  to={createPageUrl('Notifications')} 
                  className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifs > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </Link>
              )}

              {/* Logout Button - للمستخدم المسجل */}
              {user && (
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
                  title={language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
                >
                  <LogOut className="w-5 h-5" />
                </button>
              )}

              {/* Language Toggle - نفس التصميم */}
              <button
                onClick={() => changeLanguage(language === 'en' ? 'ar' : 'en')}
                className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0 whitespace-nowrap"
              >
                {language === 'en' ? 'عربي' : 'English'}
              </button>

              {/* User Actions - Conditional based on auth status */}
              {user ? (
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Admin Dashboard Button - نفس التصميم */}
                  {isAdmin && (
                    <Link to={createPageUrl('Admin')}>
                      <Button className="bg-[#1995AD] hover:bg-[#1995AD]/90 text-white shadow-md whitespace-nowrap" asChild>
                        <div>
                          <Shield className="w-4 h-4 mr-2" />
                          {language === 'ar' ? 'لوحة الإدارة' : 'Admin Dashboard'}
                        </div>
                      </Button>
                    </Link>
                  )}
                  
                  {/* Dashboard Button - نفس التصميم */}
                  <Link to={createPageUrl('Chat')}>
                    <Button className="bg-[#1995AD] hover:bg-[#1995AD]/90 text-white whitespace-nowrap">
                      {t('dashboard')}
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Sign Up Button - نفس التصميم */}
                  <Link to={createPageUrl('Register')}>
                    <Button variant="ghost" className="whitespace-nowrap">
                      {t('signUp')}
                    </Button>
                  </Link>
                  
                  {/* Get Started Button - نفس التصميم */}
                  <Link to={createPageUrl('Register')}>
                    <Button className="bg-[#1995AD] hover:bg-[#1995AD]/90 text-white whitespace-nowrap">
                      {t('getStarted')}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Add padding top to account for fixed navbar */}
      <div className="pt-20"></div>

      {/* Hero Image Section */}
      <section className="pt-24 pb-12 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="relative rounded-3xl overflow-hidden shadow-2xl"
          >
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698092d9355e78e06e2f8424/27a0d65c9_3.png"
              alt="ChatBAI Platform"
              className="w-full h-auto object-cover"
            />
          </motion.div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#A1D6E2]/30 dark:bg-[#1995AD]/50 rounded-full text-[#1995AD] dark:text-[#A1D6E2] text-sm mb-6">
              <Zap className="w-4 h-4" />
              {language === 'ar' ? 'مدعوم بالذكاء الاصطناعي المتقدم' : 'Powered by Advanced AI'}
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
              {t('aiPowered')}
            </h1>
            
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10">
              {t('heroSubtitle')}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to={createPageUrl('Register')}>
                <Button size="lg" className="bg-[#1995AD] hover:bg-[#1995AD]/90 text-white px-8 h-14 text-lg">
                  {t('getStarted')}
                  <ArrowRight className={`w-5 h-5 ${isRtl ? 'mr-2 rotate-180' : 'ml-2'}`} />
                </Button>
              </Link>
              <Link to={createPageUrl('Plans')}>
                <Button size="lg" variant="outline" className="px-8 h-14 text-lg">
                  {t('pricing')}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-white/50 dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              {language === 'ar' ? 'خدماتنا المتكاملة' : 'Our Complete Services'}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              {language === 'ar' ? 'جميع الخدمات متوفرة في كل الباقات' : 'All services available in all plans'}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200/50 dark:border-slate-700/50"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#1995AD] to-[#A1D6E2] flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              {t('clientTestimonials')}
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              {language === 'ar' ? 'ماذا يقول عملاؤنا عن خدماتنا' : 'What our clients say about our services'}
            </p>
          </div>
          
          {Array.isArray(reviews) && reviews.length > 0 ? (
            <div className="relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentReviewIndex}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg"
                >
                  <div className="flex gap-1 mb-4 justify-center">
                    {reviews[currentReviewIndex]?.rating && 
                      [...Array(reviews[currentReviewIndex].rating)].map((_, j) => (
                        <Star key={j} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                      ))
                    }
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 mb-6 italic text-center text-lg">
                    "{reviews[currentReviewIndex]?.review_text || ''}"
                  </p>
                  <div className="text-center">
                    <p className="font-semibold text-slate-900 dark:text-white text-lg">
                      {reviews[currentReviewIndex]?.user_name || ''}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">
                      {reviews[currentReviewIndex]?.job_title || ''}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              {reviews.length > 1 && (
                <div className="flex justify-center gap-4 mt-6">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={prevReview}
                    className="rounded-full"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <div className="flex items-center gap-2">
                    {reviews.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentReviewIndex(i)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          i === currentReviewIndex
                            ? 'bg-[#1995AD] w-8'
                            : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={nextReview}
                    className="rounded-full"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-slate-500 dark:text-slate-400">
              {language === 'ar' ? 'لا توجد تقييمات حتى الآن' : 'No reviews yet'}
            </div>
          )}
        </div>
      </section>

      {/* Free Credits Banner */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-[#1995AD] to-[#A1D6E2] rounded-3xl p-10 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            {language === 'ar' ? 'ابدأ مجاناً اليوم!' : 'Start Free Today!'}
          </h2>
          <p className="text-white/90 mb-6 text-lg">
            {language === 'ar' ? 'احصل على 10 نقاط مجانية = 5 أسئلة مجانية عند التسجيل' : 'Get 10 free credits = 5 free questions on signup'}
          </p>
          <Link to={createPageUrl('Register')}>
            <Button size="lg" className="bg-white text-[#1995AD] hover:bg-[#F1F1F2] px-8 h-14 text-lg">
              {t('getStarted')}
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src="/assets/images/logo.jpg"
                  alt="ChatBAI Logo"
                  className="w-10 h-10 object-contain rounded-lg"
                />
                <span className="text-xl font-bold bg-gradient-to-r from-[#1995AD] to-[#A1D6E2] bg-clip-text text-transparent">
                  ChatBAI
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
               {language === 'ar' ? 'منصة ChatBAI - ذكاء اصطناعي لتحليل الأعمال وبناء استراتيجيات التسويق' : 'ChatBAI - AI platform for business analysis and marketing strategies'}
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4">
                {language === 'ar' ? 'روابط سريعة' : 'Quick Links'}
              </h4>
              <div className="space-y-2">
                <Link to={createPageUrl('Home')} className="block text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm">
                  {t('home')}
                </Link>
                <Link to={createPageUrl('Plans')} className="block text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm">
                  {t('pricing')}
                </Link>
                <Link to={createPageUrl('Support')} className="block text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm">
                  {language === 'ar' ? 'الدعم' : 'Support'}
                </Link>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4">
                {language === 'ar' ? 'تواصل معنا' : 'Contact Us'}
              </h4>
              <div className="space-y-3">
                <a
                  href="https://wa.me/+201016064678"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-[#25D366] dark:hover:text-[#25D366] text-sm transition-colors"
                >
                  <div className="w-5 h-5 rounded-full bg-[#25D366] flex items-center justify-center">
                    <MessageCircle className="w-3 h-3 text-white" />
                  </div>
                  WhatsApp
                </a>
                <div className="flex gap-3 pt-2">
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110">
                    <div className="w-8 h-8 rounded-full bg-[#1877F2] flex items-center justify-center">
                      <Facebook className="w-5 h-5 text-white" />
                    </div>
                  </a>
                  <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110">
                    <div className="w-8 h-8 rounded bg-[#FF0000] flex items-center justify-center">
                      <Youtube className="w-5 h-5 text-white" />
                    </div>
                  </a>
                  <a href="https://t.me" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110">
                    <div className="w-8 h-8 rounded-full bg-[#0088CC] flex items-center justify-center">
                      <Send className="w-4 h-4 text-white" />
                    </div>
                  </a>
                  <a href="https://m.me" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110">
                    <div className="w-8 h-8 rounded-full bg-[#0084FF] flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 text-sm">
            <p>© {new Date().getFullYear()} ChatBAI. {language === 'ar' ? 'جميع الحقوق محفوظة' : 'All rights reserved'}.</p>
          </div>
        </div>
      </footer>

      {/* إضافة CSS لإخفاء شريط التمرير مع الحفاظ على وظيفة التمرير */}
      <style jsx>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
