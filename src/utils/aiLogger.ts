import { backendRequest } from '@/core/backend/client';

export type AIUsageLogEntry = {
  provider: string;
  model: string;
  requestType: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  inputChars?: number;
  timestamp?: string;
  error?: string;
};

export async function logAIUsage(entry: AIUsageLogEntry): Promise<void> {
  try {
    await backendRequest('/logs/ai-usage', {
      method: 'POST',
      body: JSON.stringify({
        ...entry,
        timestamp: entry.timestamp ?? new Date().toISOString(),
      }),
    });
  } catch {
    // Ignore logging errors to avoid impacting user flow.
  }
}
