/**
 * Central exports for all TypeScript types
 * Import from '@/types' in application code
 */

// Vocabulary types
export type {
  VocabularyItem,
  ErrorLogEntry,
  ErrorLog,
  TestSession,
  TestResult,
  VSTCardData,
} from './vocabulary';

export { GradeLevel } from './vocabulary';

// LLM types
export type {
  LLMConfig,
  JudgmentResult,
  LLMRequest,
  LLMResponse,
  LLMClient,
  ConnectionTestResult,
} from './llm';

export { LLMProvider } from './llm';

// Configuration types
export type {
  AppConfig,
  UserPreferences,
  FeatureFlags,
  PlatformCapabilities,
} from './config';

export { StorageKey, Platform } from './config';

// ==================== Legacy Type Aliases (Backward Compatibility) ====================
// These aliases maintain compatibility with existing code

import type { VocabularyItem as VI } from './vocabulary';

/**
 * @deprecated Use VocabularyItem instead
 */
export type Word = VI;

/**
 * @deprecated Use ErrorLogEntry instead
 */
export interface ErrorRecord {
  wordId: string;
  word: string;
  errorCount: number;
  lastErrorAt: number;
  mastered: boolean;
  createdAt: number;
}

/**
 * @deprecated Use TestSession instead
 */
export interface DiagnosisSession {
  id: string;
  startTime: number;
  endTime?: number;
  words: VI[];
  results: DiagnosisResult[];
  gradeLevel: number;
}

/**
 * @deprecated Use TestResult instead
 */
export interface DiagnosisResult {
  wordId: string;
  word: string;
  userInput: string;
  correct: boolean;
  timestamp: number;
  timeTaken?: number;
}

/**
 * @deprecated Use StorageKey instead
 */
export enum StorageKeys {
  CONFIG = 'eaa_config',
  ERROR_LOG = 'eaa_error_log',
  SESSION_HISTORY = 'eaa_session_history',
}

/**
 * Default configuration for backward compatibility
 * @deprecated Import from config/app.config.ts instead
 */
export const DEFAULT_CONFIG = {
  gradeLevel: 5,
  apiProvider: 'deepseek' as const,
  apiKey: '',
  voiceEnabled: true,
  autoPlayPronunciation: true,
};
