import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../cache/cache.service';

// 阿里云短信SDK - 使用动态导入以兼容不同版本
let SMSClient: any;
try {
  SMSClient = require('@alicloud/sms-sdk');
} catch (error) {
  // 如果包不存在，将在运行时处理
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private smsClient: any; // 使用 any 类型以兼容动态导入
  private readonly accessKeyId: string;
  private readonly accessKeySecret: string;
  private readonly signName: string;
  private readonly templateCode: string;

  constructor(
    private configService: ConfigService,
    private cacheService: CacheService,
  ) {
    this.accessKeyId = this.configService.get('ALIYUN_SMS_ACCESS_KEY_ID', '');
    this.accessKeySecret = this.configService.get('ALIYUN_SMS_ACCESS_KEY_SECRET', '');
    this.signName = this.configService.get('ALIYUN_SMS_SIGN_NAME', '');
    this.templateCode = this.configService.get('ALIYUN_SMS_TEMPLATE_CODE', '');

    if (this.accessKeyId && this.accessKeySecret) {
      if (SMSClient) {
        this.smsClient = new SMSClient({
          accessKeyId: this.accessKeyId,
          secretAccessKey: this.accessKeySecret,
        });
        this.logger.log('✅ 已初始化阿里云短信服务');
      } else {
        this.logger.warn('⚠️  短信SDK未安装，将使用模拟模式');
      }
    } else {
      this.logger.warn('⚠️  未配置阿里云短信服务，将使用模拟模式');
    }
  }

  /**
   * 生成6位数字验证码
   */
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * 获取验证码缓存键
   */
  private getCodeKey(phone: string, type: 'register' | 'login'): string {
    return `sms:code:${type}:${phone}`;
  }

  /**
   * 获取发送频率限制键
   */
  private getRateLimitKey(phone: string): string {
    return `sms:ratelimit:${phone}`;
  }

  /**
   * 发送验证码
   * @param phone 手机号
   * @param type 验证码类型：register（注册）或 login（登录）
   */
  async sendCode(phone: string, type: 'register' | 'login' = 'register'): Promise<void> {
    // 验证手机号格式
    if (!this.isValidPhone(phone)) {
      throw new BadRequestException('手机号格式不正确');
    }

    // 检查发送频率限制（60秒内只能发送一次）
    const rateLimitKey = this.getRateLimitKey(phone);
    const lastSendTime = await this.cacheService.get<number>(rateLimitKey);
    if (lastSendTime) {
      const timeLeft = 60 - Math.floor((Date.now() - lastSendTime) / 1000);
      if (timeLeft > 0) {
        throw new BadRequestException(`发送过于频繁，请${timeLeft}秒后再试`);
      }
    }

    // 生成验证码
    const code = this.generateCode();
    const codeKey = this.getCodeKey(phone, type);

    // 如果是开发环境且未配置短信服务，使用模拟模式
    if (!this.smsClient || process.env.NODE_ENV === 'development') {
      this.logger.warn(`[模拟模式] 手机号 ${phone} 的${type === 'register' ? '注册' : '登录'}验证码: ${code}`);
      // 存储验证码（5分钟有效）
      await this.cacheService.set(codeKey, code, 300);
      // 记录发送时间
      await this.cacheService.set(rateLimitKey, Date.now(), 60);
      return;
    }

    try {
      // 调用阿里云短信服务发送验证码
      // 注意：@alicloud/sms-sdk的API可能因版本而异，这里使用通用格式
      const response = await this.smsClient.sendSMS({
        PhoneNumbers: phone,
        SignName: this.signName,
        TemplateCode: this.templateCode,
        TemplateParam: JSON.stringify({ code }),
      });

      // 检查响应格式（不同版本的SDK响应格式可能不同）
      const isSuccess = response.Code === 'OK' || response.code === 'OK' || response.body?.Code === 'OK';
      
      if (isSuccess) {
        // 存储验证码（5分钟有效）
        await this.cacheService.set(codeKey, code, 300);
        // 记录发送时间
        await this.cacheService.set(rateLimitKey, Date.now(), 60);
        this.logger.log(`✅ 验证码已发送到 ${phone}`);
      } else {
        const errorMsg = response.Message || response.message || response.body?.Message || '未知错误';
        this.logger.error(`❌ 短信发送失败: ${errorMsg}`);
        throw new BadRequestException(`短信发送失败: ${errorMsg}`);
      }
    } catch (error) {
      this.logger.error(`❌ 短信发送异常: ${error.message}`, error.stack);
      throw new BadRequestException(`短信发送失败: ${error.message}`);
    }
  }

  /**
   * 验证验证码
   * @param phone 手机号
   * @param code 验证码
   * @param type 验证码类型
   * @returns 是否验证成功
   */
  async verifyCode(
    phone: string,
    code: string,
    type: 'register' | 'login' = 'register',
  ): Promise<boolean> {
    if (!this.isValidPhone(phone)) {
      throw new BadRequestException('手机号格式不正确');
    }

    if (!code || code.length !== 6) {
      throw new BadRequestException('验证码格式不正确');
    }

    const codeKey = this.getCodeKey(phone, type);
    const cachedCode = await this.cacheService.get<string>(codeKey);

    if (!cachedCode) {
      throw new BadRequestException('验证码已过期，请重新获取');
    }

    if (cachedCode !== code) {
      throw new BadRequestException('验证码错误');
    }

    // 验证成功后删除验证码（防止重复使用）
    await this.cacheService.del(codeKey);
    return true;
  }

  /**
   * 验证手机号格式
   */
  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }
}
