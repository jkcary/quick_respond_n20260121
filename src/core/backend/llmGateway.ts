import type { ConnectionTestResult, JudgmentResult } from '@/types';
import { LLMProvider } from '@/types';
import { backendRequest } from './client';

export type SegmentWordHint = {
  index: number;
  word: string;
  hints?: string[];
};

export type SegmentResult = {
  segments: string[];
  correctedTranscript?: string;
};

export class BackendLLMGateway {
  private provider: LLMProvider;
  private model?: string;

  constructor(provider: LLMProvider, model?: string) {
    this.provider = provider;
    this.model = model;
  }

  getProvider(): LLMProvider {
    return this.provider;
  }

  updateModel(model?: string) {
    this.model = model;
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const start = Date.now();

    try {
      await backendRequest<JudgmentResult>('/llm/judge', {
        method: 'POST',
        body: JSON.stringify({
          provider: this.provider,
          model: this.model,
          word: 'test',
          userInput: '≤‚ ‘',
        }),
      });

      return {
        success: true,
        latency: Date.now() - start,
        statusCode: 200,
      };
    } catch (error) {
      return {
        success: false,
        latency: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async judge(word: string, userInput: string): Promise<JudgmentResult> {
    return backendRequest<JudgmentResult>('/llm/judge', {
      method: 'POST',
      body: JSON.stringify({
        provider: this.provider,
        model: this.model,
        word,
        userInput,
      }),
    });
  }

  async segment(
    transcript: string,
    words: SegmentWordHint[],
    targetCount?: number,
  ): Promise<SegmentResult> {
    return backendRequest<SegmentResult>('/llm/segment', {
      method: 'POST',
      body: JSON.stringify({
        provider: this.provider,
        model: this.model,
        transcript,
        words,
        targetCount,
      }),
    });
  }
}
