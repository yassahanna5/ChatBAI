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
  getUserByEmail,
  updateSubscriptionCredits
} from '@/lib/firebase';

// ==================== الأيقونات ====================
const MODEL_ICONS = {
  GEMMA: 'https://openrouter.ai/images/icons/Google.png',
  QWEN: 'https://openrouter.ai/images/icons/Qwen.png',
  OPENAI: 'https://openrouter.ai/images/icons/OpenAI.png',
  MISTRAL: 'https://openrouter.ai/images/icons/Mistral.png',
  STEPFUN: 'https://upload.wikimedia.org/wikipedia/commons/6/6c/StepFun.png'
};

// ==================== نماذج الخلفية (Ollama Cloud عبر Backend) ====================
const BACKEND_ANALYZE_URL = import.meta.env.VITE_BACKEND_ANALYZE_URL || 'https://api.chatbai.business/analyze';
const BACKEND_MODEL_MAP = {
  GEMMA: 'llama3.2:latest',
  GEMMA2: 'deepseek-r1:latest',
  QWEN: 'qwen2.5:latest',
  OPENAI: 'phi4:latest',
  MISTRAL: 'mistral:latest',
  STEPFUN: 'llama3.2:latest',
  LLAMA32_CLOUD: 'llama3.2:latest',
  DEEPSEEK_R1_CLOUD: 'deepseek-r1:latest',
  QWEN25_CLOUD: 'qwen2.5:latest',
  PHI4_CLOUD: 'phi4:latest',
  MISTRAL_CLOUD: 'mistral:latest',
  NOMIC_EMBED_CLOUD: 'nomic-embed-text:latest'
};

const BUSINESS_INTELLIGENCE_FRAMEWORK = `Core services you must cover:
1) Market analysis and target audience identification
2) Marketing strategy building
3) Content production and management
4) Performance tracking and analysis
5) Continuous improvement

Mandatory depth:
- Analyze company/services, audience behavior, demand trends, competitors, pain points, growth opportunities.
- Identify segments by age, interests, purchasing power, buying behavior, and geography.
- Build buyer personas and channel recommendations.
- Provide KPI interpretation, strengths/weaknesses, and practical optimization actions.

Output quality:
- No hallucinations. If data is missing, say exactly what is missing and label assumptions clearly.
- Keep recommendations strictly tied to profile data and business context.
- Use clear sections, bullets, and actionable steps.`;

const STABILITY_KEY = import.meta.env.VITE_STABILITY_KEY || '';
const HF_TOKEN = import.meta.env.VITE_HF_TOKEN || '';
const AIHORDE_KEY = import.meta.env.VITE_AIHORDE_KEY || '';
const REPLICATE_API_TOKEN = import.meta.env.VITE_REPLICATE_API_TOKEN || '';

// التحقق من وجود المفاتيح في بيئة التطوير
if (import.meta.env.DEV) {
  console.log('Backend analyze URL:', BACKEND_ANALYZE_URL);
}

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
  const [selectedModel, setSelectedModel] = useState('GEMMA');
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

  // ==================== دالة استدعاء Backend للتحليل ====================
  const invokeOpenRouter = async (model, prompt, files = []) => {
    const modelName = BACKEND_MODEL_MAP[model] || 'llama3.2:latest';

    const attachedFilesText = files.length
      ? `\nAttached files for context:\n${files.map(f => `- ${f.name} (${f.type}, ${f.size} bytes): ${f.url}`).join('\n')}`
      : '';

    const response = await fetch(BACKEND_ANALYZE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        type: 'business',
        temperature: 0.2,
        max_tokens: 1800,
        language,
        prompt: `${prompt}${attachedFilesText}`
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return {
      type: 'text',
      content: data.content || (language === 'ar' ? 'تعذر الحصول على استجابة.' : 'No response content returned.')
    };
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

  const buildUserProfilePayload = () => ({
    user_id: user?.id || '',
    email: user?.email || '',
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    gender: user?.gender || '',
    birth_date: user?.birth_date || '',
    business_name: user?.business_name || '',
    business_type: user?.business_type || '',
    industry: user?.industry || '',
    company_size: user?.company_size || '',
    website: user?.website || '',
    monthly_budget: user?.monthly_budget || '',
    country: user?.country || '',
    city: user?.city || '',
    target_audience: user?.target_audience || '',
    current_challenges: user?.current_challenges || '',
    goals: user?.goals || '',
    competitors: user?.competitors || '',
    social_platforms: user?.social_platforms || ''
  });

  const buildDesignPrompt = (userPrompt) => {
    const p = buildUserProfilePayload();
    return `Create a professional marketing design based on this business profile:
Business Name: ${p.business_name || 'N/A'}
Business Type: ${p.business_type || 'N/A'}
Industry: ${p.industry || 'N/A'}
Target Audience: ${p.target_audience || 'N/A'}
Goals: ${p.goals || 'N/A'}
Current Challenges: ${p.current_challenges || 'N/A'}
Country/City: ${p.country || 'N/A'} / ${p.city || 'N/A'}
Brand Context: ${p.competitors || 'N/A'}
Preferred Platforms: ${p.social_platforms || 'N/A'}
Monthly Budget: ${p.monthly_budget || 'N/A'}

User design request:
${userPrompt}

Generate high-quality visuals suitable for social media, banners, logos, and ad creatives.`;
  };

  const pollAIHordeResult = async (requestId) => {
    const statusUrl = `https://aihorde.net/api/v2/generate/status/${requestId}`;
    for (let i = 0; i < 20; i++) {
      const res = await fetch(statusUrl);
      const data = await res.json();
      if (data.done && data.generations?.length > 0) {
        return data.generations[0].img;
      }
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    throw new Error('AI Horde timeout');
  };

  const pollReplicatePrediction = async (getUrl) => {
    for (let i = 0; i < 25; i++) {
      const res = await fetch(getUrl, {
        headers: {
          Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error(`Replicate polling failed (${res.status})`);
      }

      const data = await res.json();
      if (data.status === 'succeeded') {
        if (Array.isArray(data.output)) return data.output[0];
        return data.output;
      }

      if (data.status === 'failed' || data.status === 'canceled') {
        throw new Error(`Replicate generation ${data.status}`);
      }

      await new Promise(resolve => setTimeout(resolve, 2500));
    }

    throw new Error('Replicate timeout');
  };

  const runReplicateModel = async (model, input) => {
    const createUrl = `https://api.replicate.com/v1/models/${model}/predictions`;
    const createRes = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ input })
    });

    if (!createRes.ok) {
      throw new Error(`Replicate create failed (${createRes.status})`);
    }

    const prediction = await createRes.json();
    if (prediction.status === 'succeeded') {
      if (Array.isArray(prediction.output)) return prediction.output[0];
      return prediction.output;
    }

    if (!prediction.urls?.get) {
      throw new Error('Replicate prediction URL missing');
    }

    return pollReplicatePrediction(prediction.urls.get);
  };

  const generateDesignsFromProviders = async (userPrompt) => {
    const prompt = buildDesignPrompt(userPrompt);
    const results = [];

    if (STABILITY_KEY) {
      try {
        const form = new FormData();
        form.append('prompt', prompt);
        form.append('output_format', 'png');
        form.append('aspect_ratio', '1:1');

        const res = await fetch('https://api.stability.ai/v2beta/stable-image/generate/ultra', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${STABILITY_KEY}`,
            Accept: 'image/*'
          },
          body: form
        });

        if (res.ok) {
          const blob = await res.blob();
          results.push({ name: 'Design 1', url: URL.createObjectURL(blob) });
        }
      } catch (error) {
        console.error('Stability provider failed:', error);
      }
    }

    if (HF_TOKEN) {
      try {
        const res = await fetch('https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${HF_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              num_inference_steps: 40,
              guidance_scale: 8.5,
              width: 768,
              height: 768
            }
          })
        });

        if (res.ok) {
          const blob = await res.blob();
          results.push({ name: 'Design 2', url: URL.createObjectURL(blob) });
        }
      } catch (error) {
        console.error('Hugging Face provider failed:', error);
      }
    }

    if (AIHORDE_KEY) {
      try {
        const queueRes = await fetch('https://aihorde.net/api/v2/generate/async', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: AIHORDE_KEY,
            'Client-Agent': 'ChatBAI:1.0'
          },
          body: JSON.stringify({
            prompt,
            params: {
              sampler_name: 'DDIM',
              cfg_scale: 7.5,
              height: 512,
              width: 512,
              steps: 30,
              n: 1
            },
            nsfw: false,
            trusted_workers: false,
            slow_workers: true
          })
        });

        if (queueRes.ok) {
          const queueData = await queueRes.json();
          const imageUrl = await pollAIHordeResult(queueData.id);
          if (imageUrl) {
            results.push({ name: 'Design 3', url: imageUrl });
          }
        }
      } catch (error) {
        console.error('AI Horde provider failed:', error);
      }
    }

    if (REPLICATE_API_TOKEN) {
      try {
        const imagenUrl = await runReplicateModel('google/imagen-4', {
          prompt,
          aspect_ratio: '16:9',
          safety_filter_level: 'block_medium_and_above'
        });

        if (imagenUrl) {
          results.push({ name: 'Design 4', url: imagenUrl });
        }
      } catch (error) {
        console.error('Replicate Imagen provider failed:', error);
      }

      try {
        const fluxUrl = await runReplicateModel('black-forest-labs/flux-1.1-pro', {
          prompt,
          prompt_upsampling: true
        });

        if (fluxUrl) {
          results.push({ name: 'Design 5', url: fluxUrl });
        }
      } catch (error) {
        console.error('Replicate Flux provider failed:', error);
      }
    }

    return results;
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
      // ✅ تحضير بيانات البروفايل بشكل كامل
      const profileContext = user ? `
User Profile Information:
- Full Name: ${user.full_name || 'Not provided'}
- Email: ${user.email || 'Not provided'}
- Phone: ${user.phone || 'Not provided'}
- Gender: ${user.gender || 'Not provided'}
- Birth Date: ${user.birth_date || 'Not provided'}

Business Information:
- Company Name: ${user.business_name || 'Not provided'}
- Business Type: ${user.business_type || 'Not provided'}
- Industry: ${user.industry || 'Not provided'}
- Company Size: ${user.company_size || 'Not provided'}
- Website: ${user.website || 'Not provided'}
- Monthly Budget: ${user.monthly_budget || 'Not provided'}

Location:
- Country: ${user.country || 'Not provided'}
- City: ${user.city || 'Not provided'}

Goals & Challenges:
- Target Audience: ${user.target_audience || 'Not provided'}
- Current Challenges: ${user.current_challenges || 'Not provided'}
- Goals: ${user.goals || 'Not provided'}
- Competitors: ${user.competitors || 'Not provided'}

Social Media: ${user.social_platforms || 'Not provided'}
` : 'No profile information available.';

      // ✅ بناء البرومبت الكامل مع بيانات البروفايل
      const fullPrompt = `You are an AI business consultant. You have access to the user's profile information below.

${profileContext}

Previous conversation:
${messages.map(m => `${m.role}: ${m.content}`).join('\n')}

User's new question: ${content}

${currentFiles.length > 0 ? `\n📎 Attached ${currentFiles.length} file(s) for analysis.` : ''}

Instructions:
1. Use ONLY the user's profile and business context to answer.
2. If question is outside business/profile scope, refuse politely.
3. Consider industry, goals, challenges, audience, and budget.
4. Tailor advice to this exact user's profile only.
5. Cover the 5 core services in your analysis when relevant:
   - Market analysis and audience identification
   - Marketing strategy building
   - Content production and management
   - Performance tracking and analysis
   - Continuous improvement
6. Include audience insights (age, interests, purchasing power, behavior, geography), buyer persona, competitor insights, market trends, strengths/weaknesses, opportunities and risks.
7. Provide practical strategy: channels, campaign ideas, content angles, post/video description suggestions, KPI plan, and optimization actions.
8. Keep writing clear, accurate, and professional with no spelling mistakes.
9. If profile/business data is missing, explicitly list missing fields and continue with labeled assumptions.
10. Add an "Export-Ready Report" section at the end so user can save/download it as a report.

Mandatory output structure:
A) Executive Summary
B) Market & Audience Analysis
C) Buyer Personas
D) Marketing Strategy (channels + quick wins)
E) Content Plan (platform-specific)
F) Performance Tracking Plan (KPIs + diagnostics)
G) Continuous Improvement Plan (7/30/90 days)
H) Export-Ready Report

Respond in ${language === 'ar' ? 'Arabic' : 'English'} with detailed, professional analysis.`;

      if (selectedModel === 'DESIGN') {
        const generatedDesigns = await generateDesignsFromProviders(content);

        if (!generatedDesigns.length) {
          throw new Error(language === 'ar'
            ? 'تعذر إنشاء التصميمات. تأكد من إعداد مفاتيح البيئة (VITE_STABILITY_KEY / VITE_HF_TOKEN / VITE_AIHORDE_KEY / VITE_REPLICATE_API_TOKEN).'
            : 'Failed to generate designs. Please configure env keys (VITE_STABILITY_KEY / VITE_HF_TOKEN / VITE_AIHORDE_KEY / VITE_REPLICATE_API_TOKEN).');
        }

        const designsMarkdown = generatedDesigns
          .map((item, idx) => `### ${language === 'ar' ? `تصميم ${idx + 1}` : `Design ${idx + 1}`}\n![${item.name}](${item.url})`)
          .join('\n\n');

        const assistantMessage = {
          role: 'assistant',
          content: language === 'ar'
            ? `✅ تم إنشاء تصميمات مخصصة تلقائيًا بناءً على بروفايلك وطلبك.\n\n${designsMarkdown}`
            : `✅ Personalized designs were generated automatically based on your profile and prompt.\n\n${designsMarkdown}`,
          timestamp: new Date().toISOString(),
          model: selectedModel
        };

        const finalMessages = [...updatedMessages, assistantMessage];
        setMessages(finalMessages);

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
          const updatedConv = {
            ...activeConversation,
            messages: finalMessages,
            title: activeConversation.title.startsWith('New') ? content.slice(0, 50) : activeConversation.title
          };

          for (const msg of [userMessage, assistantMessage]) {
            await addMessageToConversation(activeConversation.id, msg);
          }

          setActiveConversation(updatedConv);
          setConversations(conversations.map(c =>
            c.id === activeConversation.id ? updatedConv : c
          ));
        }

        setSending(false);
        return;
      }

      let response = await invokeOpenRouter(selectedModel, fullPrompt, currentFiles);

      // تحضير رسالة المساعد حسب نوع الرد (نص أو صور)
      let assistantMessage;
      
      if (response.type === 'multimodal') {
        assistantMessage = {
          role: 'assistant',
          content: response.content,
          timestamp: new Date().toISOString(),
          model: selectedModel,
          isMultimodal: true
        };
      } else {
        assistantMessage = {
          role: 'assistant',
          content: response.content,
          timestamp: new Date().toISOString(),
          model: selectedModel
        };
      }

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);

      // ✅ خصم 2 كريديت بعد الرد الناجح
      if (user?.email) {
        const creditsResult = await updateSubscriptionCredits(user.email, 2);
        if (creditsResult.success) {
          console.log('✅ 2 credits deducted successfully');
          
          if (subscription) {
            setSubscription({
              ...subscription,
              credits_used: (subscription.credits_used || 0) + 2
            });
          }
        } else {
          console.warn('⚠️ Failed to deduct credits');
        }
      }

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
        const updatedConv = {
          ...activeConversation,
          messages: finalMessages,
          title: activeConversation.title.startsWith('New') ? content.slice(0, 50) : activeConversation.title
        };
        
        for (const msg of [userMessage, assistantMessage]) {
          await addMessageToConversation(activeConversation.id, msg);
        }
        
        setActiveConversation(updatedConv);
        setConversations(conversations.map(c => 
          c.id === activeConversation.id ? updatedConv : c
        ));
      }

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
    { id: 'GEMMA', name: 'Gemma 3 27B', icon: MODEL_ICONS.GEMMA, description: 'Google - Advanced AI', isImage: true },
    { id: 'GEMMA2', name: 'Gemma 3 27B', icon: MODEL_ICONS.GEMMA, description: 'Google - Second instance', isImage: true },
    { id: 'QWEN', name: 'Qwen3 Coder', icon: MODEL_ICONS.QWEN, description: '480B Coder - Powerful', isImage: true },
    { id: 'OPENAI', name: 'GPT-OSS 120B', icon: MODEL_ICONS.OPENAI, description: 'Open Source GPT', isImage: true },
    { id: 'MISTRAL', name: 'Mistral Small 3.1', icon: MODEL_ICONS.MISTRAL, description: '24B - Efficient', isImage: true },
    { id: 'STEPFUN', name: 'Step 3.5 Flash', icon: MODEL_ICONS.STEPFUN, description: 'Fast & Responsive', isImage: true },
    { id: 'LLAMA32_CLOUD', name: 'llama3.2:latest (cloud)', icon: MODEL_ICONS.GEMMA, description: 'Ollama Cloud Llama 3.2', isImage: true },
    { id: 'DEEPSEEK_R1_CLOUD', name: 'deepseek-r1:latest (cloud)', icon: MODEL_ICONS.QWEN, description: 'Ollama Cloud DeepSeek R1', isImage: true },
    { id: 'QWEN25_CLOUD', name: 'qwen2.5:latest (cloud)', icon: MODEL_ICONS.QWEN, description: 'Ollama Cloud Qwen 2.5', isImage: true },
    { id: 'PHI4_CLOUD', name: 'phi4:latest (cloud)', icon: MODEL_ICONS.OPENAI, description: 'Ollama Cloud Phi 4', isImage: true },
    { id: 'MISTRAL_CLOUD', name: 'mistral:latest (cloud)', icon: MODEL_ICONS.MISTRAL, description: 'Ollama Cloud Mistral', isImage: true },
    { id: 'NOMIC_EMBED_CLOUD', name: 'nomic-embed-text:latest (cloud)', icon: MODEL_ICONS.STEPFUN, description: 'Ollama Cloud Nomic Embed Text', isImage: true },
    { id: 'DESIGN', name: 'Create a Design', icon: '🎨', description: language === 'ar' ? 'إنشاء تصميمات تلقائية وفق البروفايل' : 'Generate profile-based designs automatically', isImage: false }
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
