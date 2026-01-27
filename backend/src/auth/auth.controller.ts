import { Body, Controller, Inject, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { TokenRequestDto } from './dto/token-request.dto';

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post('token')
  @Throttle({ default: { limit: 10, ttl: 60 } })
  issueToken(@Body() body: TokenRequestDto) {
    this.authService.validateSharedSecret(body.sharedSecret ?? '');
    return this.authService.issueToken(body.deviceId);
  }
}
