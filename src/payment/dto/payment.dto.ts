import { IsEnum, IsNotEmpty } from 'class-validator';
import { PaymentMethod, PlanType } from '../entities/order.entity';

export class CreateOrderDto {
  @IsEnum(PlanType, { message: '套餐类型不正确' })
  @IsNotEmpty({ message: '请选择套餐' })
  planType: PlanType;

  @IsEnum(PaymentMethod, { message: '支付方式不正确' })
  @IsNotEmpty({ message: '请选择支付方式' })
  paymentMethod: PaymentMethod;
}

export class PaymentCallbackDto {
  // 支付宝/微信回调参数
  orderNo?: string;
  tradeNo?: string;
  tradeStatus?: string;
  totalAmount?: string;
  // 微信特有
  resultCode?: string;
  outTradeNo?: string;
  transactionId?: string;
}

