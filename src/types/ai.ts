export interface AIModel {
  id: string;
  name: string;
  description?: string;
  pricing: {
    prompt: string;
    completion: string;
  };
  context_length: number;
}

export interface AISettings {
  apiKey: string;
  selectedModel: string;
  baseUrl: string;
  siteUrl?: string;
  siteName?: string;
}

export const DEFAULT_AI_SETTINGS: AISettings = {
  apiKey: '',
  selectedModel: 'openai/gpt-4o-mini',
  baseUrl: 'https://openrouter.ai/api/v1',
  siteUrl: '',
  siteName: 'Dev Challenge Tracker'
};