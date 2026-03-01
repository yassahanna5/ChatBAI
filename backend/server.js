const express = require('express');

const app = express();
app.use(express.json({ limit: '2mb' }));

const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || '';
const OLLAMA_URL = process.env.OLLAMA_URL || 'https://api.ollama.com/v1/chat/completions';
const PORT = process.env.PORT || 3000;

const BASE_BUSINESS_RULES = `You are a senior business intelligence and marketing strategy consultant.
You must answer ONLY within the user's business profile and business context.
Do not answer unrelated/general/off-topic questions.
If profile data is missing, list missing data first and continue with explicit assumptions.
Use formal and professional language with no emojis, no decorative symbols, and no childish tone.
Do not use strange characters or visual separators.
Keep responses structured, concise, and actionable.

Core services to cover when relevant:
1) Market analysis and target audience identification
2) Marketing strategy building
3) Content production and management
4) Performance tracking and analysis
5) Continuous improvement

Mandatory depth:
- company and services analysis
- market trends and demand
- audience segments (age, interests, purchasing power, buying behavior, location)
- buyer persona
- competitor and SWOT analysis
- opportunities, risks, strengths, weaknesses
- channel strategy, KPI tracking, and optimization actions

Required output structure:
A) Executive Summary
B) Market and Audience Analysis
C) Buyer Personas
D) Strategy and Channel Plan
E) Content Plan
F) Performance Tracking Plan
G) Continuous Improvement Plan
H) Export-Ready Report`;

function getSystemPrompt(type, language = 'en') {
  const languageRule = language === 'ar'
    ? 'Respond in Arabic with formal, professional wording.'
    : 'Respond in English with formal, professional wording.';

  const specialized = {
    business: 'Focus on full business diagnostics and strategy.',
    market: 'Focus on market size, trends, demand, and audience segmentation.',
    swot: 'Focus on detailed SWOT with strategic recommendations and mitigation actions.',
    competitor: 'Focus on competitor benchmarking, positioning, and market gaps.',
    rag: 'Use only provided context and profile facts, avoid unsupported claims.'
  };

  return `${BASE_BUSINESS_RULES}\n${languageRule}\n${specialized[type] || specialized.business}`;
}

async function callOllama({ model, prompt, type, temperature, max_tokens, language }) {
  if (!OLLAMA_API_KEY) {
    throw new Error('OLLAMA_API_KEY is missing on backend environment');
  }

  const response = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OLLAMA_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: getSystemPrompt(type, language) },
        { role: 'user', content: prompt }
      ],
      temperature,
      max_tokens,
      stream: false
    })
  });

  if (!response.ok) {
    const txt = await response.text();
    throw new Error(`Upstream API error (${response.status}): ${txt}`);
  }

  const data = await response.json();
  return {
    content: data?.choices?.[0]?.message?.content || '',
    usage: data?.usage || null,
    raw: data
  };
}

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'chatbai-ollama-backend',
    hasApiKey: Boolean(OLLAMA_API_KEY),
    ollamaUrl: OLLAMA_URL
  });
});

app.post('/analyze', async (req, res) => {
  try {
    const {
      prompt,
      model = 'llama3.2:latest',
      type = 'business',
      temperature = 0.2,
      max_tokens = 1800,
      language = 'en'
    } = req.body || {};

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ success: false, error: 'prompt is required' });
    }

    const result = await callOllama({ model, prompt, type, temperature, max_tokens, language });
    return res.json({ success: true, model, type, content: result.content, usage: result.usage });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/analyze/swot', async (req, res) => {
  try {
    const { companyData = '', language = 'ar' } = req.body || {};
    const prompt = `Analyze SWOT for the following company data:\n${companyData}\nProvide a formal, actionable SWOT report with recommendations.`;
    const result = await callOllama({ model: 'deepseek-r1:latest', prompt, type: 'swot', temperature: 0.2, max_tokens: 2200, language });
    return res.json({ success: true, content: result.content, usage: result.usage });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/analyze/competitors', async (req, res) => {
  try {
    const { industry = '', competitors = [], language = 'ar' } = req.body || {};
    const prompt = `Analyze competitors for industry: ${industry}.\nCompetitors: ${Array.isArray(competitors) ? competitors.join(', ') : ''}.\nReturn market gap analysis, strengths/weaknesses, positioning, and strategic opportunities.`;
    const result = await callOllama({ model: 'qwen2.5:latest', prompt, type: 'competitor', temperature: 0.2, max_tokens: 2200, language });
    return res.json({ success: true, content: result.content, usage: result.usage });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
