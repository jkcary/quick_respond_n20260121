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

export type CorrectTranscriptResult = {
  correctedTranscript: string;
};

export type SegmentAndJudgeResult = {
  segments: string[];
  correctedTranscript?: string;
  judgments: JudgmentResult[];
};

export type BatchJudgmentInput = {
  word: string;
  userInput: string;
};

export type ProviderConfigStatus = {
  provider: string;
  hasApiKey: boolean;
  hasCustomBaseUrl: boolean;
  baseUrl?: string;
  model?: string;
};

export type LLMConfigStatus = {
  providers: ProviderConfigStatus[];
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
          userInput: '����',
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

  async judgeBatch(entries: BatchJudgmentInput[]): Promise<JudgmentResult[]> {
    return backendRequest<JudgmentResult[]>('/llm/judge-batch', {
      method: 'POST',
      body: JSON.stringify({
        provider: this.provider,
        model: this.model,
        entries,
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

  async correctTranscript(
    transcript: string,
    words: SegmentWordHint[],
    targetCount?: number,
  ): Promise<CorrectTranscriptResult> {
    return backendRequest<CorrectTranscriptResult>('/llm/correct-transcript', {
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


  /**
   * 矫正、切分并判断（一次 LLM 调用完成切分和判断）
   */
  async segmentAndJudge(
    transcript: string,
    words: SegmentWordHint[],
    targetCount?: number,
  ): Promise<SegmentAndJudgeResult> {
    return backendRequest<SegmentAndJudgeResult>('/llm/segment-and-judge', {
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


  /**
   * 获取当前 provider 的配置状态
   */
  async getStatus(): Promise<ProviderConfigStatus> {
    return backendRequest<ProviderConfigStatus>(`/llm/status?provider=${this.provider}`, {
      method: 'GET',
    });
  }


  /**
   * 获取所有 provider 的配置状态
   */
  static async getAllStatus(): Promise<LLMConfigStatus> {
    return backendRequest<LLMConfigStatus>('/llm/status', {
      method: 'GET',
    });
  }


  /**
   * 设置 API 密钥
   */
  async setApiKey(apiKey: string): Promise<void> {
    await backendRequest<{ success: boolean }>('/llm/key', {
      method: 'POST',
      body: JSON.stringify({
        provider: this.provider,
        apiKey,
      }),
    });
  }


  /**
   * 设置自定义 Base URL
   */
  async setBaseUrl(baseUrl: string): Promise<void> {
    await backendRequest<{ success: boolean }>('/llm/base-url', {
      method: 'POST',
      body: JSON.stringify({
        provider: this.provider,
        baseUrl,
      }),
    });
  }
}
