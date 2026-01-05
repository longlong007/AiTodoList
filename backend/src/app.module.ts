import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { TodoModule } from './todo/todo.module';
import { UserModule } from './user/user.module';
import { AiModule } from './ai/ai.module';
import { PaymentModule } from './payment/payment.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        
        // 优先使用 DATABASE_URL（Railway 推荐方式）
        if (databaseUrl) {
          try {
            const url = new URL(databaseUrl);
            const isProduction = configService.get('NODE_ENV') === 'production';
            const dbName = url.pathname.substring(1); // 移除开头的 /
            
            return {
              type: 'postgres',
              host: url.hostname,
              port: parseInt(url.port) || 5432,
              username: url.username,
              password: url.password,
              database: dbName,
              entities: [__dirname + '/**/*.entity{.ts,.js}'],
              synchronize: false, // 生产环境必须为 false，防止数据丢失
              ssl: isProduction ? {
                rejectUnauthorized: false, // Railway 等云平台需要
              } : false,
              logging: !isProduction,
            };
          } catch (error) {
            console.error('Invalid DATABASE_URL format:', error);
          }
        }
        
        // 备用：使用独立环境变量（本地开发）
        const isProduction = configService.get('NODE_ENV') === 'production';
        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: parseInt(configService.get<string>('DB_PORT', '5432')),
          username: configService.get<string>('DB_USERNAME', 'postgres'),
          password: configService.get<string>('DB_PASSWORD', 'postgres'),
          database: configService.get<string>('DB_DATABASE', 'todolist'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: false, // 生产环境必须为 false
          ssl: isProduction ? {
            rejectUnauthorized: false,
          } : false,
          logging: !isProduction,
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    UserModule,
    TodoModule,
    AiModule,
    PaymentModule,
  ],
})
export class AppModule {}

