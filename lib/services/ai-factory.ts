import { GoogleGenerativeAI } from '@google/generative-ai';

export type AIProvider = 'gemini' | 'grok' | 'openai' | 'other';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

export async function callAI(prompt: string, config: AIConfig) {
  const { provider, apiKey, model, baseUrl } = config;

  if (provider === 'gemini') {
    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({ model: model || 'gemini-2.5-flash' });
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  if (provider === 'grok' || provider === 'openai' || provider === 'other') {
    const defaultBaseUrl = provider === 'grok' ? 'https://api.x.ai/v1' : 'https://api.openai.com/v1';
    const actualBaseUrl = baseUrl || defaultBaseUrl;
    const actualModel = model || (provider === 'grok' ? 'grok-2-1212' : 'gpt-4o');

    const response = await fetch(`${actualBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: actualModel,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `AI Provider Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  throw new Error(`Unsupported AI provider: ${provider}`);
}
