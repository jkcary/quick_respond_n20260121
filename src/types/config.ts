/**
 * Application Configuration Type Definitions
 */

import { GradeLevel } from './vocabulary';
import { LLMConfig, LLMProvider } from './llm';

/**
 * Global application configuration
 */
export interface AppConfig {
  /** Currently selected grade level */
  currentGrade: GradeLevel;

  /**
   * LLM provider configurations
   * Key: provider name
   * Value: provider config
   */
  llmConfigs: Record<LLMProvider, LLMConfig>;

  /** Currently active LLM provider */
  activeLLMProvider: LLMProvider;

  /** UI preferences */
  preferences: UserPreferences;

  /** Feature flags */
  features: FeatureFlags;
}

/**
 * User preferences for UI and behavior
 */
export interface UserPreferences {
  /** Enable auto-play TTS when word card is shown */
  autoPlayTTS: boolean;

  /** Speech recognition language (default: "zh-CN") */
  speechRecognitionLang: string;

  /** TTS voice language (default: "en-US") */
  ttsLang: string;

  /** Volume level for sound effects (0.0 - 1.0) */
  soundEffectVolume: number;

  /** Enable visual feedback animations */
  enableAnimations: boolean;

  /** Theme mode (reserved for future dark/light toggle) */
  theme: 'dark' | 'light';
}

/**
 * Feature flags for experimental or platform-specific features
 */
export interface FeatureFlags {
  /** Enable voice input (may be disabled if permission denied) */
  enableVoiceInput: boolean;

  /** Enable offline mode (browse only, no testing) */
  offlineMode: boolean;

  /** Enable export to PDF functionality */
  enablePDFExport: boolean;

  /** Enable debug logging to console */
  debugMode: boolean;
}

/**
 * Storage keys for LocalStorage
 */
export enum StorageKey {
  /** App configuration */
  AppConfig = 'eaa_app_config',

  /** Error log */
  ErrorLog = 'eaa_error_log',

  /** User preferences */
  Preferences = 'eaa_preferences',

  /** Feature flags */
  Features = 'eaa_features',

  /** Last test session (for recovery) */
  LastSession = 'eaa_last_session',
}

/**
 * Platform detection
 */
export enum Platform {
  Web = 'web',
  Electron = 'electron',
  Android = 'android',
  iOS = 'ios',
}

/**
 * Platform capabilities
 */
export interface PlatformCapabilities {
  /** Current platform */
  platform: Platform;

  /** Whether file system access is available */
  hasFileSystem: boolean;

  /** Whether native menus are available */
  hasNativeMenus: boolean;

  /** Whether microphone permission is required */
  requiresMicPermission: boolean;

  /** Whether speech recognition is supported */
  hasSpeechRecognition: boolean;

  /** Whether text-to-speech is supported */
  hasTextToSpeech: boolean;
}
