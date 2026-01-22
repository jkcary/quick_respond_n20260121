/**
 * Review Page - Error log review with VST cards
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useErrorStore } from '@/store/errorStore';
import { Card, Button } from '@/components/common';
import { ErrorList, VSTCard, ExportPanel } from '@/components/review';

const ReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    loadErrorLog,
    getFilteredErrors,
    filter,
    setFilter,
    markAsMastered,
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

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-cyan-400 mb-2">Error Review</h1>
            <p className="text-slate-400">Review and master your error words</p>
          </div>
          <Button variant="ghost" onClick={() => navigate('/')}>
            ← Back to Home
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <div className="text-center">
              <div className="text-4xl font-bold text-red-400 mb-2">{totalErrors}</div>
              <div className="text-sm text-slate-400">Total Errors</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-400 mb-2">
                {unmasteredCount}
              </div>
              <div className="text-sm text-slate-400">To Practice</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400 mb-2">
                {masteredCount}
              </div>
              <div className="text-sm text-slate-400">Mastered</div>
            </div>
          </Card>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Error list */}
          <div className="lg:col-span-2">
            <Card>
              <h2 className="text-xl font-semibold text-slate-200 mb-4">
                Error Log
              </h2>
              <ErrorList
                errors={errors}
                onSelectWord={handleSelectWord}
                onFilterChange={setFilter}
                currentFilter={filter}
              />
            </Card>
          </div>

          {/* Export panel */}
          <div>
            <Card>
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

export default ReviewPage;
