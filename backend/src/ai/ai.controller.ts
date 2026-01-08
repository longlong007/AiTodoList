import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RateLimitGuard, RateLimit } from '../common/guards/rate-limit.guard';
import { AiService } from './ai.service';

@Controller('ai')
@UseGuards(JwtAuthGuard, RateLimitGuard)
export class AiController {
  constructor(private aiService: AiService) {}

  @Get('analyze')
  @RateLimit(3, 3600) // 每小时最多3次
  async analyzeHistory(@Request() req) {
    const analysis = await this.aiService.analyzeHistory(req.user.userId);
    return { analysis };
  }
}

