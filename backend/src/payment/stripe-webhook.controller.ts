import { Controller, Post, Body, Req, Headers, RawBodyRequest, HttpCode, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { StripeService } from './stripe.service';
import { Logger } from '@nestjs/common';

@Controller('payment/stripe')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(private readonly stripeService: StripeService) {}

  /**
   * Stripe Webhook 端点
   * 需要在 Stripe Dashboard 中配置：https://your-domain.com/api/payment/stripe/webhook
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) {
      this.logger.error('Missing stripe-signature header');
      return { error: 'Missing stripe-signature header' };
    }

    let event;

    try {
      event = this.stripeService.constructWebhookEvent(req.rawBody!, signature);
    } catch (err: any) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      return { error: 'Webhook signature verification failed' };
    }

    this.logger.log(`Received Stripe webhook event: ${event.type}`);

    try {
      switch (event.type) {
        // Checkout Session 完成（一次性支付或订阅）
        case 'checkout.session.completed': {
          const session = event.data.object as any;
          this.logger.log(`Checkout completed: ${session.id}`);
          
          // 如果是订阅模式，可能还没有 subscription 数据，需要展开
          if (session.mode === 'subscription' && !session.subscription) {
            const expandedSession = await this.stripeService.verifySession(session.id);
            await this.stripeService.handleCheckoutComplete(expandedSession);
          } else {
            await this.stripeService.handleCheckoutComplete(session);
          }
          break;
        }

        // 订阅创建
        case 'customer.subscription.created': {
          const subscription = event.data.object as any;
          this.logger.log(`Subscription created: ${subscription.id}`);
          break;
        }

        // 订阅更新
        case 'customer.subscription.updated': {
          const subscription = event.data.object as any;
          this.logger.log(`Subscription updated: ${subscription.id}`);
          await this.stripeService.handleSubscriptionUpdated(subscription);
          break;
        }

        // 订阅删除/取消
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as any;
          this.logger.log(`Subscription deleted: ${subscription.id}`);
          await this.stripeService.handleSubscriptionDeleted(subscription);
          break;
        }

        // 订阅即将结束
        case 'customer.subscription.trial_will_end': {
          const subscription = event.data.object as any;
          this.logger.log(`Subscription trial will end: ${subscription.id}`);
          // 可选：发送邮件提醒用户
          break;
        }

        // 支付失败
        case 'invoice.payment_failed': {
          const invoice = event.data.object as any;
          this.logger.log(`Invoice payment failed: ${invoice.id}`);
          // 可选：发送邮件提醒用户
          break;
        }

        // 付款成功
        case 'invoice.paid': {
          const invoice = event.data.object as any;
          this.logger.log(`Invoice paid: ${invoice.id}`);
          break;
        }

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (err: any) {
      this.logger.error(`Error processing webhook event ${event.type}: ${err.message}`);
      throw err;
    }
  }
}
