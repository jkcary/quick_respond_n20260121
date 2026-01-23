/**
 * WordCard component - Display current word with pronunciation
 */

import React, { useEffect, useState } from 'react';
import type { VocabularyItem } from '@/types';
import { Card } from '@/components/common';
import { SpeechSynthesizer } from '@/core/speech';
import { useI18n } from '@/i18n';

export interface WordCardProps {
  word: VocabularyItem;
  onSpeak?: () => void;
  autoPlay?: boolean;
}

export const WordCard: React.FC<WordCardProps> = ({
  word,
  onSpeak,
  autoPlay = false,
}) => {
  const { t } = useI18n();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [synthesizer] = useState(() => new SpeechSynthesizer());

  const handleSpeak = async () => {
    if (isSpeaking) {
      return;
    }

    setIsSpeaking(true);
    onSpeak?.();

    try {
      await synthesizer.speak(word.word);
    } catch (error) {
      console.error('Speech synthesis error:', error);
    } finally {
      setIsSpeaking(false);
    }
  };

  // Auto-play on mount if enabled
  useEffect(() => {
    if (autoPlay) {
      const timer = setTimeout(() => {
        handleSpeak();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [word.id, autoPlay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      synthesizer.destroy();
    };
  }, []);

  return (
    <Card
      className={`text-center cursor-pointer transition-all duration-300 ${
        isSpeaking ? 'ring-4 ring-cyan-400 scale-105' : ''
      }`}
      onClick={handleSpeak}
      glow={isSpeaking}
    >
      {/* Speaking indicator */}
      {isSpeaking && (
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 text-cyan-400">
            <svg
              className="w-5 h-5 animate-pulse"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium">{t('test.wordCardSpeaking')}</span>
          </div>
        </div>
      )}

      {/* English word */}
      <h1 className="text-6xl font-bold text-cyan-400 mb-4 tracking-wide">
        {word.word}
      </h1>

      {/* Phonetic notation */}
      <p className="text-2xl text-slate-300 font-mono mb-6">
        {word.phonetic}
      </p>

      {/* Click to play hint */}
      <div className="text-slate-400 text-sm flex items-center justify-center gap-2">
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
            d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
          />
        </svg>
        <span>
          {t('test.wordCardClickHint', {
            action: isSpeaking ? t('test.wordCardReplay') : t('test.wordCardHear'),
          })}
        </span>
      </div>
    </Card>
  );
};
