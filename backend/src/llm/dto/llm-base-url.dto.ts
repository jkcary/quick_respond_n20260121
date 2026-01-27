import { IsEnum, IsString } from 'class-validator';
import { LlmProvider } from '../llm.types';

export class LlmBaseUrlDto {
  @IsEnum(LlmProvider)
  provider!: LlmProvider;

  @IsString()
  baseUrl!: string;
}
