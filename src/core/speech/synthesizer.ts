/**
 * Text-to-speech synthesizer using Web Speech API
 * Plays English word pronunciation
 */

import { isSpeechSynthesisSupported } from './permissions';

export interface SynthesizerConfig {
  language?: string;
  rate?: number; // 0.1 to 10
  pitch?: number; // 0 to 2
  volume?: number; // 0 to 1
}

export class SpeechSynthesizer {
  private synth: SpeechSynthesis;
  private config: SynthesizerConfig;

  constructor(config: SynthesizerConfig = {}) {
    if (!isSpeechSynthesisSupported()) {
      throw new Error('Speech synthesis is not supported in this browser');
    }

    this.synth = window.speechSynthesis;
    this.config = {
      language: 'en-US', // English pronunciation
      rate: 1.0, // Normal speed
      pitch: 1.0, // Normal pitch
      volume: 1.0, // Full volume
      ...config,
    };
  }

  /**
   * Speak text
   */
  async speak(text: string): Promise<void> {
    // Cancel any ongoing speech
    this.cancel();

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);

      // Apply configuration
      utterance.lang = this.config.language!;
      utterance.rate = this.config.rate!;
      utterance.pitch = this.config.pitch!;
      utterance.volume = this.config.volume!;

      // Try to select a native voice for the language
      const voices = this.synth.getVoices();
      const voice = voices.find((v) => v.lang.startsWith(this.config.language!.split('-')[0]));
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => {
        resolve();
      };

      utterance.onerror = (event) => {
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      this.synth.speak(utterance);
    });
  }

  /**
   * Pause ongoing speech
   */
  pause(): void {
    if (this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
    }
  }

  /**
   * Resume paused speech
   */
  resume(): void {
    if (this.synth.paused) {
      this.synth.resume();
    }
  }

  /**
   * Cancel ongoing speech
   */
  cancel(): void {
    if (this.synth.speaking) {
      this.synth.cancel();
    }
  }

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    return this.synth.speaking;
  }

  /**
   * Check if paused
   */
  isPaused(): boolean {
    return this.synth.paused;
  }

  /**
   * Get available voices
   */
  getVoices(): SpeechSynthesisVoice[] {
    return this.synth.getVoices();
  }

  /**
   * Get voices for specific language
   */
  getVoicesForLanguage(language: string): SpeechSynthesisVoice[] {
    const voices = this.getVoices();
    const langPrefix = language.split('-')[0];
    return voices.filter((voice) => voice.lang.startsWith(langPrefix));
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SynthesizerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Wait for voices to be loaded (some browsers load async)
   */
  async waitForVoices(): Promise<SpeechSynthesisVoice[]> {
    return new Promise((resolve) => {
      const voices = this.synth.getVoices();
      if (voices.length > 0) {
        resolve(voices);
        return;
      }

      // Wait for voiceschanged event
      const handler = () => {
        const loadedVoices = this.synth.getVoices();
        if (loadedVoices.length > 0) {
          this.synth.removeEventListener('voiceschanged', handler);
          resolve(loadedVoices);
        }
      };

      this.synth.addEventListener('voiceschanged', handler);

      // Timeout after 3 seconds
      setTimeout(() => {
        this.synth.removeEventListener('voiceschanged', handler);
        resolve(this.synth.getVoices());
      }, 3000);
    });
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.cancel();
  }
}

/**
 * Convenience function for one-time speech
 */
export async function speakText(text: string, config?: SynthesizerConfig): Promise<void> {
  const synthesizer = new SpeechSynthesizer(config);
  try {
    await synthesizer.speak(text);
  } finally {
    synthesizer.destroy();
  }
}
