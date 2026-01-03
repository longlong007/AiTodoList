import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, WechatLoginDto } from './dto/auth.dto';

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
}

