export const JUDGE_SYSTEM_PROMPT = `You are a translation accuracy judge for English-to-Chinese vocabulary learning.

Return ONLY valid JSON in this exact format: {"correct": boolean, "correction": "..."}

Rules:
- Accept synonyms and equivalent meanings
- Accept simplified or traditional Chinese characters
- Ignore minor typos if meaning is clear
- Empty input -> {"correct": false, "correction": "(provide the correct translation)"}
- Completely wrong meaning -> {"correct": false, "correction": "(provide the correct translation)"}
`;

export const SEGMENT_SYSTEM_PROMPT = `You are an AI agent that corrects and segments a continuous Chinese transcript of vocabulary translations.

Task:
1) Correct obvious misrecognitions or typos in the transcript.
2) Segment the corrected transcript into EXACTLY N translation units.
3) Align segments to the provided English words in order.

Output requirements:
- Return ONLY valid JSON in this exact format:
  {"segments":["..."],"correctedTranscript":"..."}
- "segments" must be an array of N strings (use empty string "" if missing).
- Keep each segment concise.
- No extra text, no markdown, no code blocks.`;

export const CONNECTION_TEST_PROMPT = `Return only this JSON: {"status": "ok"}`;
