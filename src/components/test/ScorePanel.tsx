/**
 * ScorePanel component - Session progress header
 */

import React from 'react';
import type { TestSession } from '@/types';
import { ProgressBar } from '@/components/common';
import { useI18n } from '@/i18n';

export interface ScorePanelProps {
  session: TestSession;
  currentWordIndex: number;
  batchSize: number;
  filledCount?: number;
}

export const ScorePanel: React.FC<ScorePanelProps> = ({
  session,
  currentWordIndex,
  batchSize,
  filledCount = 0,
}) => {
  const { t } = useI18n();
  const totalWords = session.words.length;
  const completedWords = session.results.length;
  const progress = totalWords > 0 ? (completedWords / totalWords) * 100 : 0;
  const totalBatches = Math.max(1, Math.ceil(totalWords / batchSize));
  const currentBatch = Math.min(totalBatches, Math.floor(currentWordIndex / batchSize) + 1);
  const remainingWords = Math.max(totalWords - completedWords, 0);
  const batchTotal = Math.min(batchSize, Math.max(totalWords - currentWordIndex, 0));

  return (
    <div className="sticky top-0 z-10 bg-bg-secondary/95 backdrop-blur-sm border-b border-border-primary p-4 shadow-lg">
      <div className="max-w-4xl mx-auto space-y-3">
        {/* Progress bar */}
        <ProgressBar
          value={progress}
          max={100}
          label={t('test.progressLabel', {
            currentBatch,
            totalBatches,
            completed: completedWords,
            total: totalWords,
          })}
          color="cyan"
          animated
        />

        {/* Mini stats */}
        <div className="grid grid-cols-1 gap-2 text-center sm:grid-cols-3">
          <div className="bg-bg-tertiary rounded-lg p-2">
            <div className="text-2xl font-bold text-accent">{completedWords}</div>
            <div className="text-xs text-text-muted">{t('test.progressCompleted')}</div>
          </div>
          <div className="bg-bg-tertiary rounded-lg p-2">
            <div className="text-2xl font-bold text-text-primary">{remainingWords}</div>
            <div className="text-xs text-text-muted">{t('test.progressRemaining')}</div>
          </div>
          <div className="bg-bg-tertiary rounded-lg p-2">
            <div className="text-2xl font-bold text-warning">
              {batchTotal > 0 ? Math.min(filledCount, batchTotal) : 0}/{batchTotal}
            </div>
            <div className="text-xs text-text-muted">{t('test.progressBatch')}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
