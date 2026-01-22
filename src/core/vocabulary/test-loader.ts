/**
 * Quick test script for vocabulary loader
 * Run this to verify the new vocabulary structure works
 */

import { loadGradeVocabulary, loadVocabularyUpToGrade, getVocabularyCount } from './loader';
import { GradeLevel } from '@/types';

export async function testVocabularyLoader() {
  console.log('=== Testing Vocabulary Loader ===\n');

  // Test loading Grade 3 vocabulary
  try {
    console.log('📚 Loading Grade 3 vocabulary...');
    const grade3Vocab = await loadGradeVocabulary(GradeLevel.Grade3);
    console.log(`✅ Loaded ${grade3Vocab.length} words for Grade 3`);

    if (grade3Vocab.length > 0) {
      const sample = grade3Vocab[0];
      console.log('\n📝 Sample word:');
      console.log(`  ID: ${sample.id}`);
      console.log(`  English: ${sample.en} (${sample.phonics})`);
      console.log(`  Chinese: ${sample.zh}`);
      console.log(`  Part of Speech: ${sample.partOfSpeech}`);
      console.log(`  Unit: ${sample.unit}`);
      console.log(`  Phrases: ${sample.phrases?.length || 0}`);
      console.log(`  Sentences: ${sample.sentences?.length || 0}`);
      console.log('\n  Legacy fields:');
      console.log(`  word: ${sample.word}`);
      console.log(`  phonetic: ${sample.phonetic}`);
      console.log(`  chinese: ${sample.chinese?.join(', ')}`);
    }
  } catch (error) {
    console.error('❌ Failed to load Grade 3:', error);
  }

  // Test loading up to Grade 5
  try {
    console.log('\n📚 Loading all vocabulary up to Grade 5...');
    const upToGrade5 = await loadVocabularyUpToGrade(GradeLevel.Grade5);
    console.log(`✅ Loaded ${upToGrade5.length} total words (Grades 3-5)`);
  } catch (error) {
    console.error('❌ Failed to load up to Grade 5:', error);
  }

  // Test vocabulary counts for all grades
  console.log('\n📊 Vocabulary counts by grade:');
  for (let g = 3; g <= 9; g++) {
    try {
      const count = await getVocabularyCount(g as GradeLevel);
      console.log(`  Grade ${g}: ${count} words`);
    } catch (error) {
      console.log(`  Grade ${g}: Failed to load`);
    }
  }

  console.log('\n=== Test Complete ===');
}

// Export for use in components
export default testVocabularyLoader;
