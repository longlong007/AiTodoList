import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, LoginType } from './entities/user.entity';

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
}

