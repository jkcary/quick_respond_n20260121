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
import { useI18n } from '@/i18n';
import { SpeechRecognizer } from '@/core/speech';
import { requestMicrophonePermission, isSpeechRecognitionSupported } from '@/core/speech';
import { formatDuration } from '@/utils/formatters';
import { logPerfEvent } from '@/utils/perfLogger';
import { getGradeBookForGrade } from '@/types';
import { TEST_CONFIG } from '@/config/app.config';
import type { TestSession, VocabularyItem } from '@/types';
import { LLMProvider } from '@/types';

const BATCH_SIZE = TEST_CONFIG.WORDS_PER_TEST;
const SEGMENT_CACHE_LIMIT = 50;

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
): Promise<T> {
  let timeoutId: number | undefined;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = window.setTimeout(() => {
      const error = new Error(message);
      error.name = 'timeout';
      reject(error);
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
    }
  });
}

export const TestPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
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
  const segmentTokenRef = useRef(0);
  const segmentAbortRef = useRef<AbortController | null>(null);
  const segmentCacheRef = useRef(
    new Map<
      string,
      { segments: string[]; correctedTranscript?: string; source: 'llm' | 'api' }
    >(),
  );

  const [gateway] = useState(() => {
    if (config.apiKey) {
      return new LLMGateway({
        provider: config.apiProvider === 'deepseek' ? LLMProvider.DeepSeek : LLMProvider.OpenAI,
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
    segmentTokenRef.current += 1;
    segmentAbortRef.current?.abort();
    segmentAbortRef.current = null;
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

    const submitStart = performance.now();
    let submitSuccess = true;
    let submitErrorType: string | undefined;

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
      submitSuccess = false;
      submitErrorType = error instanceof Error ? error.name : 'unknown';
      console.error('Batch judgment failed:', error);
    } finally {
      logPerfEvent({
        name: 'submit',
        durationMs: performance.now() - submitStart,
        success: submitSuccess,
        errorType: submitErrorType,
        source: gateway ? 'llm' : 'offline',
        provider: gateway?.getProvider?.() ?? config.apiProvider,
        batchSize: batchWords.length,
      });
      setJudging(false);
      setIsSubmitting(false);
    }
  }, [
    currentSession,
    batchWords,
    isSubmitting,
    isJudging,
    gateway,
    submitBatch,
    setJudging,
    config.apiProvider,
  ]);

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

      const trimmedTranscript = transcript.trim();
      if (!trimmedTranscript) {
        return null;
      }

      const segmentStart = performance.now();
      let segmentLogged = false;
      let skipLogging = false;
      const logSegment = (
        source: string,
        success: boolean,
        errorType?: string,
        meta?: Record<string, unknown>,
      ) => {
        if (segmentLogged || skipLogging) {
          return;
        }
        segmentLogged = true;
        logPerfEvent({
          name: 'segment',
          durationMs: performance.now() - segmentStart,
          success,
          errorType,
          source,
          provider: gateway?.getProvider?.() ?? config.apiProvider,
          batchSize: batchWords.length,
          meta,
        });
      };

      const cacheKey = `${currentSession.id}::${batchWords
        .map((word) => word.id)
        .join('|')}::${trimmedTranscript}`;
      const cached = segmentCacheRef.current.get(cacheKey);
      if (cached?.segments?.length) {
        const normalized = normalizeSegments(cached.segments, batchWords.length);
        const nextAnswers: Record<string, string> = {};
        normalized.forEach((segment, index) => {
          const word = batchWords[index];
          if (word) {
            nextAnswers[word.id] = segment.trim();
          }
        });
        setSegmentedTokens(normalized);
        if (options.applyAnswers ?? true) {
          setAnswers(nextAnswers);
        }
        if (cached.correctedTranscript) {
          recordingTranscriptRef.current = cached.correctedTranscript;
          setRecordingTranscript(cached.correctedTranscript);
        }
        if (options.autoSubmit) {
          if (autoSubmitTimerRef.current !== null) {
            window.clearTimeout(autoSubmitTimerRef.current);
          }
          autoSubmitTimerRef.current = window.setTimeout(() => {
            autoSubmitTimerRef.current = null;
            void submitBatchWithInputs(nextAnswers);
          }, 800);
        }
        logSegment('cache', true);
        return nextAnswers;
      }

      const segmentToken = segmentTokenRef.current + 1;
      segmentTokenRef.current = segmentToken;
      segmentAbortRef.current?.abort();
      segmentAbortRef.current = null;

      setIsSegmenting(true);
      setRecordingError(null);
      const { applyAnswers = true, autoSubmit = false } = options;

      const applySegments = (
        segments: string[],
        source: 'llm' | 'api' | 'fallback',
        correctedTranscript?: string,
      ) => {
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
        if (correctedTranscript) {
          recordingTranscriptRef.current = correctedTranscript;
          setRecordingTranscript(correctedTranscript);
        }
        if (applyAnswers) {
          setAnswers(nextAnswers);
        }
        if (autoSubmit && source !== 'fallback') {
          if (autoSubmitTimerRef.current !== null) {
            window.clearTimeout(autoSubmitTimerRef.current);
          }
          autoSubmitTimerRef.current = window.setTimeout(() => {
            autoSubmitTimerRef.current = null;
            void submitBatchWithInputs(nextAnswers);
          }, 800);
        }

        if (source !== 'fallback') {
          segmentCacheRef.current.set(cacheKey, {
            segments: normalized,
            correctedTranscript,
            source: source === 'llm' ? 'llm' : 'api',
          });
          if (segmentCacheRef.current.size > SEGMENT_CACHE_LIMIT) {
            const firstKey = segmentCacheRef.current.keys().next().value as string | undefined;
            if (firstKey) {
              segmentCacheRef.current.delete(firstKey);
            }
          }
        }

        return nextAnswers;
      };

      const createFallbackSegments = () => {
        const cleaned = trimmedTranscript.replace(/\s+/g, ' ').trim();
        let segments = cleaned
          .split(/[，。！？、,.;?!\n]+/)
          .map((item) => item.trim())
          .filter(Boolean);

        if (segments.length < batchWords.length) {
          const bySpace = cleaned
            .split(/\s+/)
            .map((item) => item.trim())
            .filter(Boolean);
          if (bySpace.length > segments.length) {
            segments = bySpace;
          }
        }

        if (segments.length < batchWords.length && cleaned.length > 0) {
          const avg = Math.max(1, Math.ceil(cleaned.length / batchWords.length));
          const chunked: string[] = [];
          for (let i = 0; i < cleaned.length; i += avg) {
            chunked.push(cleaned.slice(i, i + avg));
          }
          segments = chunked;
        }

        return normalizeSegments(segments, batchWords.length);
      };

      try {

        if (gateway) {
          try {
            const result = await withTimeout(
              segmentWithAgent(
                gateway,
                trimmedTranscript,
                batchWords.map((word) => ({
                  id: word.id,
                  word: word.word,
                  zh: word.zh,
                  chinese: Array.isArray(word.chinese) ? word.chinese : [],
                })),
              ),
              TEST_CONFIG.VOICE_SEGMENT_TIMEOUT_MS,
              'Segment agent timeout',
            );

            if (segmentTokenRef.current !== segmentToken) {
              skipLogging = true;
              return null;
            }

            if (result?.segments?.length) {
              const next = applySegments(result.segments, 'llm', result.correctedTranscript);
              logSegment('llm', true);
              return next;
            }
          } catch (error) {
            console.warn('Segment agent failed, falling back to API.', error);
          }
        }

        const abortController = new AbortController();
        segmentAbortRef.current = abortController;
        const timeoutId = window.setTimeout(() => {
          abortController.abort();
        }, TEST_CONFIG.VOICE_SEGMENT_TIMEOUT_MS);

        let response: Response;
        try {
          response = await fetch(
            (import.meta.env.VITE_VOICE_SEGMENT_URL as string | undefined) ??
              '/api/voice/segment-match',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                transcript: trimmedTranscript,
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
              signal: abortController.signal,
            },
          );
        } finally {
          window.clearTimeout(timeoutId);
        }

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || `Segment API failed (${response.status})`);
        }

        if (segmentTokenRef.current !== segmentToken) {
          skipLogging = true;
          return null;
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
          segmentCacheRef.current.set(cacheKey, {
            segments: normalizeSegments(orderedSegments, batchWords.length),
            correctedTranscript: undefined,
            source: 'api',
          });
          if (segmentCacheRef.current.size > SEGMENT_CACHE_LIMIT) {
            const firstKey = segmentCacheRef.current.keys().next().value as string | undefined;
            if (firstKey) {
              segmentCacheRef.current.delete(firstKey);
            }
          }
          logSegment('api', true);
          return nextAnswers;
        }

        if (Array.isArray(data.segments)) {
          const next = applySegments(data.segments, 'api');
          logSegment('api', true);
          return next;
        }

        throw new Error('Invalid segment response format');
      } catch (error) {
        if (segmentTokenRef.current !== segmentToken) {
          skipLogging = true;
          return null;
        }
        const message =
          error instanceof Error ? error.message : 'Segment request failed';
        setRecordingError(message);
        logSegment('fallback', false, error instanceof Error ? error.name : 'unknown', {
          message,
        });
        return applySegments(
          createFallbackSegments(),
          'fallback',
        );
      } finally {
        setIsSegmenting(false);
        setSegmentProgress(100);
        window.setTimeout(() => setSegmentProgress(0), 600);
        if (!segmentLogged && !skipLogging) {
          logSegment('unknown', false, 'unknown');
        }
      }
    },
    [
      batchWords,
      currentSession,
      gateway,
      normalizeSegments,
      submitBatchWithInputs,
      config.apiProvider,
    ],
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
      title={t('test.summaryTitle')}
      closeOnBackdrop={false}
      size="lg"
    >
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-5xl font-bold text-accent mb-2">{t('test.summaryTitle')}</div>
          <div className="text-lg text-text-secondary">{t('test.summaryDone')}</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-bg-tertiary rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-accent">{summaryTotal}</div>
            <div className="text-sm text-text-muted">{t('test.summaryTotalWords')}</div>
          </div>
          <div className="bg-bg-tertiary rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-accent">
              {formatDuration(summaryDuration)}
            </div>
            <div className="text-sm text-text-muted">{t('test.summaryTimeTaken')}</div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button variant="ghost" onClick={handleCloseSummary} fullWidth>
            {t('test.summaryClose')}
          </Button>
          <Button variant="secondary" onClick={handleReturnHome} fullWidth>
            {t('test.summaryReturnHome')}
          </Button>
          <Button variant="primary" onClick={handleRetry} fullWidth>
            {t('test.summaryRetry')}
          </Button>
        </div>
      </div>
    </Modal>
  ) : null;

  if (!currentSession || batchWords.length === 0) {
    return (
      <div className="min-h-screen">
        {!shouldShowSummary && (
          <div className="flex items-center justify-center min-h-screen">
            <LoadingSpinner size="lg" message={t('test.loading')} />
          </div>
        )}
        {summaryModal}
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <ScorePanel
        session={currentSession}
        currentWordIndex={currentWordIndex}
        batchSize={BATCH_SIZE}
        filledCount={filledCount}
      />

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-2 animate-fade-in">
          <h2 className="text-xl text-text-primary font-semibold">
            {t('test.headerTitle', { count: batchWords.length })}
          </h2>
          <p className="text-sm text-text-muted">
            {t('test.headerSubtitle')}
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 bg-bg-secondary border border-border-primary rounded-xl p-4 animate-slide-up">
          <Button
            variant={isRecording ? 'secondary' : 'primary'}
            onClick={handleRecordToggle}
            disabled={!voiceEnabled || isSubmitting || isJudging || isSegmenting}
          >
            {isRecording ? t('test.recordStop') : t('test.recordStart')}
          </Button>
          <div className="text-xs text-text-muted">
            {isRecording && t('test.recordHintRecording')}
            {!isRecording && isSegmenting && t('test.recordHintSegmenting')}
            {!isRecording && !isSegmenting && t('test.recordHintIdle')}
          </div>
          {(isSegmenting || segmentProgress > 0) && (
            <div className="w-full">
              <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-300"
                  style={{ width: `${segmentProgress}%` }}
                />
              </div>
              <div className="mt-1 text-right text-xs text-text-muted">
                {Math.round(segmentProgress)}%
              </div>
            </div>
          )}
          <div className="w-full flex items-center gap-3">
            <div className="flex-1 text-sm text-text-primary bg-bg-primary/60 border border-border-primary rounded-lg px-3 py-2">
              {segmentedDisplay || t('test.segmentPlaceholder')}
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
              {t('test.submit')}
            </Button>
          </div>
          {recordingError && (
            <div className="text-xs text-error">{recordingError}</div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {batchWords.map((word) => (
            <div
              key={word.id}
              className="bg-bg-secondary border border-border-primary rounded-xl p-4 space-y-3 animate-slide-up"
            >
              <div className="space-y-1">
                <div className="text-lg font-semibold text-accent">{word.word}</div>
                <div className="text-xs text-text-muted font-mono">{word.phonetic}</div>
              </div>

            </div>
          ))}
        </div>

        {(isJudging || isSubmitting) && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <LoadingSpinner
              size="lg"
              message={t('test.overlaySubmitting')}
            />
          </div>
        )}

        <div className="flex justify-center pt-2">
          <Button variant="ghost" onClick={handleEndTest} disabled={isJudging || isSubmitting}>
            {t('test.endTest')}
          </Button>
        </div>
      </div>

      {summaryModal}
    </div>
  );
};

