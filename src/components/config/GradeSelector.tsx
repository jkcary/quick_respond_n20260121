/**
 * GradeSelector component - Grade level dropdown with word count
 */

import React, { useState, useEffect } from 'react';
import type { GradeLevel } from '@/types';
import { Select } from '@/components/common';
import { getVocabularyCount } from '@/core/vocabulary';

export interface GradeSelectorProps {
  value: GradeLevel;
  onChange: (grade: GradeLevel) => void;
  disabled?: boolean;
}

const GRADE_OPTIONS: Array<{ value: GradeLevel; label: string }> = [
  { value: 3, label: 'Grade 3' },
  { value: 4, label: 'Grade 4' },
  { value: 5, label: 'Grade 5' },
  { value: 6, label: 'Grade 6' },
  { value: 7, label: 'Grade 7' },
  { value: 8, label: 'Grade 8' },
  { value: 9, label: 'Grade 9' },
];

export const GradeSelector: React.FC<GradeSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [wordCounts, setWordCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);

  // Load word counts for all grades
  useEffect(() => {
    const loadCounts = async () => {
      setLoading(true);
      const counts: Record<number, number> = {};

      for (const option of GRADE_OPTIONS) {
        try {
          const count = await getVocabularyCount(option.value);
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
    const grade = parseInt(e.target.value) as GradeLevel;
    onChange(grade);
  };

  const currentCount = wordCounts[value] || 0;

  return (
    <div className="space-y-2">
      <Select
        label="Grade Level"
        value={value}
        onChange={handleChange}
        disabled={disabled || loading}
        options={GRADE_OPTIONS.map((opt) => ({
          value: opt.value,
          label: `${opt.label} ${wordCounts[opt.value] ? `(${wordCounts[opt.value]} words)` : ''}`,
        }))}
        helperText={
          loading
            ? 'Loading word counts...'
            : `Vocabulary includes all words up to and including Grade ${value} (${currentCount} words total)`
        }
        fullWidth
      />

      {/* Visual grade indicator */}
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">Difficulty Level:</span>
          <span className="text-cyan-400 font-medium">
            {value <= 4 ? 'Beginner' : value <= 6 ? 'Intermediate' : 'Advanced'}
          </span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
          <div
            className="h-2 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-300"
            style={{ width: `${((value - 3) / 6) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
