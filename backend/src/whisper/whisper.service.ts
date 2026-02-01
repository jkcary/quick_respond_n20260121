import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TranscriptionResult, WhisperHealthStatus } from './whisper.dto';
import axios from 'axios';
import FormData from 'form-data';

@Injectable()
export class WhisperService {
  private readonly logger = new Logger(WhisperService.name);
  private readonly groqApiKey: string | undefined;
  private readonly groqBaseUrl = 'https://api.groq.com/openai/v1';

  constructor(private configService: ConfigService) {
    this.groqApiKey = this.configService.get<string>('GROQ_API_KEY');
    if (!this.groqApiKey) {
      this.logger.warn('GROQ_API_KEY not configured - Whisper transcription will not be available');
    }
  }

  async checkHealth(): Promise<WhisperHealthStatus> {
    if (!this.groqApiKey) {
      return {
        status: 'unavailable',
        provider: 'groq',
        available: false,
      };
    }

    try {
      // Test with a simple models list request
      const response = await axios.get(`${this.groqBaseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.groqApiKey}`,
        },
        timeout: 5000,
      });

      if (response.status === 200) {
        return {
          status: 'healthy',
          provider: 'groq',
          available: true,
        };
      }

      return {
        status: 'error',
        provider: 'groq',
        available: false,
      };
    } catch (error) {
      this.logger.error('Health check failed', error);
      return {
        status: 'unavailable',
        provider: 'groq',
        available: false,
      };
    }
  }

  async transcribe(
    audioBuffer: Buffer,
    filename: string,
    language: string = 'zh',
  ): Promise<TranscriptionResult> {
    if (!this.groqApiKey) {
      throw new Error('Whisper service not configured - GROQ_API_KEY missing');
    }

    const startTime = Date.now();

    // Create form data with the audio file
    const formData = new FormData();
    formData.append('file', audioBuffer, {
      filename: filename,
      contentType: this.getMimeType(filename),
    });
    formData.append('model', 'whisper-large-v3-turbo');
    formData.append('language', language);
    formData.append('response_format', 'verbose_json');

    try {
      const response = await axios.post(
        `${this.groqBaseUrl}/audio/transcriptions`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${this.groqApiKey}`,
            ...formData.getHeaders(),
          },
          timeout: 30000,
        },
      );

      const data = response.data;
      const duration = (Date.now() - startTime) / 1000;

      this.logger.log(`Transcription completed in ${duration.toFixed(2)}s: "${data.text?.substring(0, 50)}..."`);

      return {
        text: data.text || '',
        language: data.language || language,
        duration: data.duration || duration,
        segments: (data.segments || []).map((seg: any) => ({
          start: seg.start || 0,
          end: seg.end || 0,
          text: seg.text || '',
        })),
      };
    } catch (error) {
      this.logger.error('Transcription failed', error);
      throw error;
    }
  }

  private getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      webm: 'audio/webm',
      mp3: 'audio/mpeg',
      mp4: 'audio/mp4',
      m4a: 'audio/m4a',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
      flac: 'audio/flac',
    };
    return mimeTypes[ext || ''] || 'audio/webm';
  }
}
