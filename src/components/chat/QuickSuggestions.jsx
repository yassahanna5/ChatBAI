import React from 'react';
import { BarChart3, Target, Zap, TrendingUp, FileText, Lightbulb } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { motion } from 'framer-motion';

export default function QuickSuggestions({ onSelect }) {
  const { language } = useLanguage();

  const suggestions = [
    {
      icon: BarChart3,
      titleEn: 'Market Analysis',
      titleAr: 'تحليل السوق',
      descEn: 'Analyze market, competitors, and trends',
      descAr: 'تحليل السوق والمنافسين والترندات',
      prompt: language === 'ar' 
        ? 'قم بتحليل شامل للسوق الخاص بنشاطي التجاري. أريد معرفة: حجم السوق، المنافسين الرئيسيين، الترندات الحالية، الفرص المتاحة، التحديات المحتملة، والجمهور المستهدف بالتفصيل.'
        : 'Perform a comprehensive market analysis for my business. I want to know: market size, main competitors, current trends, available opportunities, potential challenges, and detailed target audience analysis.'
    },
    {
      icon: Target,
      titleEn: 'Marketing Strategy',
      titleAr: 'استراتيجية التسويق',
      descEn: 'Build complete marketing plan',
      descAr: 'بناء خطة تسويق كاملة',
      prompt: language === 'ar'
        ? 'أنشئ لي استراتيجية تسويق متكاملة تشمل: القنوات المناسبة، خطة المحتوى الشهرية، الميزانية المقترحة، جدول زمني للتنفيذ، وFunnel تسويقي واضح.'
        : 'Create a complete marketing strategy including: suitable channels, monthly content plan, suggested budget, execution timeline, and clear marketing funnel.'
    },
    {
      icon: Zap,
      titleEn: 'Content Ideas',
      titleAr: 'أفكار المحتوى',
      descEn: 'Generate social media content',
      descAr: 'توليد محتوى سوشيال ميديا',
      prompt: language === 'ar'
        ? 'اقترح لي 20 فكرة محتوى إبداعية لمنصات التواصل الاجتماعي (إنستجرام، فيسبوك، تيك توك). مع أمثلة للبوستات، سكربتات الفيديو، والهاشتاجات المناسبة.'
        : 'Suggest 20 creative content ideas for social media platforms (Instagram, Facebook, TikTok). Include post examples, video scripts, and suitable hashtags.'
    },
    {
      icon: TrendingUp,
      titleEn: 'Performance Analysis',
      titleAr: 'تحليل الأداء',
      descEn: 'Analyze metrics and KPIs',
      descAr: 'تحليل المقاييس والأرقام',
      prompt: language === 'ar'
        ? 'ساعدني في فهم أرقام الأداء الخاصة بي. أريد تحليل شامل لـ: معدلات التحويل، التفاعل، الوصول، ROI، ونقاط القوة والضعف مع اقتراحات للتحسين.'
        : 'Help me understand my performance metrics. I want a comprehensive analysis of: conversion rates, engagement, reach, ROI, strengths and weaknesses with improvement suggestions.'
    },
    {
      icon: FileText,
      titleEn: 'Business Report',
      titleAr: 'تقرير الأعمال',
      descEn: 'Generate comprehensive report',
      descAr: 'إنشاء تقرير شامل',
      prompt: language === 'ar'
        ? 'أنشئ لي تقرير أعمال شامل يتضمن: تحليل الوضع الحالي، نقاط القوة والضعف، الفرص والتهديدات، والتوصيات الاستراتيجية للربع القادم.'
        : 'Create a comprehensive business report including: current situation analysis, strengths and weaknesses, opportunities and threats, and strategic recommendations for next quarter.'
    },
    {
      icon: Lightbulb,
      titleEn: 'Growth Ideas',
      titleAr: 'أفكار النمو',
      descEn: 'Get optimization suggestions',
      descAr: 'احصل على مقترحات التحسين',
      prompt: language === 'ar'
        ? 'اقترح لي أفكار مبتكرة لتطوير ونمو نشاطي التجاري. أريد استراتيجيات قابلة للتطبيق في: زيادة المبيعات، توسيع قاعدة العملاء، تحسين الخدمات، وزيادة الوعي بالعلامة التجارية.'
        : 'Suggest innovative ideas for developing and growing my business. I want actionable strategies for: increasing sales, expanding customer base, improving services, and increasing brand awareness.'
    }
  ];

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        {language === 'ar' ? 'اختر من المقترحات السريعة' : 'Quick Suggestions'}
      </h3>
      <div className="grid md:grid-cols-2 gap-4">
        {suggestions.map((suggestion, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            onClick={() => onSelect(suggestion.prompt)}
            className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-500 hover:shadow-lg transition-all text-left group"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900 transition-colors">
                <suggestion.icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                  {language === 'ar' ? suggestion.titleAr : suggestion.titleEn}
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {language === 'ar' ? suggestion.descAr : suggestion.descEn}
                </p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}