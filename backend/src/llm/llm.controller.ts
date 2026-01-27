import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JudgeDto } from './dto/judge.dto';
import { SegmentDto } from './dto/segment.dto';
import { LlmKeyDto } from './dto/llm-key.dto';
import { LlmBaseUrlDto } from './dto/llm-base-url.dto';
import { LlmService } from './llm.service';
import type { Request } from 'express';

@Controller('llm')
@UseGuards(JwtAuthGuard)
export class LlmController {
  constructor(private readonly llmService: LlmService) {}

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
}
