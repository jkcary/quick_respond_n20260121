/**
 * Error Tracking Store using Zustand
 * Manages vocabulary error log with persistence
 */

import { create } from 'zustand';
import type { ErrorLog, ErrorLogEntry, VocabularyItem } from '@/types';
import { ErrorLogStorage } from '@/core/storage';

interface ErrorState {
  // ==================== State ====================
  errorLog: ErrorLog;
  filter: 'all' | 'unmastered' | 'mastered';
  isLoading: boolean;

  // ==================== Actions ====================
  /**
   * Load error log from storage
   */
  loadErrorLog: () => Promise<void>;

  /**
   * Add a new error or update existing entry
   */
  addError: (word: VocabularyItem, userInput: string, correction: string) => Promise<void>;

  /**
   * Mark a word as mastered
   */
  markAsMastered: (wordId: string) => Promise<void>;

  /**
   * Mark a word as unmastered (reset)
   */
  markAsUnmastered: (wordId: string) => Promise<void>;

  /**
   * Remove an error entry completely
   */
  removeError: (wordId: string) => Promise<void>;

  /**
   * Clear all error entries
   */
  clearAll: () => Promise<void>;

  /**
   * Set filter for error list display
   */
  setFilter: (filter: 'all' | 'unmastered' | 'mastered') => void;

  /**
   * Export error log as JSON string
   */
  exportToJSON: () => Promise<string>;

  /**
   * Import error log from JSON string
   */
  importFromJSON: (json: string) => Promise<void>;

  // ==================== Selectors ====================
  /**
   * Get filtered error entries based on current filter
   */
  getFilteredErrors: () => ErrorLogEntry[];

  /**
   * Get a single error entry by word ID
   */
  getErrorByWordId: (wordId: string) => ErrorLogEntry | null;

  /**
   * Get total error count
   */
  getTotalErrorCount: () => number;

  /**
   * Get unmastered error count
   */
  getUnmasteredCount: () => number;

  /**
   * Get mastered error count
   */
  getMasteredCount: () => number;
}

const errorLogStorage = new ErrorLogStorage();

export const useErrorStore = create<ErrorState>((set, get) => ({
  // ==================== Initial State ====================
  errorLog: { entries: {} },
  filter: 'all',
  isLoading: false,

  // ==================== Actions ====================
  loadErrorLog: async () => {
    set({ isLoading: true });
    try {
      const log = await errorLogStorage.load();
      set({ errorLog: log, isLoading: false });
    } catch (error) {
      console.error('Failed to load error log:', error);
      set({ isLoading: false });
    }
  },

  addError: async (word, userInput, correction) => {
    try {
      await errorLogStorage.addError(word, userInput, correction);
      const updatedLog = await errorLogStorage.load();
      set({ errorLog: updatedLog });
    } catch (error) {
      console.error('Failed to add error:', error);
      throw error;
    }
  },

  markAsMastered: async (wordId) => {
    try {
      await errorLogStorage.markAsMastered(wordId);
      const updatedLog = await errorLogStorage.load();
      set({ errorLog: updatedLog });
    } catch (error) {
      console.error('Failed to mark as mastered:', error);
      throw error;
    }
  },

  markAsUnmastered: async (wordId) => {
    try {
      await errorLogStorage.markAsUnmastered(wordId);
      const updatedLog = await errorLogStorage.load();
      set({ errorLog: updatedLog });
    } catch (error) {
      console.error('Failed to mark as unmastered:', error);
      throw error;
    }
  },

  removeError: async (wordId) => {
    try {
      await errorLogStorage.removeError(wordId);
      const updatedLog = await errorLogStorage.load();
      set({ errorLog: updatedLog });
    } catch (error) {
      console.error('Failed to remove error:', error);
      throw error;
    }
  },

  clearAll: async () => {
    try {
      await errorLogStorage.clearAll();
      set({ errorLog: { entries: {} } });
    } catch (error) {
      console.error('Failed to clear error log:', error);
      throw error;
    }
  },

  setFilter: (filter) => {
    set({ filter });
  },

  exportToJSON: async () => {
    try {
      return await errorLogStorage.exportToJSON();
    } catch (error) {
      console.error('Failed to export error log:', error);
      throw error;
    }
  },

  importFromJSON: async (json) => {
    try {
      await errorLogStorage.importFromJSON(json);
      const updatedLog = await errorLogStorage.load();
      set({ errorLog: updatedLog });
    } catch (error) {
      console.error('Failed to import error log:', error);
      throw error;
    }
  },

  // ==================== Selectors ====================
  getFilteredErrors: () => {
    const { errorLog, filter } = get();
    const entries = Object.values(errorLog.entries);

    switch (filter) {
      case 'unmastered':
        return entries.filter((entry) => !entry.mastered);
      case 'mastered':
        return entries.filter((entry) => entry.mastered);
      case 'all':
      default:
        return entries;
    }
  },

  getErrorByWordId: (wordId) => {
    const { errorLog } = get();
    return errorLog.entries[wordId] || null;
  },

  getTotalErrorCount: () => {
    const { errorLog } = get();
    return Object.keys(errorLog.entries).length;
  },

  getUnmasteredCount: () => {
    const { errorLog } = get();
    return Object.values(errorLog.entries).filter((entry) => !entry.mastered).length;
  },

  getMasteredCount: () => {
    const { errorLog } = get();
    return Object.values(errorLog.entries).filter((entry) => entry.mastered).length;
  },
}));
