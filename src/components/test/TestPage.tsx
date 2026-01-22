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
    getProgress,
    getScore,
  } = useTestStore();

  const [showSummary, setShowSummary] = useState(false);
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
  const progress = getProgress();
  const score = getScore();

  // Start test on mount
  useEffect(() => {
    if (!currentSession) {
      const gradeLevel = config.gradeLevel || 5;
      startTest(gradeLevel as any, 5);
    }
  }, []);

  // Show summary when test ends
  useEffect(() => {
    if (currentSession?.endTime) {
      setShowSummary(true);
    }
  }, [currentSession?.endTime]);

  const handleSubmit = async (input: string) => {
    if (!currentWord || !gateway || isJudging) {
      return;
    }

    setJudging(true);

    try {
      const judgment = await gateway.judge(currentWord.word, input);
      await submitAnswer(input, judgment);
    } catch (error) {
      console.error('Judgment failed:', error);
      await submitAnswer(input, {
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

  const handleCloseSummary = () => {
    setShowSummary(false);
    navigate('/');
  };

  const handleRetry = () => {
    setShowSummary(false);
    const gradeLevel = config.gradeLevel || 5;
    startTest(gradeLevel as any, 5);
  };

  if (!currentSession || !currentWord) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" message="Loading test..." />
      </div>
    );
  }

  const duration = currentSession.endTime
    ? currentSession.endTime - currentSession.startTime
    : Date.now() - currentSession.startTime;

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
          <Button variant="ghost" onClick={handleEndTest}>
            End Test
          </Button>
        </div>
      </div>

      {/* Summary modal */}
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
              {score.percentage}%
            </div>
            <div className="text-xl text-slate-300">
              {formatScore(score.correct, score.total)}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-700 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-400">{score.correct}</div>
              <div className="text-sm text-slate-400">Correct Answers</div>
            </div>
            <div className="bg-slate-700 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-red-400">
                {score.total - score.correct}
              </div>
              <div className="text-sm text-slate-400">Errors</div>
            </div>
            <div className="bg-slate-700 rounded-lg p-4 text-center col-span-2">
              <div className="text-2xl font-bold text-cyan-400">
                {formatDuration(duration)}
              </div>
              <div className="text-sm text-slate-400">Time Taken</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button variant="secondary" onClick={handleCloseSummary} fullWidth>
              Back to Home
            </Button>
            <Button variant="primary" onClick={handleRetry} fullWidth>
              Try Again
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
