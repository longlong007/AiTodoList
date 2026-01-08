import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, LoginType, AccountType, SubscriptionStatus } from './entities/user.entity';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private cacheService: CacheService,
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
    // 先从缓存读取
    const cacheKey = this.cacheService.getUserKey(id);
    const cached = await this.cacheService.get<User>(cacheKey);
    
    if (cached) {
      return cached;
    }

    // 缓存未命中，从数据库查询
    const user = await this.userRepository.findOne({ where: { id } });
    
    if (user) {
      // 缓存用户信息30分钟
      await this.cacheService.set(cacheKey, user, 1800);
    }
    
    return user;
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

    const savedUser = await this.userRepository.save(user);
    
    // 缓存新用户信息
    const cacheKey = this.cacheService.getUserKey(savedUser.id);
    await this.cacheService.set(cacheKey, savedUser, 1800);
    
    return savedUser;
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

    const savedUser = await this.userRepository.save(user);
    
    // 缓存新用户信息
    const cacheKey = this.cacheService.getUserKey(savedUser.id);
    await this.cacheService.set(cacheKey, savedUser, 1800);
    
    return savedUser;
  }

  async createOrUpdateWithWechat(wechatOpenId: string, nickname?: string, avatar?: string): Promise<User> {
    let user = await this.findByWechatOpenId(wechatOpenId);
    
    if (user) {
      // 更新用户信息
      if (nickname) user.nickname = nickname;
      if (avatar) user.avatar = avatar;
      const savedUser = await this.userRepository.save(user);
      
      // 清除缓存
      await this.cacheService.del(this.cacheService.getUserKey(savedUser.id));
      
      return savedUser;
    }

    // 创建新用户
    user = this.userRepository.create({
      wechatOpenId,
      loginType: LoginType.WECHAT,
      nickname: nickname || '微信用户',
      avatar,
    });

    const savedUser = await this.userRepository.save(user);
    
    // 缓存新用户信息
    await this.cacheService.set(this.cacheService.getUserKey(savedUser.id), savedUser, 1800);
    
    return savedUser;
  }

  async createOrUpdateWithGoogle(googleId: string, email?: string, nickname?: string, avatar?: string): Promise<User> {
    let user = await this.findByGoogleId(googleId);
    
    if (user) {
      // 更新用户信息
      if (email && !user.email) user.email = email;
      if (nickname) user.nickname = nickname;
      if (avatar) user.avatar = avatar;
      const savedUser = await this.userRepository.save(user);
      
      // 清除缓存
      await this.cacheService.del(this.cacheService.getUserKey(savedUser.id));
      
      return savedUser;
    }

    // 如果邮箱已存在，关联 Google ID
    if (email) {
      const existingUser = await this.findByEmail(email);
      if (existingUser && !existingUser.googleId) {
        existingUser.googleId = googleId;
        if (nickname) existingUser.nickname = nickname;
        if (avatar) existingUser.avatar = avatar;
        const savedUser = await this.userRepository.save(existingUser);
        
        // 清除缓存
        await this.cacheService.del(this.cacheService.getUserKey(savedUser.id));
        
        return savedUser;
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

    const savedUser = await this.userRepository.save(user);
    
    // 缓存新用户信息
    await this.cacheService.set(this.cacheService.getUserKey(savedUser.id), savedUser, 1800);
    
    return savedUser;
  }

  async createOrUpdateWithGithub(githubId: string, email?: string, nickname?: string, avatar?: string): Promise<User> {
    let user = await this.findByGithubId(githubId);
    
    if (user) {
      // 更新用户信息
      if (email && !user.email) user.email = email;
      if (nickname) user.nickname = nickname;
      if (avatar) user.avatar = avatar;
      const savedUser = await this.userRepository.save(user);
      
      // 清除缓存
      await this.cacheService.del(this.cacheService.getUserKey(savedUser.id));
      
      return savedUser;
    }

    // 如果邮箱已存在，关联 GitHub ID
    if (email) {
      const existingUser = await this.findByEmail(email);
      if (existingUser && !existingUser.githubId) {
        existingUser.githubId = githubId;
        if (nickname) existingUser.nickname = nickname;
        if (avatar) existingUser.avatar = avatar;
        const savedUser = await this.userRepository.save(existingUser);
        
        // 清除缓存
        await this.cacheService.del(this.cacheService.getUserKey(savedUser.id));
        
        return savedUser;
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

    const savedUser = await this.userRepository.save(user);
    
    // 缓存新用户信息
    await this.cacheService.set(this.cacheService.getUserKey(savedUser.id), savedUser, 1800);
    
    return savedUser;
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
    const savedUser = await this.userRepository.save(user);
    
    // 清除缓存
    await this.cacheService.del(this.cacheService.getUserKey(userId));
    
    return savedUser;
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
    
    const savedUser = await this.userRepository.save(user);
    
    // 清除用户缓存和Pro状态缓存
    await this.cacheService.del(this.cacheService.getUserKey(userId));
    await this.cacheService.del(this.cacheService.getUserProKey(userId));
    
    return savedUser;
  }

  // 检查用户是否是Pro会员
  async checkProStatus(userId: string): Promise<{ isPro: boolean; expireAt?: Date }> {
    // 先从缓存读取Pro状态
    const cacheKey = this.cacheService.getUserProKey(userId);
    const cached = await this.cacheService.get<{ isPro: boolean; expireAt?: Date }>(cacheKey);
    
    if (cached !== undefined) {
      return cached;
    }

    // 缓存未命中，查询数据库
    const user = await this.findById(userId);
    if (!user) {
      return { isPro: false };
    }

    const isPro = user.isPro();
    const result = {
      isPro,
      expireAt: isPro ? user.subscriptionExpireAt : undefined,
    };
    
    // 缓存Pro状态5分钟
    await this.cacheService.set(cacheKey, result, 300);
    
    return result;
  }
}

