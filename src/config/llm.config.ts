/**
 * LLM Provider Configuration
 * Default settings for each supported LLM provider
 */

import { LLMProvider, type LLMConfig } from '@/types';

/**
 * Default LLM configurations for each provider
 */
export const DEFAULT_LLM_CONFIGS: Record<LLMProvider, LLMConfig> = {
  [LLMProvider.DeepSeek]: {
    provider: LLMProvider.DeepSeek,
    baseUrl: 'https://api.deepseek.com/v1',
    apiKey: '',
    modelName: 'deepseek-chat',
    enabled: false,
  },

  [LLMProvider.OpenAI]: {
    provider: LLMProvider.OpenAI,
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    modelName: 'gpt-4',
    enabled: false,
  },

  [LLMProvider.Anthropic]: {
    provider: LLMProvider.Anthropic,
    baseUrl: 'https://api.anthropic.com/v1',
    apiKey: '',
    modelName: 'claude-3-sonnet-20240229',
    enabled: false,
  },

  [LLMProvider.Moonshot]: {
    provider: LLMProvider.Moonshot,
    baseUrl: 'https://api.moonshot.cn/v1',
    apiKey: '',
    modelName: 'moonshot-v1-8k',
    enabled: false,
  },

  [LLMProvider.Ollama]: {
    provider: LLMProvider.Ollama,
    baseUrl: 'http://localhost:11434/api',
    apiKey: '',
    modelName: 'llama2',
    enabled: false,
  },
};
