/**
 * TestPage component - Main test orchestrator
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTestStore } from '@/store/testStore';
import { useAppStore } from '@/store/useAppStore';
import { ScorePanel } from './ScorePanel';
import { Button, Modal, LoadingSpinner, Input } from '@/components/common';
import { LLMGateway } from '@/core/llm';
import { SpeechRecognizer } from '@/core/speech';
import { requestMicrophonePermission, isSpeechRecognitionSupported } from '@/core/speech';
import { formatDuration } from '@/utils/formatters';
import { getGradeBookForGrade } from '@/types';
import { TEST_CONFIG } from '@/config/app.config';
import type { TestSession, VocabularyItem } from '@/types';

const BATCH_SIZE = TEST_CONFIG.WORDS_PER_TEST;

export const TestPage: React.FC = () => {
  const navigate = useNavigate();
  const config = useAppStore((state) => state.config);
  const {
    currentSession,
    currentWordIndex,
    isJudging,
    startTest,
    submitBatch,
    endTest,
    setJudging,
    resetTest,
  } = useTestStore();

  const [showSummary, setShowSummary] = useState(false);
  const [completedSession, setCompletedSession] = useState<TestSession | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isListening, setIsListening] = useState(false);
  const [listeningWordId, setListeningWordId] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const recognizerRef = useRef<SpeechRecognizer | null>(null);
  const sessionTokenRef = useRef(0);

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

  const batchWords = useMemo(() => {
    if (!currentSession) {
      return [] as VocabularyItem[];
    }
    return currentSession.words.slice(currentWordIndex, currentWordIndex + BATCH_SIZE);
  }, [currentSession, currentWordIndex]);

  const filledCount = useMemo(() => {
    return batchWords.reduce((count, word) => {
      return answers[word.id]?.trim() ? count + 1 : count;
    }, 0);
  }, [batchWords, answers]);

  const summarySession = completedSession ?? currentSession;
  const summaryTotal = summarySession ? summarySession.words.length : 0;
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

  // Reset batch answers when the batch changes
  useEffect(() => {
    if (!currentSession) {
      return;
    }

    const nextAnswers: Record<string, string> = {};
    for (const word of batchWords) {
      nextAnswers[word.id] = '';
    }

    setAnswers(nextAnswers);
    setIsSubmitting(false);
    setIsListening(false);
    setListeningWordId(null);
    sessionTokenRef.current += 1;
    recognizerRef.current?.abort();
  }, [currentSession?.id, currentWordIndex]);

  // Initialize speech recognizer
  useEffect(() => {
    const initRecognizer = async () => {
      if (!isSpeechRecognitionSupported()) {
        return;
      }

      try {
        const permission = await requestMicrophonePermission();
        if (permission.status === 'granted') {
          const rec = new SpeechRecognizer({
            language: 'zh-CN',
            continuous: false,
            interimResults: true,
          });
          recognizerRef.current = rec;
          setVoiceEnabled(true);
        }
      } catch (error) {
        console.error('Failed to initialize speech recognizer:', error);
      }
    };

    initRecognizer();

    return () => {
      sessionTokenRef.current += 1;
      recognizerRef.current?.destroy();
      recognizerRef.current = null;
    };
  }, []);

  const handleVoiceInput = async (wordId: string) => {
    const recognizer = recognizerRef.current;
    if (!recognizer || isListening || isJudging || isSubmitting) {
      return;
    }

    const sessionToken = sessionTokenRef.current + 1;
    sessionTokenRef.current = sessionToken;
    setIsListening(true);
    setListeningWordId(wordId);

    try {
      const result = await recognizer.start();
      if (sessionTokenRef.current !== sessionToken) {
        return;
      }
      const transcript = result.transcript.trim();
      if (transcript.length > 0) {
        setAnswers((prev) => ({
          ...prev,
          [wordId]: transcript,
        }));
      }
      recognizer.stop();
    } catch (error) {
      if (sessionTokenRef.current !== sessionToken) {
        return;
      }
      console.error('Speech recognition error:', error);
    } finally {
      if (sessionTokenRef.current === sessionToken) {
        setIsListening(false);
        setListeningWordId(null);
      }
    }
  };

  const getDefaultCorrection = (word: VocabularyItem): string => {
    return Array.isArray(word.chinese) ? word.chinese.filter(Boolean).join('; ') : '';
  };

  const handleSubmitBatch = useCallback(async () => {
    if (!currentSession || batchWords.length === 0 || isSubmitting || isJudging) {
      return;
    }

    setIsSubmitting(true);
    setJudging(true);

    try {
      const entries = [] as Array<{ word: VocabularyItem; input: string; judgment: { correct: boolean; correction: string } }>;

      for (const word of batchWords) {
        const input = (answers[word.id] ?? '').trim();
        let judgment: { correct: boolean; correction: string };

        if (!gateway) {
          judgment = {
            correct: true,
            correction: getDefaultCorrection(word),
          };
        } else if (input.length === 0) {
          judgment = {
            correct: false,
            correction: getDefaultCorrection(word),
          };
        } else {
          const result = await gateway.judge(word.word, input);
          judgment = {
            correct: result.correct,
            correction: result.correction,
          };
        }

        entries.push({ word, input, judgment });
      }

      await submitBatch(entries);
    } catch (error) {
      console.error('Batch judgment failed:', error);
    } finally {
      setJudging(false);
      setIsSubmitting(false);
    }
  }, [currentSession, batchWords, answers, isSubmitting, isJudging, gateway, submitBatch, setJudging]);

  const allFilled = batchWords.length > 0 && batchWords.every((word) => answers[word.id]?.trim());

  useEffect(() => {
    if (!allFilled || isSubmitting || isJudging) {
      return;
    }

    const timer = setTimeout(() => {
      void handleSubmitBatch();
    }, 300);

    return () => clearTimeout(timer);
  }, [allFilled, isSubmitting, isJudging, handleSubmitBatch]);

  const handleEndTest = () => {
    endTest();
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
      title="Test Complete"
      closeOnBackdrop={false}
      size="lg"
    >
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-5xl font-bold text-cyan-400 mb-2">Done</div>
          <div className="text-lg text-slate-300">All batches have been submitted.</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-700 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-cyan-400">{summaryTotal}</div>
            <div className="text-sm text-slate-400">Total Words</div>
          </div>
          <div className="bg-slate-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-cyan-400">
              {formatDuration(summaryDuration)}
            </div>
            <div className="text-sm text-slate-400">Time Taken</div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button variant="ghost" onClick={handleCloseSummary} fullWidth>
            Close
          </Button>
          <Button variant="secondary" onClick={handleReturnHome} fullWidth>
            Return Home
          </Button>
          <Button variant="primary" onClick={handleRetry} fullWidth>
            Start Again
          </Button>
        </div>
      </div>
    </Modal>
  ) : null;

  if (!currentSession || batchWords.length === 0) {
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
      <ScorePanel
        session={currentSession}
        currentWordIndex={currentWordIndex}
        batchSize={BATCH_SIZE}
        filledCount={filledCount}
      />

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-xl text-slate-200 font-semibold">
            完成本组 {batchWords.length} 个单词后自动提交
          </h2>
          <p className="text-sm text-slate-400">
            每组两排、每排五个单词，全部填写完成后自动进入下一组。
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {batchWords.map((word) => {
            const isListeningForWord = isListening && listeningWordId === word.id;
            return (
              <div
                key={word.id}
                className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3"
              >
                <div className="space-y-1">
                  <div className="text-lg font-semibold text-cyan-300">{word.word}</div>
                  <div className="text-xs text-slate-400 font-mono">{word.phonetic}</div>
                </div>

                <Input
                  type="text"
                  value={answers[word.id] ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setAnswers((prev) => ({
                      ...prev,
                      [word.id]: value,
                    }));
                  }}
                  placeholder="中文翻译"
                  disabled={isJudging || isSubmitting}
                  fullWidth
                  rightElement={
                    voiceEnabled ? (
                      <button
                        type="button"
                        onClick={() => handleVoiceInput(word.id)}
                        disabled={isJudging || isSubmitting || isListening}
                        className={`h-8 w-8 flex items-center justify-center rounded-full transition-colors ${
                          isListeningForWord
                            ? 'bg-red-500 text-white animate-pulse'
                            : 'bg-slate-600 text-slate-200 hover:bg-cyan-500'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title="Voice input"
                        aria-label="Voice input"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 1a3 3 0 00-3 3v6a3 3 0 006 0V4a3 3 0 00-3-3zm5 8a5 5 0 01-10 0m5 8v4m0 0H8m4 0h4"
                          />
                        </svg>
                      </button>
                    ) : undefined
                  }
                />

                {isListeningForWord && (
                  <p className="text-xs text-cyan-400 animate-pulse">Listening...</p>
                )}
              </div>
            );
          })}
        </div>

        {(isJudging || isSubmitting) && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <LoadingSpinner size="lg" message="Submitting this batch..." />
          </div>
        )}

        <div className="flex justify-center pt-2">
          <Button variant="ghost" onClick={handleEndTest} disabled={isJudging || isSubmitting}>
            End Test
          </Button>
        </div>
      </div>

      {summaryModal}
    </div>
  );
};

