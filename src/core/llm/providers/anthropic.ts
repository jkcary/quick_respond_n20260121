/**
 * Anthropic (Claude) API client implementation
 */

import axios, { type AxiosInstance } from 'axios';
import type { LLMClient, LLMRequest, LLMResponse, JudgmentResult, LLMConfig } from '@/types';
import { parseJudgment, parseConnectionTest } from '../parser';
import { JUDGMENT_SYSTEM_PROMPT, createJudgmentUserMessage, CONNECTION_TEST_PROMPT, CONNECTION_TEST_MESSAGE } from '../prompts';
import { logAIUsage } from '@/utils/aiLogger';

const DEFAULT_BASE_URL = 'https://api.anthropic.com';
const DEFAULT_MODEL = 'claude-3-haiku-20240307';
const API_VERSION = '2023-06-01';
const REQUEST_TIMEOUT = 10000;

export class AnthropicClient implements LLMClient {
  private client: AxiosInstance;
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;

    this.client = axios.create({
      baseURL: config.baseUrl || DEFAULT_BASE_URL,
      timeout: REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': API_VERSION,
      },
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.sendRequest({
        systemPrompt: CONNECTION_TEST_PROMPT,
        userMessage: CONNECTION_TEST_MESSAGE,
        maxTokens: 10,
        temperature: 0,
      });

      return !response.error && parseConnectionTest(response.content);
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
      const response = await this.client.post('/v1/messages', {
        model: this.config.modelName || DEFAULT_MODEL,
        system: request.systemPrompt,
        messages: [
          {
            role: 'user',
            content: request.userMessage,
          },
        ],
        max_tokens: request.maxTokens || 100,
        temperature: request.temperature ?? 0,
      });

      const data = response.data;
      const content = data.content?.[0]?.text || '';

      if (data.usage) {
        const requestType =
          request.requestType ??
          (request.systemPrompt === CONNECTION_TEST_PROMPT ? 'connection_test' : 'judge');
        void logAIUsage({
          provider: this.config.provider,
          model: this.config.modelName || DEFAULT_MODEL,
          requestType,
          promptTokens: data.usage.input_tokens,
          completionTokens: data.usage.output_tokens,
          totalTokens: data.usage.input_tokens + data.usage.output_tokens,
          inputChars: request.userMessage?.length ?? 0,
        });
      }

      return {
        content,
        usage: data.usage
          ? {
              promptTokens: data.usage.input_tokens,
              completionTokens: data.usage.output_tokens,
              totalTokens: data.usage.input_tokens + data.usage.output_tokens,
            }
          : undefined,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.error?.message || error.message;

        return {
          content: '',
          error: `Anthropic API错误 (${status || 'Network'}): ${message}`,
        };
      }

      return {
        content: '',
        error: `未知错误: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}
