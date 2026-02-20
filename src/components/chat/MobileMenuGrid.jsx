import React, { useState, useEffect, useRef } from 'react';
import { Home, Star, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../LanguageContext';

export default function MobileMenuGrid({ onNavigateHome, onNavigateReviews, onShare }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const { language } = useLanguage();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const menuItems = [
    {
      icon: Home,
      label: language === 'ar' ? 'الرئيسية' : 'Home',
      onClick: () => { onNavigateHome(); setIsOpen(false); }
    },
    {
      icon: Star,
      label: language === 'ar' ? 'تقييمنا' : 'Reviews',
      onClick: () => { onNavigateReviews(); setIsOpen(false); }
    },
    {
      icon: Share2,
      label: language === 'ar' ? 'مشاركة' : 'Share',
      onClick: () => { onShare(); setIsOpen(false); }
    }
  ];

  return (
    <div className="relative" ref={menuRef}>
      {/* زر 9-dots المصغر - المربع الأبيض صغير جداً الآن */}
      <button
  onClick={() => setIsOpen(!isOpen)}
  className="p-2 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center justify-center"
  aria-label="Google Apps"
  aria-expanded={isOpen}
  aria-haspopup="true"
  style={{ width: '40px', height: '40px' }}
>
  <svg className="w-6 h-6 text-slate-600 dark:text-slate-400" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="5" cy="5" r="1.8" />
    <circle cx="12" cy="5" r="1.8" />
    <circle cx="19" cy="5" r="1.8" />
    <circle cx="5" cy="12" r="1.8" />
    <circle cx="12" cy="12" r="1.8" />
    <circle cx="19" cy="12" r="1.8" />
    <circle cx="5" cy="19" r="1.8" />
    <circle cx="12" cy="19" r="1.8" />
    <circle cx="19" cy="19" r="1.8" />
  </svg>
</button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 right-0 z-[9999]"
          >
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-3 min-w-[220px] border border-slate-100 dark:border-slate-700">
              <div className="grid grid-cols-3 gap-2">
                {menuItems.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={item.onClick}
                    className="flex flex-col items-center justify-center gap-1 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95"
                    style={{ touchAction: 'manipulation' }}
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1995AD] to-[#A1D6E2] flex items-center justify-center shadow-sm">
                      <item.icon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-[9px] font-medium text-slate-700 dark:text-slate-300 text-center leading-tight">
                      {item.label}
                    </span>
                  </button>
                ))}
                {/* 6 empty slots بنفس الحجم المصغر */}
                {[...Array(6)].map((_, idx) => (
                  <div
                    key={`empty-${idx}`}
                    className="flex flex-col items-center justify-center gap-1 p-1.5 rounded-lg opacity-20"
                  >
                    <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}