import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LlmProvider } from '../llm.types';

class JudgeBatchItemDto {
  @IsString()
  @IsNotEmpty()
  word!: string;

  @IsString()
  userInput!: string;
}

export class JudgeBatchDto {
  @IsEnum(LlmProvider)
  provider!: LlmProvider;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => JudgeBatchItemDto)
  entries!: JudgeBatchItemDto[];

  @IsString()
  @IsOptional()
  model?: string;
}
