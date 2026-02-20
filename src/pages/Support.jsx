import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Phone, Send, Loader2, ArrowLeft, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

const WHATSAPP_NUMBER = '+201016064678';

export default function Support() {
  const navigate = useNavigate();
  const { language, isRtl } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    const allPlans = await base44.entities.Plan.filter({ is_active: true });
    setPlans(allPlans);
  };

  const handleAskSupport = async () => {
    if (!question.trim()) return;
    
    setLoading(true);
    setAnswer('');
    
    try {
      // Build context about the platform
      const plansContext = plans.map(p => 
        `Plan: ${language === 'ar' ? p.name_ar : p.name_en}, Price: $${p.price}, Credits: ${p.credits}, Questions: ${Math.floor(p.credits/2)}, Tokens: ${p.tokens_per_question}`
      ).join('\n');

      const platformContext = `
You are a customer support AI for ChatBAI platform - an AI-powered business intelligence platform.

Platform Features:
- Market Analysis: Comprehensive market, competitor, and trend analysis
- Marketing Strategy: Complete marketing plan generation
- Content Generation: Social media content and campaign ideas
- Analytics & Reports: Performance tracking and insights
- Optimization: Growth suggestions and recommendations
- Business Setup: Company profile and goals management

Available Plans:
${plansContext}

Key Information:
- Free tier: 10 credits (5 questions) with 500 tokens per question
- 2 credits = 1 question
- All plans include ALL 6 features (Market Analysis, Strategy, Content, Analytics, Reports, Optimization)
- Support available via WhatsApp: ${WHATSAPP_NUMBER}
- Platform supports Arabic and English
- Dark/Light mode available
- User profiles with business data integration

Answer the user's question accurately and helpfully in ${language === 'ar' ? 'Arabic' : 'English'}.
If you don't know something specific, suggest contacting via WhatsApp.

User Question: ${question}
`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: platformContext,
        add_context_from_internet: false
      });

      setAnswer(response);
    } catch (error) {
      console.error('Error:', error);
      setAnswer(language === 'ar' ? 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.' : 'Sorry, an error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = () => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}`, '_blank');
  };

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-6 ${isRtl ? 'rtl' : 'ltr'}`}>
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate(createPageUrl('Chat'))}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
          {language === 'ar' ? 'العودة' : 'Back'}
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4">
            <HelpCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            {language === 'ar' ? 'الدعم الفني' : 'Technical Support'}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {language === 'ar' ? 'نحن هنا لمساعدتك في أي استفسار' : 'We are here to help with any questions'}
          </p>
        </div>

        {/* WhatsApp Contact */}
        <Card className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {language === 'ar' ? 'تواصل معنا عبر واتساب' : 'Contact us via WhatsApp'}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{WHATSAPP_NUMBER}</p>
                </div>
              </div>
              <Button onClick={openWhatsApp} className="bg-green-500 hover:bg-green-600">
                <MessageCircle className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'فتح واتساب' : 'Open WhatsApp'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Support */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              {language === 'ar' ? 'اسأل المساعد الذكي' : 'Ask AI Assistant'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={language === 'ar' 
                ? 'اكتب سؤالك هنا... (مثال: ما هي أسعار الباقات؟ كيف أستخدم ميزة تحليل السوق؟)'
                : 'Type your question here... (Example: What are the plan prices? How do I use market analysis?)'}
              rows={4}
              className={isRtl ? 'text-right' : ''}
            />
            <Button 
              onClick={handleAskSupport} 
              disabled={loading || !question.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {language === 'ar' ? 'جاري البحث...' : 'Searching...'}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'إرسال' : 'Send'}
                </>
              )}
            </Button>

            {answer && (
              <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  {language === 'ar' ? 'الإجابة:' : 'Answer:'}
                </h4>
                <div className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {answer}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                q: language === 'ar' ? 'كيف أحصل على نقاط إضافية؟' : 'How do I get more credits?',
                a: language === 'ar' ? 'يمكنك الاشتراك في إحدى الباقات المدفوعة من صفحة الباقات.' : 'You can subscribe to one of the paid plans from the Plans page.'
              },
              {
                q: language === 'ar' ? 'ما المميزات المتاحة في كل باقة؟' : 'What features are available in each plan?',
                a: language === 'ar' ? 'جميع الباقات تشمل الـ 6 مميزات: تحليل السوق، استراتيجية التسويق، توليد المحتوى، التقارير، التحليلات، والتحسين.' : 'All plans include all 6 features: Market Analysis, Marketing Strategy, Content Generation, Reports, Analytics, and Optimization.'
              },
              {
                q: language === 'ar' ? 'كم سؤال يمكنني طرحه؟' : 'How many questions can I ask?',
                a: language === 'ar' ? 'كل 2 نقطة = سؤال واحد. عدد الأسئلة يعتمد على باقتك.' : 'Every 2 credits = 1 question. Number of questions depends on your plan.'
              }
            ].map((faq, i) => (
              <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <h5 className="font-semibold text-slate-900 dark:text-white mb-2">{faq.q}</h5>
                <p className="text-slate-600 dark:text-slate-400 text-sm">{faq.a}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}