export function extractJsonObject(content: string): string | null {
  if (!content) return null;
  let cleaned = content.trim();
  cleaned = cleaned.replace(/^```json\s*/i, '');
  cleaned = cleaned.replace(/^```\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/i, '');

  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) {
    return null;
  }
  return cleaned.slice(first, last + 1).trim();
}

export function safeParseJson<T>(content: string): T | null {
  const json = extractJsonObject(content);
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}
