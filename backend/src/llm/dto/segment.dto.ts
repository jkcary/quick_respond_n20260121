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

class SegmentWordDto {
  @IsNumber()
  index!: number;

  @IsString()
  @IsNotEmpty()
  word!: string;

  @IsArray()
  @IsOptional()
  hints?: string[];
}

export class SegmentDto {
  @IsEnum(LlmProvider)
  provider!: LlmProvider;

  @IsString()
  @IsNotEmpty()
  transcript!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SegmentWordDto)
  words!: SegmentWordDto[];

  @IsNumber()
  @IsOptional()
  targetCount?: number;

  @IsString()
  @IsOptional()
  model?: string;
}
