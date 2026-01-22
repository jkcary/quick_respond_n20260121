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
  async start(): Promise<SpeechResult> {
    if (!this.recognition) {
      throw new Error('Speech recognition not initialized');
    }

    if (this.isListening) {
      throw new Error('Already listening');
    }

    return new Promise((resolve, reject) => {
      this.isListening = true;

      this.recognition!.onresult = (event: SpeechRecognitionEvent) => {
        const result = event.results[event.results.length - 1];
        const alternative = result[0];

        const speechResult: SpeechResult = {
          transcript: alternative.transcript,
          confidence: alternative.confidence,
          isFinal: result.isFinal,
        };

        // Resolve with final result
        if (result.isFinal) {
          this.isListening = false;
          resolve(speechResult);
        }
      };

      this.recognition!.onerror = (event: SpeechRecognitionErrorEvent) => {
        this.isListening = false;

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

        reject(new Error(errorMessage));
      };

      this.recognition!.onend = () => {
        this.isListening = false;
      };

      try {
        this.recognition!.start();
      } catch (error) {
        this.isListening = false;
        reject(error);
      }
    });
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
