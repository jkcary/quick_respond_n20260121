/**
 * ResultFeedback component - Show judgment result with visual feedback
 */

import React, { useEffect } from 'react';
import type { TestResult, VocabularyItem } from '@/types';
import { Card, Button } from '@/components/common';
import { useI18n } from '@/i18n';

export interface ResultFeedbackProps {
  result: TestResult;
  word: VocabularyItem;
  onNext: () => void;
  autoAdvance?: boolean;
  autoAdvanceDelay?: number;
}

export const ResultFeedback: React.FC<ResultFeedbackProps> = ({
  result,
  word,
  onNext,
  autoAdvance = true,
  autoAdvanceDelay = 1500,
}) => {
  const { t } = useI18n();
  const isCorrect = result.correct;

  // Auto-advance for correct answers
  useEffect(() => {
    if (isCorrect && autoAdvance) {
      const timer = setTimeout(() => {
        onNext();
      }, autoAdvanceDelay);

      return () => clearTimeout(timer);
    }
  }, [isCorrect, autoAdvance, autoAdvanceDelay, onNext]);

  return (
    <Card
      className={`text-center transition-all duration-300 ${
        isCorrect
          ? 'ring-4 ring-green-500 bg-green-900/20'
          : 'ring-4 ring-red-500 bg-red-900/20'
      }`}
    >
      {/* Result icon */}
      <div className="mb-6">
        {isCorrect ? (
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500 text-white animate-scale-in">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        ) : (
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500 text-white animate-shake">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Result message */}
      <h2
        className={`text-3xl font-bold mb-4 ${
          isCorrect ? 'text-green-400' : 'text-red-400'
        }`}
      >
        {isCorrect ? t('test.feedbackCorrect') : t('test.feedbackIncorrect')}
      </h2>

      {/* English word */}
      <p className="text-xl text-slate-300 mb-2">
        {word.word} <span className="text-slate-400">{word.phonetic}</span>
      </p>

      {/* User input vs correct answer */}
      <div className="space-y-2 mb-6">
        {!isCorrect && result.userInput && (
          <div className="text-red-400">
            <span className="text-slate-400">{t('test.feedbackYourAnswer')}:</span> {result.userInput}
          </div>
        )}

        <div className={isCorrect ? 'text-green-400' : 'text-cyan-400'}>
          <span className="text-slate-400">
            {isCorrect ? t('test.feedbackTranslation') : t('test.feedbackCorrectAnswer')}
          </span>{' '}
          {result.correction}
        </div>
      </div>

      {/* Example sentence (only show for incorrect) */}
      {!isCorrect && word.exampleSentence && (
        <div className="border-t border-slate-700 pt-4 mb-6">
          <p className="text-sm text-slate-400 mb-2">{t('test.feedbackExample')}</p>
          <p className="text-slate-300">{word.exampleSentence}</p>
          <p className="text-slate-400 text-sm mt-1">{word.exampleChinese}</p>
        </div>
      )}

      {/* Next button (only show for incorrect, correct auto-advances) */}
      {!isCorrect && (
        <Button onClick={onNext} variant="primary" size="lg" fullWidth>
          {t('test.feedbackNextWord')}
        </Button>
      )}

      {/* Auto-advance indicator for correct */}
      {isCorrect && autoAdvance && (
        <p className="text-slate-400 text-sm animate-pulse">
          {t('test.feedbackAutoAdvance')}
        </p>
      )}
    </Card>
  );
};
