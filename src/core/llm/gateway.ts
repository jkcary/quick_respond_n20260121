/**
 * LLM Gateway - Multi-provider factory and orchestrator
 * Selects the appropriate LLM client based on configuration
 */

import type { LLMClient, LLMConfig, JudgmentResult, ConnectionTestResult, LLMProvider } from '@/types';
import { DeepSeekClient } from './providers/deepseek';
import { OpenAIClient } from './providers/openai';
import { AnthropicClient } from './providers/anthropic';
import { MoonshotClient } from './providers/moonshot';
import { OllamaClient } from './providers/ollama';

export class LLMGateway {
  private client: LLMClient;
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
    this.client = this.createClient(config);
  }

  /**
   * Factory method to create the appropriate LLM client
   */
  private createClient(config: LLMConfig): LLMClient {
    switch (config.provider) {
      case 'deepseek':
        return new DeepSeekClient(config);
      case 'openai':
        return new OpenAIClient(config);
      case 'anthropic':
        return new AnthropicClient(config);
      case 'moonshot':
        return new MoonshotClient(config);
      case 'ollama':
        return new OllamaClient(config);
      default:
        throw new Error(`Unsupported LLM provider: ${config.provider}`);
    }
  }

  /**
   * Update configuration and recreate client
   */
  updateConfig(config: LLMConfig): void {
    this.config = config;
    this.client = this.createClient(config);
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now();

    try {
      const success = await this.client.testConnection();
      const latency = Date.now() - startTime;

      return {
        success,
        latency,
        statusCode: success ? 200 : 500,
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      return {
        success: false,
        latency,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Judge user's translation
   */
  async judge(word: string, userInput: string): Promise<JudgmentResult> {
    try {
      return await this.client.judge(word, userInput);
    } catch (error) {
      return {
        correct: false,
        correction: `系统错误: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get current provider name
   */
  getProvider(): LLMProvider {
    return this.config.provider;
  }

  /**
   * Get current configuration
   */
  getConfig(): LLMConfig {
    return { ...this.config };
  }
}

/**
 * Create LLM gateway instance from configuration
 */
export function createLLMGateway(config: LLMConfig): LLMGateway {
  return new LLMGateway(config);
}
