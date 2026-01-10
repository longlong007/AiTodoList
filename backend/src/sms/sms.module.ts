import { Module } from '@nestjs/common';
import { SmsService } from './sms.service';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [CacheModule],
  providers: [SmsService],
  exports: [SmsService],
})
export class SmsModule {}
