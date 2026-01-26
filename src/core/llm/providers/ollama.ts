/**
 * Ollama local API client implementation
 * For self-hosted models
 */

import axios, { type AxiosInstance } from 'axios';
import type { LLMClient, LLMRequest, LLMResponse, JudgmentResult, LLMConfig } from '@/types';
import { parseJudgment } from '../parser';
import { JUDGMENT_SYSTEM_PROMPT, createJudgmentUserMessage, CONNECTION_TEST_PROMPT } from '../prompts';
import { logAIUsage } from '@/utils/aiLogger';

const DEFAULT_BASE_URL = 'http://localhost:11434';
const DEFAULT_MODEL = 'llama2';
const REQUEST_TIMEOUT = 30000; // Longer timeout for local models

export class OllamaClient implements LLMClient {
  private client: AxiosInstance;
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;

    this.client = axios.create({
      baseURL: config.baseUrl || DEFAULT_BASE_URL,
      timeout: REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      // Test Ollama availability with /api/tags endpoint
      await this.client.get('/api/tags');
      return true;
    } catch {
      return false;
    }
  }

  async judge(word: string, userInput: string): Promise<JudgmentResult> {
    const response = await this.sendRequest({
      systemPrompt: JUDGMENT_SYSTEM_PROMPT,
      userMessage: createJudgmentUserMessage(word, userInput),
      maxTokens: 100,
      temperature: 0,
    });

    if (response.error) {
      return {
        correct: false,
        correction: `API错误: ${response.error}`,
      };
    }

    return parseJudgment(response.content);
  }

  async sendRequest(request: LLMRequest): Promise<LLMResponse> {
    try {
      const response = await this.client.post('/api/chat', {
        model: this.config.modelName || DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: request.systemPrompt,
          },
          {
            role: 'user',
            content: request.userMessage,
          },
        ],
        stream: false,
        options: {
          temperature: request.temperature ?? 0,
          num_predict: request.maxTokens || 100,
        },
      });

      const data = response.data;
      const content = data.message?.content || '';

      if (data.prompt_eval_count && data.eval_count) {
        const requestType =
          request.requestType ??
          (request.systemPrompt === CONNECTION_TEST_PROMPT ? 'connection_test' : 'judge');
        void logAIUsage({
          provider: this.config.provider,
          model: this.config.modelName || DEFAULT_MODEL,
          requestType,
          promptTokens: data.prompt_eval_count,
          completionTokens: data.eval_count,
          totalTokens: data.prompt_eval_count + data.eval_count,
          inputChars: request.userMessage?.length ?? 0,
        });
      }

      return {
        content,
        usage: data.prompt_eval_count && data.eval_count
          ? {
              promptTokens: data.prompt_eval_count,
              completionTokens: data.eval_count,
              totalTokens: data.prompt_eval_count + data.eval_count,
            }
          : undefined,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.error || error.message;

        return {
          content: '',
          error: `Ollama API错误 (${status || 'Network'}): ${message}`,
        };
      }

      return {
        content: '',
        error: `未知错误: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}
