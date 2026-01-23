import { LLMGateway } from './gateway';
import { SEGMENT_SYSTEM_PROMPT, createSegmentUserMessage } from './prompts';

export interface SegmentAgentWord {
  id: string;
  word: string;
  zh?: string;
  chinese?: string[];
}

export interface SegmentAgentResult {
  segments: string[];
  correctedTranscript?: string;
}

interface SegmentAgentResponse {
  segments?: unknown;
  correctedTranscript?: unknown;
}

function cleanResponseContent(content: string): string {
  let cleaned = content.trim();
  cleaned = cleaned.replace(/^```json\s*/i, '');
  cleaned = cleaned.replace(/^```\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/i, '');

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return cleaned.trim();
}

function normalizeSegments(segments: string[], targetCount: number): string[] {
  if (segments.length === targetCount) {
    return segments;
  }
  if (segments.length > targetCount) {
    const overflow = segments.slice(targetCount - 1).join(' ');
    return [...segments.slice(0, targetCount - 1), overflow];
  }
  return [...segments, ...Array(targetCount - segments.length).fill('')];
}

function parseSegmentResponse(content: string, targetCount: number): SegmentAgentResult {
  const cleaned = cleanResponseContent(content);
  const parsed = JSON.parse(cleaned) as SegmentAgentResponse;
  const rawSegments = Array.isArray(parsed.segments)
    ? parsed.segments.map((item) => String(item ?? '').trim())
    : [];

  return {
    segments: normalizeSegments(rawSegments, targetCount),
    correctedTranscript:
      typeof parsed.correctedTranscript === 'string'
        ? parsed.correctedTranscript.trim()
        : undefined,
  };
}

export async function segmentWithAgent(
  gateway: LLMGateway,
  transcript: string,
  words: SegmentAgentWord[],
): Promise<SegmentAgentResult> {
  const targetCount = words.length;
  const hints = words.map((word, index) => ({
    index: index + 1,
    word: word.word,
    hints: [word.zh, ...(word.chinese ?? [])]
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map((item) => item.trim()),
  }));

  const response = await gateway.sendRequest({
    systemPrompt: SEGMENT_SYSTEM_PROMPT,
    userMessage: createSegmentUserMessage(transcript, hints, targetCount),
    maxTokens: 500,
    temperature: 0,
    requestType: 'segment',
  });

  if (response.error) {
    throw new Error(response.error);
  }

  return parseSegmentResponse(response.content, targetCount);
}
