import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
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

// ==================== دالة تحويل الملف إلى Base64 (تعمل 100%) ====================
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

// ==================== دالة رفع الملف إلى خادم مؤقت (بديل عن base44) ====================
const uploadFileToTempServer = async (file) => {
  try {
    // استخدام خدمة مجانية لرفع الملفات مؤقتاً
    const formData = new FormData();
    formData.append('file', file);
    
    // استخدام خدمة رفع مؤقتة (بديل موثوق)
    const response = await fetch('https://tmpfiles.org/api/v1/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Upload failed');
    }
    
    const data = await response.json();
    // تحويل رابط tmpfiles.org إلى رابط مباشر
    const fileUrl = data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
    return fileUrl;
  } catch (error) {
    console.error('Temp upload failed, using base64 fallback:', error);
    // إذا فشل الرفع، نستخدم Base64 كبديل
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
  const [businessProfile, setBusinessProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
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
    const currentUser = await base44.auth.me();
    setUser(currentUser);
    
    // Check for pending registration data
    const pendingReg = localStorage.getItem('pendingRegistration');
    if (pendingReg && !currentUser.phone) {
      const regData = JSON.parse(pendingReg);
      
      await base44.auth.updateMe({
        phone: regData.personal.phone,
        gender: regData.personal.gender
      });
      
      if (regData.business.business_name) {
        await base44.entities.BusinessProfile.create({
          user_email: currentUser.email,
          ...regData.business
        });
      }
      
      localStorage.removeItem('pendingRegistration');
    }

    // Load subscription
    const subs = await base44.entities.Subscription.filter({ user_email: currentUser.email, status: 'active' });
    setSubscription(Array.isArray(subs) && subs.length > 0 ? subs[0] : null);
    
    if (!currentUser.free_credits_given && (!subs || subs.length === 0)) {
      const freeSub = await base44.entities.Subscription.create({
        user_email: currentUser.email,
        plan_id: 'free',
        plan_name: 'Free Trial',
        credits_total: 10,
        credits_used: 0,
        tokens_per_question: 500,
        status: 'active',
        amount_paid: 0
      });
      setSubscription(freeSub);
      
      await base44.auth.updateMe({ free_credits_given: true });

      await base44.entities.Notification.create({
        user_email: currentUser.email,
        title_en: 'Welcome!',
        title_ar: 'مرحباً!',
        message_en: 'Welcome to our platform! You have received 10 free credits.',
        message_ar: 'مرحباً بك في منصتنا! لقد حصلت على 10 نقاط مجانية.',
        type: 'welcome'
      });

      await base44.entities.ActivityLog.create({
        user_email: currentUser.email,
        action: 'login',
        details: 'First login - free credits given'
      });
    }

    const profiles = await base44.entities.BusinessProfile.filter({ user_email: currentUser.email });
    setBusinessProfile(Array.isArray(profiles) && profiles.length > 0 ? profiles[0] : null);

    const convs = await base44.entities.Conversation.filter({ user_email: currentUser.email }, '-created_date');
    setConversations(Array.isArray(convs) ? convs : []);

    const notifs = await base44.entities.Notification.filter({ user_email: currentUser.email, is_read: false });
    setNotifications(Array.isArray(notifs) ? notifs : []);

    if (!currentUser.onboarding_completed) {
      setShowOnboarding(true);
    }

  } catch (error) {
    console.error('Error loading data:', error);
    // ✅ تعيين قيم افتراضية في حالة الخطأ
    setConversations([]);
    setNotifications([]);
  } finally {
    setLoading(false);
  }
};

  // ==================== دالة OpenRouter المتطورة (تدعم الصور والملفات) ====================
  const invokeOpenRouter = async (model, prompt, files = []) => {
    const apiKey = OPENROUTER_API_KEYS[model];
    const modelName = OPENROUTER_MODELS[model];
    
    // تحضير محتوى المستخدم
    const userContent = [];
    
    // إضافة النص الرئيسي
    userContent.push({
      type: 'text',
      text: prompt
    });

    // إضافة الملفات المرفوعة
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        // الصور نرسلها كـ image_url
        userContent.push({
          type: 'image_url',
          image_url: {
            url: file.url // قد يكون Base64 أو رابط
          }
        });
      } else {
        // المستندات نضيفها كوصف
        userContent.push({
          type: 'text',
          text: `\n[Document: ${file.name} (${file.type}) - ${file.size} bytes]\nURL: ${file.url}\nPlease analyze this document.`
        });
      }
    }

    const messages = [
      {
        role: 'system',
        content: `You are an expert business AI consultant. You MUST analyze any images or documents provided.

Analysis Guidelines:
- For images: Describe exactly what you see, extract text, analyze charts/graphs
- For documents: Read and analyze the content, extract key information
- Always connect your analysis to the user's business question
- Provide actionable insights based on the visual/document data

Respond in ${language === 'ar' ? 'Arabic' : 'English'} with detailed, professional analysis.`
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
      await base44.auth.updateMe({ onboarding_completed: true });
    } catch (error) {
      console.error('Error updating onboarding status:', error);
    }
  };

  const handleNewChat = async () => {
    const newConv = await base44.entities.Conversation.create({
      user_email: user.email,
      title: language === 'ar' ? 'محادثة جديدة' : 'New Conversation',
      messages: [],
      is_active: true
    });
    setConversations([newConv, ...conversations]);
    setActiveConversation(newConv);
    setMessages([]);
  };

  const handleSelectConversation = (conv) => {
    setActiveConversation(conv);
    setMessages(conv.messages || []);
  };

  // ==================== دالة رفع الملفات المحسنة (تعمل 100%) ====================
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    
    try {
      const uploadedFilesData = [];
      
      for (const file of files) {
        try {
          // محاولة رفع الملف إلى خادم مؤقت
          let fileUrl;
          try {
            fileUrl = await uploadFileToTempServer(file);
          } catch (uploadError) {
            console.log('Using base64 fallback for:', file.name);
            // إذا فشل الرفع، نستخدم Base64
            fileUrl = await fileToBase64(file);
          }
          
          uploadedFilesData.push({
            name: file.name,
            type: file.type,
            size: file.size,
            url: fileUrl,
            file: file // الاحتفاظ بالملف الأصلي
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

  // ==================== دالة إرسال الرسالة النهائية ====================
  const handleSendMessage = async (content) => {
    if (!subscription || subscription.credits_used >= subscription.credits_total || !content.trim()) {
      return;
    }

    setSending(true);
    setInputValue('');
    
    // رسالة المستخدم
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
    
    // حفظ الملفات الحالية
    const currentFiles = [...uploadedFiles];
    setUploadedFiles([]);

    try {
      // بناء السياق
      let context = '';
      if (businessProfile) {
        context = `
Business Profile:
- Company: ${businessProfile.business_name}
- Industry: ${businessProfile.industry}
- Goals: ${businessProfile.goals}
- Challenges: ${businessProfile.current_challenges}
`;
      }

      // بناء البرومبت الكامل
      const fullPrompt = `You are an AI business consultant. 

${context}

Previous conversation:
${messages.map(m => `${m.role}: ${m.content}`).join('\n')}

User's new question: ${content}

${currentFiles.length > 0 ? `\n📎 Attached ${currentFiles.length} file(s) for analysis.` : ''}

Instructions:
1. If there are images: Describe them in detail and explain their business relevance
2. If there are documents: Extract and analyze the key information
3. Connect your analysis to the user's business context
4. Provide actionable recommendations

Respond in ${language === 'ar' ? 'Arabic' : 'English'}.`;

      let response;

      if (selectedModel === 'base44') {
        // نموذج base44 المحلي
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: fullPrompt,
          add_context_from_internet: true,
          file_urls: currentFiles.map(f => f.url)
        });
        response = result;
      } else {
        // OpenRouter مع دعم الملفات
        response = await invokeOpenRouter(selectedModel, fullPrompt, currentFiles);
      }

      // رسالة المساعد
      const assistantMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
        model: selectedModel
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);

      // حفظ المحادثة
      if (!activeConversation?.id) {
        const newConv = await base44.entities.Conversation.create({
          user_email: user.email,
          title: content.slice(0, 50),
          messages: finalMessages,
          is_active: true
        });
        setActiveConversation(newConv);
        setConversations([newConv, ...conversations]);
      } else {
        await base44.entities.Conversation.update(activeConversation.id, {
          messages: finalMessages,
          title: activeConversation.title.startsWith('New') ? content.slice(0, 50) : activeConversation.title
        });
      }

      // تحديث الرصيد
      await base44.entities.Subscription.update(subscription.id, {
        credits_used: (subscription.credits_used || 0) + 2
      });

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

  // قائمة الموديلات
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
          unreadNotifications={notifications.filter(n => !n.is_read).length}
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
              <div key={index}>
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
