import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { LlmProvider } from '../llm.types';

export class JudgeDto {
  @IsEnum(LlmProvider)
  provider!: LlmProvider;

  @IsString()
  @IsNotEmpty()
  word!: string;

  @IsString()
  userInput!: string;

  @IsString()
  @IsOptional()
  model?: string;
}
