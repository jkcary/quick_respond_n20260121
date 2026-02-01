import {
  Controller,
  Post,
  Get,
  UseInterceptors,
  UploadedFile,
  Body,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { WhisperService } from './whisper.service';
import { TranscribeDto, TranscriptionResult, WhisperHealthStatus } from './whisper.dto';

@Controller('whisper')
export class WhisperController {
  private readonly logger = new Logger(WhisperController.name);

  constructor(private readonly whisperService: WhisperService) {}

  @Get('health')
  async checkHealth(): Promise<WhisperHealthStatus> {
    return this.whisperService.checkHealth();
  }

  @Post('transcribe')
  @UseInterceptors(
    FileInterceptor('audio', {
      limits: {
        fileSize: 25 * 1024 * 1024, // 25MB max
      },
    }),
  )
  async transcribe(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: TranscribeDto,
  ): Promise<TranscriptionResult> {
    if (!file) {
      throw new HttpException('No audio file provided', HttpStatus.BAD_REQUEST);
    }

    this.logger.log(`Received audio file: ${file.originalname}, size: ${file.size} bytes, language: ${dto.language}`);

    try {
      const result = await this.whisperService.transcribe(
        file.buffer,
        file.originalname || 'audio.webm',
        dto.language || 'zh',
      );

      return result;
    } catch (error) {
      this.logger.error('Transcription failed', error);
      throw new HttpException(
        error instanceof Error ? error.message : 'Transcription failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
