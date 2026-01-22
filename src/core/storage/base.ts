/**
 * Base storage interface for cross-platform data persistence
 * Supports LocalStorage (Web/Electron) and future expansion to SQLite (Capacitor)
 */

export interface StorageAdapter {
  /**
   * Retrieve a value from storage
   * @param key - Storage key
   * @returns Parsed value or null if not found
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Store a value in storage
   * @param key - Storage key
   * @param value - Value to store (will be JSON serialized)
   */
  set<T>(key: string, value: T): Promise<void>;

  /**
   * Remove a value from storage
   * @param key - Storage key to remove
   */
  remove(key: string): Promise<void>;

  /**
   * Clear all data from storage
   * WARNING: This will delete all app data
   */
  clear(): Promise<void>;

  /**
   * Check if a key exists in storage
   * @param key - Storage key to check
   */
  has(key: string): Promise<boolean>;
}

/**
 * Storage error types
 */
export class StorageError extends Error {
  constructor(message: string, public readonly code: StorageErrorCode) {
    super(message);
    this.name = 'StorageError';
  }
}

export enum StorageErrorCode {
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  PARSE_ERROR = 'PARSE_ERROR',
  NOT_SUPPORTED = 'NOT_SUPPORTED',
  UNKNOWN = 'UNKNOWN',
}
