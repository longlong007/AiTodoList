import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: '账号不能为空' })
  identifier: string;

  @IsString()
  @MinLength(6, { message: '密码长度至少为6位' })
  password: string;
}

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: '账号不能为空' })
  identifier: string;

  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  password: string;
}

export class WechatLoginDto {
  @IsString()
  @IsNotEmpty({ message: '微信授权码不能为空' })
  code: string;
}

