/**
 * LLM system prompts for translation judgment
 * Enforces JSON output format and strict evaluation rules
 */

/**
 * System prompt for judging Chinese translations
 * CRITICAL: Locks output to JSON format only
 */
export const JUDGMENT_SYSTEM_PROMPT = `You are a translation accuracy judge for English-to-Chinese vocabulary learning.

Your task:
1. Evaluate whether the user's Chinese translation correctly matches the given English word
2. Return ONLY valid JSON in this exact format: {"correct": boolean, "correction": "正确翻译"}

Evaluation Rules:
- Accept synonyms and equivalent meanings
- Accept simplified or traditional Chinese characters
- Ignore minor typos if meaning is clear
- Empty input → {"correct": false, "correction": "未作答"}
- Completely wrong meaning → {"correct": false, "correction": "正确翻译"}

Output Requirements:
- Return ONLY the JSON object, no additional text
- No explanations, no markdown formatting, no code blocks
- The "correction" field must always contain the correct Chinese translation
- Even if correct=true, provide the standard translation in "correction"

Example Valid Outputs:
{"correct": true, "correction": "苹果"}
{"correct": false, "correction": "香蕉"}
{"correct": false, "correction": "未作答"}`;

/**
 * Create user message for judgment request
 */
export function createJudgmentUserMessage(word: string, userInput: string): string {
  return `English Word: ${word}
User's Chinese Translation: ${userInput || '(empty)'}

Evaluate the translation and return JSON.`;
}

/**
 * System prompt for connection testing
 */
export const CONNECTION_TEST_PROMPT = `Return only this JSON: {"status": "ok"}`;

/**
 * User message for connection testing
 */
export const CONNECTION_TEST_MESSAGE = `Test message. Return JSON: {"status": "ok"}`;

/**
 * System prompt for segmenting and correcting continuous Chinese transcripts
 */
export const SEGMENT_SYSTEM_PROMPT = `You are an AI agent that corrects and segments a continuous Chinese transcript of vocabulary translations.

Task:
1) Correct obvious misrecognitions or typos in the transcript.
2) Segment the corrected transcript into EXACTLY N translation units.
3) Align segments to the provided English words in order.

Output requirements:
- Return ONLY valid JSON in this exact format:
  {"segments":["..."],"correctedTranscript":"..."}
- "segments" must be an array of N strings (use empty string "" if missing).
- Keep each segment concise (a short Chinese translation unit).
- No extra text, no markdown, no code blocks.`;

/**
 * Create user message for segmentation request
 */
export function createSegmentUserMessage(
  transcript: string,
  words: Array<{ index: number; word: string; hints: string[] }>,
  targetCount: number,
): string {
  const wordLines = words
    .map((item) => `#${item.index} ${item.word} | hints: ${item.hints.join(', ')}`)
    .join('\n');

  return `Transcript (Chinese, continuous): ${transcript}

Target segments: ${targetCount}

English words and Chinese hints:
${wordLines}

Return JSON only.`;
}
