import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { User } from '../user/entities/user.entity';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private cacheService: CacheService,
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

  /**
   * 使用验证码登录（免密登录）
   */
  async loginWithPhoneCode(phone: string) {
    if (!this.isValidPhone(phone)) {
      throw new BadRequestException('手机号格式不正确');
    }

    const user = await this.userService.findByPhone(phone);
    if (!user) {
      throw new UnauthorizedException('用户不存在，请先注册');
    }

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

  /**
   * 登出 - 将token加入黑名单
   */
  async logout(token: string): Promise<void> {
    try {
      // 解析token获取过期时间
      const decoded = this.jwtService.decode(token) as any;
      if (!decoded || !decoded.exp) {
        return;
      }

      // 计算token剩余有效时间
      const now = Math.floor(Date.now() / 1000);
      const ttl = decoded.exp - now;

      if (ttl > 0) {
        // 将token加入黑名单，TTL为token剩余有效时间
        const blacklistKey = this.cacheService.getJwtBlacklistKey(token);
        await this.cacheService.set(blacklistKey, true, ttl);
        console.log(`✅ Token已加入黑名单，TTL: ${ttl}秒`);
      }
    } catch (error) {
      console.error('登出失败:', error);
    }
  }

  /**
   * 检查token是否在黑名单中
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const blacklistKey = this.cacheService.getJwtBlacklistKey(token);
    const isBlacklisted = await this.cacheService.get(blacklistKey);
    return !!isBlacklisted;
  }
}

