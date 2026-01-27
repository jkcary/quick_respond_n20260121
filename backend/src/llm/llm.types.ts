export enum LlmProvider {
  OpenAI = 'openai',
  DeepSeek = 'deepseek',
  Anthropic = 'anthropic',
  Moonshot = 'moonshot',
  Ollama = 'ollama',
}

export type ProviderConfig = {
  provider: LlmProvider;
  baseUrl: string;
  apiKey?: string;
  model: string;
};

export type LlmUsage = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

export type LlmResponse = {
  content: string;
  usage?: LlmUsage;
};

export type JudgmentResult = {
  correct: boolean;
  correction: string;
};

export type SegmentResult = {
  segments: string[];
  correctedTranscript?: string;
};
