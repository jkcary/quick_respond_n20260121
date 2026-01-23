/**
 * GradeSelector component - Grade level dropdown with word count
 */

import React, { useState, useEffect } from 'react';
import type { GradeBook } from '@/types';
import { createGradeBook, getGradeBookLabel, parseGradeBook } from '@/types';
import { Select } from '@/components/common';
import { getVocabularyCountForGradeBook } from '@/core/vocabulary';
import { useI18n } from '@/i18n';

export interface GradeSelectorProps {
  value: GradeBook;
  onChange: (gradeBook: GradeBook) => void;
  disabled?: boolean;
}

const GRADE_OPTIONS: Array<{ value: GradeBook; label: string }> = [
  createGradeBook(3, 1),
  createGradeBook(3, 2),
  createGradeBook(4, 1),
  createGradeBook(4, 2),
  createGradeBook(5, 1),
  createGradeBook(5, 2),
  createGradeBook(6, 1),
  createGradeBook(6, 2),
  createGradeBook(7, 1),
  createGradeBook(7, 2),
  createGradeBook(8, 1),
  createGradeBook(8, 2),
  createGradeBook(9, 3),
].map((value) => ({
  value,
  label: getGradeBookLabel(value),
}));

export const GradeSelector: React.FC<GradeSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const { t } = useI18n();
  const [wordCounts, setWordCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Load word counts for all grade books
  useEffect(() => {
    const loadCounts = async () => {
      setLoading(true);
      const counts: Record<string, number> = {};

      for (const option of GRADE_OPTIONS) {
        try {
          const count = await getVocabularyCountForGradeBook(option.value);
          counts[option.value] = count;
        } catch {
          counts[option.value] = 0;
        }
      }

      setWordCounts(counts);
      setLoading(false);
    };

    loadCounts();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const gradeBook = e.target.value as GradeBook;
    onChange(gradeBook);
  };

  const currentCount = wordCounts[value] || 0;
  const selectedLabel = GRADE_OPTIONS.find((opt) => opt.value === value)?.label ?? value;
  const { grade } = parseGradeBook(value);

  return (
    <div className="space-y-2">
      <Select
        label={t('settings.gradeLabel')}
        value={value}
        onChange={handleChange}
        disabled={disabled || loading}
        options={GRADE_OPTIONS.map((opt) => ({
          value: opt.value,
          label: `${opt.label} ${wordCounts[opt.value] ? t('settings.gradeWordsSuffix', { count: wordCounts[opt.value] }) : ''}`,
        }))}
        helperText={
          loading
            ? t('settings.gradeLoading')
            : t('settings.gradeHelper', { label: selectedLabel, count: currentCount })
        }
        fullWidth
      />

      {/* Visual grade indicator */}
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">{t('settings.difficultyLabel')}</span>
          <span className="text-cyan-400 font-medium">
            {grade <= 4
              ? t('settings.difficultyBeginner')
              : grade <= 6
              ? t('settings.difficultyIntermediate')
              : t('settings.difficultyAdvanced')}
          </span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
          <div
            className="h-2 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-300"
            style={{ width: `${((grade - 3) / 6) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
