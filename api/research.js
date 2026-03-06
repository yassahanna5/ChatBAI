const MAX_CONTENT_CHARS = 3000;

const addCors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

const normalizeText = (value = '') => value.replace(/\s+/g, ' ').trim();

const stripHtml = (html = '') => html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/\s+/g, ' ')
  .trim();

async function fetchUrlText(url) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'ChatBAI-ResearchBot/1.0',
        Accept: 'text/html,application/xhtml+xml,application/xml,text/plain'
      },
      redirect: 'follow'
    });

    if (!response.ok) {
      return { url, ok: false, error: `HTTP ${response.status}` };
    }

    const contentType = response.headers.get('content-type') || '';
    const rawText = await response.text();
    const text = contentType.includes('text/html') ? stripHtml(rawText) : normalizeText(rawText);

    return {
      url,
      ok: true,
      content: text.slice(0, MAX_CONTENT_CHARS)
    };
  } catch (error) {
    return { url, ok: false, error: error.message };
  }
}

async function searchTavily(query, tavilyKey) {
  if (!tavilyKey || !query) return [];

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      api_key: tavilyKey,
      query,
      search_depth: 'advanced',
      max_results: 5,
      include_answer: true
    })
  });

  if (!response.ok) {
    throw new Error(`Tavily error ${response.status}`);
  }

  const data = await response.json();
  return (data.results || []).map((item) => ({
    source: 'tavily',
    title: item.title || '',
    url: item.url || '',
    content: normalizeText(item.content || '').slice(0, 600)
  }));
}

async function searchSerp(query, serpKey) {
  if (!serpKey || !query) return [];

  const url = new URL('https://serpapi.com/search.json');
  url.searchParams.set('engine', 'google');
  url.searchParams.set('q', query);
  url.searchParams.set('api_key', serpKey);
  url.searchParams.set('num', '5');

  const response = await fetch(url.toString(), { method: 'GET' });
  if (!response.ok) {
    throw new Error(`SerpAPI error ${response.status}`);
  }

  const data = await response.json();
  return (data.organic_results || []).slice(0, 5).map((item) => ({
    source: 'serpapi',
    title: item.title || '',
    url: item.link || '',
    content: normalizeText(item.snippet || '').slice(0, 600)
  }));
}

export default async function handler(req, res) {
  addCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query = '', urls = [] } = req.body || {};
    const SERP_API_KEY = process.env.SERP_API_KEY || '';
    const TAVILY_API_KEY = process.env.TAVILY_API_KEY || '';

    const [tavilyResults, serpResults, urlFetchResults] = await Promise.all([
      searchTavily(query, TAVILY_API_KEY).catch(() => []),
      searchSerp(query, SERP_API_KEY).catch(() => []),
      Promise.all((Array.isArray(urls) ? urls.slice(0, 5) : []).map((url) => fetchUrlText(url)))
    ]);

    const sources = [...tavilyResults, ...serpResults];
    const pages = urlFetchResults.filter((item) => item.ok);

    return res.status(200).json({
      ok: true,
      query,
      sources,
      pages,
      errors: urlFetchResults.filter((item) => !item.ok)
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}
