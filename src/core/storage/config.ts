/**
 * Application configuration storage
 * Manages user preferences and LLM settings persistence
 */

import type { AppConfig, UserPreferences, LLMConfig } from '@/types';
import { LLMProvider } from '@/types';
import { StorageAdapter } from './base';
import { LocalStorageAdapter } from './localStorage';

const CONFIG_KEY = 'app_config';

/**
 * Default user preferences
 */
const DEFAULT_PREFERENCES: UserPreferences = {
  autoPlayTTS: true,
  speechRecognitionLang: 'zh-CN',
  ttsLang: 'en-US',
  soundEffectVolume: 1.0,
  enableAnimations: true,
  theme: 'dark',
};

/**
 * Default application configuration
 */
export const DEFAULT_CONFIG: AppConfig = {
  gradeLevel: 5,
  activeLLMProvider: LLMProvider.DeepSeek,
  preferences: DEFAULT_PREFERENCES,
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
        preferences: { ...DEFAULT_PREFERENCES, ...config.preferences },
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
      preferences: partialConfig.preferences
        ? { ...currentConfig.preferences, ...partialConfig.preferences }
        : currentConfig.preferences,
    };
    await this.save(updatedConfig);
  }

  /**
   * Update LLM configuration for a provider
   */
  async updateLLMConfig(provider: LLMProvider, llmConfig: Partial<LLMConfig>): Promise<void> {
    const currentConfig = await this.load();
    const existingConfigs = currentConfig.llmConfigs ?? ({} as Record<LLMProvider, LLMConfig>);
    const existingProviderConfig = existingConfigs[provider];

    const updatedConfigs: Record<LLMProvider, LLMConfig> = {
      ...existingConfigs,
      [provider]: {
        // Base defaults
        provider,
        apiKey: existingProviderConfig?.apiKey ?? '',
        modelName: existingProviderConfig?.modelName ?? '',
        enabled: existingProviderConfig?.enabled ?? true,
        baseUrl: existingProviderConfig?.baseUrl,
        // Override with new config
        ...llmConfig,
      },
    };

    await this.update({ llmConfigs: updatedConfigs });
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
  async updatePreferences(preferences: Partial<UserPreferences>): Promise<void> {
    const currentConfig = await this.load();
    const updatedConfig: AppConfig = {
      ...currentConfig,
      preferences: {
        ...DEFAULT_PREFERENCES,
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
    // Check legacy apiKey or new llmConfigs
    if (config.apiKey && config.apiKey.trim().length > 0) {
      return true;
    }
    const activeProvider = config.activeLLMProvider ?? LLMProvider.DeepSeek;
    const providerConfig = config.llmConfigs?.[activeProvider];
    return (providerConfig?.apiKey?.trim().length ?? 0) > 0;
  }
}
