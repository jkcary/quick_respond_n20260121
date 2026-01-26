/**
 * ErrorList component - Display error log table
 */

import React, { useState } from 'react';
import type { ErrorLogEntry } from '@/types';
import { Card, Button } from '@/components/common';
import { formatRelativeTime } from '@/utils/formatters';
import { useI18n } from '@/i18n';

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
  const { t } = useI18n();
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
          className="w-16 h-16 text-text-muted mx-auto mb-4"
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
        <h3 className="text-xl font-medium text-text-secondary mb-2">{t('errorList.emptyTitle')}</h3>
        <p className="text-text-muted">
          {currentFilter === 'unmastered'
            ? t('errorList.emptyDescUnmastered')
            : currentFilter === 'mastered'
            ? t('errorList.emptyDescMastered')
            : t('errorList.emptyDescAll')}
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
            {t('errorList.filterAll')} ({errors.length})
          </Button>
          <Button
            variant={currentFilter === 'unmastered' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => onFilterChange('unmastered')}
          >
            {t('errorList.filterUnmastered')}
          </Button>
          <Button
            variant={currentFilter === 'mastered' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => onFilterChange('mastered')}
          >
            {t('errorList.filterMastered')}
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-primary">
              <th
                className="text-left p-3 text-text-muted font-medium cursor-pointer hover:text-accent transition"
                onClick={() => handleSort('word')}
              >
                {t('errorList.tableWord')}
                {sortField === 'word' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '^' : 'v'}</span>
                )}
              </th>
              <th className="text-left p-3 text-text-muted font-medium hidden sm:table-cell">
                {t('errorList.tableChinese')}
              </th>
              <th
                className="text-center p-3 text-text-muted font-medium cursor-pointer hover:text-accent transition"
                onClick={() => handleSort('errorCount')}
              >
                {t('errorList.tableErrors')}
                {sortField === 'errorCount' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '^' : 'v'}</span>
                )}
              </th>
              <th
                className="text-left p-3 text-text-muted font-medium cursor-pointer hover:text-accent transition hidden md:table-cell"
                onClick={() => handleSort('lastErrorDate')}
              >
                {t('errorList.tableLastError')}
                {sortField === 'lastErrorDate' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '^' : 'v'}</span>
                )}
              </th>
              <th className="text-center p-3 text-text-muted font-medium">{t('errorList.tableStatus')}</th>
            </tr>
          </thead>
          <tbody>
            {sortedErrors.map((error) => (
              <tr
                key={error.word.id}
                onClick={() => onSelectWord(error.word.id)}
                className="border-b border-border-primary hover:bg-bg-tertiary cursor-pointer transition"
              >
                <td className="p-3">
                  <div className="font-semibold text-word-english">{error.word.word}</div>
                  <div className="text-sm text-word-chinese sm:hidden">
                    {error.word.chinese}
                  </div>
                </td>
                <td className="p-3 text-word-chinese hidden sm:table-cell">
                  {error.word.chinese}
                </td>
                <td className="p-3 text-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-error-muted text-error font-medium text-sm">
                    {error.errorCount}
                  </span>
                </td>
                <td className="p-3 text-text-muted text-sm hidden md:table-cell">
                  {formatRelativeTime(error.lastErrorDate)}
                </td>
                <td className="p-3 text-center">
                  {error.mastered ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success-muted text-success text-xs font-medium">
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
                      {t('errorList.statusMastered')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-warning-muted text-warning text-xs font-medium">
                      {t('errorList.statusPractice')}
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
