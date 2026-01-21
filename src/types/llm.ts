/**
 * LLM API Type Definitions
 * Based on PRD Section 2.1: Multi-Model Gateway Configuration
 */

/**
 * Supported LLM providers
 */
export enum LLMProvider {
  DeepSeek = 'deepseek',
  OpenAI = 'openai',
  Anthropic = 'anthropic',
  Moonshot = 'moonshot',
  Ollama = 'ollama',
}

/**
 * Configuration for a single LLM provider
 */
export interface LLMConfig {
  /** Provider type */
  provider: LLMProvider;

  /**
   * Optional base URL for API proxy or custom endpoint
   * If not provided, uses provider's default URL
   */
  baseUrl?: string;

  /** API key for authentication */
  apiKey: string;

  /**
   * Model name (e.g., "deepseek-chat", "gpt-4", "claude-3-sonnet")
   */
  modelName: string;

  /** Whether this provider is currently active */
  enabled: boolean;
}

/**
 * LLM judgment result from translation evaluation
 */
export interface JudgmentResult {
  /** Whether the user's translation is correct */
  correct: boolean;

  /**
   * Correct translation or explanation
   * Provided when answer is incorrect
   */
  correction: string;
}

/**
 * Generic LLM API request structure
 */
export interface LLMRequest {
  /** System prompt (enforces JSON output format) */
  systemPrompt: string;

  /** User message (contains word and user input) */
  userMessage: string;

  /** Maximum tokens to generate */
  maxTokens?: number;

  /** Temperature for randomness (0.0 - 1.0) */
  temperature?: number;
}

/**
 * Generic LLM API response structure
 */
export interface LLMResponse {
  /** Raw text content from model */
  content: string;

  /** Usage statistics */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };

  /** Error message if request failed */
  error?: string;
}

/**
 * Provider-specific client interface
 * All LLM providers must implement this
 */
export interface LLMClient {
  /** Test API connectivity with a simple request */
  testConnection(): Promise<boolean>;

  /**
   * Judge user's translation against the English word
   * @param word - English vocabulary word
   * @param userInput - User's Chinese translation
   * @returns JudgmentResult with correct flag and correction
   */
  judge(word: string, userInput: string): Promise<JudgmentResult>;

  /**
   * Send a raw request to the LLM API
   * @param request - LLM request with prompt and parameters
   * @returns LLM response with content and metadata
   */
  sendRequest(request: LLMRequest): Promise<LLMResponse>;
}

/**
 * Connection test result
 */
export interface ConnectionTestResult {
  /** Whether connection succeeded */
  success: boolean;

  /** Response time in milliseconds */
  latency?: number;

  /** Error message if failed */
  error?: string;

  /** HTTP status code */
  statusCode?: number;
}
