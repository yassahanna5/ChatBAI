import React, { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown, MessageCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConversationNavigator({ messages }) {
  const [userQuestions, setUserQuestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const messageRefs = useRef({});

  useEffect(() => {
    // Extract user questions
    const questions = messages
      .map((msg, index) => ({
        index,
        role: msg.role,
        content: msg.content,
        id: `msg-${index}`
      }))
      .filter(msg => msg.role === 'user');

    setUserQuestions(questions);

    // Observe DOM changes
    const observer = new MutationObserver(() => {
      const newQuestions = messages
        .map((msg, index) => ({
          index,
          role: msg.role,
          content: msg.content,
          id: `msg-${index}`
        }))
        .filter(msg => msg.role === 'user');
      setUserQuestions(newQuestions);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }, [messages]);

  const scrollToQuestion = (questionIndex) => {
    const messageElements = document.querySelectorAll('[data-message-role="user"]');
    const targetElement = Array.from(messageElements)[questionIndex];

    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setActiveIndex(questionIndex);

      // Highlight effect
      targetElement.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.5)';
      targetElement.style.transition = 'box-shadow 0.3s ease';
      setTimeout(() => {
        targetElement.style.boxShadow = '';
      }, 2000);
    }
  };

  const navigateNext = () => {
    if (activeIndex === null || activeIndex >= userQuestions.length - 1) {
      scrollToQuestion(0);
    } else {
      scrollToQuestion(activeIndex + 1);
    }
  };

  const navigatePrev = () => {
    if (activeIndex === null || activeIndex <= 0) {
      scrollToQuestion(userQuestions.length - 1);
    } else {
      scrollToQuestion(activeIndex - 1);
    }
  };

  if (userQuestions.length === 0) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="fixed right-24 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2"
        >
          {/* Toggle Button */}
          <button
            onClick={() => setIsVisible(false)}
            className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Navigation Controls */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-2 flex flex-col gap-1">
            <button
              onClick={navigatePrev}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
              title="Previous question"
            >
              <ChevronUp className="w-5 h-5" />
            </button>

            <div className="px-2 py-1 text-xs text-center text-slate-600 dark:text-slate-400">
              {activeIndex !== null ? activeIndex + 1 : '-'} / {userQuestions.length}
            </div>

            <button
              onClick={navigateNext}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
              title="Next question"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Question Dots */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-2 max-h-96 overflow-y-auto space-y-1">
            {userQuestions.map((q, idx) => (
              <div key={q.id} className="relative">
                <button
                  onClick={() => scrollToQuestion(idx)}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    activeIndex === idx
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-indigo-100 dark:hover:bg-indigo-900'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                </button>

                {/* Tooltip */}
                {hoveredIndex === idx && (
                  <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-slate-900 dark:bg-slate-700 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap max-w-xs">
                    <p className="truncate">{q.content.slice(0, 50)}...</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Show Button when hidden */}
      {!isVisible && (
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setIsVisible(true)}
          className="fixed right-6 top-1/2 -translate-y-1/2 z-50 p-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}