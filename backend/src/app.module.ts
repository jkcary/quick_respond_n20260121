import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { DiagnosticsModule } from './diagnostics/diagnostics.module';
import { LlmModule } from './llm/llm.module';
import { WhisperModule } from './whisper/whisper.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { HttpLoggerMiddleware } from './common/middleware/http-logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: Number(process.env.RATE_LIMIT_TTL ?? 60),
          limit: Number(process.env.RATE_LIMIT_LIMIT ?? 60),
        },
      ],
    }),
    AuthModule,
    DiagnosticsModule,
    LlmModule,
    WhisperModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware, HttpLoggerMiddleware).forRoutes('*');
  }
}
