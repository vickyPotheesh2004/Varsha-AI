export interface AIServiceConfig {
  provider?: 'openrouter' | 'gemini';
  apiKey?: string;
}

export async function generateAIChoice(
  systemPrompt: string,
  userPrompt: string,
  config: AIServiceConfig = {}
): Promise<string> {
  // 1. Resolve provider and api key
  const clientKey = config.apiKey;
  const clientProvider = config.provider;

  const openRouterKey = process.env.OPENROUTER_API_KEY || (clientProvider === 'openrouter' ? clientKey : '');
  const geminiKey = process.env.GEMINI_API_KEY || (clientProvider === 'gemini' ? clientKey : '') || (!openRouterKey ? clientKey : '');

  const provider = clientProvider 
    ? clientProvider 
    : openRouterKey 
      ? 'openrouter' 
      : geminiKey 
        ? 'gemini' 
        : 'gemini'; // Default to gemini if both are unset but a key is passed

  const apiKey = provider === 'openrouter' ? openRouterKey : geminiKey;

  if (!apiKey) {
    throw new Error('No API key found. Please configure OPENROUTER_API_KEY or GEMINI_API_KEY.');
  }

  if (provider === 'openrouter') {
    return callOpenRouter(systemPrompt, userPrompt, apiKey);
  } else {
    return callGemini(systemPrompt, userPrompt, apiKey);
  }
}

async function callOpenRouter(systemPrompt: string, userPrompt: string, apiKey: string): Promise<string> {
  const modelPrimary = process.env.OPENROUTER_MODEL_PRIMARY || 'google/gemma-2-9b-it:free';
  const modelFallback = process.env.OPENROUTER_MODEL_FALLBACK || 'meta-llama/llama-3-8b-instruct:free';
  
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://varsha-ai.vercel.app',
    'X-Title': 'VarshaAI'
  };

  const payload = {
    model: modelPrimary,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    response_format: { type: 'json_object' }
  };

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    }
    throw new Error('Unexpected OpenRouter response structure.');
  } catch (error) {
    console.warn('Primary OpenRouter model failed. Attempting fallback model...', error);
    
    // Fallback attempt
    const fallbackPayload = {
      ...payload,
      model: modelFallback
    };
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify(fallbackPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter Fallback Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }
}

async function callGemini(systemPrompt: string, userPrompt: string, apiKey: string): Promise<string> {
  // We try gemini-2.5-flash as default, then fallback to gemini-1.5-flash
  const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
  let lastError: unknown = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${systemPrompt}\n\nUser Context and Data:\n${userPrompt}` }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API Error (${model}): ${errorText}`);
      }

      const data = await response.json();
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
        return data.candidates[0].content.parts[0].text;
      }
      throw new Error('Malformed response from Gemini API.');
    } catch (error) {
      lastError = error;
      console.warn(`Gemini model ${model} failed, trying next fallback...`, error);
    }
  }

  throw lastError || new Error('All Gemini API models failed.');
}
