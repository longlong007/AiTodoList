import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Order } from './entities/order.entity';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { StripeWebhookController } from './stripe-webhook.controller';
import { StripeService } from './stripe.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order]),
    ConfigModule,
    UserModule,
  ],
  providers: [PaymentService, StripeService],
  controllers: [PaymentController, StripeWebhookController],
  exports: [PaymentService, StripeService],
})
export class PaymentModule {}

