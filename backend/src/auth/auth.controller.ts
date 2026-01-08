import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards, Req, Res, Headers } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, WechatLoginDto } from './dto/auth.dto';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register/email')
  async registerWithEmail(@Body() dto: RegisterDto) {
    return this.authService.registerWithEmail(dto.identifier, dto.password);
  }

  @Post('register/phone')
  async registerWithPhone(@Body() dto: RegisterDto) {
    return this.authService.registerWithPhone(dto.identifier, dto.password);
  }

  @Post('login/email')
  @HttpCode(HttpStatus.OK)
  async loginWithEmail(@Body() dto: LoginDto) {
    return this.authService.loginWithEmail(dto.identifier, dto.password);
  }

  @Post('login/phone')
  @HttpCode(HttpStatus.OK)
  async loginWithPhone(@Body() dto: LoginDto) {
    return this.authService.loginWithPhone(dto.identifier, dto.password);
  }

  @Post('login/wechat')
  @HttpCode(HttpStatus.OK)
  async loginWithWechat(@Body() dto: WechatLoginDto) {
    return this.authService.loginWithWechat(dto.code);
  }

  // Google OAuth
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates the Google OAuth2 login flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req, @Res() res: Response) {
    const result = await this.authService.loginWithGoogle(req.user);
    
    // 重定向到前端，携带 token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/callback?token=${result.access_token}`);
  }

  // GitHub OAuth
  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubAuth() {
    // Initiates the GitHub OAuth2 login flow
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubAuthCallback(@Req() req, @Res() res: Response) {
    const result = await this.authService.loginWithGithub(req.user);
    
    // 重定向到前端，携带 token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/callback?token=${result.access_token}`);
  }

  // 登出
  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async logout(@Headers('authorization') authorization: string) {
    if (authorization && authorization.startsWith('Bearer ')) {
      const token = authorization.substring(7);
      await this.authService.logout(token);
    }
    return { message: '登出成功' };
  }
}

