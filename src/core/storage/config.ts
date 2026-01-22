/**
 * Application configuration storage
 * Manages user preferences and LLM settings persistence
 */

import type { AppConfig } from '@/types';
import { StorageAdapter } from './base';
import { LocalStorageAdapter } from './localStorage';

const CONFIG_KEY = 'app_config';

/**
 * Default application configuration
 */
export const DEFAULT_CONFIG: AppConfig = {
  llm: {
    provider: 'deepseek',
    apiKey: '',
    model: 'deepseek-chat',
    baseUrl: 'https://api.deepseek.com',
  },
  gradeLevel: 3,
  preferences: {
    voiceEnabled: true,
    autoPlayAudio: true,
    speechRate: 1.0,
    theme: 'dark',
  },
};

export class ConfigStorage {
  private storage: StorageAdapter;

  constructor(storage?: StorageAdapter) {
    this.storage = storage ?? new LocalStorageAdapter();
  }

  /**
   * Load application configuration
   */
  async load(): Promise<AppConfig> {
    const config = await this.storage.get<AppConfig>(CONFIG_KEY);

    // Merge with defaults to handle missing fields
    if (config) {
      return {
        ...DEFAULT_CONFIG,
        ...config,
        llm: { ...DEFAULT_CONFIG.llm, ...config.llm },
        preferences: { ...DEFAULT_CONFIG.preferences, ...config.preferences },
      };
    }

    return DEFAULT_CONFIG;
  }

  /**
   * Save application configuration
   */
  async save(config: AppConfig): Promise<void> {
    await this.storage.set(CONFIG_KEY, config);
  }

  /**
   * Update partial configuration
   */
  async update(partialConfig: Partial<AppConfig>): Promise<void> {
    const currentConfig = await this.load();
    const updatedConfig: AppConfig = {
      ...currentConfig,
      ...partialConfig,
      llm: partialConfig.llm
        ? { ...currentConfig.llm, ...partialConfig.llm }
        : currentConfig.llm,
      preferences: partialConfig.preferences
        ? { ...currentConfig.preferences, ...partialConfig.preferences }
        : currentConfig.preferences,
    };
    await this.save(updatedConfig);
  }

  /**
   * Update LLM configuration
   */
  async updateLLMConfig(llmConfig: Partial<AppConfig['llm']>): Promise<void> {
    const currentConfig = await this.load();
    const updatedConfig: AppConfig = {
      ...currentConfig,
      llm: {
        ...currentConfig.llm,
        ...llmConfig,
      },
    };
    await this.save(updatedConfig);
  }

  /**
   * Update grade level
   */
  async updateGradeLevel(gradeLevel: number): Promise<void> {
    await this.update({ gradeLevel });
  }

  /**
   * Update preferences
   */
  async updatePreferences(preferences: Partial<AppConfig['preferences']>): Promise<void> {
    const currentConfig = await this.load();
    const updatedConfig: AppConfig = {
      ...currentConfig,
      preferences: {
        ...currentConfig.preferences,
        ...preferences,
      },
    };
    await this.save(updatedConfig);
  }

  /**
   * Reset to default configuration
   */
  async reset(): Promise<void> {
    await this.save(DEFAULT_CONFIG);
  }

  /**
   * Check if API key is configured
   */
  async isConfigured(): Promise<boolean> {
    const config = await this.load();
    return config.llm.apiKey.trim().length > 0;
  }
}
