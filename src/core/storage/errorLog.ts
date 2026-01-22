/**
 * Error log storage operations
 * Manages CRUD operations for vocabulary error tracking
 */

import type { ErrorLog, ErrorLogEntry, VocabularyItem } from '@/types';
import { StorageAdapter } from './base';
import { LocalStorageAdapter } from './localStorage';

const ERROR_LOG_KEY = 'error_log';

export class ErrorLogStorage {
  private storage: StorageAdapter;

  constructor(storage?: StorageAdapter) {
    this.storage = storage ?? new LocalStorageAdapter();
  }

  /**
   * Load the complete error log
   */
  async load(): Promise<ErrorLog> {
    const log = await this.storage.get<ErrorLog>(ERROR_LOG_KEY);
    return log ?? { entries: {} };
  }

  /**
   * Save the complete error log
   */
  async save(log: ErrorLog): Promise<void> {
    await this.storage.set(ERROR_LOG_KEY, log);
  }

  /**
   * Add a new error entry or update existing one
   */
  async addError(
    word: VocabularyItem,
    userInput: string,
    correction: string
  ): Promise<void> {
    const log = await this.load();
    const wordId = word.id;

    const existingEntry = log.entries[wordId];

    if (existingEntry) {
      // Update existing entry
      existingEntry.errorCount += 1;
      existingEntry.lastErrorDate = Date.now();
      existingEntry.userInputs.push({
        input: userInput,
        correction,
        timestamp: Date.now(),
      });
    } else {
      // Create new entry
      log.entries[wordId] = {
        word,
        errorCount: 1,
        firstErrorDate: Date.now(),
        lastErrorDate: Date.now(),
        mastered: false,
        userInputs: [
          {
            input: userInput,
            correction,
            timestamp: Date.now(),
          },
        ],
      };
    }

    await this.save(log);
  }

  /**
   * Mark a word as mastered
   */
  async markAsMastered(wordId: string): Promise<void> {
    const log = await this.load();
    const entry = log.entries[wordId];

    if (entry) {
      entry.mastered = true;
      await this.save(log);
    }
  }

  /**
   * Mark a word as unmastered (reset)
   */
  async markAsUnmastered(wordId: string): Promise<void> {
    const log = await this.load();
    const entry = log.entries[wordId];

    if (entry) {
      entry.mastered = false;
      await this.save(log);
    }
  }

  /**
   * Remove an error entry completely
   */
  async removeError(wordId: string): Promise<void> {
    const log = await this.load();
    delete log.entries[wordId];
    await this.save(log);
  }

  /**
   * Clear all error entries
   */
  async clearAll(): Promise<void> {
    await this.save({ entries: {} });
  }

  /**
   * Get a single error entry by word ID
   */
  async getError(wordId: string): Promise<ErrorLogEntry | null> {
    const log = await this.load();
    return log.entries[wordId] ?? null;
  }

  /**
   * Get filtered error entries
   */
  async getFilteredErrors(filter: 'all' | 'unmastered' | 'mastered'): Promise<ErrorLogEntry[]> {
    const log = await this.load();
    const entries = Object.values(log.entries);

    switch (filter) {
      case 'unmastered':
        return entries.filter((entry) => !entry.mastered);
      case 'mastered':
        return entries.filter((entry) => entry.mastered);
      case 'all':
      default:
        return entries;
    }
  }

  /**
   * Get unmastered words for vocabulary selection
   */
  async getUnmasteredWords(): Promise<VocabularyItem[]> {
    const entries = await this.getFilteredErrors('unmastered');
    return entries.map((entry) => entry.word);
  }

  /**
   * Export error log as JSON string
   */
  async exportToJSON(): Promise<string> {
    const log = await this.load();
    return JSON.stringify(log, null, 2);
  }

  /**
   * Import error log from JSON string
   */
  async importFromJSON(json: string): Promise<void> {
    try {
      const log = JSON.parse(json) as ErrorLog;
      await this.save(log);
    } catch (error) {
      throw new Error(`Failed to import error log: ${error instanceof Error ? error.message : 'Invalid JSON'}`);
    }
  }
}
