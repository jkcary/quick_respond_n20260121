/**
 * Vocabulary loader - Loads and aggregates vocabulary JSON files
 * Supports book-based vocabulary from PEP textbooks (Grade 3-9)
 */

import type { VocabularyItem, GradeLevel } from '@/types';

/**
 * Book manifest entry
 */
interface BookManifest {
  id: string;
  name: string;
  grade: number;
  semester: number;
  wordCount: number;
  file: string;
}

/**
 * Cache for loaded vocabulary to avoid redundant imports
 */
const vocabularyCache: Map<GradeLevel, VocabularyItem[]> = new Map();

/**
 * Load vocabulary for a specific grade level
 * This loads both semester 1 and semester 2 for the grade (or full year for grade 9)
 */
export async function loadGradeVocabulary(grade: GradeLevel): Promise<VocabularyItem[]> {
  // Check cache first
  if (vocabularyCache.has(grade)) {
    return vocabularyCache.get(grade)!;
  }

  try {
    // Dynamic import for books
    const bookModules = import.meta.glob('@/data/books/*.json');

    // Load all book files for this grade
    const vocabularyArrays: VocabularyItem[] = [];

    for (const [path, importFn] of Object.entries(bookModules)) {
      // Check if this file belongs to the current grade
      // Pattern: g3-s1.json, g3-s2.json, g9-full.json
      const gradeMatch = path.match(/g(\d+)-/);
      if (gradeMatch && parseInt(gradeMatch[1]) === grade) {
        const module = (await importFn()) as { default: VocabularyItem[] };
        const items = module.default;

        // Add backward compatibility fields and validate
        const processedItems = items
          .map(normalizeVocabularyItem)
          .filter(validateVocabularyItem);

        vocabularyArrays.push(...processedItems);
      }
    }

    if (vocabularyArrays.length === 0) {
      console.warn(`No vocabulary files found for grade ${grade}`);
      return [];
    }

    // Deduplicate by ID
    const uniqueVocabulary = deduplicateById(vocabularyArrays);

    // Cache the result
    vocabularyCache.set(grade, uniqueVocabulary);

    return uniqueVocabulary;
  } catch (error) {
    console.error(`Failed to load vocabulary for grade ${grade}:`, error);
    throw new Error(`Vocabulary loading failed for grade ${grade}`);
  }
}

/**
 * Load vocabulary for all grades up to and including the specified level
 */
export async function loadVocabularyUpToGrade(grade: GradeLevel): Promise<VocabularyItem[]> {
  const grades: GradeLevel[] = [];

  for (let g = 3; g <= grade; g++) {
    grades.push(g as GradeLevel);
  }

  const vocabularyArrays = await Promise.all(
    grades.map((g) => loadGradeVocabulary(g))
  );

  // Flatten and deduplicate by ID
  const allVocabulary = vocabularyArrays.flat();
  const uniqueVocabulary = deduplicateById(allVocabulary);

  return uniqueVocabulary;
}

/**
 * Normalize vocabulary item to add backward compatibility fields
 */
function normalizeVocabularyItem(item: VocabularyItem): VocabularyItem {
  // Extract grade level from ID (e.g., "g3s1-0" -> 3)
  const gradeMatch = item.id.match(/^g(\d+)/);
  const gradeLevel = gradeMatch ? parseInt(gradeMatch[1]) : 5;

  return {
    ...item,
    // Add legacy compatibility fields
    word: item.en,
    phonetic: item.phonics,
    chinese: [item.zh],
    sentence: item.sentences?.[0]?.en || '',
    exampleSentence: item.sentences?.[0]?.en || '',
    exampleChinese: item.sentences?.[0]?.zh || '',
    gradeLevel,
  };
}

/**
 * Deduplicate vocabulary items by ID (keep first occurrence)
 */
function deduplicateById(items: VocabularyItem[]): VocabularyItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
}

/**
 * Validate a vocabulary item structure (checks new format)
 */
function validateVocabularyItem(item: unknown): item is VocabularyItem {
  if (typeof item !== 'object' || item === null) {
    return false;
  }

  const vocab = item as Record<string, unknown>;

  return (
    typeof vocab.id === 'string' &&
    typeof vocab.en === 'string' &&
    typeof vocab.zh === 'string' &&
    typeof vocab.phonics === 'string' &&
    typeof vocab.partOfSpeech === 'string' &&
    typeof vocab.unit === 'string' &&
    Array.isArray(vocab.syllables) &&
    Array.isArray(vocab.phrases) &&
    Array.isArray(vocab.sentences)
  );
}

/**
 * Get vocabulary count for a specific grade
 */
export async function getVocabularyCount(grade: GradeLevel): Promise<number> {
  const vocabulary = await loadGradeVocabulary(grade);
  return vocabulary.length;
}

/**
 * Clear vocabulary cache (useful for testing or reloading)
 */
export function clearVocabularyCache(): void {
  vocabularyCache.clear();
}

/**
 * Load the book manifest (metadata about all available books)
 */
export async function loadBookManifest(): Promise<BookManifest[]> {
  try {
    const manifestModule = await import('@/data/books/manifest.json');
    return manifestModule.default as BookManifest[];
  } catch (error) {
    console.error('Failed to load book manifest:', error);
    return [];
  }
}
