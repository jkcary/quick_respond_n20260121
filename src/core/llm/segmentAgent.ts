import type { SegmentWordHint, SegmentAndJudgeResult } from '@/core/backend/llmGateway';
import type { JudgmentResult } from '@/types';

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

export interface SegmentAgentResultWithJudgments extends SegmentAgentResult {
  judgments?: JudgmentResult[];
}

export interface TranscriptCorrectionResult {
  correctedTranscript: string;
}

export interface SegmentGateway {
  segment: (
    transcript: string,
    words: SegmentWordHint[],
    targetCount?: number,
  ) => Promise<SegmentAgentResult>;
}

export interface SegmentAndJudgeGateway {
  segmentAndJudge: (
    transcript: string,
    words: SegmentWordHint[],
    targetCount?: number,
  ) => Promise<SegmentAndJudgeResult>;
}

export interface TranscriptCorrectionGateway {
  correctTranscript: (
    transcript: string,
    words: SegmentWordHint[],
    targetCount?: number,
  ) => Promise<TranscriptCorrectionResult>;
}

function buildHints(words: SegmentAgentWord[]): SegmentWordHint[] {
  return words.map((word, index) => ({
    index: index + 1,
    word: word.word,
    hints: [word.zh, ...(word.chinese ?? [])]
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map((item) => item.trim()),
  }));
}

export async function segmentWithAgent(
  gateway: SegmentGateway,
  transcript: string,
  words: SegmentAgentWord[],
): Promise<SegmentAgentResult> {
  const targetCount = words.length;
  const hints = buildHints(words);
  return gateway.segment(transcript, hints, targetCount);
}

export async function correctTranscriptWithAgent(
  gateway: TranscriptCorrectionGateway,
  transcript: string,
  words: SegmentAgentWord[],
): Promise<TranscriptCorrectionResult> {
  const targetCount = words.length;
  const hints = buildHints(words);
  return gateway.correctTranscript(transcript, hints, targetCount);
}

/**
 * 一次调用完成切分和判断，减少 LLM 调用次数，提高速度
 */
export async function segmentAndJudgeWithAgent(
  gateway: SegmentAndJudgeGateway,
  transcript: string,
  words: SegmentAgentWord[],
): Promise<SegmentAgentResultWithJudgments> {
  const targetCount = words.length;
  const hints = buildHints(words);
  const result = await gateway.segmentAndJudge(transcript, hints, targetCount);
  return {
    segments: result.segments,
    correctedTranscript: result.correctedTranscript,
    judgments: result.judgments,
  };
}
