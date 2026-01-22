/**
 * Global Application Store using Zustand
 * Manages app config, error log, and diagnosis session state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AppConfig,
  ErrorRecord,
  DiagnosisSession,
  Word,
  DiagnosisResult,
} from '@/types';
import { StorageKeys, createGradeBook, parseGradeBook, getGradeBookForGrade } from '@/types';

interface AppState {
  // ==================== Configuration ====================
  config: AppConfig;
  updateConfig: (config: Partial<AppConfig>) => void;

  // ==================== Error Log ====================
  errorLog: ErrorRecord[];
  addError: (word: Word) => void;
  removeError: (wordId: string) => void;
  markAsMastered: (wordId: string) => void;
  clearErrorLog: () => void;

  // ==================== Current Session ====================
  currentSession: DiagnosisSession | null;
  startSession: (words: Word[]) => void;
  endSession: () => void;
  addResult: (result: DiagnosisResult) => void;

  // ==================== UI State ====================
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ==================== Configuration ====================
      config: {
        gradeLevel: 5,
        gradeBook: createGradeBook(5, 1),
        apiProvider: 'deepseek',
        apiKey: '',
        voiceEnabled: true,
        autoPlayPronunciation: true,
      },

      updateConfig: (newConfig) => {
        set((state) => ({
          config: { ...state.config, ...newConfig },
        }));
      },

      // ==================== Error Log ====================
      errorLog: [],

      addError: (word) => {
        const now = Date.now();
        set((state) => {
          const existingIndex = state.errorLog.findIndex(
            (e) => e.wordId === word.id
          );

          if (existingIndex >= 0) {
            // Update existing error record
            const updated = [...state.errorLog];
            updated[existingIndex] = {
              ...updated[existingIndex],
              errorCount: updated[existingIndex].errorCount + 1,
              lastErrorAt: now,
            };
            return { errorLog: updated };
          } else {
            // Create new error record
            const newError: ErrorRecord = {
              wordId: word.id,
              word: word.word,
              errorCount: 1,
              lastErrorAt: now,
              mastered: false,
              createdAt: now,
            };
            return { errorLog: [...state.errorLog, newError] };
          }
        });
      },

      removeError: (wordId) => {
        set((state) => ({
          errorLog: state.errorLog.filter((e) => e.wordId !== wordId),
        }));
      },

      markAsMastered: (wordId) => {
        set((state) => ({
          errorLog: state.errorLog.map((e) =>
            e.wordId === wordId ? { ...e, mastered: true } : e
          ),
        }));
      },

      clearErrorLog: () => {
        set({ errorLog: [] });
      },

      // ==================== Current Session ====================
      currentSession: null,

      startSession: (words) => {
        const config = get().config;
        const fallbackGradeBook = getGradeBookForGrade(config.gradeLevel ?? 5);
        const activeGradeBook = config.gradeBook ?? fallbackGradeBook;
        const session: DiagnosisSession = {
          id: `session_${Date.now()}`,
          startTime: Date.now(),
          words,
          results: [],
          gradeLevel: parseGradeBook(activeGradeBook).grade,
        };
        set({ currentSession: session });
      },

      endSession: () => {
        set((state) => {
          if (state.currentSession) {
            return {
              currentSession: {
                ...state.currentSession,
                endTime: Date.now(),
              },
            };
          }
          return state;
        });
        // Clear session after a brief delay for animations
        setTimeout(() => set({ currentSession: null }), 300);
      },

      addResult: (result) => {
        set((state) => {
          if (!state.currentSession) return state;

          return {
            currentSession: {
              ...state.currentSession,
              results: [...state.currentSession.results, result],
            },
          };
        });
      },

      // ==================== UI State ====================
      loading: false,
      setLoading: (loading) => set({ loading }),
    }),
    {
      name: StorageKeys.CONFIG,
      // Only persist config and errorLog, not session state
      partialize: (state) => ({
        config: state.config,
        errorLog: state.errorLog,
      }),
    }
  )
);
