/**
 * ScorePanel component - Session progress header
 */

import React from 'react';
import type { TestSession } from '@/types';
import { ProgressBar } from '@/components/common';
import { formatScore } from '@/utils/formatters';

export interface ScorePanelProps {
  session: TestSession;
  currentWordIndex: number;
}

export const ScorePanel: React.FC<ScorePanelProps> = ({
  session,
  currentWordIndex,
}) => {
  const totalWords = session.words.length;
  const currentWord = Math.min(currentWordIndex + 1, totalWords);
  const completedWords = session.results.length;
  const correctCount = session.results.filter((r) => r.correct).length;
  const progress = totalWords > 0 ? (completedWords / totalWords) * 100 : 0;

  return (
    <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 p-4 shadow-lg">
      <div className="max-w-4xl mx-auto space-y-3">
        {/* Progress bar */}
        <ProgressBar
          value={progress}
          max={100}
          label={`Word ${currentWord}/${totalWords}`}
          color="cyan"
          animated
        />

        {/* Score stats */}
        <div className="flex items-center justify-between text-sm">
          {/* Current position */}
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-cyan-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="text-slate-300">
              Progress: <span className="text-cyan-400 font-medium">{Math.round(progress)}%</span>
            </span>
          </div>

          {/* Score */}
          {completedWords > 0 && (
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-green-400"
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
              <span className="text-slate-300">
                Score: <span className="text-green-400 font-medium">{formatScore(correctCount, completedWords)}</span>
              </span>
            </div>
          )}
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-800 rounded-lg p-2">
            <div className="text-2xl font-bold text-cyan-400">{totalWords}</div>
            <div className="text-xs text-slate-400">Total</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-2">
            <div className="text-2xl font-bold text-green-400">{correctCount}</div>
            <div className="text-xs text-slate-400">Correct</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-2">
            <div className="text-2xl font-bold text-red-400">{completedWords - correctCount}</div>
            <div className="text-xs text-slate-400">Errors</div>
          </div>
        </div>
      </div>
    </div>
  );
};
