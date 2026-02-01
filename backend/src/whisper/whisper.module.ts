import { Module } from '@nestjs/common';
import { WhisperController } from './whisper.controller';
import { WhisperService } from './whisper.service';

@Module({
  controllers: [WhisperController],
  providers: [WhisperService],
  exports: [WhisperService],
})
export class WhisperModule {}
