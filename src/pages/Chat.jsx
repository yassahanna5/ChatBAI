import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Menu, X, Paperclip, X as XIcon, Home, Star, Share2, Plus, Image, File, Brain, ChevronRight, SendHorizonal, Loader2 } from 'lucide-react';
import ChatSidebar from '@/components/chat/ChatSidebar';
import MessageBubble from '@/components/chat/MessageBubble';
import QuickSuggestions from '@/components/chat/QuickSuggestions';
import OnboardingTour from '@/components/OnboardingTour';
import ConversationNavigator from '@/components/chat/ConversationNavigator';
import MobileMenuGrid from '@/components/chat/MobileMenuGrid';
import { useLanguage } from '@/components/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getCurrentUser, 
  getUserSubscription,
  getUserConversations,
  createConversation,
  addMessageToConversation,
  getAllPlans,
  updateUser,
  getUserByEmail
} from '@/lib/firebase';

// ==================== الأيقونات ====================
const MODEL_ICONS = {
  DEEPSEEK: 'https://openrouter.ai/images/icons/DeepSeek.png',
  STEPFUN: 'https://upload.wikimedia.org/wikipedia/commons/6/6c/StepFun.png',
  MISTRAL: 'https://openrouter.ai/images/icons/Mistral.png',
  QWEN: 'https://openrouter.ai/images/icons/Qwen.png' 
};

// ==================== مفاتيح API ====================
const OPENROUTER_API_KEYS = {
  DEEPSEEK: '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',
  STEPFUN: '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',
  MISTRAL: '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',
  QWEN: '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'
};

// ==================== أسماء الموديلات ====================
const OPENROUTER_MODELS = {
  DEEPSEEK: 'deepseek/deepseek-chat',
  STEPFUN: 'stepfun/step-3.5-flash',
  MISTRAL: 'mistralai/mistral-7b-instruct',
  QWEN: 'qwen/qwen3.5-plus-02-15'
};

// ==================== دالة تحويل الملف إلى Base64 ====================
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      reject(error);
    };
  });
};

// ==================== دالة رفع الملف إلى خادم مؤقت ====================
const uploadFileToTempServer = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('https://tmpfiles.org/api/v1/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Upload failed');
    }
    
    const data = await response.json();
    const fileUrl = data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
    return fileUrl;
  } catch (error) {
    console.error('Temp upload failed, using base64 fallback:', error);
    const base64 = await fileToBase64(file);
    return base64;
  }
};

export default function Chat() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const messagesEndRef = useRef(null);
  const plusMenuRef = useRef(null);
  const modelSelectorRef = useRef(null);
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [plans, setPlans] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedModel, setSelectedModel] = useState('base44');
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const fileInputRef = useRef(null);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(event.target)) {
        setShowPlusMenu(false);
      }
      if (modelSelectorRef.current && !modelSelectorRef.current.contains(event.target)) {
        setShowModelSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    try {
      // جلب المستخدم الحالي من sessionStorage
      const currentUser = getCurrentUser();
      
      if (!currentUser) {
        navigate(createPageUrl('SignIn'));
        return;
      }
      
      setUser(currentUser);
      
      // جلب أحدث بيانات المستخدم من Firebase
      const freshUserData = await getUserByEmail(currentUser.email);
      
      // جلب اشتراك المستخدم
      const userSub = await getUserSubscription(currentUser.email);
      setSubscription(userSub);
      
      // جلب محادثات المستخدم
      const userConvs = await getUserConversations(currentUser.email);
      setConversations(userConvs);
      
      // جلب كل الخطط (للاستخدام في صفحة Plans)
      const allPlans = await getAllPlans();
      setPlans(allPlans);
      
      // التحقق من إكمال Onboarding
      if (freshUserData && !freshUserData.onboarding_completed) {
        setShowOnboarding(true);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  // تحديث بيانات المستخدم (للبروفايل)
  const handleUpdateUserProfile = async (userData) => {
    try {
      if (!user) return false;
      
      const result = await updateUser(user.id, userData);
      if (result.success) {
        // تحديث الـ sessionStorage
        const updatedUser = { ...user, ...userData };
        sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
        setUser(updatedUser);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  };

  // ==================== دالة OpenRouter ====================
  const invokeOpenRouter = async (model, prompt, files = []) => {
    const apiKey = OPENROUTER_API_KEYS[model];
    const modelName = OPENROUTER_MODELS[model];
    
    const userContent = [];
    
    userContent.push({
      type: 'text',
      text: prompt
    });

    for (const file of files) {
      if (file.type.startsWith('image/')) {
        userContent.push({
          type: 'image_url',
          image_url: {
            url: file.url
          }
        });
      } else {
        userContent.push({
          type: 'text',
          text: `\n[Document: ${file.name} (${file.type}) - ${file.size} bytes]\nURL: ${file.url}\nPlease analyze this document.`
        });
      }
    }

    const messages = [
      {
        role: 'system',
        content: `You are an expert business AI consultant. Respond in ${language === 'ar' ? 'Arabic' : 'English'} with detailed, professional analysis.`
      },
      {
        role: 'user',
        content: userContent
      }
    ];

    try {
      console.log(`📤 Sending to ${modelName} with ${files.length} files`);
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'ChatBAI'
        },
        body: JSON.stringify({
          model: modelName,
          messages: messages,
          temperature: 0.7,
          max_tokens: 4000
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Response received');
      return data.choices[0].message.content;
    } catch (error) {
      console.error(`❌ Error with ${model}:`, error);
      throw error;
    }
  };

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    try {
      if (user) {
        await updateUser(user.id, { onboarding_completed: true });
      }
    } catch (error) {
      console.error('Error updating onboarding status:', error);
    }
  };

  const handleNewChat = async () => {
    if (!user) return;
    
    const newConv = await createConversation({
      user_email: user.email,
      title: language === 'ar' ? 'محادثة جديدة' : 'New Conversation',
      messages: []
    });
    
    if (newConv.success) {
      const newConversation = {
        id: newConv.id,
        user_email: user.email,
        title: language === 'ar' ? 'محادثة جديدة' : 'New Conversation',
        messages: [],
        createdAt: new Date().toISOString()
      };
      
      setConversations([newConversation, ...conversations]);
      setActiveConversation(newConversation);
      setMessages([]);
    }
  };

  const handleSelectConversation = (conv) => {
    setActiveConversation(conv);
    setMessages(conv.messages || []);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    
    try {
      const uploadedFilesData = [];
      
      for (const file of files) {
        try {
          let fileUrl;
          try {
            fileUrl = await uploadFileToTempServer(file);
          } catch (uploadError) {
            console.log('Using base64 fallback for:', file.name);
            fileUrl = await fileToBase64(file);
          }
          
          uploadedFilesData.push({
            name: file.name,
            type: file.type,
            size: file.size,
            url: fileUrl,
            file: file
          });
        } catch (fileError) {
          console.error(`Failed to process ${file.name}:`, fileError);
        }
      }
      
      setUploadedFiles([...uploadedFiles, ...uploadedFilesData]);
      console.log('✅ Files ready:', uploadedFilesData.map(f => f.name));
      
    } catch (error) {
      console.error('Upload error:', error);
      alert(language === 'ar' ? 'فشل رفع بعض الملفات' : 'Some files failed to upload');
    } finally {
      setUploading(false);
    }
    setShowPlusMenu(false);
  };

  const removeFile = (index) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleQuickSuggestion = (prompt) => {
    handleSendMessage(prompt);
  };

  const handleSendMessage = async (content) => {
    if (!subscription || subscription.credits_used >= subscription.credits_total || !content.trim() || !user) {
      return;
    }

    setSending(true);
    setInputValue('');
    
    const userMessage = {
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
      files: uploadedFiles.map(f => ({
        name: f.name,
        type: f.type,
        url: f.url
      })),
      model: selectedModel
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    
    const currentFiles = [...uploadedFiles];
    setUploadedFiles([]);

    try {
      const fullPrompt = `Previous conversation:
${messages.map(m => `${m.role}: ${m.content}`).join('\n')}

User's new question: ${content}

${currentFiles.length > 0 ? `\n📎 Attached ${currentFiles.length} file(s) for analysis.` : ''}

Respond in ${language === 'ar' ? 'Arabic' : 'English'}.`;

      let response;

      if (selectedModel === 'base44') {
        // استخدام OpenRouter كنموذج افتراضي
        response = await invokeOpenRouter('DEEPSEEK', fullPrompt, currentFiles);
      } else {
        response = await invokeOpenRouter(selectedModel, fullPrompt, currentFiles);
      }

      const assistantMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
        model: selectedModel
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);

      // حفظ المحادثة في Firebase
      if (!activeConversation?.id) {
        const newConv = await createConversation({
          user_email: user.email,
          title: content.slice(0, 50),
          messages: finalMessages
        });
        
        if (newConv.success) {
          const newConversation = {
            id: newConv.id,
            user_email: user.email,
            title: content.slice(0, 50),
            messages: finalMessages,
            createdAt: new Date().toISOString()
          };
          setActiveConversation(newConversation);
          setConversations([newConversation, ...conversations]);
        }
      } else {
        // تحديث المحادثة الموجودة
        const updatedConv = {
          ...activeConversation,
          messages: finalMessages,
          title: activeConversation.title.startsWith('New') ? content.slice(0, 50) : activeConversation.title
        };
        
        // إضافة كل رسالة على حدة (في التطبيق الفعلي، تحتاج دالة updateConversation)
        for (const msg of [userMessage, assistantMessage]) {
          await addMessageToConversation(activeConversation.id, msg);
        }
        
        setActiveConversation(updatedConv);
        setConversations(conversations.map(c => 
          c.id === activeConversation.id ? updatedConv : c
        ));
      }

      // تحديث الرصيد (هذا يحتاج دالة في firebase.js لتحديث الاشتراك)
      // await updateSubscriptionCredits(user.email, 2);

    } catch (error) {
      console.error('Send error:', error);
      setMessages([...updatedMessages, {
        role: 'assistant',
        content: language === 'ar' 
          ? `❌ خطأ: ${error.message}. حاول مرة أخرى.` 
          : `❌ Error: ${error.message}. Please try again.`,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setSending(false);
    }
  };

  const handleModelSelect = (model) => {
    setSelectedModel(model);
    setShowModelSelector(false);
    setShowPlusMenu(false);
  };

  const handleNavigate = (page) => {
    navigate(createPageUrl(page));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-[#1995AD]" />
      </div>
    );
  }

  const canSendMessage = subscription && subscription.credits_used < subscription.credits_total;

  const models = [
    { id: 'base44', name: 'Base44 AI', icon: '🧠', description: 'Default model - Files OK' },
    { id: 'DEEPSEEK', name: 'DeepSeek', icon: MODEL_ICONS.DEEPSEEK, description: 'Advanced - Files OK', isImage: true },
    { id: 'STEPFUN', name: 'StepFun', icon: MODEL_ICONS.STEPFUN, description: 'Fast - Files OK', isImage: true },
    { id: 'MISTRAL', name: 'Mistral', icon: MODEL_ICONS.MISTRAL, description: 'Efficient - Files OK', isImage: true },
    { id: 'QWEN', name: 'Qwen 3.5', icon: MODEL_ICONS.QWEN, description: 'Latest - Files OK', isImage: true }
  ];

  const currentModel = models.find(m => m.id === selectedModel);

  return (
    <div className="h-screen flex bg-[#F1F1F2] dark:bg-slate-900">
      {showOnboarding && <OnboardingTour onComplete={handleOnboardingComplete} />}
      
      {/* Mobile Menu */}
      <div className="lg:hidden fixed top-4 right-4 z-50 flex gap-2">
        <MobileMenuGrid
          onNavigateHome={() => navigate(createPageUrl('Home'))}
          onNavigateReviews={() => navigate(createPageUrl('Reviews'))}
          onShare={async () => {
            if (navigator.share) {
              await navigator.share({
                title: 'ChatBAI',
                text: 'AI Business Platform',
                url: window.location.origin
              });
            }
          }}
        />
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg"
        >
          {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>
      
      {/* Desktop Buttons */}
      <div className="hidden lg:flex fixed top-4 right-4 z-50 gap-2">
        <button onClick={() => navigate(createPageUrl('Home'))} className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg">
          <Home className="w-4 h-4" />
        </button>
        <button onClick={() => navigate(createPageUrl('Reviews'))} className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg">
          <Star className="w-4 h-4" />
        </button>
        <button onClick={async () => {
          if (navigator.share) {
            await navigator.share({
              title: 'ChatBAI',
              text: 'AI Business Platform',
              url: window.location.origin
            });
          }
        }} className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg">
          <Share2 className="w-4 h-4" />
        </button>
      </div>
      
      <ConversationNavigator messages={messages} />

      {/* Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setSidebarOpen(false)} />
      )}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative left-0 z-40 h-full transition-transform`}>
        <ChatSidebar
          user={user}
          subscription={subscription}
          conversations={conversations}
          activeConversation={activeConversation}
          onNewChat={handleNewChat}
          onSelectConversation={handleSelectConversation}
          onNavigate={handleNavigate}
          onUpdateProfile={handleUpdateUserProfile}
          unreadNotifications={0}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F1F1F2] dark:bg-slate-900">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-6">
          <div className="max-w-3xl mx-auto">
            {messages.length === 0 && (
              <div className="h-auto flex flex-col items-center justify-center text-center px-4 py-8">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1995AD] to-[#A1D6E2] flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">
                  {language === 'ar' ? 'مرحباً بك!' : 'Welcome!'}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 max-w-md mb-8">
                  {language === 'ar' 
                    ? 'اسألني عن تحليل السوق، استراتيجيات التسويق، المنافسين، أو أي شيء يتعلق بنشاطك التجاري.'
                    : 'Ask me about market analysis, marketing strategies, competitors, or anything related to your business.'}
                </p>
              </div>
            )}
            
            {messages.length === 0 && <QuickSuggestions onSelect={handleQuickSuggestion} />}
            
            {messages.map((message, index) => (
              <div key={index} data-message-role={message.role}>
                <MessageBubble 
                  message={message}
                  userAvatar={user?.avatar_url}
                  userName={user?.full_name}
                />
                {message.role === 'assistant' && index === messages.length - 1 && !sending && (
                  <QuickSuggestions onSelect={handleQuickSuggestion} />
                )}
              </div>
            ))}
            
            {sending && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1995AD] to-[#A1D6E2] flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* File Previews */}
        {uploadedFiles.length > 0 && (
          <div className="px-4 pb-2">
            <div className="max-w-3xl mx-auto">
              <div className="flex flex-wrap gap-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                      {file.type.startsWith('image/') ? (
                        <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <File className="w-8 h-8 text-slate-400" />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XIcon className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="bg-[#F1F1F2] dark:bg-slate-900 px-4 pb-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              {/* Input Row */}
              <div className="flex items-end bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                {/* Plus Button */}
                <div className="relative" ref={plusMenuRef}>
                  <button
                    onClick={() => setShowPlusMenu(!showPlusMenu)}
                    disabled={uploading}
                    className="ml-3 mb-3 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  </button>

                  <AnimatePresence>
                    {showPlusMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-full left-0 mb-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border overflow-hidden z-50"
                      >
                        <div className="p-2">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                          >
                            <Paperclip className="w-5 h-5 text-blue-500" />
                            <span>{language === 'ar' ? 'رفع صور وملفات' : 'Upload images & files'}</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Text Input */}
                <div className="flex-1">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={language === 'ar' ? 'اسأل أي شيء...' : 'Ask anything...'}
                    disabled={!canSendMessage || sending}
                    className="w-full py-4 px-0 bg-transparent border-0 focus:ring-0 resize-none max-h-32"
                    rows={1}
                  />
                </div>

                {/* Send Button */}
                <div className="mr-3 mb-3">
                  <button
                    onClick={() => handleSendMessage(inputValue)}
                    disabled={!canSendMessage || sending || !inputValue.trim()}
                    className={`p-2 rounded-full transition-all ${
                      inputValue.trim() 
                        ? 'bg-[#1995AD] text-white hover:bg-[#148095]' 
                        : 'bg-transparent text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <SendHorizonal className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Model Selector */}
              <div className="flex justify-center mt-2" ref={modelSelectorRef}>
                <button
                  onClick={() => setShowModelSelector(!showModelSelector)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-xs text-slate-500"
                >
                  {currentModel?.isImage ? (
                    <img src={currentModel.icon} alt={currentModel.name} className="w-4 h-4 object-contain" />
                  ) : (
                    <span>{currentModel?.icon}</span>
                  )}
                  <span>{currentModel?.name}</span>
                  <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                </button>

                <AnimatePresence>
                  {showModelSelector && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-full mb-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border overflow-hidden z-50"
                    >
                      <div className="p-2">
                        {models.map((model) => (
                          <button
                            key={model.id}
                            onClick={() => {
                              handleModelSelect(model.id);
                              setShowModelSelector(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 ${
                              selectedModel === model.id ? 'bg-slate-100 dark:bg-slate-700' : ''
                            }`}
                          >
                            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                              {model.isImage ? (
                                <img src={model.icon} alt={model.name} className="w-5 h-5 object-contain" />
                              ) : (
                                <span className="text-lg">{model.icon}</span>
                              )}
                            </div>
                            <div className="flex-1 text-left">
                              <div className="font-medium text-sm">{model.name}</div>
                              <div className="text-xs text-slate-500">{model.description}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

