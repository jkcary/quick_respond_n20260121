/**
 * TestPage component - Main test orchestrator
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTestStore } from '@/store/testStore';
import { useAppStore } from '@/store/useAppStore';
import { WordCard } from './WordCard';
import { VoiceInput } from './VoiceInput';
import { ResultFeedback } from './ResultFeedback';
import { ScorePanel } from './ScorePanel';
import { Button, Modal, LoadingSpinner } from '@/components/common';
import { LLMGateway } from '@/core/llm';
import { formatScore, formatDuration } from '@/utils/formatters';
import { getGradeBookForGrade } from '@/types';
import type { TestSession, VocabularyItem } from '@/types';

export const TestPage: React.FC = () => {
  const navigate = useNavigate();
  const config = useAppStore((state) => state.config);
  const {
    currentSession,
    currentWordIndex,
    isJudging,
    lastResult,
    startTest,
    submitAnswer,
    nextWord,
    endTest,
    setJudging,
    getCurrentWord,
    resetTest,
  } = useTestStore();

  const [showSummary, setShowSummary] = useState(false);
  const [completedSession, setCompletedSession] = useState<TestSession | null>(null);
  const [isSkipping, setIsSkipping] = useState(false);
  const [gateway] = useState(() => {
    if (config.apiKey) {
      return new LLMGateway({
        provider: config.apiProvider === 'deepseek' ? 'deepseek' : 'openai',
        apiKey: config.apiKey,
        modelName: config.apiProvider === 'deepseek' ? 'deepseek-chat' : 'gpt-3.5-turbo',
        enabled: true,
      });
    }
    return null;
  });

  const currentWord = getCurrentWord();
  const summarySession = completedSession ?? currentSession;
  const summaryCorrect = summarySession
    ? summarySession.results.filter((result) => result.correct).length
    : 0;
  const summaryTotal = summarySession ? summarySession.results.length : 0;
  const summaryScore = {
    correct: summaryCorrect,
    total: summaryTotal,
    percentage: summaryTotal > 0 ? Math.round((summaryCorrect / summaryTotal) * 100) : 0,
  };
  const summaryDuration = summarySession
    ? summarySession.endTime
      ? summarySession.endTime - summarySession.startTime
      : Date.now() - summarySession.startTime
    : 0;
  const shouldShowSummary = Boolean(showSummary && summarySession);

  // Start test on mount
  useEffect(() => {
    if (!currentSession) {
      const fallbackGradeBook = getGradeBookForGrade(config.gradeLevel || 5);
      const gradeSelection = config.gradeBook ?? fallbackGradeBook;
      startTest(gradeSelection);
    }
  }, []);

  // Show summary when test ends
  useEffect(() => {
    if (currentSession?.endTime) {
      setCompletedSession(currentSession);
      setShowSummary(true);
    }
  }, [currentSession?.endTime]);

  

  const handleSubmit = async (input: string) => {
    if (!currentWord || isJudging) {
      return;
    }

    const trimmedInput = input.trim();
    if (trimmedInput.length === 0) {
      setIsSkipping(true);
      try {
        await submitAnswer('', {
          correct: false,
          correction: getDefaultCorrection(currentWord),
        });
      } finally {
        setIsSkipping(false);
      }
      return;
    }

    if (!gateway) {
      return;
    }

    setJudging(true);

    try {
      const judgment = await gateway.judge(currentWord.word, trimmedInput);
      await submitAnswer(trimmedInput, judgment);
    } catch (error) {
      console.error('Judgment failed:', error);
      await submitAnswer(trimmedInput, {
        correct: false,
        correction: 'System error, please try again',
      });
    } finally {
      setJudging(false);
    }
  };

  const handleEndTest = () => {
    endTest();
  };

  const getDefaultCorrection = (word: VocabularyItem): string => {
    return Array.isArray(word.chinese) ? word.chinese.filter(Boolean).join('; ') : '';
  };

  const handleNextWord = async () => {
    if (!currentWord || isJudging || lastResult || isSkipping) {
      return;
    }

    setIsSkipping(true);
    try {
      await submitAnswer('', {
        correct: false,
        correction: getDefaultCorrection(currentWord),
      });
    } finally {
      setIsSkipping(false);
    }
  };

  const handleCloseSummary = () => {
    setShowSummary(false);
    setCompletedSession(null);
    resetTest();
    navigate('/');
  };

  const handleReturnHome = () => {
    handleCloseSummary();
  };

  const handleRetry = () => {
    setShowSummary(false);
    setCompletedSession(null);
    const fallbackGradeBook = getGradeBookForGrade(config.gradeLevel || 5);
    const gradeSelection = config.gradeBook ?? fallbackGradeBook;
    startTest(gradeSelection);
  };

  const summaryModal = shouldShowSummary ? (
    <Modal
      isOpen={showSummary}
      onClose={handleCloseSummary}
      title="Test Summary"
      closeOnBackdrop={false}
      size="lg"
    >
      <div className="space-y-6">
        {/* Score */}
        <div className="text-center">
          <div className="text-6xl font-bold text-cyan-400 mb-2">
            {summaryScore.percentage}%
          </div>
          <div className="text-xl text-slate-300">
            {formatScore(summaryScore.correct, summaryScore.total)}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-700 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-green-400">{summaryScore.correct}</div>
            <div className="text-sm text-slate-400">Correct Answers</div>
          </div>
          <div className="bg-slate-700 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-red-400">
              {summaryScore.total - summaryScore.correct}
            </div>
            <div className="text-sm text-slate-400">Errors</div>
          </div>
          <div className="bg-slate-700 rounded-lg p-4 text-center col-span-2">
            <div className="text-2xl font-bold text-cyan-400">
              {formatDuration(summaryDuration)}
            </div>
            <div className="text-sm text-slate-400">Time Taken</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Button variant="ghost" onClick={handleCloseSummary} fullWidth>
            Close
          </Button>
          <Button variant="secondary" onClick={handleReturnHome} fullWidth>
            Return Home
          </Button>
          <Button variant="primary" onClick={handleRetry} fullWidth>
            Try Again
          </Button>
        </div>
      </div>
    </Modal>
  ) : null;

  if (!currentSession || !currentWord) {
    return (
      <div className="min-h-screen bg-slate-900">
        {!shouldShowSummary && (
          <div className="flex items-center justify-center min-h-screen">
            <LoadingSpinner size="lg" message="Loading test..." />
          </div>
        )}
        {summaryModal}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Score panel */}
      <ScorePanel session={currentSession} currentWordIndex={currentWordIndex} />

      {/* Main content */}
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Word card or result feedback */}
        {lastResult ? (
          <ResultFeedback
            result={currentSession.results[currentSession.results.length - 1]}
            word={currentWord}
            onNext={nextWord}
          />
        ) : (
          <WordCard
            word={currentWord}
            autoPlay={config.autoPlayPronunciation}
          />
        )}

        {/* Input (only show if no result yet) */}
        {!lastResult && (
          <VoiceInput
            onSubmit={handleSubmit}
            disabled={isJudging}
            placeholder="Enter Chinese translation..."
            wordId={currentWord.id}
          />
        )}

        {/* Loading overlay */}
        {isJudging && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <LoadingSpinner size="lg" message="Judging your answer..." />
          </div>
        )}

        {/* End test button */}
        <div className="flex justify-center pt-4">
          <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleEndTest}>
            End Test
          </Button>
          <Button
            variant="primary"
            onClick={handleNextWord}
            disabled={isJudging || Boolean(lastResult) || isSkipping}
          >
            Next
          </Button>
          </div>
        </div>
      </div>

      {/* Summary modal */}
      {summaryModal}
    </div>
  );
};
