/**
 * Test Session Store using Zustand
 * Manages test session state, word flow, and judgment results
 */

import { create } from 'zustand';
import type { VocabularyItem, TestSession, TestResult, JudgmentResult, GradeLevel } from '@/types';
import { selectWords } from '@/core/vocabulary';
import { ErrorLogStorage } from '@/core/storage';

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
  startTest: (gradeLevel: GradeLevel, wordCount?: number) => Promise<void>;

  /**
   * Move to next word in the session
   */
  nextWord: () => void;

  /**
   * Submit user's answer for judgment
   */
  submitAnswer: (input: string, judgment: JudgmentResult) => Promise<void>;

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

const DEFAULT_WORD_COUNT = 5;

export const useTestStore = create<TestState>((set, get) => ({
  // ==================== Initial State ====================
  currentSession: null,
  currentWordIndex: 0,
  isListening: false,
  isJudging: false,
  userInput: '',
  lastResult: null,

  // ==================== Actions ====================
  startTest: async (gradeLevel, wordCount = DEFAULT_WORD_COUNT) => {
    try {
      // Load error log for smart word selection
      const errorLogStorage = new ErrorLogStorage();
      const errorLog = await errorLogStorage.load();

      // Select words (prioritize errors)
      const selectedWords = await selectWords({
        count: wordCount,
        gradeLevel,
        errorLog,
        prioritizeErrors: true,
        excludeMastered: true,
      });

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
    const { currentSession, currentWordIndex } = get();

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

    // Create test result
    const result: TestResult = {
      wordId: currentWord.id,
      word: currentWord.word,
      userInput: input,
      correct: judgment.correct,
      correction: judgment.correction,
      timestamp: Date.now(),
    };

    // Update session with result
    const updatedSession: TestSession = {
      ...currentSession,
      results: [...currentSession.results, result],
    };

    set({
      currentSession: updatedSession,
      lastResult: judgment,
      userInput: '',
    });

    // If answer is incorrect, add to error log
    if (!judgment.correct) {
      try {
        const errorLogStorage = new ErrorLogStorage();
        await errorLogStorage.addError(currentWord, input, judgment.correction);
      } catch (error) {
        console.error('Failed to add error to log:', error);
      }
    }

    // Auto-advance after a delay (only if correct)
    if (judgment.correct) {
      setTimeout(() => {
        const state = get();
        // Only auto-advance if we're still on the same word
        if (state.currentSession?.results.length === updatedSession.results.length) {
          get().nextWord();
        }
      }, 1500);
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
    const current = Math.min(currentWordIndex + 1, total);
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
