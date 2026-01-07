import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, LoginType, AccountType, SubscriptionStatus } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { phone } });
  }

  async findByWechatOpenId(wechatOpenId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { wechatOpenId } });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { googleId } });
  }

  async findByGithubId(githubId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { githubId } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async createWithEmail(email: string, password: string): Promise<User> {
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('该邮箱已被注册');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      loginType: LoginType.EMAIL,
      nickname: email.split('@')[0],
    });

    return this.userRepository.save(user);
  }

  async createWithPhone(phone: string, password: string): Promise<User> {
    const existingUser = await this.findByPhone(phone);
    if (existingUser) {
      throw new ConflictException('该手机号已被注册');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      phone,
      password: hashedPassword,
      loginType: LoginType.PHONE,
      nickname: `用户${phone.slice(-4)}`,
    });

    return this.userRepository.save(user);
  }

  async createOrUpdateWithWechat(wechatOpenId: string, nickname?: string, avatar?: string): Promise<User> {
    let user = await this.findByWechatOpenId(wechatOpenId);
    
    if (user) {
      // 更新用户信息
      if (nickname) user.nickname = nickname;
      if (avatar) user.avatar = avatar;
      return this.userRepository.save(user);
    }

    // 创建新用户
    user = this.userRepository.create({
      wechatOpenId,
      loginType: LoginType.WECHAT,
      nickname: nickname || '微信用户',
      avatar,
    });

    return this.userRepository.save(user);
  }

  async createOrUpdateWithGoogle(googleId: string, email?: string, nickname?: string, avatar?: string): Promise<User> {
    let user = await this.findByGoogleId(googleId);
    
    if (user) {
      // 更新用户信息
      if (email && !user.email) user.email = email;
      if (nickname) user.nickname = nickname;
      if (avatar) user.avatar = avatar;
      return this.userRepository.save(user);
    }

    // 如果邮箱已存在，关联 Google ID
    if (email) {
      const existingUser = await this.findByEmail(email);
      if (existingUser && !existingUser.googleId) {
        existingUser.googleId = googleId;
        if (nickname) existingUser.nickname = nickname;
        if (avatar) existingUser.avatar = avatar;
        return this.userRepository.save(existingUser);
      }
    }

    // 创建新用户
    user = this.userRepository.create({
      googleId,
      email,
      loginType: LoginType.GOOGLE,
      nickname: nickname || email?.split('@')[0] || 'Google用户',
      avatar,
    });

    return this.userRepository.save(user);
  }

  async createOrUpdateWithGithub(githubId: string, email?: string, nickname?: string, avatar?: string): Promise<User> {
    let user = await this.findByGithubId(githubId);
    
    if (user) {
      // 更新用户信息
      if (email && !user.email) user.email = email;
      if (nickname) user.nickname = nickname;
      if (avatar) user.avatar = avatar;
      return this.userRepository.save(user);
    }

    // 如果邮箱已存在，关联 GitHub ID
    if (email) {
      const existingUser = await this.findByEmail(email);
      if (existingUser && !existingUser.githubId) {
        existingUser.githubId = githubId;
        if (nickname) existingUser.nickname = nickname;
        if (avatar) existingUser.avatar = avatar;
        return this.userRepository.save(existingUser);
      }
    }

    // 创建新用户
    user = this.userRepository.create({
      githubId,
      email,
      loginType: LoginType.GITHUB,
      nickname: nickname || email?.split('@')[0] || 'GitHub用户',
      avatar,
    });

    return this.userRepository.save(user);
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    if (!user.password) return false;
    return bcrypt.compare(password, user.password);
  }

  async updateProfile(userId: string, data: Partial<User>): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    Object.assign(user, data);
    return this.userRepository.save(user);
  }

  // 更新订阅状态
  async updateSubscription(userId: string, data: {
    accountType: AccountType;
    subscriptionStatus: SubscriptionStatus;
    subscriptionExpireAt: Date;
  }): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    user.accountType = data.accountType;
    user.subscriptionStatus = data.subscriptionStatus;
    user.subscriptionExpireAt = data.subscriptionExpireAt;
    
    return this.userRepository.save(user);
  }

  // 检查用户是否是Pro会员
  async checkProStatus(userId: string): Promise<{ isPro: boolean; expireAt?: Date }> {
    const user = await this.findById(userId);
    if (!user) {
      return { isPro: false };
    }

    const isPro = user.isPro();
    return {
      isPro,
      expireAt: isPro ? user.subscriptionExpireAt : undefined,
    };
  }
}

