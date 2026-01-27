import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class TokenRequestDto {
  @IsString()
  @IsNotEmpty()
  deviceId!: string;

  @IsString()
  @IsOptional()
  sharedSecret?: string;
}
