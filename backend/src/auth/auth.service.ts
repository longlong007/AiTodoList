import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { User } from '../user/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(identifier: string, password: string, type: 'email' | 'phone'): Promise<User> {
    let user: User | null;
    
    if (type === 'email') {
      user = await this.userService.findByEmail(identifier);
    } else {
      user = await this.userService.findByPhone(identifier);
    }

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    const isPasswordValid = await this.userService.validatePassword(user, password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('密码错误');
    }

    return user;
  }

  async login(user: User) {
    const payload = { 
      sub: user.id, 
      email: user.email,
      phone: user.phone,
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar,
        loginType: user.loginType,
        accountType: user.accountType,
        isPro: user.isPro(),
        subscriptionExpireAt: user.subscriptionExpireAt,
      },
    };
  }

  async registerWithEmail(email: string, password: string) {
    if (!this.isValidEmail(email)) {
      throw new BadRequestException('邮箱格式不正确');
    }
    if (password.length < 6) {
      throw new BadRequestException('密码长度至少为6位');
    }

    const user = await this.userService.createWithEmail(email, password);
    return this.login(user);
  }

  async registerWithPhone(phone: string, password: string) {
    if (!this.isValidPhone(phone)) {
      throw new BadRequestException('手机号格式不正确');
    }
    if (password.length < 6) {
      throw new BadRequestException('密码长度至少为6位');
    }

    const user = await this.userService.createWithPhone(phone, password);
    return this.login(user);
  }

  async loginWithEmail(email: string, password: string) {
    const user = await this.validateUser(email, password, 'email');
    return this.login(user);
  }

  async loginWithPhone(phone: string, password: string) {
    const user = await this.validateUser(phone, password, 'phone');
    return this.login(user);
  }

  async loginWithWechat(code: string) {
    // 这里需要调用微信API获取openId
    // 实际项目中需要配置微信开放平台
    // 这里仅作示例
    const wechatOpenId = `wx_${code}`;
    const user = await this.userService.createOrUpdateWithWechat(wechatOpenId);
    return this.login(user);
  }

  async loginWithGoogle(googleUser: { googleId: string; email?: string; nickname?: string; avatar?: string }) {
    const user = await this.userService.createOrUpdateWithGoogle(
      googleUser.googleId,
      googleUser.email,
      googleUser.nickname,
      googleUser.avatar,
    );
    return this.login(user);
  }

  async loginWithGithub(githubUser: { githubId: string; email?: string; nickname?: string; avatar?: string }) {
    const user = await this.userService.createOrUpdateWithGithub(
      githubUser.githubId,
      githubUser.email,
      githubUser.nickname,
      githubUser.avatar,
    );
    return this.login(user);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }
}

