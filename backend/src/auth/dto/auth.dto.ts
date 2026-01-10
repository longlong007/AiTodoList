import { IsString, IsNotEmpty, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: '账号不能为空' })
  identifier: string;

  @IsString()
  @MinLength(6, { message: '密码长度至少为6位' })
  password: string;

  @IsString()
  @IsOptional()
  code?: string; // 手机号注册时的验证码
}

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: '账号不能为空' })
  identifier: string;

  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  password: string;

  @IsString()
  @IsOptional()
  code?: string; // 手机号登录时的验证码（可选）
}

export class WechatLoginDto {
  @IsString()
  @IsNotEmpty({ message: '微信授权码不能为空' })
  code: string;
}

export class SendSmsCodeDto {
  @IsString()
  @IsNotEmpty({ message: '手机号不能为空' })
  phone: string;

  @IsString()
  @IsNotEmpty({ message: '验证码类型不能为空' })
  type: 'register' | 'login';
}

export class VerifySmsCodeDto {
  @IsString()
  @IsNotEmpty({ message: '手机号不能为空' })
  phone: string;

  @IsString()
  @IsNotEmpty({ message: '验证码不能为空' })
  code: string;

  @IsString()
  @IsNotEmpty({ message: '验证码类型不能为空' })
  type: 'register' | 'login';
}
