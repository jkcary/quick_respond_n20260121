import { Controller, Get } from '@nestjs/common';
import { DiagnosticsService } from './diagnostics.service';

@Controller('diagnostics')
export class DiagnosticsController {
  constructor(private readonly diagnosticsService: DiagnosticsService) {}

  @Get('startup')
  getStartup() {
    return { success: true, data: this.diagnosticsService.getStartupTelemetry() };
  }
}
