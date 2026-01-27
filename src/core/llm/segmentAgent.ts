import type { SegmentWordHint } from '@/core/backend/llmGateway';

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

export interface SegmentGateway {
  segment: (
    transcript: string,
    words: SegmentWordHint[],
    targetCount?: number,
  ) => Promise<SegmentAgentResult>;
}

export async function segmentWithAgent(
  gateway: SegmentGateway,
  transcript: string,
  words: SegmentAgentWord[],
): Promise<SegmentAgentResult> {
  const targetCount = words.length;
  const hints: SegmentWordHint[] = words.map((word, index) => ({
    index: index + 1,
    word: word.word,
    hints: [word.zh, ...(word.chinese ?? [])]
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map((item) => item.trim()),
  }));

  return gateway.segment(transcript, hints, targetCount);
}
