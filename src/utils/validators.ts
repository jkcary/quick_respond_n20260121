/**
 * Input validation functions
 */

import type { VocabularyItem } from '@/types';
import { LLMProvider } from '@/types';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate API key format
 */
export function validateAPIKey(key: string, provider?: LLMProvider): ValidationResult {
  if (!key || typeof key !== 'string') {
    return { valid: false, error: 'API key is required' };
  }

  const trimmed = key.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'API key cannot be empty' };
  }

  // Provider-specific validation
  if (provider) {
    switch (provider) {
      case LLMProvider.DeepSeek:
        if (!trimmed.startsWith('sk-')) {
          return { valid: false, error: 'DeepSeek API key should start with "sk-"' };
        }
        if (trimmed.length < 20) {
          return { valid: false, error: 'DeepSeek API key is too short' };
        }
        break;

      case LLMProvider.OpenAI:
        if (!trimmed.startsWith('sk-')) {
          return { valid: false, error: 'OpenAI API key should start with "sk-"' };
        }
        if (trimmed.length < 40) {
          return { valid: false, error: 'OpenAI API key is too short' };
        }
        break;

      case LLMProvider.Anthropic:
        if (!trimmed.startsWith('sk-ant-')) {
          return { valid: false, error: 'Anthropic API key should start with "sk-ant-"' };
        }
        break;

      case LLMProvider.Ollama:
        // Ollama typically doesn't require API key
        return { valid: true };

      default:
        // Generic validation for unknown providers
        if (trimmed.length < 10) {
          return { valid: false, error: 'API key is too short' };
        }
    }
  }

  return { valid: true };
}

/**
 * Validate URL format
 */
export function validateURL(url: string): ValidationResult {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' };
  }

  const trimmed = url.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'URL cannot be empty' };
  }

  try {
    const parsed = new URL(trimmed);

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'URL must use HTTP or HTTPS protocol' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Validate grade level
 */
export function validateGradeLevel(grade: number): boolean {
  return Number.isInteger(grade) && grade >= 3 && grade <= 9;
}

/**
 * Validate vocabulary item structure
 */
export function validateVocabularyItem(item: unknown): item is VocabularyItem {
  if (typeof item !== 'object' || item === null) {
    return false;
  }

  const vocab = item as Record<string, unknown>;

  return (
    typeof vocab.id === 'string' &&
    vocab.id.length > 0 &&
    typeof vocab.word === 'string' &&
    vocab.word.length > 0 &&
    typeof vocab.phonetic === 'string' &&
    typeof vocab.chinese === 'string' &&
    vocab.chinese.length > 0 &&
    typeof vocab.gradeLevel === 'number' &&
    validateGradeLevel(vocab.gradeLevel) &&
    typeof vocab.exampleSentence === 'string' &&
    typeof vocab.exampleChinese === 'string'
  );
}

/**
 * Validate model name format
 */
export function validateModelName(model: string, provider: LLMProvider): ValidationResult {
  if (!model || typeof model !== 'string') {
    return { valid: false, error: 'Model name is required' };
  }

  const trimmed = model.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Model name cannot be empty' };
  }

  // Provider-specific model validation
  switch (provider) {
    case LLMProvider.DeepSeek:
      if (!trimmed.includes('deepseek')) {
        return { valid: false, error: 'Invalid DeepSeek model name' };
      }
      break;

    case LLMProvider.OpenAI:
      if (!['gpt-3.5', 'gpt-4'].some((prefix) => trimmed.toLowerCase().includes(prefix))) {
        return { valid: false, error: 'Model should be gpt-3.5-turbo or gpt-4 variant' };
      }
      break;

    case LLMProvider.Anthropic:
      if (!trimmed.toLowerCase().includes('claude')) {
        return { valid: false, error: 'Model should be a Claude variant' };
      }
      break;

    case LLMProvider.Moonshot:
      if (!trimmed.includes('moonshot')) {
        return { valid: false, error: 'Invalid Moonshot model name' };
      }
      break;

    case LLMProvider.Ollama:
      // Any model name is valid for Ollama
      break;
  }

  return { valid: true };
}

/**
 * Validate user input (Chinese translation)
 */
export function validateUserInput(input: string): ValidationResult {
  if (typeof input !== 'string') {
    return { valid: false, error: 'Input must be a string' };
  }

  const trimmed = input.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Please enter a translation' };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: 'Translation is too long (max 100 characters)' };
  }

  return { valid: true };
}

/**
 * Sanitize user input (remove potentially harmful content)
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .substring(0, 100); // Limit length
}
