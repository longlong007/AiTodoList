import { Controller, Get, Put, Body, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserService } from './user.service';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Get('profile')
  async getProfile(@Request() req) {
    const user = await this.userService.findById(req.user.userId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    const { password, ...result } = user;
    return result;
  }

  @Put('profile')
  async updateProfile(@Request() req, @Body() body: { nickname?: string; avatar?: string }) {
    const user = await this.userService.updateProfile(req.user.userId, body);
    const { password, ...result } = user;
    return result;
  }
}

