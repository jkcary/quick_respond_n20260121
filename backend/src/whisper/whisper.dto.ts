import { IsOptional, IsString } from 'class-validator';

export class TranscribeDto {
  @IsString()
  @IsOptional()
  language?: string = 'zh';
}

export interface TranscriptionResult {
  text: string;
  language: string;
  duration: number;
  segments: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

export interface WhisperHealthStatus {
  status: string;
  provider: string;
  available: boolean;
}
