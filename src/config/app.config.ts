/**
 * Application Constants and Configuration
 */

import { GradeLevel, LLMProvider, Platform, type AppConfig, type UserPreferences, type FeatureFlags } from '@/types';

/**
 * Application metadata
 */
export const APP_METADATA = {
  name: 'English AI Agent',
  version: '0.1.0',
  description: 'Cross-platform English vocabulary diagnostic tool',
  author: 'Development Team',
} as const;

/**
 * 语音识别模式
 */
export type VoiceRecognitionMode = 'web-speech' | 'whisper';

/**
 * Test configuration constants
 */
export const TEST_CONFIG = {
  /** Number of words per batch */
  WORDS_PER_TEST: 10,

  /** Maximum retry attempts for voice recognition */
  MAX_VOICE_RETRIES: 3,

  /** Debounce delay for voice input (ms) */
  VOICE_INPUT_DEBOUNCE: 500,

  /** Timeout for no speech detected before auto-advancing (ms) */
  VOICE_SPEECH_TIMEOUT_MS: 5000,

  /** Timeout for voice segmentation (ms) */
  VOICE_SEGMENT_TIMEOUT_MS: 8000,

  /** Enable AI correction before segmentation */
  VOICE_CORRECTION_ENABLED: true,

  /** Timeout for transcript correction (ms) */
  VOICE_CORRECTION_TIMEOUT_MS: 3000,

  /**
   * 语音识别模式
   * - 'web-speech': 使用浏览器 Web Speech API (依赖 Google 服务器)
   * - 'whisper': 使用本地 Whisper 服务 (需要启动 whisper-service)
   */
  VOICE_RECOGNITION_MODE: (import.meta.env.VITE_VOICE_RECOGNITION_MODE as VoiceRecognitionMode) || 'web-speech',

  /** Whisper 服务地址 (使用后端 /whisper 端点) */
  WHISPER_API_URL: (import.meta.env.VITE_WHISPER_API_URL as string) || 'http://localhost:4000/whisper',

  /** Whisper 请求超时时间 (ms) */
  WHISPER_TIMEOUT_MS: 30000,

  /** Auto-advance delay after correct answer (ms) */
  AUTO_ADVANCE_DELAY: 1500,

  /** Score calculation: points per correct answer */
  POINTS_PER_CORRECT: 20,
} as const;

/**
 * Audio configuration
 */
export const AUDIO_CONFIG = {
  /** Sound effect volume (0.0 - 1.0) */
  DEFAULT_VOLUME: 0.7,

  /** TTS speech rate (0.1 - 10.0, 1.0 = normal) */
  TTS_RATE: 1.0,

  /** TTS pitch (0.0 - 2.0, 1.0 = normal) */
  TTS_PITCH: 1.0,

  /** Success sound effect */
  SUCCESS_SOUND: '/assets/sounds/success.mp3',

  /** Error sound effect */
  ERROR_SOUND: '/assets/sounds/error.mp3',
} as const;

/**
 * Storage configuration
 */
export const STORAGE_CONFIG = {
  /** LocalStorage key prefix */
  KEY_PREFIX: 'eaa_',

  /** Maximum error log entries to keep */
  MAX_ERROR_LOG_ENTRIES: 1000,

  /** Auto-save interval (ms) */
  AUTO_SAVE_INTERVAL: 5000,
} as const;

/**
 * Default user preferences
 */
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  autoPlayTTS: true,
  speechRecognitionLang: 'zh-CN',
  ttsLang: 'en-US',
  soundEffectVolume: AUDIO_CONFIG.DEFAULT_VOLUME,
  enableAnimations: true,
  theme: 'dark',
};

/**
 * Default feature flags
 */
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  enableVoiceInput: true,
  offlineMode: false,
  enablePDFExport: true,
  debugMode: false,
};

/**
 * Default application configuration
 */
export const DEFAULT_APP_CONFIG: Partial<AppConfig> = {
  currentGrade: GradeLevel.Grade5,
  activeLLMProvider: LLMProvider.DeepSeek,
  preferences: DEFAULT_USER_PREFERENCES,
  features: DEFAULT_FEATURE_FLAGS,
};

/**
 * Platform-specific paths
 */
export const PLATFORM_PATHS = {
  [Platform.Web]: {
    vocabularyData: '/data',
    assets: '/assets',
  },
  [Platform.Electron]: {
    vocabularyData: './data',
    assets: './assets',
  },
  [Platform.Android]: {
    vocabularyData: 'public/data',
    assets: 'public/assets',
  },
  [Platform.iOS]: {
    vocabularyData: 'public/data',
    assets: 'public/assets',
  },
};

/**
 * API timeout configuration (ms)
 */
export const TIMEOUT_CONFIG = {
  /** LLM API request timeout */
  LLM_REQUEST: 10000,

  /** Connection test timeout */
  CONNECTION_TEST: 5000,

  /** Vocabulary file loading timeout */
  FILE_LOAD: 3000,
} as const;

/**
 * Grade level ranges
 */
export const GRADE_LEVELS = [
  GradeLevel.Grade3,
  GradeLevel.Grade4,
  GradeLevel.Grade5,
  GradeLevel.Grade6,
  GradeLevel.Grade7,
  GradeLevel.Grade8,
  GradeLevel.Grade9,
] as const;

/**
 * Vocabulary file naming pattern
 */
export function getVocabularyFileName(grade: GradeLevel, volume = 1): string {
  return `grade${grade}_vol${volume}.json`;
}

/**
 * Get all vocabulary file paths for a grade level
 */
export function getVocabularyPaths(grade: GradeLevel): string[] {
  const paths: string[] = [];

  // Aggregate all grades up to and including current grade
  for (let g = GradeLevel.Grade3; g <= grade; g++) {
    // Assuming one volume per grade for now (can expand later)
    paths.push(`/data/grade${g}/${getVocabularyFileName(g as GradeLevel)}`);
  }

  return paths;
}

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  API_KEY_INVALID: 'Invalid API key. Please check your configuration.',
  VOICE_PERMISSION_DENIED: 'Microphone permission denied. Voice input is disabled.',
  VOICE_NOT_SUPPORTED: 'Speech recognition is not supported in this browser.',
  FILE_LOAD_ERROR: 'Failed to load vocabulary data. Please try again.',
  STORAGE_ERROR: 'Failed to save data. Please check browser storage.',
  LLM_REQUEST_FAILED: 'AI service is unavailable. Please try again later.',
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  CONFIG_SAVED: 'Configuration saved successfully',
  CONNECTION_OK: 'Connection test successful',
  EXPORT_COMPLETE: 'Export completed successfully',
} as const;
