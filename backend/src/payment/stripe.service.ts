import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus, PlanType, PLAN_PRICES, PLAN_DAYS } from './entities/order.entity';
import { UserService } from '../user/user.service';
import { AccountType, SubscriptionStatus } from '../user/entities/user.entity';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private configService: ConfigService,
    private userService: UserService,
  ) {
    const secretKey = this.configService.get('STRIPE_SECRET_KEY');
    if (!secretKey) {
      this.logger.warn('STRIPE_SECRET_KEY not configured - Stripe features will be disabled');
      this.stripe = null as any;
    } else {
      this.stripe = new Stripe(secretKey, {
        apiVersion: '2025-01-27.acacia',
      });
    }
  }

  /**
   * 检查 Stripe 是否已配置
   */
  isConfigured(): boolean {
    return !!this.stripe;
  }

  /**
   * 获取或创建 Stripe Customer
   */
  async getOrCreateCustomer(userId: string, email: string, name?: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new BadRequestException('Stripe 支付未配置，请联系管理员');
    }

    // 先查找是否已有订单关联了 Stripe customer
    const existingOrder = await this.orderRepository.findOne({
      where: { userId, stripeCustomerId: null as any },
      order: { createdAt: 'DESC' },
    });

    if (existingOrder?.stripeCustomerId) {
      return existingOrder.stripeCustomerId;
    }

    // 创建新的 Stripe Customer
    const customer = await this.stripe.customers.create({
      email,
      name,
      metadata: {
        userId,
      },
    });

    this.logger.log(`Created Stripe customer: ${customer.id} for user: ${userId}`);
    return customer.id;
  }

  /**
   * 获取套餐对应的 Stripe Price ID
   */
  private getPriceId(planType: PlanType): string {
    const priceIds = {
      [PlanType.MONTHLY]: this.configService.get('STRIPE_MONTHLY_PRICE_ID'),
      [PlanType.QUARTERLY]: this.configService.get('STRIPE_QUARTERLY_PRICE_ID'),
      [PlanType.YEARLY]: this.configService.get('STRIPE_YEARLY_PRICE_ID'),
    };

    const priceId = priceIds[planType];
    if (!priceId) {
      throw new BadRequestException(`未配置套餐 ${planType} 的 Stripe Price ID`);
    }

    return priceId;
  }

  /**
   * 创建 Stripe Checkout Session（订阅模式）
   */
  async createSubscriptionCheckout(
    userId: string,
    planType: PlanType,
    successUrl: string,
    cancelUrl: string,
  ): Promise<{ sessionId: string; checkoutUrl: string }> {
    if (!this.isConfigured()) {
      throw new BadRequestException('Stripe 支付未配置，请联系管理员');
    }

    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 获取或创建 Stripe Customer
    const customerId = await this.getOrCreateCustomer(userId, user.email, user.nickname || undefined);

    // 获取套餐价格
    const amount = PLAN_PRICES[planType];
    const priceId = this.getPriceId(planType);

    // 创建订单记录
    const orderNo = this.generateOrderNo();
    const order = this.orderRepository.create({
      orderNo,
      userId,
      planType,
      amount,
      paymentMethod: 'stripe' as any,
      status: OrderStatus.PENDING,
      stripeCustomerId: customerId,
    });

    // 创建 Stripe Checkout Session
    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'], // 支持信用卡、借记卡
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription', // 订阅模式
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        orderNo,
        userId,
        planType,
      },
      subscription_data: {
        metadata: {
          orderNo,
          userId,
        },
      },
      // 允许 promotion code
      allow_promotion_codes: true,
      // 设置账单周期
      billing_address_collection: 'auto',
    });

    // 更新订单的 sessionId
    order.stripeSessionId = session.id;
    order.payUrl = session.url || undefined;
    await this.orderRepository.save(order);

    this.logger.log(`Created Stripe checkout session: ${session.id} for order: ${orderNo}`);

    return {
      sessionId: session.id,
      checkoutUrl: session.url!,
    };
  }

  /**
   * 创建一次性支付 Checkout Session（替代订阅）
   */
  async createOneTimePayment(
    userId: string,
    planType: PlanType,
    successUrl: string,
    cancelUrl: string,
  ): Promise<{ sessionId: string; checkoutUrl: string }> {
    if (!this.isConfigured()) {
      throw new BadRequestException('Stripe 支付未配置，请联系管理员');
    }

    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 获取或创建 Stripe Customer
    const customerId = await this.getOrCreateCustomer(userId, user.email, user.nickname || undefined);

    // 获取套餐价格（转换为美元，Stripe 使用最小货币单位）
    const amount = PLAN_PRICES[planType];
    const amountInCents = Math.round(amount / 7.5); // 假设汇率 1 CNY = 7.5 USD cents

    // 创建订单记录
    const orderNo = this.generateOrderNo();
    const order = this.orderRepository.create({
      orderNo,
      userId,
      planType,
      amount,
      paymentMethod: 'stripe' as any,
      status: OrderStatus.PENDING,
      stripeCustomerId: customerId,
    });

    // 创建 Stripe Checkout Session（一次性支付）
    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: this.getPlanName(planType),
              description: `Todo Master Pro - ${this.getPlanName(planType)}`,
            },
            unit_amount: amountInCents,
            recurring: undefined, // 一次性支付
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        orderNo,
        userId,
        planType,
      },
    });

    // 更新订单的 sessionId
    order.stripeSessionId = session.id;
    order.payUrl = session.url || undefined;
    await this.orderRepository.save(order);

    this.logger.log(`Created Stripe one-time payment session: ${session.id} for order: ${orderNo}`);

    return {
      sessionId: session.id,
      checkoutUrl: session.url!,
    };
  }

  /**
   * 验证并获取 Checkout Session
   */
  async verifySession(sessionId: string): Promise<Stripe.Checkout.Session> {
    if (!this.isConfigured()) {
      throw new BadRequestException('Stripe 支付未配置，请联系管理员');
    }

    const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });

    return session;
  }

  /**
   * 处理 Checkout Session 完成事件
   */
  async handleCheckoutComplete(session: Stripe.Checkout.Session): Promise<Order | null> {
    const orderNo = session.metadata?.orderNo;
    if (!orderNo) {
      this.logger.error('No orderNo in session metadata');
      return null;
    }

    const order = await this.orderRepository.findOne({ where: { orderNo } });
    if (!order) {
      this.logger.error(`Order not found: ${orderNo}`);
      return null;
    }

    // 标记订单为已支付
    order.status = OrderStatus.PAID;
    order.tradeNo = session.payment_intent as string || session.subscription as string;
    order.stripeSubscriptionId = (session.subscription as Stripe.Subscription)?.id || undefined;
    order.paidAt = new Date();
    await this.orderRepository.save(order);

    // 激活用户订阅
    await this.activateUserSubscription(order);

    this.logger.log(`Order ${orderNo} completed, subscription activated`);

    return order;
  }

  /**
   * 激活用户订阅
   */
  async activateUserSubscription(order: Order): Promise<void> {
    const days = PLAN_DAYS[order.planType];
    let expireAt: Date;

    const user = await this.userService.findById(order.userId);
    if (!user) return;

    // 如果当前是有效会员，在原有基础上延长
    if (user.isPro() && user.subscriptionExpireAt) {
      expireAt = new Date(user.subscriptionExpireAt);
      expireAt.setDate(expireAt.getDate() + days);
    } else {
      expireAt = new Date();
      expireAt.setDate(expireAt.getDate() + days);
    }

    // 如果有 Stripe 订阅ID，保存到用户信息
    const stripeSubscriptionId = order.stripeSubscriptionId || user.stripeSubscriptionId || undefined;

    await this.userService.updateSubscription(order.userId, {
      accountType: AccountType.PRO,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      subscriptionExpireAt: expireAt,
      stripeSubscriptionId,
    });

    this.logger.log(`Activated subscription for user ${order.userId}, expires: ${expireAt.toISOString()}`);
  }

  /**
   * 处理订阅取消事件
   */
  async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata?.userId || subscription.metadata?.orderNo?.split('-')[0];
    
    if (!userId) {
      this.logger.warn('No userId in subscription metadata');
      return;
    }

    // 查找相关的未完成订单
    const order = await this.orderRepository.findOne({
      where: { 
        stripeSubscriptionId: subscription.id,
        status: OrderStatus.PAID,
      },
    });

    if (order) {
      // 取消订单（可选：也可以保留记录，只更新用户状态）
      order.status = OrderStatus.CANCELLED;
      await this.orderRepository.save(order);
    }

    // 更新用户订阅状态
    await this.userService.updateSubscription(userId, {
      accountType: AccountType.NORMAL,
      subscriptionStatus: SubscriptionStatus.CANCELLED,
    });

    this.logger.log(`Subscription ${subscription.id} cancelled for user ${userId}`);
  }

  /**
   * 处理订阅更新事件
   */
  async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata?.userId;
    
    if (!userId) {
      this.logger.warn('No userId in subscription metadata');
      return;
    }

    // 根据 Stripe 订阅状态更新用户状态
    let subscriptionStatus: SubscriptionStatus;
    switch (subscription.status) {
      case 'active':
        subscriptionStatus = SubscriptionStatus.ACTIVE;
        break;
      case 'past_due':
        subscriptionStatus = SubscriptionStatus.PAST_DUE;
        break;
      case 'canceled':
      case 'unpaid':
        subscriptionStatus = SubscriptionStatus.CANCELLED;
        break;
      default:
        subscriptionStatus = SubscriptionStatus.ACTIVE;
    }

    await this.userService.updateSubscription(userId, {
      subscriptionStatus,
      stripeSubscriptionId: subscription.id,
    });

    this.logger.log(`Subscription ${subscription.id} updated to ${subscription.status}`);
  }

  /**
   * 创建 Stripe Portal Session（管理订阅）
   */
  async createPortalSession(customerId: string, returnUrl: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new BadRequestException('Stripe 支付未配置，请联系管理员');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session.url;
  }

  /**
   * 获取订阅详情
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    if (!this.isConfigured()) {
      throw new BadRequestException('Stripe 支付未配置，请联系管理员');
    }

    return await this.stripe.subscriptions.retrieve(subscriptionId);
  }

  /**
   * 取消订阅
   */
  async cancelSubscription(subscriptionId: string, immediately: boolean = false): Promise<Stripe.Subscription> {
    if (!this.isConfigured()) {
      throw new BadRequestException('Stripe 支付未配置，请联系管理员');
    }

    if (immediately) {
      return await this.stripe.subscriptions.cancel(subscriptionId);
    } else {
      return await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    }
  }

  /**
   * 构造 Webhook 签名验证
   */
  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
    if (!this.isConfigured()) {
      throw new BadRequestException('Stripe 支付未配置，请联系管理员');
    }

    const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new BadRequestException('Stripe Webhook Secret 未配置');
    }

    return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }

  /**
   * 生成订单号
   */
  private generateOrderNo(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TD${timestamp}${random}`;
  }

  /**
   * 获取套餐名称
   */
  private getPlanName(planType: PlanType): string {
    const names = {
      [PlanType.MONTHLY]: '月度会员',
      [PlanType.QUARTERLY]: '季度会员',
      [PlanType.YEARLY]: '年度会员',
    };
    return names[planType];
  }
}
