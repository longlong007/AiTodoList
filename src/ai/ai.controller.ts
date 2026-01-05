import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiService } from './ai.service';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private aiService: AiService) {}

  @Get('analyze')
  async analyzeHistory(@Request() req) {
    const analysis = await this.aiService.analyzeHistory(req.user.userId);
    return { analysis };
  }
}

