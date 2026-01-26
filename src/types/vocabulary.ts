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
 * User input record for error tracking
 */
export interface UserInputRecord {
  /** User's input text */
  input: string;
  /** AI correction if available */
  correction?: string;
  /** Timestamp of input */
  timestamp: number;
}

/**
 * Single error entry for a vocabulary item
 */
export interface ErrorLogEntry {
  /** The vocabulary item */
  word: VocabularyItem;

  /** Total number of times this word was answered incorrectly */
  errorCount: number;

  /** Timestamp of first error (Unix milliseconds) */
  firstErrorDate: number;

  /** Timestamp of the last error (Unix milliseconds) */
  lastErrorDate: number;

  /** Array of user input records */
  userInputs: UserInputRecord[];

  /** Whether the user has mastered this word (for filtering) */
  mastered: boolean;
}

/**
 * Complete error log structure with entries map
 */
export interface ErrorLog {
  /** Map of word ID to error entry */
  entries: Record<string, ErrorLogEntry>;
}

/**
 * Grade level enumeration (deprecated - use GradeBook instead)
 * @deprecated Use GradeBook for semester-specific selection
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
 * Grade book identifier (grade + semester)
 * Examples: "3-1" (Grade 3 Semester 1), "3-2" (Grade 3 Semester 2), "9-3" (Grade 9 Full)
 */
export type GradeBook = `${3 | 4 | 5 | 6 | 7 | 8}-${1 | 2}` | '9-3';

/**
 * Helper to parse GradeBook into grade and semester
 */
export function parseGradeBook(gradeBook: GradeBook): { grade: number; semester: number } {
  const [grade, semester] = gradeBook.split('-').map(Number);
  return { grade, semester };
}

/**
 * Helper to create GradeBook from grade and semester
 */
export function createGradeBook(grade: number, semester: number): GradeBook {
  return `${grade}-${semester}` as GradeBook;
}

/**
 * Get default GradeBook for a grade (handles Grade 9 full volume)
 */
export function getGradeBookForGrade(grade: number, semester = 1): GradeBook {
  if (grade === 9) {
    return createGradeBook(9, 3);
  }
  return createGradeBook(grade, semester);
}

/**
 * Get display label for a GradeBook
 */
export function getGradeBookLabel(gradeBook: GradeBook): string {
  const { grade, semester } = parseGradeBook(gradeBook);
  if (grade === 9) {
    return `Grade ${grade}`;
  }
  const semesterLabel = semester === 1 ? '1st' : '2nd';
  return `Grade ${grade} ${semesterLabel}`;
}

/**
 * Test session state for batch-based tests
 */
export interface TestSession {
  /** Unique session identifier */
  id: string;

  /** Session start timestamp */
  startTime: number;

  /** Session end timestamp */
  endTime?: number;

  /** Array of vocabulary items for current test */
  words: VocabularyItem[];

  /** Array of results for each word */
  results: TestResult[];

  /** Grade level for the session */
  gradeLevel: number;
}

/**
 * Result for a single word in test session
 */
export interface TestResult {
  /** Vocabulary item identifier */
  wordId: string;

  /** English word */
  word: string;

  /** User's answer (Chinese translation) */
  userInput: string;

  /** Whether the answer was correct */
  correct: boolean;

  /** AI-provided correction if incorrect */
  correction?: string;

  /** Timestamp when answered */
  timestamp: number;

  /** Optional time taken for answer (ms) */
  timeTaken?: number;
}

/**
 * VST (Visual, Sound, Text) card data for error review
 */
export interface VSTCardData extends VocabularyItem {
  /** Error log entry for this word */
  errorInfo: ErrorLogEntry;
}
