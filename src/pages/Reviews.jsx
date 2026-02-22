import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Star, Loader2 } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { base44 } from '@/api/base44Client';
import { saveReview } from '@/lib/firebase';

export default function Reviews() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [formData, setFormData] = useState({
    user_name: '',
    job_title: '',
    review_text: ''
  });
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (rating === 0) {
      alert(language === 'ar' ? 'يرجى اختيار التقييم' : 'Please select a rating');
      return;
    }

    if (!formData.user_name || !formData.job_title || !formData.review_text) {
      alert(language === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      // ✅ التحقق من البريد الإلكتروني بشكل آمن
      let userEmail = 'anonymous@example.com';
      try {
        const user = await base44.auth.me();
        console.log('👤 User from base44:', user);
        
        if (user && user.email && user.email !== 'undefined') {
          userEmail = user.email;
        } else {
          console.warn('⚠️ User email is missing or undefined, using anonymous');
        }
      } catch (error) {
        console.warn('⚠️ User not logged in, using anonymous email');
      }
      
      console.log('📧 Final email being sent:', userEmail);
      
      // تجهيز بيانات التقييم - تأكد من تطابق أسماء الحقول مع القواعد
      const reviewData = {
        user_name: formData.user_name.trim(),
        job_title: formData.job_title.trim(),
        rating: rating,
        review_text: formData.review_text.trim(),
        user_email: userEmail
        // ملاحظة: لا نضيف createdAt هنا لأننا سنضيفه في saveReview
      };
      
      console.log('📤 Sending to Firebase:', reviewData);
      console.log('📤 Review data keys:', Object.keys(reviewData));
      
      // حفظ التقييم في Firebase
      const result = await saveReview(reviewData);
      console.log('✅ Save result:', result);

      alert(t('reviewSubmitted'));
      navigate(createPageUrl('Home'));
    } catch (error) {
      console.error('❌ Error submitting review:', error);
      
      // عرض رسالة خطأ مفصلة
      const errorMsg = language === 'ar' 
        ? `حدث خطأ في إرسال التقييم: ${error.message}` 
        : `An error occurred while submitting review: ${error.message}`;
      
      setErrorMessage(errorMsg);
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl('Home'))}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {language === 'ar' ? 'رجوع' : 'Back'}
        </Button>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            {t('reviewUs')}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            {language === 'ar' 
              ? 'نحن نقدر رأيك! شاركنا تجربتك مع ChatBAI'
              : 'We value your feedback! Share your experience with ChatBAI'}
          </p>

          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Star Rating */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                {t('yourRating')} *
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        (hoverRating || rating) >= star
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('yourName')} *
              </label>
              <Input
                required
                value={formData.user_name}
                onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
                placeholder={language === 'ar' ? 'أدخل اسمك' : 'Enter your name'}
                disabled={loading}
              />
            </div>

            {/* Job Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('yourJobTitle')} *
              </label>
              <Input
                required
                value={formData.job_title}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                placeholder={language === 'ar' ? 'مثال: مدير تسويق' : 'e.g. Marketing Manager'}
                disabled={loading}
              />
            </div>

            {/* Review Text */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('yourReview')} *
              </label>
              <Textarea
                required
                rows={5}
                value={formData.review_text}
                onChange={(e) => setFormData({ ...formData, review_text: e.target.value })}
                placeholder={language === 'ar' 
                  ? 'شاركنا تجربتك مع المنصة...'
                  : 'Share your experience with the platform...'}
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-6 text-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {language === 'ar' ? 'جاري الإرسال...' : 'Submitting...'}
                </>
              ) : (
                t('submitReview')
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
