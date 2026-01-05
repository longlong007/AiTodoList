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
        // 调试日志 - 查看实际读取的值
        console.log('=== 环境变量调试 ===');
        console.log('DATABASE_URL:', databaseUrl);
        console.log('DATABASE_URL 来源:', process.env.DATABASE_URL ? '系统环境变量' : '.env 文件');
        // 优先使用 DATABASE_URL（Railway 推荐方式）
        if (databaseUrl) {
          try {
            const url = new URL(databaseUrl);
            console.log('数据库主机:', url.hostname);
            console.log('数据库端口:', url.port || 5432);
            const isProduction = configService.get('NODE_ENV') === 'production';
            const dbName = url.pathname.substring(1); // 移除开头的 /
            console.log('数据库环境:', isProduction);
            console.log('数据库名:', dbName);
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

