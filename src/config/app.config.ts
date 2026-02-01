/**
 * Application Constants and Configuration
 */

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

  /** Whisper 服务地址 (使用后端 /api/whisper 端点) */
  WHISPER_API_URL: (import.meta.env.VITE_WHISPER_API_URL as string) || 'http://localhost:4000/api/whisper',

  /** Whisper 请求超时时间 (ms) */
  WHISPER_TIMEOUT_MS: 30000,

  /** Auto-advance delay after correct answer (ms) */
  AUTO_ADVANCE_DELAY: 1500,

  /** Score calculation: points per correct answer */
  POINTS_PER_CORRECT: 20,
} as const;
