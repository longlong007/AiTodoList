import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { TodoModule } from '../todo/todo.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [ConfigModule, TodoModule, UserModule],
  providers: [AiService],
  controllers: [AiController],
  exports: [AiService],
})
export class AiModule {}

