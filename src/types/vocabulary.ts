/**
 * Vocabulary and Error Log Type Definitions
 * Based on PRD Section 3: Data Schema
 */

/**
 * Phrase translation pair
 */
export interface Phrase {
  /** English phrase */
  en: string;
  /** Chinese translation */
  zh: string;
}

/**
 * Sentence translation pair
 */
export interface Sentence {
  /** English sentence */
  en: string;
  /** Chinese translation */
  zh: string;
}

/**
 * Represents a single vocabulary item from the word bank
 * Based on PEP textbook JSON structure
 */
export interface VocabularyItem {
  /** Unique identifier (e.g., "g3s1-0") */
  id: string;

  /** English word */
  en: string;

  /** Chinese translation */
  zh: string;

  /** IPA phonetic notation (e.g., "/ˈruːlər/") */
  phonics: string;

  /** Part of speech (e.g., "noun", "verb", "adjective") */
  partOfSpeech: string;

  /** Unit identifier (e.g., "Unit 1") */
  unit: string;

  /** Syllable breakdown for pronunciation practice */
  syllables: string[];

  /** Common phrases using this word */
  phrases: Phrase[];

  /** Example sentences using this word */
  sentences: Sentence[];

  // Legacy compatibility properties (computed from new structure)
  // These are automatically populated by the loader for backward compatibility
  /** @deprecated Use 'en' instead */
  word: string;

  /** @deprecated Use 'phonics' instead */
  phonetic: string;

  /** @deprecated Use 'zh' instead */
  chinese: string[];

  /** @deprecated Use 'sentences[0].en' instead */
  sentence: string;

  /** @deprecated Use 'sentences[0].en' instead */
  exampleSentence: string;

  /** @deprecated Use 'sentences[0].zh' instead */
  exampleChinese: string;

  /** @deprecated Derived from ID (e.g., "g3s1-0" -> grade 3) */
  gradeLevel: number;

  /**
   * Optional image URL
   * May be local path (e.g., "assets/img/g5/telescope.png") or empty string
   */
  image_url?: string;
}

/**
 * Single error entry for a vocabulary item
 */
export interface ErrorLogEntry {
  /** Total number of times this word was answered incorrectly */
  err_count: number;

  /** Timestamp of the last error (Unix milliseconds) */
  last_err_at: number;

  /** Array of incorrect user inputs */
  history_inputs: string[];

  /** Whether the user has mastered this word (for filtering) */
  mastered?: boolean;
}

/**
 * Complete error log structure
 * Key: vocabulary item ID (e.g., "g5v2_001")
 * Value: ErrorLogEntry
 */
export type ErrorLog = Record<string, ErrorLogEntry>;

/**
 * Grade level enumeration
 */
export enum GradeLevel {
  Grade3 = 3,
  Grade4 = 4,
  Grade5 = 5,
  Grade6 = 6,
  Grade7 = 7,
  Grade8 = 8,
  Grade9 = 9,
}

/**
 * Test session state for 5-word loop
 */
export interface TestSession {
  /** Array of 5 vocabulary items for current test */
  words: VocabularyItem[];

  /** Current word index (0-4) */
  currentIndex: number;

  /** Number of correct answers in this session */
  correctCount: number;

  /** Array of results for each word */
  results: TestResult[];

  /** Session start timestamp */
  startedAt: number;
}

/**
 * Result for a single word in test session
 */
export interface TestResult {
  /** Vocabulary item being tested */
  word: VocabularyItem;

  /** User's answer (Chinese translation) */
  userInput: string;

  /** Whether the answer was correct */
  correct: boolean;

  /** AI-provided correction if incorrect */
  correction?: string;

  /** Timestamp when answered */
  answeredAt: number;
}

/**
 * VST (Visual, Sound, Text) card data for error review
 */
export interface VSTCardData extends VocabularyItem {
  /** Error log entry for this word */
  errorInfo: ErrorLogEntry;
}
