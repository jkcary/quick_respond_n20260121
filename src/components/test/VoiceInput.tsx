/**
 * VoiceInput component - Hybrid voice/text input
 */

import React, { useState, useEffect, useRef } from 'react';
import { Button, Input } from '@/components/common';
import { SpeechRecognizer } from '@/core/speech';
import { requestMicrophonePermission, isSpeechRecognitionSupported } from '@/core/speech';
import { useI18n } from '@/i18n';

export interface VoiceInputProps {
  onSubmit: (input: string) => void;
  disabled?: boolean;
  placeholder?: string;
  wordId?: string;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  onSubmit,
  disabled = false,
  placeholder,
  wordId,
}) => {
  const { t } = useI18n();
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognizerRef = useRef<SpeechRecognizer | null>(null);
  const sessionTokenRef = useRef(0);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [transcript, setTranscript] = useState('');

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

  useEffect(() => {
    if (wordId === undefined) {
      return;
    }

    sessionTokenRef.current += 1;
    setIsListening(false);
    setInput('');
    setTranscript('');
    recognizerRef.current?.abort();
  }, [wordId]);

  const handleVoiceInput = async () => {
    const recognizer = recognizerRef.current;
    if (!recognizer || isListening) {
      return;
    }

    const sessionToken = sessionTokenRef.current + 1;
    sessionTokenRef.current = sessionToken;
    setIsListening(true);
    setTranscript('');

    try {
      const result = await recognizer.start();
      if (sessionTokenRef.current !== sessionToken) {
        return;
      }
      setInput(result.transcript);
      setTranscript(result.transcript);
      setIsListening(false);
      recognizer.stop();

      // Auto-submit after recognition
      const trimmedTranscript = result.transcript.trim();
      if (trimmedTranscript.length > 0) {
        const submitToken = sessionTokenRef.current;
        setTimeout(() => {
          if (sessionTokenRef.current !== submitToken) {
            return;
          }
          onSubmit(trimmedTranscript);
        }, 500);
      }
    } catch (error) {
      if (sessionTokenRef.current !== sessionToken) {
        return;
      }
      console.error('Speech recognition error:', error);
      setIsListening(false);
    }
  };

  const handleTextSubmit = () => {
    if (input.trim().length > 0) {
      onSubmit(input.trim());
      setInput('');
      setTranscript('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !disabled) {
      handleTextSubmit();
    }
  };

  const resolvedPlaceholder = placeholder ?? t('test.voicePlaceholder');

  return (
    <div className="w-full space-y-4">
      {/* Voice input button */}
      {voiceEnabled && (
        <div className="flex justify-center">
          <button
            onClick={handleVoiceInput}
            disabled={disabled || isListening}
            className={`relative p-8 rounded-full transition-all duration-300 ${
              isListening
                ? 'bg-red-500 scale-110 animate-pulse'
                : 'bg-cyan-500 hover:bg-cyan-600'
            } disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
          >
            {isListening ? (
              <>
                {/* Listening animation */}
                <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75"></div>
                <svg
                  className="w-12 h-12 text-white relative z-10"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                    clipRule="evenodd"
                  />
                </svg>
              </>
            ) : (
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* Listening status */}
      {isListening && (
        <div className="text-center">
          <p className="text-cyan-400 font-medium animate-pulse">
            {t('test.voiceListening')}
          </p>
          {transcript && (
            <p className="text-slate-300 mt-2 text-lg">{transcript}</p>
          )}
        </div>
      )}

      {/* Divider */}
      {voiceEnabled && (
        <div className="flex items-center gap-4">
          <div className="flex-1 border-t border-slate-700"></div>
          <span className="text-slate-400 text-sm">{t('test.voiceOrType')}</span>
          <div className="flex-1 border-t border-slate-700"></div>
        </div>
      )}

      {/* Text input */}
      <div className="flex gap-2">
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={resolvedPlaceholder}
          disabled={disabled || isListening}
          fullWidth
          className="text-lg"
        />
        <Button
          onClick={handleTextSubmit}
          disabled={disabled || isListening || input.trim().length === 0}
          variant="primary"
        >
          {t('test.voiceSubmit')}
        </Button>
      </div>

      {/* Helper text */}
      {voiceEnabled && (
        <p className="text-center text-slate-400 text-sm">
          {t('test.voiceHelper')}
        </p>
      )}
    </div>
  );
};
