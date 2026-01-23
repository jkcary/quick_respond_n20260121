/**
 * Test Session Store using Zustand
 * Manages test session state, word flow, and judgment results
 */

import { create } from 'zustand';
import type {
  VocabularyItem,
  TestSession,
  TestResult,
  JudgmentResult,
  GradeLevel,
  GradeBook,
} from '@/types';
import { parseGradeBook } from '@/types';
import { selectWords, getVocabularyCountForGradeBook, getVocabularyCountUpToGrade } from '@/core/vocabulary';
import { ErrorLogStorage } from '@/core/storage';
import { TEST_CONFIG } from '@/config/app.config';

interface TestState {
  // ==================== Session State ====================
  currentSession: TestSession | null;
  currentWordIndex: number;
  isListening: boolean;
  isJudging: boolean;
  userInput: string;
  lastResult: JudgmentResult | null;

  // ==================== Actions ====================
  /**
   * Start a new test session with selected words
   */
  startTest: (gradeSelection: GradeLevel | GradeBook, wordCount?: number) => Promise<void>;

  /**
   * Move to next word in the session
   */
  nextWord: () => void;

  /**
   * Submit user's answer for judgment
   */
  submitAnswer: (input: string, judgment: JudgmentResult) => Promise<void>;

  /**
   * Submit a batch of answers for judgment
   */
  submitBatch: (
    entries: Array<{ word: VocabularyItem; input: string; judgment: JudgmentResult }>
  ) => Promise<void>;

  /**
   * End current test session
   */
  endTest: () => void;

  /**
   * Reset test state completely
   */
  resetTest: () => void;

  /**
   * Set listening state (for voice input UI)
   */
  setListening: (isListening: boolean) => void;

  /**
   * Set judging state (for loading UI)
   */
  setJudging: (isJudging: boolean) => void;

  /**
   * Update user input (for text input)
   */
  setUserInput: (input: string) => void;

  /**
   * Get current word being tested
   */
  getCurrentWord: () => VocabularyItem | null;

  /**
   * Get test progress (e.g., "3/5")
   */
  getProgress: () => { current: number; total: number; percentage: number };

  /**
   * Get test score
   */
  getScore: () => { correct: number; total: number; percentage: number };
}

const DEFAULT_WORD_COUNT = TEST_CONFIG.WORDS_PER_TEST;
const isGradeBook = (value: GradeLevel | GradeBook): value is GradeBook =>
  typeof value === 'string';

export const useTestStore = create<TestState>((set, get) => ({
  // ==================== Initial State ====================
  currentSession: null,
  currentWordIndex: 0,
  isListening: false,
  isJudging: false,
  userInput: '',
  lastResult: null,

  // ==================== Actions ====================
  startTest: async (gradeSelection, wordCount) => {
    try {
      // Load error log for smart word selection
      const errorLogStorage = new ErrorLogStorage();
      const errorLog = await errorLogStorage.load();

      const totalCount =
        wordCount ??
        (isGradeBook(gradeSelection)
          ? await getVocabularyCountForGradeBook(gradeSelection)
          : await getVocabularyCountUpToGrade(gradeSelection));
      const effectiveCount = totalCount > 0 ? totalCount : DEFAULT_WORD_COUNT;

      // Select words (prioritize errors)
      const selectedWords = await selectWords({
        count: effectiveCount,
        ...(isGradeBook(gradeSelection)
          ? { gradeBook: gradeSelection }
          : { gradeLevel: gradeSelection }),
        errorLog,
        prioritizeErrors: true,
        excludeMastered: true,
      });

      const gradeLevel = isGradeBook(gradeSelection)
        ? parseGradeBook(gradeSelection).grade
        : gradeSelection;

      // Create new session
      const session: TestSession = {
        id: `session_${Date.now()}`,
        startTime: Date.now(),
        words: selectedWords,
        results: [],
        gradeLevel,
      };

      set({
        currentSession: session,
        currentWordIndex: 0,
        userInput: '',
        lastResult: null,
        isListening: false,
        isJudging: false,
      });
    } catch (error) {
      console.error('Failed to start test:', error);
      throw error;
    }
  },

  nextWord: () => {
    const { currentSession } = get();

    if (!currentSession) {
      return;
    }

    const nextIndex = currentWordIndex + 1;

    if (nextIndex < currentSession.words.length) {
      set({
        currentWordIndex: nextIndex,
        userInput: '',
        lastResult: null,
      });
    } else {
      // Test completed
      get().endTest();
    }
  },

  submitAnswer: async (input, judgment) => {
    const { currentSession, currentWordIndex } = get();

    if (!currentSession) {
      return;
    }

    const currentWord = currentSession.words[currentWordIndex];
    if (!currentWord) {
      return;
    }

    await get().submitBatch([{ word: currentWord, input, judgment }]);
  },

  submitBatch: async (entries) => {
    const { currentSession, currentWordIndex } = get();

    if (!currentSession || entries.length === 0) {
      return;
    }

    const errorLogStorage = new ErrorLogStorage();
    const now = Date.now();
    const results: TestResult[] = [];

    for (const entry of entries) {
      const result: TestResult = {
        wordId: entry.word.id,
        word: entry.word.word,
        userInput: entry.input,
        correct: entry.judgment.correct,
        correction: entry.judgment.correction,
        timestamp: now,
      };
      results.push(result);

      if (!entry.judgment.correct) {
        try {
          await errorLogStorage.addError(entry.word, entry.input, entry.judgment.correction);
        } catch (error) {
          console.error('Failed to add error to log:', error);
        }
      }
    }

    const updatedSession: TestSession = {
      ...currentSession,
      results: [...currentSession.results, ...results],
    };

    set({
      currentSession: updatedSession,
      lastResult: null,
      userInput: '',
    });

    const nextIndex = currentWordIndex + entries.length;
    if (nextIndex < currentSession.words.length) {
      set({
        currentWordIndex: nextIndex,
      });
    } else {
      get().endTest();
    }
  },

  endTest: () => {
    const { currentSession } = get();

    if (currentSession) {
      const completedSession: TestSession = {
        ...currentSession,
        endTime: Date.now(),
      };

      set({
        currentSession: completedSession,
      });

      // Clear session after a brief delay for results display
      setTimeout(() => {
        set({
          currentSession: null,
          currentWordIndex: 0,
          userInput: '',
          lastResult: null,
        });
      }, 300);
    }
  },

  resetTest: () => {
    set({
      currentSession: null,
      currentWordIndex: 0,
      isListening: false,
      isJudging: false,
      userInput: '',
      lastResult: null,
    });
  },

  setListening: (isListening) => {
    set({ isListening });
  },

  setJudging: (isJudging) => {
    set({ isJudging });
  },

  setUserInput: (userInput) => {
    set({ userInput });
  },

  getCurrentWord: () => {
    const { currentSession, currentWordIndex } = get();
    if (!currentSession) {
      return null;
    }
    return currentSession.words[currentWordIndex] || null;
  },

  getProgress: () => {
    const { currentSession, currentWordIndex } = get();

    if (!currentSession) {
      return { current: 0, total: 0, percentage: 0 };
    }

    const total = currentSession.words.length;
    const current = Math.min(currentSession.results.length, total);
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

    return { current, total, percentage };
  },

  getScore: () => {
    const { currentSession } = get();

    if (!currentSession) {
      return { correct: 0, total: 0, percentage: 0 };
    }

    const total = currentSession.results.length;
    const correct = currentSession.results.filter((r) => r.correct).length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

    return { correct, total, percentage };
  },
}));
