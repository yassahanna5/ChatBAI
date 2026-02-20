import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  X, ArrowRight, ArrowLeft, Menu, MessageSquare, Sparkles, 
  Zap, BarChart3, Target, FileText, CreditCard, Settings,
  Star, ChevronRight, Bot, Brain, Users, TrendingUp, Lightbulb,
  Globe, MessageCircle, Bell, Home, Shield, LogOut, Moon, Sun,
  Paperclip, SendHorizonal, Plus, Image, File, ChevronLeft,
  CheckCircle, AlertCircle, Info, HelpCircle
} from 'lucide-react';
import { useLanguage } from './LanguageContext';

const tourSteps = {
  en: [
    {
      id: 'sidebar',
      target: 'sidebar',
      icon: Menu,
      iconColor: '#1995AD',
      title: 'Sidebar Navigation',
      content: 'This is your main navigation hub. Access your conversations, settings, and account details.',
      position: 'right',
      highlight: 'sidebar'
    },
    {
      id: 'new-chat',
      target: 'new-chat',
      icon: MessageSquare,
      iconColor: '#22C55E',
      title: 'Start New Conversations',
      content: 'Click here to begin a fresh chat with your AI business consultant. Each new conversation helps you explore different topics.',
      position: 'right',
      highlight: 'new-chat'
    },
    {
      id: 'conversations',
      target: 'conversations-list',
      icon: Bot,
      iconColor: '#A855F7',
      title: 'Your Chat History',
      content: 'All your previous conversations are saved here. Click any conversation to continue where you left off.',
      position: 'right',
      highlight: 'conversations'
    },
    {
      id: 'quick-suggestions',
      target: 'quick-suggestions',
      icon: Zap,
      iconColor: '#EAB308',
      title: 'Quick Suggestions',
      content: 'Get instant business insights with these pre-made prompts. Perfect for market analysis, competitor research, and strategy planning.',
      position: 'top',
      highlight: 'suggestions'
    },
    {
      id: 'chat-input',
      target: 'chat-input',
      icon: SendHorizonal,
      iconColor: '#1995AD',
      title: 'Chat Input Area',
      content: 'Type your questions here. You can ask about market trends, customer behavior, marketing strategies, or any business challenge.',
      position: 'top',
      highlight: 'input'
    },
    {
      id: 'file-upload',
      target: 'plus-menu',
      icon: Paperclip,
      iconColor: '#3B82F6',
      title: 'Upload Files',
      content: 'Attach images, PDFs, or documents for analysis. Our AI can extract and analyze information from your files.',
      position: 'top',
      highlight: 'upload'
    },
    {
      id: 'model-selector',
      target: 'model-selector',
      icon: Brain,
      iconColor: '#EC4899',
      title: 'AI Model Selection',
      content: 'Choose between different AI models. Each has unique strengths for different types of business analysis.',
      position: 'top',
      highlight: 'model'
    },
    {
      id: 'credits',
      target: 'credits',
      icon: CreditCard,
      iconColor: '#F59E0B',
      title: 'Credits & Usage',
      content: 'Monitor your remaining credits here. Each question uses 2 credits. Upgrade your plan for more.',
      position: 'right',
      highlight: 'credits'
    },
    {
      id: 'plans',
      target: 'plans',
      icon: Sparkles,
      iconColor: '#8B5CF6',
      title: 'Upgrade Your Plan',
      content: 'Get more credits and unlock premium features. Perfect for growing businesses.',
      position: 'right',
      highlight: 'plans'
    },
    {
      id: 'settings',
      target: 'settings',
      icon: Settings,
      iconColor: '#64748B',
      title: 'Settings & Preferences',
      content: 'Customize your experience. Change language, theme, and manage your account settings.',
      position: 'right',
      highlight: 'settings'
    }
  ],
  ar: [
    {
      id: 'sidebar',
      target: 'sidebar',
      icon: Menu,
      iconColor: '#1995AD',
      title: 'القائمة الجانبية',
      content: 'هذه هي لوحة التحكم الرئيسية. يمكنك الوصول إلى محادثاتك وإعداداتك وتفاصيل حسابك.',
      position: 'left',
      highlight: 'sidebar'
    },
    {
      id: 'new-chat',
      target: 'new-chat',
      icon: MessageSquare,
      iconColor: '#22C55E',
      title: 'بدء محادثة جديدة',
      content: 'اضغط هنا لبدء محادثة جديدة مع مستشار الأعمال الذكي. كل محادثة جديدة تساعدك في استكشاف مواضيع مختلفة.',
      position: 'left',
      highlight: 'new-chat'
    },
    {
      id: 'conversations',
      target: 'conversations-list',
      icon: Bot,
      iconColor: '#A855F7',
      title: 'سجل المحادثات',
      content: 'جميع محادثاتك السابقة محفوظة هنا. اضغط على أي محادثة لمتابعتها من حيث توقفت.',
      position: 'left',
      highlight: 'conversations'
    },
    {
      id: 'quick-suggestions',
      target: 'quick-suggestions',
      icon: Zap,
      iconColor: '#EAB308',
      title: 'اقتراحات سريعة',
      content: 'احصل على رؤى فورية للأعمال باستخدام هذه الأوامر الجاهزة. مثالية لتحليل السوق وأبحاث المنافسين وتخطيط الاستراتيجيات.',
      position: 'top',
      highlight: 'suggestions'
    },
    {
      id: 'chat-input',
      target: 'chat-input',
      icon: SendHorizonal,
      iconColor: '#1995AD',
      title: 'منطقة إدخال النص',
      content: 'اكتب أسئلتك هنا. يمكنك السؤال عن اتجاهات السوق وسلوك العملاء واستراتيجيات التسويق أو أي تحدٍ تجاري.',
      position: 'top',
      highlight: 'input'
    },
    {
      id: 'file-upload',
      target: 'plus-menu',
      icon: Paperclip,
      iconColor: '#3B82F6',
      title: 'رفع الملفات',
      content: 'أرفق صوراً أو PDF أو مستندات للتحليل. يمكن للذكاء الاصطناعي استخراج وتحليل المعلومات من ملفاتك.',
      position: 'top',
      highlight: 'upload'
    },
    {
      id: 'model-selector',
      target: 'model-selector',
      icon: Brain,
      iconColor: '#EC4899',
      title: 'اختيار نموذج الذكاء الاصطناعي',
      content: 'اختر من بين نماذج الذكاء الاصطناعي المختلفة. لكل منها نقاط قوة فريدة لأنواع مختلفة من تحليل الأعمال.',
      position: 'top',
      highlight: 'model'
    },
    {
      id: 'credits',
      target: 'credits',
      icon: CreditCard,
      iconColor: '#F59E0B',
      title: 'النقاط والاستخدام',
      content: 'راقب نقاطك المتبقية هنا. كل سؤال يستخدم نقطتين. قم بترقية باقتك للحصول على المزيد.',
      position: 'left',
      highlight: 'credits'
    },
    {
      id: 'plans',
      target: 'plans',
      icon: Sparkles,
      iconColor: '#8B5CF6',
      title: 'ترقية باقتك',
      content: 'احصل على المزيد من النقاط وافتح الميزات المميزة. مثالية للأعمال المتنامية.',
      position: 'left',
      highlight: 'plans'
    },
    {
      id: 'settings',
      target: 'settings',
      icon: Settings,
      iconColor: '#64748B',
      title: 'الإعدادات والتفضيلات',
      content: 'خصص تجربتك. غير اللغة والثيم وأدر إعدادات حسابك.',
      position: 'left',
      highlight: 'settings'
    }
  ]
};

export default function OnboardingTour({ onComplete }) {
  const { language, t, isRtl } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [targetPosition, setTargetPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  
  const steps = tourSteps[language] || tourSteps.en;
  const step = steps[currentStep];

  // Find and highlight target element
  useEffect(() => {
    if (!isVisible || !step) return;

    const findTargetElement = () => {
      // Try to find element by data attribute or class
      let element = null;
      
      switch (step.target) {
        case 'sidebar':
          element = document.querySelector('[class*="ChatSidebar"]') || document.querySelector('.sidebar');
          break;
        case 'new-chat':
          element = document.querySelector('[class*="newChatButton"]') || document.querySelector('button:has(.lucide-plus)');
          break;
        case 'conversations-list':
          element = document.querySelector('[class*="conversations-list"]') || document.querySelector('.conversations-container');
          break;
        case 'quick-suggestions':
          element = document.querySelector('[class*="QuickSuggestions"]') || document.querySelector('.suggestions-grid');
          break;
        case 'chat-input':
          element = document.querySelector('textarea[placeholder*="Ask"]') || document.querySelector('textarea');
          break;
        case 'plus-menu':
          element = document.querySelector('button:has(.lucide-plus)');
          break;
        case 'model-selector':
          element = document.querySelector('[class*="model-selector"]') || document.querySelector('button:has(.lucide-chevron-right)');
          break;
        case 'credits':
          element = document.querySelector('[class*="credits"]') || document.querySelector('.credits-display');
          break;
        case 'plans':
          element = document.querySelector('a[href*="Plans"]') || document.querySelector('button:has(.lucide-sparkles)');
          break;
        case 'settings':
          element = document.querySelector('[class*="settings"]') || document.querySelector('button:has(.lucide-settings)');
          break;
        default:
          element = document.querySelector(`[data-tour="${step.target}"]`);
      }

      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetPosition({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
          right: rect.right
        });

        // Calculate tooltip position based on step.position
        calculateTooltipPosition(rect, step.position);
      } else {
        // Fallback to center of screen if element not found
        setTargetPosition({
          top: window.innerHeight / 2,
          left: window.innerWidth / 2,
          width: 0,
          height: 0
        });
        setTooltipPosition({
          top: window.innerHeight / 2 - 100,
          left: window.innerWidth / 2 - 200
        });
      }
    };

    findTargetElement();

    // Recalculate on scroll or resize
    window.addEventListener('scroll', findTargetElement);
    window.addEventListener('resize', findTargetElement);

    return () => {
      window.removeEventListener('scroll', findTargetElement);
      window.removeEventListener('resize', findTargetElement);
    };
  }, [currentStep, isVisible, step]);

  const calculateTooltipPosition = (targetRect, position) => {
    const tooltipWidth = 400;
    const tooltipHeight = 200;
    const margin = 20;

    let top, left;

    switch (position) {
      case 'top':
        top = targetRect.top - tooltipHeight - margin;
        left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
        break;
      case 'bottom':
        top = targetRect.bottom + margin;
        left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
        break;
      case 'left':
        top = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2);
        left = targetRect.left - tooltipWidth - margin;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2);
        left = targetRect.right + margin;
        break;
      default:
        top = targetRect.top - tooltipHeight - margin;
        left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
    }

    // Ensure tooltip stays within viewport
    top = Math.max(margin, Math.min(window.innerHeight - tooltipHeight - margin, top));
    left = Math.max(margin, Math.min(window.innerWidth - tooltipWidth - margin, left));

    setTooltipPosition({ top, left });
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    if (onComplete) onComplete();
  };

  const handleSkip = () => {
    setIsVisible(false);
    if (onComplete) onComplete();
  };

  if (!isVisible) return null;

  const IconComponent = step.icon;

  return (
    <AnimatePresence>
      {/* Backdrop with blurred overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* Target Highlight */}
      {targetPosition.width > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed z-50 pointer-events-none"
          style={{
            top: targetPosition.top - 8,
            left: targetPosition.left - 8,
            width: targetPosition.width + 16,
            height: targetPosition.height + 16,
            boxShadow: '0 0 0 4px #1995AD, 0 0 0 9999px rgba(0, 0, 0, 0.5)',
            borderRadius: '12px',
            transition: 'all 0.3s ease'
          }}
        />
      )}

      {/* Tour Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed z-50 w-96"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          
          {/* Header with Icon */}
          <div className="p-6 pb-4">
            <div className="flex items-start gap-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${step.iconColor}20` }}
              >
                <IconComponent 
                  className="w-6 h-6" 
                  style={{ color: step.iconColor }}
                />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {step.content}
                </p>
              </div>
              <button
                onClick={handleSkip}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="px-6 pb-4">
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                    i <= currentStep 
                      ? 'bg-gradient-to-r from-[#1995AD] to-[#A1D6E2]' 
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-slate-500">
                {currentStep + 1} of {steps.length}
              </span>
              {currentStep < steps.length - 1 && (
                <span className="text-xs text-[#1995AD] font-medium">
                  {steps.length - currentStep - 1} remaining
                </span>
              )}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="p-6 pt-0 flex gap-3">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1 border-slate-200 dark:border-slate-700"
            >
              Skip
            </Button>
            
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                className="px-4 border-slate-200 dark:border-slate-700"
              >
                {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </Button>
            )}
            
            <Button
              onClick={handleNext}
              className="flex-1 bg-gradient-to-r from-[#1995AD] to-[#A1D6E2] hover:from-[#148095] hover:to-[#8EC4D1] text-white"
            >
              {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
              {currentStep < steps.length - 1 && (
                isRtl ? <ChevronLeft className="w-4 h-4 mr-2" /> : <ChevronRight className="w-4 h-4 ml-2" />
              )}
            </Button>
          </div>

          {/* Hint for clicking */}
          <div className="px-6 pb-4 text-center">
            <p className="text-xs text-slate-400">
              Click anywhere outside to skip the tour
            </p>
          </div>
        </div>
      </motion.div>

      {/* Step Indicator Dots */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex gap-2">
        {steps.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentStep(i)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === currentStep 
                ? 'w-8 bg-[#1995AD]' 
                : 'bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </AnimatePresence>
  );
}