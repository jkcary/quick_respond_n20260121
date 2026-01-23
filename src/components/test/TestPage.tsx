/**
 * TestPage component - Main test orchestrator
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTestStore } from '@/store/testStore';
import { useAppStore } from '@/store/useAppStore';
import { ScorePanel } from './ScorePanel';
import { Button, Modal, LoadingSpinner } from '@/components/common';
import { LLMGateway, segmentWithAgent } from '@/core/llm';
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
  const [recordingTranscript, setRecordingTranscript] = useState('');
  const [segmentedTokens, setSegmentedTokens] = useState<string[]>([]);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSegmenting, setIsSegmenting] = useState(false);
  const [segmentProgress, setSegmentProgress] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const recognizerRef = useRef<SpeechRecognizer | null>(null);
  const recordingTokenRef = useRef(0);
  const recordingTranscriptRef = useRef('');
  const autoSubmitTimerRef = useRef<number | null>(null);

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

  const segmentedDisplay = useMemo(() => {
    if (segmentedTokens.length === 0) {
      return '';
    }
    return segmentedTokens
      .map((item) => (item && item.trim() ? item.trim() : '—'))
      .join(' / ');
  }, [segmentedTokens]);

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
    setIsRecording(false);
    setRecordingTranscript('');
    setSegmentedTokens([]);
    setRecordingError(null);
    setSegmentProgress(0);
    recordingTranscriptRef.current = '';
    recordingTokenRef.current += 1;
    recognizerRef.current?.abort();
    if (autoSubmitTimerRef.current !== null) {
      window.clearTimeout(autoSubmitTimerRef.current);
      autoSubmitTimerRef.current = null;
    }
  }, [currentSession?.id, currentWordIndex, batchWords]);

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
      recognizerRef.current?.destroy();
      recognizerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isSegmenting) {
      return;
    }

    setSegmentProgress(10);
    const interval = window.setInterval(() => {
      setSegmentProgress((prev) => {
        if (prev >= 90) {
          return prev;
        }
        return Math.min(90, prev + 5 + Math.random() * 12);
      });
    }, 300);

    return () => {
      window.clearInterval(interval);
    };
  }, [isSegmenting]);

  const getDefaultCorrection = (word: VocabularyItem): string => {
    return Array.isArray(word.chinese) ? word.chinese.filter(Boolean).join('; ') : '';
  };

  const submitBatchWithInputs = useCallback(async (inputs: Record<string, string>) => {
    if (!currentSession || batchWords.length === 0 || isSubmitting || isJudging) {
      return;
    }

    setIsSubmitting(true);
    setJudging(true);

    try {
      const entries = await Promise.all(
        batchWords.map(async (word) => {
          const input = (inputs[word.id] ?? '').trim();
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

          return { word, input, judgment };
        }),
      );

      await submitBatch(entries);
    } catch (error) {
      console.error('Batch judgment failed:', error);
    } finally {
      setJudging(false);
      setIsSubmitting(false);
    }
  }, [currentSession, batchWords, isSubmitting, isJudging, gateway, submitBatch, setJudging]);

  const normalizeSegments = useCallback(
    (segments: string[], targetCount: number) => {
      if (segments.length === targetCount) {
        return segments;
      }
      if (segments.length > targetCount) {
        const overflow = segments.slice(targetCount - 1).join(' ');
        return [...segments.slice(0, targetCount - 1), overflow];
      }
      return [...segments, ...Array(targetCount - segments.length).fill('')];
    },
    [],
  );

  // Voice batch recording helpers
  const segmentAndMatchTranscript = useCallback(
    async (
      transcript: string,
      options: { applyAnswers?: boolean; autoSubmit?: boolean } = {},
    ) => {
      if (!currentSession || batchWords.length === 0) {
        return null;
      }

      setIsSegmenting(true);
      setRecordingError(null);
      const { applyAnswers = true, autoSubmit = false } = options;

      try {
        const applySegments = (segments: string[]) => {
          const normalized = normalizeSegments(
            segments.map((item) => item.trim()),
            batchWords.length,
          );
          const nextAnswers: Record<string, string> = {};
          normalized.forEach((segment, index) => {
            const word = batchWords[index];
            if (word) {
              nextAnswers[word.id] = segment.trim();
            }
          });

          setSegmentedTokens(normalized);
          if (applyAnswers) {
            setAnswers(nextAnswers);
          }
          if (autoSubmit) {
            if (autoSubmitTimerRef.current !== null) {
              window.clearTimeout(autoSubmitTimerRef.current);
            }
            autoSubmitTimerRef.current = window.setTimeout(() => {
              autoSubmitTimerRef.current = null;
              void submitBatchWithInputs(nextAnswers);
            }, 800);
          }

          return nextAnswers;
        };

        if (gateway) {
          try {
            const result = await segmentWithAgent(
              gateway,
              transcript,
              batchWords.map((word) => ({
                id: word.id,
                word: word.word,
                zh: word.zh,
                chinese: Array.isArray(word.chinese) ? word.chinese : [],
              })),
            );

            if (result?.correctedTranscript) {
              recordingTranscriptRef.current = result.correctedTranscript;
              setRecordingTranscript(result.correctedTranscript);
            }

            if (result?.segments?.length) {
              return applySegments(result.segments);
            }
          } catch (error) {
            console.warn('Segment agent failed, falling back to API.', error);
          }
        }

        const response = await fetch(
          (import.meta.env.VITE_VOICE_SEGMENT_URL as string | undefined) ??
            '/api/voice/segment-match',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              transcript,
              matchMode: 'ordered',
              words: batchWords.map((word, index) => ({
                index: index + 1,
                id: word.id,
                word: word.word,
                zh: word.zh,
                chinese: Array.isArray(word.chinese)
                  ? word.chinese.filter((item) => item && item.trim())
                  : [],
              })),
            }),
          },
        );

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || `Segment API failed (${response.status})`);
        }

        const data = (await response.json()) as {
          matches?: Array<{ wordId: string; translation: string }>;
          segments?: string[];
        };

        if (Array.isArray(data.matches)) {
          const nextAnswers: Record<string, string> = {};
          for (const word of batchWords) {
            const match = data.matches.find((item) => item.wordId === word.id);
            nextAnswers[word.id] = match?.translation?.trim() ?? '';
          }
          const orderedSegments = batchWords.map(
            (word) => nextAnswers[word.id] ?? '',
          );
          setSegmentedTokens(normalizeSegments(orderedSegments, batchWords.length));
          if (applyAnswers) {
            setAnswers(nextAnswers);
          }
          if (autoSubmit) {
            if (autoSubmitTimerRef.current !== null) {
              window.clearTimeout(autoSubmitTimerRef.current);
            }
            autoSubmitTimerRef.current = window.setTimeout(() => {
              autoSubmitTimerRef.current = null;
              void submitBatchWithInputs(nextAnswers);
            }, 800);
          }
          return nextAnswers;
        }

        if (Array.isArray(data.segments)) {
          return applySegments(data.segments);
        }

        throw new Error('Invalid segment response format');
      } catch (error) {
        setRecordingError(
          error instanceof Error ? error.message : 'Segment request failed',
        );
        return null;
      } finally {
        setIsSegmenting(false);
        setSegmentProgress(100);
        window.setTimeout(() => setSegmentProgress(0), 600);
      }
    },
    [batchWords, currentSession, gateway, normalizeSegments, submitBatchWithInputs],
  );

  const stopBatchRecording = useCallback(() => {
    setIsRecording(false);
    recognizerRef.current?.stop();
  }, []);

  const startBatchRecording = useCallback(() => {
    const recognizer = recognizerRef.current;
    if (!recognizer || isRecording || isSubmitting || isJudging) {
      return;
    }

    const sessionToken = recordingTokenRef.current + 1;
    recordingTokenRef.current = sessionToken;
    recordingTranscriptRef.current = '';
    setRecordingTranscript('');
    setSegmentedTokens([]);
    setRecordingError(null);
    setIsRecording(true);

    try {
      recognizer.updateConfig({ continuous: true, interimResults: true });
      recognizer.startContinuous(
        {
          onResult: (result) => {
            if (recordingTokenRef.current !== sessionToken) {
              return;
            }
            if (!result.isFinal) {
              return;
            }
            const trimmed = result.transcript.trim();
            if (!trimmed) {
              return;
            }
            const nextValue = recordingTranscriptRef.current
              ? `${recordingTranscriptRef.current} ${trimmed}`
              : trimmed;
            recordingTranscriptRef.current = nextValue;
            setRecordingTranscript(nextValue);
          },
          onError: (error) => {
            if (recordingTokenRef.current !== sessionToken) {
              return;
            }
            setIsRecording(false);
            setRecordingError(
              error instanceof Error ? error.message : 'Speech recognition error',
            );
          },
          onEnd: () => {
            if (recordingTokenRef.current !== sessionToken) {
              return;
            }
            setIsRecording(false);
          },
        },
        {
          speechStartTimeoutMs: TEST_CONFIG.VOICE_SPEECH_TIMEOUT_MS,
        },
      );
    } catch (error) {
      setIsRecording(false);
      setRecordingError(
        error instanceof Error ? error.message : 'Speech recognition error',
      );
    }
  }, [isRecording, isSubmitting, isJudging, segmentAndMatchTranscript]);

  const handleRecordToggle = useCallback(() => {
    if (isRecording) {
      stopBatchRecording();
    } else {
      startBatchRecording();
    }
  }, [isRecording, startBatchRecording, stopBatchRecording]);

  const handleSubmitBatch = useCallback(async () => {
    await submitBatchWithInputs(answers);
  }, [answers, submitBatchWithInputs]);

  const allFilled = batchWords.length > 0 && batchWords.every((word) => answers[word.id]?.trim());

  useEffect(() => {
    if (!allFilled || isSubmitting || isJudging || autoSubmitTimerRef.current !== null) {
      return;
    }

    const timer = setTimeout(() => {
      void handleSubmitBatch();
    }, 300);

    return () => clearTimeout(timer);
  }, [allFilled, isSubmitting, isJudging, handleSubmitBatch]);

  const handleEndTest = () => {
    if (isRecording) {
      stopBatchRecording();
    }
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

        <div className="flex flex-col items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl p-4">
          <Button
            variant={isRecording ? 'secondary' : 'primary'}
            onClick={handleRecordToggle}
            disabled={!voiceEnabled || isSubmitting || isJudging || isSegmenting}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </Button>
          <div className="text-xs text-slate-400">
            {isRecording && 'Recording... Speak all 10 translations in one pass.'}
            {!isRecording && isSegmenting && 'Segmenting and matching transcript...'}
            {!isRecording && !isSegmenting && 'Click to record one pass for all 10 words.'}
          </div>
          {(isSegmenting || segmentProgress > 0) && (
            <div className="w-full">
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 transition-all duration-300"
                  style={{ width: `${segmentProgress}%` }}
                />
              </div>
              <div className="mt-1 text-right text-xs text-slate-400">
                {Math.round(segmentProgress)}%
              </div>
            </div>
          )}
          <div className="w-full flex items-center gap-3">
            <div className="flex-1 text-sm text-slate-200 bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2">
              {segmentedDisplay || '等待切分结果...'}
            </div>
            <Button
              variant="primary"
              onClick={() => {
                const transcript = recordingTranscript.trim()
                if (transcript) {
                  void segmentAndMatchTranscript(transcript, { autoSubmit: true })
                }
              }}
              disabled={
                isRecording ||
                isSegmenting ||
                isSubmitting ||
                isJudging ||
                recordingTranscript.trim().length === 0
              }
            >
              提交
            </Button>
          </div>
          {recordingError && (
            <div className="text-xs text-red-400">{recordingError}</div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {batchWords.map((word) => (
            <div
              key={word.id}
              className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3"
            >
              <div className="space-y-1">
                <div className="text-lg font-semibold text-cyan-300">{word.word}</div>
                <div className="text-xs text-slate-400 font-mono">{word.phonetic}</div>
              </div>

            </div>
          ))}
        </div>

        {(isJudging || isSubmitting || isSegmenting) && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <LoadingSpinner
              size="lg"
              message={isSegmenting ? 'Segmenting transcript...' : 'Submitting this batch...'}
            />
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

