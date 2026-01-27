import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JudgeDto } from './dto/judge.dto';
import { SegmentDto } from './dto/segment.dto';
import { CorrectTranscriptDto } from './dto/correct-transcript.dto';
import { LlmKeyDto } from './dto/llm-key.dto';
import { LlmBaseUrlDto } from './dto/llm-base-url.dto';
import { JudgeBatchDto } from './dto/judge-batch.dto';
import { SegmentAndJudgeDto } from './dto/segment-and-judge.dto';
import { LlmService } from './llm.service';
import { LlmProvider } from './llm.types';
import type { Request } from 'express';

const parseProvider = (value?: string): LlmProvider | undefined => {
  if (!value) {
    return undefined;
  }
  const providers = Object.values(LlmProvider);
  if (providers.includes(value as LlmProvider)) {
    return value as LlmProvider;
  }
  throw new BadRequestException('Invalid provider');
};

@Controller('llm')
@UseGuards(JwtAuthGuard)
export class LlmController {
  constructor(@Inject(LlmService) private readonly llmService: LlmService) {}

  @Post('key')
  @Throttle({ default: { limit: 10, ttl: 60 } })
  async setKey(@Req() req: Request, @Body() body: LlmKeyDto) {
    const deviceId = (req as Request & { user?: { sub?: string } }).user?.sub ?? 'anonymous';
    this.llmService.setApiKey(deviceId, body.provider, body.apiKey ?? '');
    return { success: true };
  }

  @Post('base-url')
  @Throttle({ default: { limit: 10, ttl: 60 } })
  async setBaseUrl(@Req() req: Request, @Body() body: LlmBaseUrlDto) {
    const deviceId = (req as Request & { user?: { sub?: string } }).user?.sub ?? 'anonymous';
    this.llmService.setBaseUrl(deviceId, body.provider, body.baseUrl ?? '');
    return { success: true };
  }

  @Post('judge')
  @Throttle({ default: { limit: 30, ttl: 60 } })
  async judge(@Req() req: Request, @Body() body: JudgeDto) {
    const deviceId = (req as Request & { user?: { sub?: string } }).user?.sub ?? 'anonymous';
    const result = await this.llmService.judge(
      body.provider,
      body.word,
      body.userInput,
      body.model,
      deviceId,
    );
    return { success: true, data: result };
  }

  @Post('segment')
  @Throttle({ default: { limit: 20, ttl: 60 } })
  async segment(@Req() req: Request, @Body() body: SegmentDto) {
    const deviceId = (req as Request & { user?: { sub?: string } }).user?.sub ?? 'anonymous';
    const targetCount = body.targetCount ?? body.words.length;
    const result = await this.llmService.segment(
      body.provider,
      body.transcript,
      body.words,
      targetCount,
      body.model,
      deviceId,
    );
    return { success: true, data: result };
  }

  @Post('correct-transcript')
  @Throttle({ default: { limit: 20, ttl: 60 } })
  async correctTranscript(@Req() req: Request, @Body() body: CorrectTranscriptDto) {
    const deviceId = (req as Request & { user?: { sub?: string } }).user?.sub ?? 'anonymous';
    const targetCount = body.targetCount ?? body.words.length;
    const result = await this.llmService.correctTranscript(
      body.provider,
      body.transcript,
      body.words,
      targetCount,
      body.model,
      deviceId,
    );
    return { success: true, data: result };
  }

  @Post('judge-batch')
  @Throttle({ default: { limit: 20, ttl: 60 } })
  async judgeBatch(@Req() req: Request, @Body() body: JudgeBatchDto) {
    const deviceId = (req as Request & { user?: { sub?: string } }).user?.sub ?? 'anonymous';
    const result = await this.llmService.judgeBatch(
      body.provider,
      body.entries,
      body.model,
      deviceId,
    );
    return { success: true, data: result };
  }

  @Post('segment-and-judge')
  @Throttle({ default: { limit: 20, ttl: 60 } })
  async segmentAndJudge(@Req() req: Request, @Body() body: SegmentAndJudgeDto) {
    const deviceId = (req as Request & { user?: { sub?: string } }).user?.sub ?? 'anonymous';
    const targetCount = body.targetCount ?? body.words.length;
    const result = await this.llmService.segmentAndJudge(
      body.provider,
      body.transcript,
      body.words,
      targetCount,
      body.model,
      deviceId,
    );
    return { success: true, data: result };
  }

  @Get('status')
  async status(@Req() req: Request, @Query('provider') provider?: string) {
    const deviceId = (req as Request & { user?: { sub?: string } }).user?.sub ?? 'anonymous';
    const parsed = parseProvider(provider);
    const status = this.llmService.getConfigStatus(deviceId, parsed);
    return { success: true, data: status };
  }
}
