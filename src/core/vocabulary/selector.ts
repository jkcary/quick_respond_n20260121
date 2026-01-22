/**
 * Vocabulary selector - Smart word selection algorithm
 * Priority: Error log words (unmastered) → Random new words
 */

import type { VocabularyItem, GradeLevel, GradeBook, ErrorLog } from '@/types';
import { loadVocabularyUpToGradeBook, loadVocabularyUpToGrade } from './loader';

export interface SelectionOptions {
  count: number;
  gradeLevel?: GradeLevel;
  gradeBook?: GradeBook;
  errorLog: ErrorLog;
  excludeMastered?: boolean;
  prioritizeErrors?: boolean;
}

/**
 * Select words for a test session
 * Priority order:
 * 1. Unmastered words from error log
 * 2. Random new words (not in error log)
 */
export async function selectWords(options: SelectionOptions): Promise<VocabularyItem[]> {
  const {
    count,
    gradeLevel,
    gradeBook,
    errorLog,
    excludeMastered = true,
    prioritizeErrors = true,
  } = options;

  if (!gradeBook && gradeLevel === undefined) {
    throw new Error('Grade selection is required');
  }

  const allVocabulary = gradeBook
    ? await loadVocabularyUpToGradeBook(gradeBook)
    : await loadVocabularyUpToGrade(gradeLevel as GradeLevel);

  if (allVocabulary.length === 0) {
    const selectionLabel = gradeBook ?? `grade ${gradeLevel}`;
    throw new Error(`No vocabulary available for ${selectionLabel}`);
  }

  // Get unmastered error words
  const errorWords = getUnmasteredErrorWords(errorLog, allVocabulary, excludeMastered);

  // Get new words (not in error log)
  const newWords = getNewWords(allVocabulary, errorLog);

  // Select words based on priority
  const selectedWords: VocabularyItem[] = [];

  if (prioritizeErrors && errorWords.length > 0) {
    // Add error words first (up to count)
    const errorCount = Math.min(count, errorWords.length);
    const shuffledErrors = shuffleArray([...errorWords]);
    selectedWords.push(...shuffledErrors.slice(0, errorCount));
  }

  // Fill remaining slots with new words
  const remainingCount = count - selectedWords.length;
  if (remainingCount > 0 && newWords.length > 0) {
    const shuffledNew = shuffleArray([...newWords]);
    selectedWords.push(...shuffledNew.slice(0, remainingCount));
  }

  // If we still don't have enough words, use any available vocabulary
  if (selectedWords.length < count) {
    const availableWords = allVocabulary.filter(
      (word) => !selectedWords.some((selected) => selected.id === word.id)
    );
    const shuffledAvailable = shuffleArray(availableWords);
    const neededCount = count - selectedWords.length;
    selectedWords.push(...shuffledAvailable.slice(0, neededCount));
  }

  // Ensure no duplicates and return exactly count words
  const uniqueWords = deduplicateById(selectedWords);
  return uniqueWords.slice(0, count);
}

/**
 * Get unmastered words from error log
 */
function getUnmasteredErrorWords(
  errorLog: ErrorLog,
  vocabulary: VocabularyItem[],
  excludeMastered: boolean
): VocabularyItem[] {
  const errorEntries = Object.values(errorLog.entries);

  const unmasteredEntries = excludeMastered
    ? errorEntries.filter((entry) => !entry.mastered)
    : errorEntries;

  // Match error entries with vocabulary items
  const errorWords: VocabularyItem[] = [];
  for (const entry of unmasteredEntries) {
    const word = vocabulary.find((v) => v.id === entry.word.id);
    if (word) {
      errorWords.push(word);
    }
  }

  return errorWords;
}

/**
 * Get words that are not in error log
 */
function getNewWords(vocabulary: VocabularyItem[], errorLog: ErrorLog): VocabularyItem[] {
  const errorWordIds = new Set(Object.keys(errorLog.entries));
  return vocabulary.filter((word) => !errorWordIds.has(word.id));
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Deduplicate by ID
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
 * Select a single random word
 */
export async function selectRandomWord(
  gradeSelection: GradeLevel | GradeBook
): Promise<VocabularyItem> {
  const vocabulary =
    typeof gradeSelection === 'string'
      ? await loadVocabularyUpToGradeBook(gradeSelection)
      : await loadVocabularyUpToGrade(gradeSelection);

  if (vocabulary.length === 0) {
    const selectionLabel =
      typeof gradeSelection === 'string' ? gradeSelection : `grade ${gradeSelection}`;
    throw new Error(`No vocabulary available for ${selectionLabel}`);
  }

  const randomIndex = Math.floor(Math.random() * vocabulary.length);
  return vocabulary[randomIndex];
}
