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
    apiKey: '', // Ollama typically doesn't require API key
    modelName: 'llama2',
    enabled: false,
  },
};

/**
 * System prompt for translation judgment
 * Enforces JSON-only output format
 */
export const JUDGMENT_SYSTEM_PROMPT = `You are a translation judgment system.
Your task is to determine if a user's Chinese translation matches the given English word.

CRITICAL RULES:
1. Return ONLY valid JSON in this exact format: {"correct": boolean, "correction": string}
2. NO explanations, NO additional text, NO markdown code blocks
3. If meanings match (including synonyms), set correct to true
4. If input is empty or nonsensical, set correct to false
5. The correction field should contain the most accurate Chinese translation

Examples:
- Word: "telescope", Input: "望远镜" → {"correct": true, "correction": "望远镜"}
- Word: "telescope", Input: "显微镜" → {"correct": false, "correction": "望远镜"}
- Word: "telescope", Input: "" → {"correct": false, "correction": "望远镜"}
`;

/**
 * Generate user message for judgment request
 */
export function createJudgmentUserMessage(word: string, userInput: string): string {
  return `Word: ${word}
User Input: ${userInput}

Evaluate the translation and return JSON.`;
}

/**
 * Default LLM request parameters
 */
export const DEFAULT_LLM_PARAMS = {
  /** Maximum tokens to generate */
  maxTokens: 100,

  /** Temperature for response randomness (0.0 = deterministic) */
  temperature: 0.0,

  /** Request timeout in milliseconds */
  timeout: 10000,
};

/**
 * Connection test message
 * Simple prompt to verify API connectivity
 */
export const CONNECTION_TEST_MESSAGE = 'Hello! Please respond with "OK" if you can read this.';

/**
 * Validate LLM configuration
 */
export function validateLLMConfig(config: LLMConfig): { valid: boolean; error?: string } {
  if (!config.provider) {
    return { valid: false, error: 'Provider is required' };
  }

  if (!config.modelName) {
    return { valid: false, error: 'Model name is required' };
  }

  // Ollama doesn't require API key
  if (config.provider !== LLMProvider.Ollama && !config.apiKey) {
    return { valid: false, error: 'API key is required' };
  }

  return { valid: true };
}
