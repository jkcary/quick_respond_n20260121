/**
 * ErrorList component - Display error log table
 */

import React, { useState } from 'react';
import type { ErrorLogEntry } from '@/types';
import { Card, Button } from '@/components/common';
import { formatDate, formatRelativeTime } from '@/utils/formatters';

export interface ErrorListProps {
  errors: ErrorLogEntry[];
  onSelectWord: (wordId: string) => void;
  onFilterChange?: (filter: 'all' | 'unmastered' | 'mastered') => void;
  currentFilter?: 'all' | 'unmastered' | 'mastered';
}

type SortField = 'word' | 'errorCount' | 'lastErrorDate';
type SortOrder = 'asc' | 'desc';

export const ErrorList: React.FC<ErrorListProps> = ({
  errors,
  onSelectWord,
  onFilterChange,
  currentFilter = 'all',
}) => {
  const [sortField, setSortField] = useState<SortField>('lastErrorDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedErrors = [...errors].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case 'word':
        comparison = a.word.word.localeCompare(b.word.word);
        break;
      case 'errorCount':
        comparison = a.errorCount - b.errorCount;
        break;
      case 'lastErrorDate':
        comparison = a.lastErrorDate - b.lastErrorDate;
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  if (errors.length === 0) {
    return (
      <Card className="text-center py-12">
        <svg
          className="w-16 h-16 text-slate-600 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="text-xl font-medium text-slate-400 mb-2">No errors found</h3>
        <p className="text-slate-500">
          {currentFilter === 'unmastered'
            ? 'All error words have been mastered!'
            : currentFilter === 'mastered'
            ? 'No mastered words yet. Keep practicing!'
            : 'Start a test to track words you need to practice.'}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter buttons */}
      {onFilterChange && (
        <div className="flex gap-2">
          <Button
            variant={currentFilter === 'all' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => onFilterChange('all')}
          >
            All ({errors.length})
          </Button>
          <Button
            variant={currentFilter === 'unmastered' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => onFilterChange('unmastered')}
          >
            Unmastered
          </Button>
          <Button
            variant={currentFilter === 'mastered' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => onFilterChange('mastered')}
          >
            Mastered
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th
                className="text-left p-3 text-slate-400 font-medium cursor-pointer hover:text-cyan-400 transition"
                onClick={() => handleSort('word')}
              >
                Word
                {sortField === 'word' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th className="text-left p-3 text-slate-400 font-medium hidden sm:table-cell">
                Chinese
              </th>
              <th
                className="text-center p-3 text-slate-400 font-medium cursor-pointer hover:text-cyan-400 transition"
                onClick={() => handleSort('errorCount')}
              >
                Errors
                {sortField === 'errorCount' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th
                className="text-left p-3 text-slate-400 font-medium cursor-pointer hover:text-cyan-400 transition hidden md:table-cell"
                onClick={() => handleSort('lastErrorDate')}
              >
                Last Error
                {sortField === 'lastErrorDate' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th className="text-center p-3 text-slate-400 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {sortedErrors.map((error) => (
              <tr
                key={error.word.id}
                onClick={() => onSelectWord(error.word.id)}
                className="border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer transition"
              >
                <td className="p-3">
                  <div className="font-medium text-slate-200">{error.word.word}</div>
                  <div className="text-sm text-slate-400 sm:hidden">
                    {error.word.chinese}
                  </div>
                </td>
                <td className="p-3 text-slate-300 hidden sm:table-cell">
                  {error.word.chinese}
                </td>
                <td className="p-3 text-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-900/30 text-red-400 font-medium text-sm">
                    {error.errorCount}
                  </span>
                </td>
                <td className="p-3 text-slate-400 text-sm hidden md:table-cell">
                  {formatRelativeTime(error.lastErrorDate)}
                </td>
                <td className="p-3 text-center">
                  {error.mastered ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-900/30 text-green-400 text-xs font-medium">
                      <svg
                        className="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Mastered
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-900/30 text-yellow-400 text-xs font-medium">
                      Practice
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
