/**
 * LLM response parser - Extract and validate JSON from responses
 * Handles markdown code blocks and malformed responses
 */

import type { JudgmentResult } from '@/types';

/**
 * Parse judgment result from LLM response
 * Handles various response formats including markdown code blocks
 */
export function parseJudgment(content: string): JudgmentResult {
  try {
    // Remove markdown code blocks if present
    const cleaned = cleanResponseContent(content);

    // Parse JSON
    const parsed = JSON.parse(cleaned);

    // Validate structure
    if (typeof parsed === 'object' && parsed !== null) {
      const hasCorrect = typeof parsed.correct === 'boolean';
      const hasCorrection = typeof parsed.correction === 'string';

      if (hasCorrect && hasCorrection) {
        return {
          correct: parsed.correct,
          correction: parsed.correction,
        };
      }
    }

    // Fallback for invalid structure
    return createErrorFallback('Invalid response structure');
  } catch (error) {
    // Fallback for parse errors
    return createErrorFallback(
      error instanceof Error ? error.message : 'Unknown parsing error'
    );
  }
}

/**
 * Clean response content to extract JSON
 * Removes markdown code blocks, extra whitespace, etc.
 */
function cleanResponseContent(content: string): string {
  let cleaned = content.trim();

  // Remove markdown JSON code blocks: ```json ... ```
  cleaned = cleaned.replace(/^```json\s*/i, '');
  cleaned = cleaned.replace(/^```\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/i, '');

  // Find JSON object boundaries
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return cleaned.trim();
}

/**
 * Create error fallback judgment result
 */
function createErrorFallback(reason: string): JudgmentResult {
  console.error('LLM response parsing failed:', reason);
  return {
    correct: false,
    correction: '系统错误，请重试',
  };
}

/**
 * Validate judgment result structure
 */
export function isValidJudgment(obj: unknown): obj is JudgmentResult {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const judgment = obj as Record<string, unknown>;
  return (
    typeof judgment.correct === 'boolean' &&
    typeof judgment.correction === 'string'
  );
}

/**
 * Parse connection test response
 */
export function parseConnectionTest(content: string): boolean {
  try {
    const cleaned = cleanResponseContent(content);
    const parsed = JSON.parse(cleaned);
    return parsed.status === 'ok';
  } catch {
    // If response is not JSON or doesn't match expected format,
    // still consider it successful if we got a response
    return content.length > 0;
  }
}
