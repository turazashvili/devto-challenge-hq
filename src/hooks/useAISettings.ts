'use client';

import { useState, useEffect, useCallback } from 'react';
import { AISettings, AIModel, DEFAULT_AI_SETTINGS } from '../types/ai';

const STORAGE_KEY = 'ai-settings';

export function useAISettings() {
  const [settings, setSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [models, setModels] = useState<AIModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings({
          ...DEFAULT_AI_SETTINGS,
          ...parsed,
          siteUrl: window?.location?.origin || ''
        });
      } catch (error) {
        console.error('Failed to load AI settings:', error);
      }
    } else {
      // Set default site URL on first load
      setSettings(prev => ({
        ...prev,
        siteUrl: window?.location?.origin || ''
      }));
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = useCallback((newSettings: Partial<AISettings>) => {
    setSettings(prevSettings => {
      const updated = { ...prevSettings, ...newSettings };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Fetch available models from OpenRouter
  const fetchModels = useCallback(async () => {
    if (!settings.apiKey) {
      setModels([]);
      return;
    }

    setIsLoadingModels(true);
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${settings.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }

      const data = await response.json();
      const modelList: AIModel[] = data.data.map((model: {id: string, name?: string, description?: string, pricing?: unknown, context_length?: number}) => ({
        id: model.id,
        name: model.name || model.id,
        description: model.description,
        pricing: model.pricing,
        context_length: model.context_length,
      }));

      setModels(modelList);
    } catch (error) {
      console.error('Failed to fetch models:', error);
      // Set some default models if fetch fails
      setModels([
        {
          id: 'openai/gpt-4o-mini',
          name: 'GPT-4o Mini',
          description: 'Faster, cheaper GPT-4o',
          pricing: { prompt: '0.00000015', completion: '0.0000006' },
          context_length: 128000,
        },
        {
          id: 'openai/gpt-4o',
          name: 'GPT-4o',
          description: 'GPT-4 Omni multimodal model',
          pricing: { prompt: '0.000002', completion: '0.000006' },
          context_length: 128000,
        },
        {
          id: 'anthropic/claude-3.5-sonnet',
          name: 'Claude 3.5 Sonnet',
          description: 'Anthropic\'s most capable model',
          pricing: { prompt: '0.000003', completion: '0.000015' },
          context_length: 200000,
        },
      ]);
    } finally {
      setIsLoadingModels(false);
    }
  }, [settings.apiKey]);

  // Fetch models when API key changes
  useEffect(() => {
    if (settings.apiKey) {
      fetchModels();
    } else {
      setModels([]);
    }
  }, [settings.apiKey, fetchModels]);

  return {
    settings,
    models,
    isLoadingModels,
    updateSettings: saveSettings,
    refreshModels: fetchModels,
  };
}