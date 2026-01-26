/**
 * Error Log Page - Dedicated error log with VST review
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useErrorStore } from '@/store/errorStore';
import { Card, Button } from '@/components/common';
import { ErrorList, VSTCard, ExportPanel } from '@/components/review';
import { useI18n } from '@/i18n';

const ErrorLogPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const {
    loadErrorLog,
    getFilteredErrors,
    filter,
    setFilter,
    markAsMastered,
    clearAll,
    getTotalErrorCount,
    getUnmasteredCount,
    getMasteredCount,
    errorLog,
  } = useErrorStore();

  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);

  const errors = getFilteredErrors();
  const selectedError = selectedWordId
    ? errorLog.entries[selectedWordId]
    : null;

  // Load error log on mount
  useEffect(() => {
    loadErrorLog();
  }, [loadErrorLog]);

  const handleSelectWord = (wordId: string) => {
    setSelectedWordId(wordId);
  };

  const handleCloseVST = () => {
    setSelectedWordId(null);
  };

  const handleMaster = async () => {
    if (selectedWordId) {
      await markAsMastered(selectedWordId);
    }
  };

  const handleNext = () => {
    if (!selectedError) return;

    const currentIndex = errors.findIndex((e) => e.word.id === selectedWordId);
    if (currentIndex < errors.length - 1) {
      setSelectedWordId(errors[currentIndex + 1].word.id);
    }
  };

  const handlePrev = () => {
    if (!selectedError) return;

    const currentIndex = errors.findIndex((e) => e.word.id === selectedWordId);
    if (currentIndex > 0) {
      setSelectedWordId(errors[currentIndex - 1].word.id);
    }
  };

  const totalErrors = getTotalErrorCount();
  const unmasteredCount = getUnmasteredCount();
  const masteredCount = getMasteredCount();

  useEffect(() => {
    if (filter === 'mastered') {
      setFilter('all');
    }
  }, [filter, setFilter]);

  const handleClearAll = async () => {
    if (totalErrors === 0) {
      return;
    }
    const confirmed = window.confirm(t('errorLog.confirmClear'));
    if (!confirmed) {
      return;
    }
    await clearAll();
    setSelectedWordId(null);
  };

  const handleFilterChange = (nextFilter: 'all' | 'unmastered' | 'mastered') => {
    if (nextFilter === 'mastered') {
      navigate('/mastered');
      return;
    }

    setFilter(nextFilter);
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-accent mb-2">{t('errorLog.title')}</h1>
            <p className="text-text-muted">{t('errorLog.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={handleClearAll}
              disabled={totalErrors === 0}
            >
              {t('errorLog.clear')}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="animate-slide-up">
            <div className="text-center">
              <div className="text-4xl font-bold text-error mb-2">{totalErrors}</div>
              <div className="text-sm text-text-muted">{t('errorLog.statsTotal')}</div>
            </div>
          </Card>
          <Card className="animate-slide-up">
            <div className="text-center">
              <div className="text-4xl font-bold text-warning mb-2">
                {unmasteredCount}
              </div>
              <div className="text-sm text-text-muted">{t('errorLog.statsToPractice')}</div>
            </div>
          </Card>
          <Card className="animate-slide-up">
            <div className="text-center">
              <div className="text-4xl font-bold text-success mb-2">
                {masteredCount}
              </div>
              <div className="text-sm text-text-muted">{t('errorLog.statsMastered')}</div>
            </div>
          </Card>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Error list */}
          <div className="lg:col-span-2">
            <Card className="animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-text-primary">{t('errorLog.title')}</h2>
              </div>
              <ErrorList
                errors={errors}
                onSelectWord={handleSelectWord}
                onFilterChange={handleFilterChange}
                currentFilter={filter}
              />
            </Card>
          </div>

          {/* Export panel */}
          <div>
            <Card className="animate-slide-up">
              <ExportPanel errorLog={errorLog} />
            </Card>
          </div>
        </div>

        {/* VST Card Modal */}
        {selectedError && (
          <VSTCard
            errorEntry={selectedError}
            onMaster={handleMaster}
            onClose={handleCloseVST}
            onNext={
              errors.findIndex((e) => e.word.id === selectedWordId) < errors.length - 1
                ? handleNext
                : undefined
            }
            onPrev={
              errors.findIndex((e) => e.word.id === selectedWordId) > 0
                ? handlePrev
                : undefined
            }
          />
        )}
      </div>
    </div>
  );
};

export default ErrorLogPage;
