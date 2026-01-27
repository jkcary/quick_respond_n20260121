import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  JUDGE_SYSTEM_PROMPT,
  SEGMENT_SYSTEM_PROMPT,
  CONNECTION_TEST_PROMPT,
} from './prompts';
import {
  JudgmentResult,
  LlmProvider,
  LlmResponse,
  ProviderConfig,
  SegmentResult,
} from './llm.types';
import { safeParseJson } from './parser';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly deviceKeys = new Map<string, Map<LlmProvider, string>>();
  private readonly deviceBaseUrls = new Map<string, Map<LlmProvider, string>>();

  constructor(private readonly configService: ConfigService) {}

  async judge(
    provider: LlmProvider,
    word: string,
    userInput: string,
    modelOverride?: string,
    deviceId?: string,
  ): Promise<JudgmentResult> {
    const userMessage = `English Word: ${word}\nUser's Chinese Translation: ${userInput || '(empty)'}`;
    const response = await this.sendChat(
      provider,
      JUDGE_SYSTEM_PROMPT,
      userMessage,
      modelOverride,
      deviceId,
    );

    const parsed = safeParseJson<JudgmentResult>(response.content);
    if (parsed && typeof parsed.correct === 'boolean' && typeof parsed.correction === 'string') {
      return parsed;
    }

    return {
      correct: false,
      correction: 'Invalid model response',
    };
  }

  async segment(
    provider: LlmProvider,
    transcript: string,
    words: Array<{ index: number; word: string; hints?: string[] }>,
    targetCount: number,
    modelOverride?: string,
    deviceId?: string,
  ): Promise<SegmentResult> {
    const wordLines = words
      .map((item) => `#${item.index} ${item.word} | hints: ${(item.hints ?? []).join(', ')}`)
      .join('\n');

    const userMessage = `Transcript (Chinese, continuous): ${transcript}\n\nTarget segments: ${targetCount}\n\nEnglish words and Chinese hints:\n${wordLines}\n\nReturn JSON only.`;

    const response = await this.sendChat(
      provider,
      SEGMENT_SYSTEM_PROMPT,
      userMessage,
      modelOverride,
      deviceId,
    );

    const parsed = safeParseJson<SegmentResult>(response.content);
    if (parsed && Array.isArray(parsed.segments)) {
      return parsed;
    }

    return {
      segments: Array.from({ length: targetCount }).map(() => ''),
      correctedTranscript: transcript,
    };
  }

  async testConnection(provider: LlmProvider, deviceId?: string): Promise<boolean> {
    const response = await this.sendChat(provider, CONNECTION_TEST_PROMPT, 'Test', undefined, deviceId);
    return response.content.length > 0;
  }

  setApiKey(deviceId: string, provider: LlmProvider, apiKey: string): void {
    if (!deviceId) {
      return;
    }
    if (provider === LlmProvider.Ollama) {
      return;
    }
    const trimmed = apiKey.trim();
    if (!trimmed) {
      const existing = this.deviceKeys.get(deviceId);
      if (existing) {
        existing.delete(provider);
        if (existing.size === 0) {
          this.deviceKeys.delete(deviceId);
        }
      }
      return;
    }
    let map = this.deviceKeys.get(deviceId);
    if (!map) {
      map = new Map<LlmProvider, string>();
      this.deviceKeys.set(deviceId, map);
    }
    map.set(provider, trimmed);
  }

  setBaseUrl(deviceId: string, provider: LlmProvider, baseUrl: string): void {
    if (!deviceId) {
      return;
    }
    const trimmed = baseUrl.trim();
    if (!trimmed) {
      const existing = this.deviceBaseUrls.get(deviceId);
      if (existing) {
        existing.delete(provider);
        if (existing.size === 0) {
          this.deviceBaseUrls.delete(deviceId);
        }
      }
      return;
    }
    this.ensureSecureBaseUrl(provider, trimmed);
    let map = this.deviceBaseUrls.get(deviceId);
    if (!map) {
      map = new Map<LlmProvider, string>();
      this.deviceBaseUrls.set(deviceId, map);
    }
    map.set(provider, trimmed);
  }

  private getDeviceApiKey(deviceId: string | undefined, provider: LlmProvider): string | undefined {
    if (!deviceId) {
      return undefined;
    }
    return this.deviceKeys.get(deviceId)?.get(provider);
  }

  private getDeviceBaseUrl(deviceId: string | undefined, provider: LlmProvider): string | undefined {
    if (!deviceId) {
      return undefined;
    }
    return this.deviceBaseUrls.get(deviceId)?.get(provider);
  }

  private getProviderConfig(
    provider: LlmProvider,
    modelOverride?: string,
    deviceId?: string,
  ): ProviderConfig {
    const get = (key: string) => this.configService.get<string>(key);
    const deviceKey = this.getDeviceApiKey(deviceId, provider);
    const deviceBaseUrl = this.getDeviceBaseUrl(deviceId, provider);

    switch (provider) {
      case LlmProvider.OpenAI:
        return {
          provider,
          baseUrl: deviceBaseUrl ?? get('OPENAI_BASE_URL') ?? 'https://api.openai.com',
          apiKey: deviceKey ?? get('OPENAI_API_KEY'),
          model: modelOverride ?? get('OPENAI_MODEL') ?? 'gpt-4',
        };
      case LlmProvider.DeepSeek:
        return {
          provider,
          baseUrl: deviceBaseUrl ?? get('DEEPSEEK_BASE_URL') ?? 'https://api.deepseek.com',
          apiKey: deviceKey ?? get('DEEPSEEK_API_KEY'),
          model: modelOverride ?? get('DEEPSEEK_MODEL') ?? 'deepseek-chat',
        };
      case LlmProvider.Anthropic:
        return {
          provider,
          baseUrl: deviceBaseUrl ?? get('ANTHROPIC_BASE_URL') ?? 'https://api.anthropic.com',
          apiKey: deviceKey ?? get('ANTHROPIC_API_KEY'),
          model: modelOverride ?? get('ANTHROPIC_MODEL') ?? 'claude-3-haiku-20240307',
        };
      case LlmProvider.Moonshot:
        return {
          provider,
          baseUrl: deviceBaseUrl ?? get('MOONSHOT_BASE_URL') ?? 'https://api.moonshot.cn',
          apiKey: deviceKey ?? get('MOONSHOT_API_KEY'),
          model: modelOverride ?? get('MOONSHOT_MODEL') ?? 'moonshot-v1-8k',
        };
      case LlmProvider.Ollama:
        return {
          provider,
          baseUrl: deviceBaseUrl ?? get('OLLAMA_BASE_URL') ?? 'http://localhost:11434',
          model: modelOverride ?? get('OLLAMA_MODEL') ?? 'llama2',
        };
      default:
        throw new BadRequestException('Unsupported provider');
    }
  }

  private ensureSecureBaseUrl(provider: LlmProvider, baseUrl: string): void {
    const parsed = new URL(baseUrl);
    if (provider === LlmProvider.Ollama) {
      const allow = this.configService.get<string>('ALLOW_OLLAMA') ?? 'false';
      if (allow !== 'true') {
        throw new BadRequestException('Ollama is disabled');
      }
      const isLocalhost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
      if (!isLocalhost) {
        throw new BadRequestException('Ollama must use a localhost base URL');
      }
      return;
    }

    if (parsed.protocol !== 'https:') {
      throw new BadRequestException('Insecure base URL is not allowed');
    }
  }

  private buildOpenAIEndpoint(baseUrl: string): string {
    let normalized = baseUrl.replace(/\/+$/, '');
    if (normalized.endsWith('/v1')) {
      normalized = normalized.slice(0, -3);
    }
    return `${normalized}/v1/chat/completions`;
  }

  private buildAnthropicEndpoint(baseUrl: string): string {
    let normalized = baseUrl.replace(/\/+$/, '');
    if (normalized.endsWith('/v1')) {
      normalized = normalized.slice(0, -3);
    }
    return `${normalized}/v1/messages`;
  }

  private buildOllamaEndpoint(baseUrl: string): string {
    return `${baseUrl.replace(/\/+$/, '')}/api/chat`;
  }

  private async sendChat(
    provider: LlmProvider,
    systemPrompt: string,
    userMessage: string,
    modelOverride?: string,
    deviceId?: string,
  ): Promise<LlmResponse> {
    const config = this.getProviderConfig(provider, modelOverride, deviceId);
    this.ensureSecureBaseUrl(provider, config.baseUrl);

    if (provider !== LlmProvider.Ollama && !config.apiKey) {
      throw new BadRequestException('Missing API key for provider');
    }

    const timeout = Number(this.configService.get<string>('REQUEST_TIMEOUT_MS') ?? 10000);

    switch (provider) {
      case LlmProvider.Anthropic:
        return this.sendAnthropic(config, systemPrompt, userMessage, timeout);
      case LlmProvider.Ollama:
        return this.sendOllama(config, systemPrompt, userMessage, timeout);
      default:
        return this.sendOpenAICompatible(config, systemPrompt, userMessage, timeout);
    }
  }

  private async sendOpenAICompatible(
    config: ProviderConfig,
    systemPrompt: string,
    userMessage: string,
    timeout: number,
  ): Promise<LlmResponse> {
    const endpoint = this.buildOpenAIEndpoint(config.baseUrl);
    const response = await axios.post(
      endpoint,
      {
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 200,
        temperature: 0,
      },
      {
        timeout,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
      },
    );

    const content = response.data?.choices?.[0]?.message?.content ?? '';
    return {
      content,
      usage: response.data?.usage,
    };
  }

  private async sendAnthropic(
    config: ProviderConfig,
    systemPrompt: string,
    userMessage: string,
    timeout: number,
  ): Promise<LlmResponse> {
    const endpoint = this.buildAnthropicEndpoint(config.baseUrl);
    const version = this.configService.get<string>('ANTHROPIC_VERSION') ?? '2023-06-01';

    const response = await axios.post(
      endpoint,
      {
        model: config.model,
        max_tokens: 200,
        temperature: 0,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      },
      {
        timeout,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': version,
        },
      },
    );

    const content = response.data?.content?.[0]?.text ?? '';
    const usage = response.data?.usage
      ? {
          promptTokens: response.data.usage.input_tokens,
          completionTokens: response.data.usage.output_tokens,
          totalTokens:
            response.data.usage.input_tokens + response.data.usage.output_tokens,
        }
      : undefined;

    return { content, usage };
  }

  private async sendOllama(
    config: ProviderConfig,
    systemPrompt: string,
    userMessage: string,
    timeout: number,
  ): Promise<LlmResponse> {
    const endpoint = this.buildOllamaEndpoint(config.baseUrl);

    const response = await axios.post(
      endpoint,
      {
        model: config.model,
        stream: false,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        options: {
          temperature: 0,
        },
      },
      { timeout },
    );

    const content = response.data?.message?.content ?? '';
    return { content };
  }
}
