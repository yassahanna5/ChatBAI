import React from 'react';
import { useLanguage } from '../LanguageContext';

export default function CreditsBar({ total, used }) {
  const { t } = useLanguage();
  const available = total - used;
  const percentage = total > 0 ? (used / total) * 100 : 0;
  const questionsLeft = Math.floor(available / 2);
  
  const getBarColor = () => {
    if (percentage >= 80) return 'bg-red-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-gradient-to-r from-[#1995AD] to-[#A1D6E2]';
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('credits')}</span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {available} {t('available')} / {total} {t('credits')}
        </span>
      </div>
      <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getBarColor()} transition-all duration-500 rounded-full`}
          style={{ width: `${100 - percentage}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs">
        <span className="text-[#1995AD] dark:text-[#A1D6E2]">
          {questionsLeft} {t('questionsLeft')}
        </span>
        <span className="text-slate-500 dark:text-slate-400">
          {used} {t('used')}
        </span>
      </div>
    </div>
  );
}