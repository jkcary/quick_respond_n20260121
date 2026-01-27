import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LlmProvider } from '../llm.types';

class CorrectTranscriptWordDto {
  @IsNumber()
  index!: number;

  @IsString()
  @IsNotEmpty()
  word!: string;

  @IsArray()
  @IsOptional()
  hints?: string[];
}

export class CorrectTranscriptDto {
  @IsEnum(LlmProvider)
  provider!: LlmProvider;

  @IsString()
  @IsNotEmpty()
  transcript!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CorrectTranscriptWordDto)
  words!: CorrectTranscriptWordDto[];

  @IsNumber()
  @IsOptional()
  targetCount?: number;

  @IsString()
  @IsOptional()
  model?: string;
}
