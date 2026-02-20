import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '../LanguageContext';

export default function ChatInput({ onSend, disabled, loading }) {
  const [message, setMessage] = useState('');
  const { t, isRtl } = useLanguage();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled && !loading) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <div className="flex gap-3 items-end">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('typeMessage')}
          disabled={disabled || loading}
          className={`flex-1 min-h-[50px] max-h-[200px] resize-none bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-indigo-500 ${isRtl ? 'text-right' : ''}`}
          rows={1}
        />
        <button
          type="submit"
          disabled={!message.trim() || disabled || loading}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-[50px] px-6 rounded"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
          )}
        </button>
      </div>
      {disabled && (
        <p className="text-xs text-red-500 mt-2">
          {t('noPlan')} - {t('upgradeNow')}
        </p>
      )}
    </form>
  );
}