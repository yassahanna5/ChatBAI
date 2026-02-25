import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import Draggable from 'react-draggable';
import { Bot, User, Copy, Check, GripVertical, ChevronUp, ChevronDown, MessageSquare } from 'lucide-react';

export default function MessageBubble({ message, userAvatar, userName, allMessages = [], onSelectMessage }) {
  const [copied, setCopied] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const nodeRef = useRef(null);
  const isUser = message.role === 'user';
  
  // الحصول على كل أسئلة المستخدم (الرسائل من type user)
  const userQuestions = allMessages.filter(msg => msg.role === 'user');

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDragStop = (e, data) => {
    setPosition({ x: data.x, y: data.y });
  };

  // تتبع موقع الـ bubble في الصفحة
  useEffect(() => {
    const updatePosition = () => {
      if (nodeRef.current) {
        const rect = nodeRef.current.getBoundingClientRect();
        setPosition({ x: rect.left, y: rect.top });
      }
    };
    
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, []);

  return (
    <Draggable
      nodeRef={nodeRef}
      handle=".drag-handle"
      position={position}
      onStop={handleDragStop}
      bounds="parent"
    >
      <div 
        ref={nodeRef}
        className={`absolute ${isUser ? 'right-4' : 'left-4'} ${showQuestions ? 'z-50' : 'z-10'}`}
        style={{ 
          top: position.y || 'auto',
          bottom: position.y ? 'auto' : '20px',
          maxWidth: '80%',
          minWidth: '300px'
        }}
      >
        {/* Questions Timeline - ثابت ويظهر كل الأسئلة */}
        {showQuestions && (
          <div className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-800 p-2 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {userQuestions.length} Questions
              </h3>
              <button 
                onClick={() => setShowQuestions(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-2 space-y-2">
              {userQuestions.map((q, index) => (
                <button
                  key={q.id || index}
                  onClick={() => {
                    onSelectMessage?.(q);
                    setShowQuestions(false);
                  }}
                  className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${
                    q.id === message.id 
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 border-l-4 border-indigo-500'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-3 h-3 mt-0.5 text-slate-400 flex-shrink-0" />
                    <span className="line-clamp-2 text-slate-700 dark:text-slate-300">
                      {q.content.substring(0, 60)}...
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(q.timestamp).toLocaleTimeString()}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Message Bubble */}
        <div className="relative group">
          {/* Drag Handle */}
          <div className="drag-handle absolute -top-3 left-1/2 transform -translate-x-1/2 cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-white dark:bg-slate-700 rounded-full shadow-lg p-1 border border-slate-200 dark:border-slate-600">
              <GripVertical className="w-4 h-4 text-slate-500" />
            </div>
          </div>

          {/* Questions Toggle Button - يظهر جنب البابل */}
          <button
            onClick={() => setShowQuestions(!showQuestions)}
            className="absolute -left-8 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white dark:bg-slate-700 rounded-full shadow-md flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronUp className="w-4 h-4 text-slate-500" />
          </button>

          <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {!isUser && (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            
            <div className={`max-w-[80%] group ${isUser ? 'order-first' : ''}`}>
              <div className={`rounded-2xl px-4 py-3 ${
                isUser 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' 
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
              }`}>
                {isUser ? (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                        li: ({ children }) => <li className="mb-1">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-bold mb-2">{children}</h3>,
                        code: ({ inline, children }) => 
                          inline 
                            ? <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs">{children}</code>
                            : <pre className="bg-slate-100 dark:bg-slate-700 rounded-lg p-3 overflow-x-auto"><code className="text-xs">{children}</code></pre>
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                )}
                
                {/* File attachments */}
                {message.files && message.files.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {message.files.map((file, i) => (
                      <a
                        key={i}
                        href={file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 hover:opacity-80 transition-opacity"
                      >
                        <img src={file} alt="Attachment" className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
              
              {!isUser && (
                <button
                  onClick={handleCopy}
                  className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
              
              <p className={`text-xs text-slate-400 mt-1 ${isUser ? 'text-right' : ''}`}>
                {message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : ''}
              </p>
            </div>
            
            {isUser && (
              <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-indigo-500 to-purple-600">
                {userAvatar ? (
                  <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-semibold text-sm">
                    {userName?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Draggable>
  );
}
