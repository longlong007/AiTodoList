import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../user/entities/user.entity';

export enum PaymentMethod {
  ALIPAY = 'alipay',
  WECHAT = 'wechat',
  STRIPE = 'stripe',
}

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

export enum PlanType {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

// 套餐价格配置（单位：分）
export const PLAN_PRICES = {
  [PlanType.MONTHLY]: 1990,    // 19.90元/月
  [PlanType.QUARTERLY]: 4990,  // 49.90元/季度
  [PlanType.YEARLY]: 14990,    // 149.90元/年
};

// 套餐天数配置
export const PLAN_DAYS = {
  [PlanType.MONTHLY]: 30,
  [PlanType.QUARTERLY]: 90,
  [PlanType.YEARLY]: 365,
};

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 订单号（用于支付平台）
  @Column({ unique: true })
  orderNo: string;

  // 用户ID
  @Column()
  userId: string;

  @ManyToOne(() => User)
  user: User;

  // 套餐类型
  @Column({
    type: 'enum',
    enum: PlanType,
  })
  planType: PlanType;

  // 支付金额（单位：分）
  @Column()
  amount: number;

  // 支付方式
  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  paymentMethod: PaymentMethod;

  // 订单状态
  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  // 第三方支付交易号
  @Column({ nullable: true })
  tradeNo: string;

  // 支付时间
  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  // 支付二维码/链接（临时存储）
  @Column({ type: 'text', nullable: true })
  payUrl: string;

  // Stripe 相关字段
  @Column({ nullable: true })
  stripeCustomerId: string;

  @Column({ nullable: true })
  stripeSubscriptionId: string;

  @Column({ nullable: true })
  stripeSessionId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

