import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  validateSharedSecret(sharedSecret: string): void {
    const expected = this.configService.get<string>('AUTH_SHARED_SECRET');
    if (!expected || expected.trim().length === 0) {
      return;
    }
    if (!sharedSecret || sharedSecret !== expected) {
      throw new UnauthorizedException('Invalid shared secret');
    }
  }

  issueToken(deviceId: string) {
    const payload = {
      sub: deviceId,
      type: 'device',
    };
    const accessToken = this.jwtService.sign(payload);
    const expiresIn = Number(
      this.configService.get<string>('TOKEN_TTL_SECONDS') ?? 900,
    );

    return { accessToken, expiresIn };
  }
}
