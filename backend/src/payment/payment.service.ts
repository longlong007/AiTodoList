import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Order, OrderStatus, PaymentMethod, PlanType, PLAN_PRICES, PLAN_DAYS } from './entities/order.entity';
import { CreateOrderDto } from './dto/payment.dto';
import { UserService } from '../user/user.service';
import { AccountType, SubscriptionStatus } from '../user/entities/user.entity';
import * as crypto from 'crypto';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private configService: ConfigService,
    private userService: UserService,
  ) {}

  // 生成订单号
  private generateOrderNo(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TD${timestamp}${random}`;
  }

  // 创建订单
  async createOrder(userId: string, dto: CreateOrderDto): Promise<Order> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const orderNo = this.generateOrderNo();
    const amount = PLAN_PRICES[dto.planType];

    const order = this.orderRepository.create({
      orderNo,
      userId,
      planType: dto.planType,
      amount,
      paymentMethod: dto.paymentMethod,
      status: OrderStatus.PENDING,
    });

    await this.orderRepository.save(order);

    // 生成支付链接/二维码
    if (dto.paymentMethod === PaymentMethod.ALIPAY) {
      order.payUrl = await this.generateAlipayUrl(order);
    } else if (dto.paymentMethod === PaymentMethod.WECHAT) {
      order.payUrl = await this.generateWechatPayUrl(order);
    }

    await this.orderRepository.save(order);
    return order;
  }

  // 生成支付宝支付链接（模拟）
  private async generateAlipayUrl(order: Order): Promise<string> {
    // 实际项目中需要接入支付宝SDK
    // 这里返回模拟的支付页面URL
    const params = new URLSearchParams({
      orderNo: order.orderNo,
      amount: (order.amount / 100).toFixed(2),
      subject: `Todo Master Pro会员 - ${this.getPlanName(order.planType)}`,
    });
    
    // 获取后端域名
    const backendUrl = this.configService.get('BACKEND_URL') || 'http://localhost:3000';
    
    // 模拟支付页面（实际应该是支付宝的支付页面）
    return `${backendUrl}/api/payment/mock-pay?${params.toString()}&method=alipay`;
  }

  // 生成微信支付链接（模拟）
  private async generateWechatPayUrl(order: Order): Promise<string> {
    // 实际项目中需要接入微信支付SDK
    // 这里返回模拟的支付页面URL
    const params = new URLSearchParams({
      orderNo: order.orderNo,
      amount: (order.amount / 100).toFixed(2),
      subject: `Todo Master Pro会员 - ${this.getPlanName(order.planType)}`,
    });
    
    // 获取后端域名
    const backendUrl = this.configService.get('BACKEND_URL') || 'http://localhost:3000';
    
    return `${backendUrl}/api/payment/mock-pay?${params.toString()}&method=wechat`;
  }

  // 获取套餐名称
  private getPlanName(planType: PlanType): string {
    const names = {
      [PlanType.MONTHLY]: '月度会员',
      [PlanType.QUARTERLY]: '季度会员',
      [PlanType.YEARLY]: '年度会员',
    };
    return names[planType];
  }

  // 查询订单
  async findOrderByNo(orderNo: string): Promise<Order | null> {
    return this.orderRepository.findOne({ where: { orderNo } });
  }

  // 查询用户订单列表
  async findUserOrders(userId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  // 处理支付回调（支付宝）
  async handleAlipayCallback(params: any): Promise<boolean> {
    const { out_trade_no, trade_no, trade_status, total_amount } = params;
    
    if (trade_status !== 'TRADE_SUCCESS' && trade_status !== 'TRADE_FINISHED') {
      return false;
    }

    return this.completePayment(out_trade_no, trade_no);
  }

  // 处理支付回调（微信）
  async handleWechatCallback(params: any): Promise<boolean> {
    const { out_trade_no, transaction_id, result_code } = params;
    
    if (result_code !== 'SUCCESS') {
      return false;
    }

    return this.completePayment(out_trade_no, transaction_id);
  }

  // 模拟支付完成（用于测试）
  async mockPaymentComplete(orderNo: string): Promise<Order> {
    console.log('📝 mockPaymentComplete 开始处理:', orderNo);
    
    try {
      const order = await this.findOrderByNo(orderNo);
      console.log('📋 订单查询结果:', order ? `找到订单 ${order.id}` : '订单不存在');
      
      if (!order) {
        throw new NotFoundException(`订单不存在: ${orderNo}`);
      }

      console.log('💰 当前订单状态:', order.status);
      if (order.status === OrderStatus.PAID) {
        throw new BadRequestException('订单已支付');
      }

      // 模拟第三方交易号
      const mockTradeNo = `MOCK${Date.now()}`;
      console.log('🔄 开始执行支付完成流程...');
      
      await this.completePayment(orderNo, mockTradeNo);

      // 再次查询确保订单存在
      const updatedOrder = await this.findOrderByNo(orderNo);
      console.log('✅ 订单更新后状态:', updatedOrder?.status);
      
      if (!updatedOrder) {
        throw new NotFoundException('订单处理失败');
      }
      
      console.log('🎉 支付完成处理成功');
      return updatedOrder;
    } catch (error) {
      console.error('❌ mockPaymentComplete 失败:', error);
      throw error;
    }
  }

  // 完成支付，更新订单和用户状态
  private async completePayment(orderNo: string, tradeNo: string): Promise<boolean> {
    console.log('开始处理支付完成:', { orderNo, tradeNo });
    
    const order = await this.findOrderByNo(orderNo);
    if (!order) {
      console.error('订单不存在:', orderNo);
      return false;
    }

    if (order.status === OrderStatus.PAID) {
      console.log('订单已支付:', orderNo);
      return true;
    }

    // 更新订单状态
    order.status = OrderStatus.PAID;
    order.tradeNo = tradeNo;
    order.paidAt = new Date();
    await this.orderRepository.save(order);
    console.log('订单状态已更新为PAID:', orderNo);

    // 更新用户会员状态
    const user = await this.userService.findById(order.userId);
    if (user) {
      const days = PLAN_DAYS[order.planType];
      let expireAt: Date;

      // 如果当前是有效会员，在原有基础上延长
      if (user.isPro() && user.subscriptionExpireAt) {
        expireAt = new Date(user.subscriptionExpireAt);
        expireAt.setDate(expireAt.getDate() + days);
      } else {
        // 否则从现在开始计算
        expireAt = new Date();
        expireAt.setDate(expireAt.getDate() + days);
      }

      await this.userService.updateSubscription(order.userId, {
        accountType: AccountType.PRO,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionExpireAt: expireAt,
      });
      
      console.log('用户会员状态已更新:', { 
        userId: order.userId, 
        accountType: AccountType.PRO,
        expireAt: expireAt.toISOString()
      });
    }

    console.log('支付处理完成');
    return true;
  }

  // 获取套餐列表
  getPlans() {
    return [
      {
        type: PlanType.MONTHLY,
        name: '月度会员',
        price: PLAN_PRICES[PlanType.MONTHLY],
        priceDisplay: '¥19.90',
        days: PLAN_DAYS[PlanType.MONTHLY],
        features: ['AI智能分析', '无限待办数量', '优先客服支持'],
      },
      {
        type: PlanType.QUARTERLY,
        name: '季度会员',
        price: PLAN_PRICES[PlanType.QUARTERLY],
        priceDisplay: '¥49.90',
        originalPrice: '¥59.70',
        days: PLAN_DAYS[PlanType.QUARTERLY],
        discount: '省17%',
        features: ['AI智能分析', '无限待办数量', '优先客服支持', '历史数据导出'],
      },
      {
        type: PlanType.YEARLY,
        name: '年度会员',
        price: PLAN_PRICES[PlanType.YEARLY],
        priceDisplay: '¥149.90',
        originalPrice: '¥238.80',
        days: PLAN_DAYS[PlanType.YEARLY],
        discount: '省37%',
        popular: true,
        features: ['AI智能分析', '无限待办数量', '优先客服支持', '历史数据导出', '专属会员标识'],
      },
    ];
  }
}

