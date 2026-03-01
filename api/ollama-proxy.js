export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { model, messages, temperature = 0.2, max_tokens = 1800 } = req.body || {};
    const OLLAMA_CLOUD_API_KEY = process.env.VITE_OLLAMA_CLOUD_API_KEY;

    if (!OLLAMA_CLOUD_API_KEY) {
      return res.status(500).json({ error: 'Ollama API key not configured' });
    }

    const requestBody = {
      model,
      messages,
      temperature,
      max_tokens,
      stream: false
    };

    const response = await fetch('https://api.ollama.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OLLAMA_CLOUD_API_KEY}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(requestBody),
      redirect: 'manual'
    });

    if (response.status === 308 || response.status === 301 || response.status === 302) {
      const location = response.headers.get('location');
      if (!location) {
        throw new Error('Redirect detected but location header is missing');
      }

      const redirectedResponse = await fetch(location, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OLLAMA_CLOUD_API_KEY}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!redirectedResponse.ok) {
        const redirectedErrorText = await redirectedResponse.text();
        throw new Error(`Ollama redirected API error (${redirectedResponse.status}): ${redirectedErrorText}`);
      }

      const redirectedData = await redirectedResponse.json();
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return res.status(200).json(redirectedData);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).json(data);
  } catch (error) {
    console.error('Ollama proxy error:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(500).json({ error: error.message });
  }
}
