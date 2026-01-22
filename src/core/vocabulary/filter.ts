/**
 * Vocabulary filter - Filter and search vocabulary items
 */

import type { VocabularyItem, GradeLevel, ErrorLog } from '@/types';

export interface FilterOptions {
  gradeLevel?: GradeLevel;
  searchText?: string;
  excludeMastered?: boolean;
  errorLog?: ErrorLog;
}

/**
 * Filter vocabulary items based on criteria
 */
export function filterVocabulary(
  vocabulary: VocabularyItem[],
  options: FilterOptions
): VocabularyItem[] {
  let filtered = [...vocabulary];

  // Filter by grade level
  if (options.gradeLevel !== undefined) {
    filtered = filtered.filter((word) => word.gradeLevel <= options.gradeLevel!);
  }

  // Filter by search text (case-insensitive)
  if (options.searchText && options.searchText.trim().length > 0) {
    const searchLower = options.searchText.toLowerCase().trim();
    filtered = filtered.filter(
      (word) =>
        word.word.toLowerCase().includes(searchLower) ||
        word.chinese.toLowerCase().includes(searchLower) ||
        word.exampleSentence.toLowerCase().includes(searchLower)
    );
  }

  // Exclude mastered words
  if (options.excludeMastered && options.errorLog) {
    const masteredIds = new Set(
      Object.entries(options.errorLog.entries)
        .filter(([, entry]) => entry.mastered)
        .map(([id]) => id)
    );
    filtered = filtered.filter((word) => !masteredIds.has(word.id));
  }

  return filtered;
}

/**
 * Filter words by specific grade level (exact match)
 */
export function filterByExactGrade(
  vocabulary: VocabularyItem[],
  gradeLevel: GradeLevel
): VocabularyItem[] {
  return vocabulary.filter((word) => word.gradeLevel === gradeLevel);
}

/**
 * Filter words by grade range
 */
export function filterByGradeRange(
  vocabulary: VocabularyItem[],
  minGrade: GradeLevel,
  maxGrade: GradeLevel
): VocabularyItem[] {
  return vocabulary.filter(
    (word) => word.gradeLevel >= minGrade && word.gradeLevel <= maxGrade
  );
}

/**
 * Search vocabulary by word or Chinese
 */
export function searchVocabulary(
  vocabulary: VocabularyItem[],
  query: string
): VocabularyItem[] {
  if (!query || query.trim().length === 0) {
    return vocabulary;
  }

  const queryLower = query.toLowerCase().trim();
  return vocabulary.filter(
    (word) =>
      word.word.toLowerCase().includes(queryLower) ||
      word.chinese.includes(queryLower) ||
      word.phonetic.toLowerCase().includes(queryLower)
  );
}

/**
 * Get mastered words from error log
 */
export function getMasteredWords(
  vocabulary: VocabularyItem[],
  errorLog: ErrorLog
): VocabularyItem[] {
  const masteredIds = new Set(
    Object.entries(errorLog.entries)
      .filter(([, entry]) => entry.mastered)
      .map(([id]) => id)
  );

  return vocabulary.filter((word) => masteredIds.has(word.id));
}

/**
 * Get unmastered words from error log
 */
export function getUnmasteredWords(
  vocabulary: VocabularyItem[],
  errorLog: ErrorLog
): VocabularyItem[] {
  const unmasteredIds = new Set(
    Object.entries(errorLog.entries)
      .filter(([, entry]) => !entry.mastered)
      .map(([id]) => id)
  );

  return vocabulary.filter((word) => unmasteredIds.has(word.id));
}

/**
 * Sort vocabulary by different criteria
 */
export function sortVocabulary(
  vocabulary: VocabularyItem[],
  sortBy: 'word' | 'gradeLevel' | 'random'
): VocabularyItem[] {
  const sorted = [...vocabulary];

  switch (sortBy) {
    case 'word':
      return sorted.sort((a, b) => a.word.localeCompare(b.word));
    case 'gradeLevel':
      return sorted.sort((a, b) => a.gradeLevel - b.gradeLevel);
    case 'random':
      return sorted.sort(() => Math.random() - 0.5);
    default:
      return sorted;
  }
}
