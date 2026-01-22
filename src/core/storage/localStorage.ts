/**
 * LocalStorage implementation of StorageAdapter
 * Works in Web and Electron environments
 */

import { StorageAdapter, StorageError, StorageErrorCode } from './base';

export class LocalStorageAdapter implements StorageAdapter {
  private prefix: string;

  constructor(prefix = 'eaa_') {
    this.prefix = prefix;
    this.validateSupport();
  }

  private validateSupport(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      throw new StorageError(
        'LocalStorage is not supported in this environment',
        StorageErrorCode.NOT_SUPPORTED
      );
    }
  }

  private getFullKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const fullKey = this.getFullKey(key);
      const item = localStorage.getItem(fullKey);

      if (item === null) {
        return null;
      }

      return JSON.parse(item) as T;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new StorageError(
          `Failed to parse stored value for key: ${key}`,
          StorageErrorCode.PARSE_ERROR
        );
      }
      throw new StorageError(
        `Failed to get item: ${error instanceof Error ? error.message : 'Unknown error'}`,
        StorageErrorCode.UNKNOWN
      );
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      const fullKey = this.getFullKey(key);
      const serialized = JSON.stringify(value);
      localStorage.setItem(fullKey, serialized);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new StorageError(
          'Storage quota exceeded. Please clear some data or use a smaller dataset.',
          StorageErrorCode.QUOTA_EXCEEDED
        );
      }
      throw new StorageError(
        `Failed to set item: ${error instanceof Error ? error.message : 'Unknown error'}`,
        StorageErrorCode.UNKNOWN
      );
    }
  }

  async remove(key: string): Promise<void> {
    try {
      const fullKey = this.getFullKey(key);
      localStorage.removeItem(fullKey);
    } catch (error) {
      throw new StorageError(
        `Failed to remove item: ${error instanceof Error ? error.message : 'Unknown error'}`,
        StorageErrorCode.UNKNOWN
      );
    }
  }

  async clear(): Promise<void> {
    try {
      // Only clear items with our prefix
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      throw new StorageError(
        `Failed to clear storage: ${error instanceof Error ? error.message : 'Unknown error'}`,
        StorageErrorCode.UNKNOWN
      );
    }
  }

  async has(key: string): Promise<boolean> {
    const fullKey = this.getFullKey(key);
    return localStorage.getItem(fullKey) !== null;
  }
}
