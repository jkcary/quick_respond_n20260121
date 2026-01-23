/**
 * Speech-to-text recognizer using Web Speech API
 * Captures Chinese voice input
 */

import { isSpeechRecognitionSupported } from './permissions';

export interface SpeechResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface RecognizerConfig {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export interface StartOptions {
  /** Timeout for detecting the start of speech (ms). */
  speechStartTimeoutMs?: number;
}

export interface ContinuousHandlers {
  onResult: (result: SpeechResult) => void;
  onError?: (error: Error) => void;
  onSpeechStart?: () => void;
  onSoundStart?: () => void;
  onEnd?: () => void;
}

type SpeechRecognitionType = typeof SpeechRecognition | typeof webkitSpeechRecognition;

export class SpeechRecognizer {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private config: RecognizerConfig;

  constructor(config: RecognizerConfig = {}) {
    this.config = {
      language: 'zh-CN', // Chinese input
      continuous: false, // Single utterance
      interimResults: true, // Show real-time results
      maxAlternatives: 1,
      ...config,
    };

    if (!isSpeechRecognitionSupported()) {
      throw new Error('Speech recognition is not supported in this browser');
    }

    this.initializeRecognition();
  }

  private initializeRecognition(): void {
    const SpeechRecognitionAPI = (window.SpeechRecognition ||
      window.webkitSpeechRecognition) as SpeechRecognitionType;

    this.recognition = new SpeechRecognitionAPI();
    this.recognition.lang = this.config.language!;
    this.recognition.continuous = this.config.continuous!;
    this.recognition.interimResults = this.config.interimResults!;
    this.recognition.maxAlternatives = this.config.maxAlternatives!;
  }

  /**
   * Start listening for speech
   */
  async start(options: StartOptions = {}): Promise<SpeechResult> {
    if (!this.recognition) {
      throw new Error('Speech recognition not initialized');
    }

    if (this.isListening) {
      throw new Error('Already listening');
    }

    return new Promise((resolve, reject) => {
      this.isListening = true;
      let settled = false;
      let timeoutId: number | null = null;
      let lastTranscript = '';
      let lastConfidence = 0;

      const clearTimeoutIfNeeded = () => {
        if (timeoutId !== null) {
          window.clearTimeout(timeoutId);
          timeoutId = null;
        }
      };

      const finalizeResolve = (result: SpeechResult) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeoutIfNeeded();
        this.isListening = false;
        resolve(result);
      };

      const finalizeReject = (error: unknown) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeoutIfNeeded();
        this.isListening = false;
        reject(error);
      };

      const markSpeechDetected = () => {
        clearTimeoutIfNeeded();
      };

      this.recognition!.onresult = (event: SpeechRecognitionEvent) => {
        markSpeechDetected();
        const result = event.results[event.results.length - 1];
        const alternative = result[0];

        lastTranscript = alternative.transcript;
        lastConfidence = alternative.confidence;

        const speechResult: SpeechResult = {
          transcript: alternative.transcript,
          confidence: alternative.confidence,
          isFinal: result.isFinal,
        };

        // Resolve with final result
        if (result.isFinal) {
          finalizeResolve(speechResult);
        }
      };

      this.recognition!.onspeechstart = markSpeechDetected;
      this.recognition!.onsoundstart = markSpeechDetected;

      this.recognition!.onerror = (event: SpeechRecognitionErrorEvent) => {
        let errorMessage = event.error;
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected';
            break;
          case 'audio-capture':
            errorMessage = 'No microphone found';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone permission denied';
            break;
          case 'network':
            errorMessage = 'Network error occurred';
            break;
        }

        finalizeReject(new Error(errorMessage));
      };

      this.recognition!.onend = () => {
        this.isListening = false;
        clearTimeoutIfNeeded();
        if (!settled) {
          finalizeResolve({
            transcript: lastTranscript,
            confidence: lastConfidence,
            isFinal: false,
          });
        }
      };

      if (options.speechStartTimeoutMs && options.speechStartTimeoutMs > 0) {
        timeoutId = window.setTimeout(() => {
          if (settled || !this.isListening) {
            return;
          }
          const timeoutError = new Error('No speech detected within timeout');
          timeoutError.name = 'speech-timeout';
          this.recognition?.abort();
          finalizeReject(timeoutError);
        }, options.speechStartTimeoutMs);
      }

      try {
        this.recognition!.start();
      } catch (error) {
        finalizeReject(error);
      }
    });
  }

  /**
   * Start continuous listening with event handlers
   */
  startContinuous(handlers: ContinuousHandlers, options: StartOptions = {}): void {
    if (!this.recognition) {
      throw new Error('Speech recognition not initialized');
    }

    if (this.isListening) {
      throw new Error('Already listening');
    }

    this.isListening = true;
    this.config = { ...this.config, continuous: true };
    this.recognition.continuous = true;

    let timeoutId: number | null = null;
    let speechDetected = false;

    const clearTimeoutIfNeeded = () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const markSpeechDetected = () => {
      speechDetected = true;
      clearTimeoutIfNeeded();
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1];
      const alternative = result[0];

      const speechResult: SpeechResult = {
        transcript: alternative.transcript,
        confidence: alternative.confidence,
        isFinal: result.isFinal,
      };

      handlers.onResult(speechResult);
    };

    this.recognition.onspeechstart = () => {
      markSpeechDetected();
      handlers.onSpeechStart?.();
    };

    this.recognition.onsoundstart = () => {
      markSpeechDetected();
      handlers.onSoundStart?.();
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      let errorMessage = event.error;
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected';
          break;
        case 'audio-capture':
          errorMessage = 'No microphone found';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone permission denied';
          break;
        case 'network':
          errorMessage = 'Network error occurred';
          break;
      }

      handlers.onError?.(new Error(errorMessage));
    };

    this.recognition.onend = () => {
      this.isListening = false;
      clearTimeoutIfNeeded();
      handlers.onEnd?.();
    };

    if (options.speechStartTimeoutMs && options.speechStartTimeoutMs > 0) {
      timeoutId = window.setTimeout(() => {
        if (speechDetected || !this.isListening) {
          return;
        }
        const timeoutError = new Error('No speech detected within timeout');
        timeoutError.name = 'speech-timeout';
        this.recognition?.abort();
        handlers.onError?.(timeoutError);
      }, options.speechStartTimeoutMs);
    }

    this.recognition.start();
  }

  /**
   * Stop listening
   */
  stop(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  /**
   * Abort listening (immediate)
   */
  abort(): void {
    if (this.recognition && this.isListening) {
      this.recognition.abort();
      this.isListening = false;
    }
  }

  /**
   * Check if currently listening
   */
  getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RecognizerConfig>): void {
    this.config = { ...this.config, ...config };
    this.initializeRecognition();
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.abort();
    this.recognition = null;
  }
}

/**
 * Convenience function for one-time recognition
 */
export async function recognizeSpeech(language = 'zh-CN'): Promise<string> {
  const recognizer = new SpeechRecognizer({ language });
  try {
    const result = await recognizer.start();
    return result.transcript;
  } finally {
    recognizer.destroy();
  }
}
