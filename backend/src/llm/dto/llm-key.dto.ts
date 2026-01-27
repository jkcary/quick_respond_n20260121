import { IsEnum, IsString } from 'class-validator';
import { LlmProvider } from '../llm.types';

export class LlmKeyDto {
  @IsEnum(LlmProvider)
  provider!: LlmProvider;

  @IsString()
  apiKey!: string;
}
