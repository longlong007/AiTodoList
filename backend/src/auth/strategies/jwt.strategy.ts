import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET', 'default-secret'),
      passReqToCallback: true, // 传递request对象以获取token
    });
  }

  async validate(req: Request, payload: any) {
    // 获取token
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    
    if (token) {
      // 检查token是否在黑名单中
      const isBlacklisted = await this.authService.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token已失效，请重新登录');
      }
    }
    
    return { 
      userId: payload.sub, 
      email: payload.email,
      phone: payload.phone,
    };
  }
}

