/**
 * VSTCard component - Full-screen Visual-Sound-Text learning card
 */

import React, { useState, useEffect } from 'react';
import type { ErrorLogEntry } from '@/types';
import { Button, Card } from '@/components/common';
import { SpeechSynthesizer } from '@/core/speech';
import { formatRelativeTime } from '@/utils/formatters';
import { useI18n } from '@/i18n';

export interface VSTCardProps {
  errorEntry: ErrorLogEntry;
  onMaster: () => void;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

type RevealStage = 'word' | 'phonetic' | 'chinese' | 'example';

export const VSTCard: React.FC<VSTCardProps> = ({
  errorEntry,
  onMaster,
  onClose,
  onNext,
  onPrev,
}) => {
  const { t } = useI18n();
  const [stage, setStage] = useState<RevealStage>('word');
  const [synthesizer] = useState(() => new SpeechSynthesizer());
  const [isSpeaking, setIsSpeaking] = useState(false);

  const { word } = errorEntry;

  // Auto-play pronunciation on mount
  useEffect(() => {
    const playAudio = async () => {
      setIsSpeaking(true);
      try {
        await synthesizer.speak(word.word);
      } catch (error) {
        console.error('TTS error:', error);
      } finally {
        setIsSpeaking(false);
      }
    };

    playAudio();

    return () => {
      synthesizer.destroy();
    };
  }, [word.id]);

  const handleRevealNext = () => {
    const stages: RevealStage[] = ['word', 'phonetic', 'chinese', 'example'];
    const currentIndex = stages.indexOf(stage);
    if (currentIndex < stages.length - 1) {
      setStage(stages[currentIndex + 1]);
    }
  };

  const handleReplay = async () => {
    if (isSpeaking) return;

    setIsSpeaking(true);
    try {
      await synthesizer.speak(word.word);
    } catch (error) {
      console.error('TTS error:', error);
    } finally {
      setIsSpeaking(false);
    }
  };

  const stageIndex = ['word', 'phonetic', 'chinese', 'example'].indexOf(stage);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 overflow-y-auto">
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onPrev && (
                <Button variant="ghost" onClick={onPrev} size="sm">
                  {t('vst.prev')}
                </Button>
              )}
              {onNext && (
                <Button variant="ghost" onClick={onNext} size="sm">
                  {t('vst.next')}
                </Button>
              )}
            </div>
            <Button variant="ghost" onClick={onClose} size="sm">
              {t('vst.close')}
            </Button>
          </div>

          {/* Main card */}
          <Card className="text-center py-12">
            {/* Visual (placeholder for future image) */}
            <div className="mb-8">
              <div className="w-32 h-32 mx-auto bg-slate-700 rounded-full flex items-center justify-center">
                <svg
                  className="w-16 h-16 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>

            {/* Word (always visible) */}
            <h1 className="text-6xl font-bold text-cyan-400 mb-6">
              {word.word}
            </h1>

            {/* Sound - Replay button */}
            <div className="mb-8">
              <Button
                onClick={handleReplay}
                disabled={isSpeaking}
                variant="secondary"
                className={isSpeaking ? 'animate-pulse' : ''}
              >
                <svg
                  className="w-5 h-5 mr-2 inline"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                </svg>
                {isSpeaking ? t('vst.playing') : t('vst.replay')}
              </Button>
            </div>

            {/* Text - Sequential reveal */}
            <div className="space-y-6">
              {/* Phonetic */}
              {stageIndex >= 1 && (
                <div className="animate-fade-in">
                  <p className="text-3xl text-slate-300 font-mono">{word.phonetic}</p>
                </div>
              )}

              {/* Chinese */}
              {stageIndex >= 2 && (
                <div className="animate-fade-in">
                  <p className="text-4xl text-green-400 font-medium">{word.chinese}</p>
                </div>
              )}

              {/* Example */}
              {stageIndex >= 3 && (
                <div className="animate-fade-in border-t border-slate-700 pt-6 mt-6">
                  <p className="text-xl text-slate-200 mb-2">{word.exampleSentence}</p>
                  <p className="text-lg text-slate-400">{word.exampleChinese}</p>
                </div>
              )}

              {/* Reveal button */}
              {stageIndex < 3 && (
                <Button onClick={handleRevealNext} variant="primary" size="lg">
                  {stageIndex === 0
                    ? t('vst.revealPhonetic')
                    : stageIndex === 1
                    ? t('vst.revealTranslation')
                    : t('vst.revealExample')}
                </Button>
              )}
            </div>
          </Card>

          {/* Error stats */}
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-400">{errorEntry.errorCount}</div>
                <div className="text-sm text-slate-400">{t('vst.statsTotalErrors')}</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-medium text-slate-300">
                  {formatRelativeTime(errorEntry.lastErrorDate)}
                </div>
                <div className="text-sm text-slate-400">{t('vst.statsLastError')}</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-medium text-slate-300">
                  {t('vst.statsGrade', { grade: word.gradeLevel })}
                </div>
                <div className="text-sm text-slate-400">{t('vst.statsDifficulty')}</div>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            {!errorEntry.mastered && (
              <Button onClick={onMaster} variant="primary" fullWidth>
                {t('vst.markMastered')}
              </Button>
            )}
            {errorEntry.mastered && (
              <div className="w-full text-center py-3 bg-green-900/20 border border-green-700 rounded-lg text-green-400 font-medium">
                {t('vst.mastered')}
              </div>
            )}
          </div>

          {/* Error history */}
          {errorEntry.userInputs.length > 0 && (
            <Card>
              <h3 className="text-lg font-medium text-slate-200 mb-4">{t('vst.historyTitle')}</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {errorEntry.userInputs.map((input, index) => (
                  <div
                    key={index}
                    className="p-3 bg-slate-700 rounded-lg border border-slate-600"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-red-400">
                          {t('vst.historyAnswer')}: {input.input || t('vst.historyEmpty')}
                        </div>
                        <div className="text-green-400 text-sm mt-1">
                          {t('vst.historyCorrect')}: {input.correction}
                        </div>
                      </div>
                      <div className="text-xs text-slate-400">
                        {formatRelativeTime(input.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
