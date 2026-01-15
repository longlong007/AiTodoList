import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, Res, BadRequestException, HttpCode, HttpStatus, RawBodyRequest, Headers } from '@nestjs/common';
import { Response } from 'express';
import { Request as ExpressRequest } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RateLimitGuard, RateLimit } from '../common/guards/rate-limit.guard';
import { PaymentService } from './payment.service';
import { StripeService } from './stripe.service';
import { CreateOrderDto } from './dto/payment.dto';
import { UserService } from '../user/user.service';

@Controller('payment')
export class PaymentController {
  constructor(
    private paymentService: PaymentService,
    private stripeService: StripeService,
    private configService: ConfigService,
    private userService: UserService,
  ) {}

  // 获取套餐列表（公开）
  @Get('plans')
  getPlans() {
    return this.paymentService.getPlans();
  }

  // 创建订单
  @Post('order')
  @UseGuards(JwtAuthGuard, RateLimitGuard)
  @RateLimit(5, 60) // 每分钟最多5次
  async createOrder(@Request() req, @Body() dto: CreateOrderDto) {
    const order = await this.paymentService.createOrder(req.user.userId, dto);
    return {
      orderNo: order.orderNo,
      amount: order.amount,
      amountDisplay: `¥${(order.amount / 100).toFixed(2)}`,
      payUrl: order.payUrl,
      status: order.status,
    };
  }

  // 查询订单状态
  @Get('order/:orderNo')
  @UseGuards(JwtAuthGuard)
  async getOrder(@Request() req, @Param('orderNo') orderNo: string) {
    const order = await this.paymentService.findOrderByNo(orderNo);
    if (!order || order.userId !== req.user.userId) {
      return { error: '订单不存在' };
    }
    return {
      orderNo: order.orderNo,
      planType: order.planType,
      amount: order.amount,
      amountDisplay: `¥${(order.amount / 100).toFixed(2)}`,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paidAt: order.paidAt,
      createdAt: order.createdAt,
    };
  }

  // 查询用户订单列表
  @Get('orders')
  @UseGuards(JwtAuthGuard)
  async getOrders(@Request() req) {
    const orders = await this.paymentService.findUserOrders(req.user.userId);
    return orders.map(order => ({
      orderNo: order.orderNo,
      planType: order.planType,
      amount: order.amount,
      amountDisplay: `¥${(order.amount / 100).toFixed(2)}`,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paidAt: order.paidAt,
      createdAt: order.createdAt,
    }));
  }

  // 模拟支付页面（开发测试用）
  @Get('mock-pay')
  async mockPayPage(@Query() query: any, @Res() res: Response) {
    const { orderNo, amount, subject, method } = query;
    
    // 返回简单的模拟支付页面
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>模拟支付</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
          }
          .card {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            max-width: 400px;
            width: 90%;
            text-align: center;
          }
          .logo { font-size: 48px; margin-bottom: 20px; }
          h2 { font-size: 24px; margin-bottom: 10px; }
          .amount { font-size: 36px; color: #ed760f; margin: 20px 0; }
          .info { color: #888; margin-bottom: 30px; }
          .btn {
            display: block;
            width: 100%;
            padding: 15px;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            cursor: pointer;
            margin-bottom: 10px;
            transition: all 0.3s;
          }
          .btn-pay {
            background: linear-gradient(135deg, #ed760f 0%, #f19433 100%);
            color: white;
          }
          .btn-pay:hover { transform: scale(1.02); }
          .btn-cancel {
            background: rgba(255,255,255,0.1);
            color: #888;
          }
          .method { 
            display: inline-block;
            padding: 5px 15px;
            background: ${method === 'alipay' ? '#1677ff' : '#07c160'};
            border-radius: 20px;
            font-size: 14px;
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo">${method === 'alipay' ? '💳' : '💚'}</div>
          <div class="method">${method === 'alipay' ? '支付宝支付' : '微信支付'}</div>
          <h2>${subject}</h2>
          <div class="amount">¥${amount}</div>
          <div class="info">订单号：${orderNo}</div>
          <button class="btn btn-pay" onclick="pay()">确认支付</button>
          <button class="btn btn-cancel" onclick="cancel()">取消</button>
        </div>
        <script>
          function pay() {
            console.log('开始支付，订单号:', '${orderNo}');
            
            fetch('/api/payment/mock-complete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderNo: '${orderNo}' })
            })
            .then(res => {
              console.log('收到响应，状态码:', res.status);
              if (!res.ok) {
                throw new Error('HTTP error! status: ' + res.status);
              }
              return res.json();
            })
            .then(data => {
              console.log('支付结果:', data);
              if (data.success) {
                alert('支付成功！窗口将自动关闭');
                // 通知父窗口支付成功
                if (window.opener) {
                  window.opener.postMessage({ type: 'payment-success', orderNo: '${orderNo}' }, '*');
                }
                setTimeout(() => {
                  window.close();
                }, 1000);
              } else {
                alert('支付失败：' + (data.message || '未知错误'));
                console.error('支付失败详情:', data);
              }
            })
            .catch(err => {
              console.error('支付请求失败:', err);
              alert('支付请求失败：' + err.message + '\\n请检查网络连接或联系客服');
            });
          }
          function cancel() {
            if (window.opener) {
              window.opener.postMessage({ type: 'payment-cancel' }, '*');
            }
            window.close();
          }
        </script>
      </body>
      </html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  // 模拟支付完成（开发测试用）
  @Post('mock-complete')
  async mockComplete(@Body() body: { orderNo: string }) {
    console.log('==========================================');
    console.log('收到支付完成请求:', body);
    console.log('订单号:', body?.orderNo);
    console.log('==========================================');
    
    try {
      if (!body || !body.orderNo) {
        throw new BadRequestException('订单号不能为空');
      }

      const order = await this.paymentService.mockPaymentComplete(body.orderNo);
      console.log('✅ 支付处理成功，订单状态:', order.status);
      return { success: true, order };
    } catch (error) {
      console.error('❌ 支付处理失败:', error);
      console.error('错误详情:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      return { 
        success: false, 
        message: error.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
    }
  }

  // 支付宝回调（实际生产环境）
  @Post('callback/alipay')
  async alipayCallback(@Body() body: any) {
    // 实际需要验证签名
    const success = await this.paymentService.handleAlipayCallback(body);
    return success ? 'success' : 'fail';
  }

  // 微信支付回调（实际生产环境）
  @Post('callback/wechat')
  async wechatCallback(@Body() body: any) {
    // 实际需要验证签名
    const success = await this.paymentService.handleWechatCallback(body);
    return success ? '<xml><return_code>SUCCESS</return_code></xml>' : '<xml><return_code>FAIL</return_code></xml>';
  }

  // ==================== Stripe 支付接口 ====================

  /**
   * 创建 Stripe 订阅 Checkout Session
   */
  @Post('stripe/subscription')
  @UseGuards(JwtAuthGuard, RateLimitGuard)
  @RateLimit(5, 60)
  async createStripeSubscription(
    @Request() req,
    @Body() body: { planType: string; mode: 'subscription' | 'payment' },
  ) {
    const { planType, mode } = body;

    if (!this.stripeService.isConfigured()) {
      throw new BadRequestException('Stripe 支付未配置，请联系管理员');
    }

    // 获取前端域名
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:5173';

    let result;
    if (mode === 'subscription') {
      result = await this.stripeService.createSubscriptionCheckout(
        req.user.userId,
        planType as any,
        `${frontendUrl}/payment/success`,
        `${frontendUrl}/pricing`,
      );
    } else {
      result = await this.stripeService.createOneTimePayment(
        req.user.userId,
        planType as any,
        `${frontendUrl}/payment/success`,
        `${frontendUrl}/pricing`,
      );
    }

    return {
      sessionId: result.sessionId,
      checkoutUrl: result.checkoutUrl,
    };
  }

  /**
   * 验证 Stripe Checkout Session 状态
   */
  @Get('stripe/verify/:sessionId')
  @UseGuards(JwtAuthGuard)
  async verifyStripeSession(
    @Request() req,
    @Param('sessionId') sessionId: string,
  ) {
    if (!this.stripeService.isConfigured()) {
      throw new BadRequestException('Stripe 支付未配置，请联系管理员');
    }

    try {
      const session = await this.stripeService.verifySession(sessionId);

      // 验证 session 属于当前用户
      const orderNo = session.metadata?.orderNo;
      if (orderNo) {
        const order = await this.paymentService.findOrderByNo(orderNo);
        if (!order || order.userId !== req.user.userId) {
          return { error: '无权访问此订单' };
        }
      }

      return {
        status: session.payment_status,
        customerEmail: session.customer_details?.email,
        amountTotal: session.amount_total,
        currency: session.currency,
        mode: session.mode,
        subscriptionStatus: (session.subscription as any)?.status,
      };
    } catch (error: any) {
      return { error: error.message || '验证失败' };
    }
  }

  /**
   * 创建 Stripe Billing Portal Session（管理订阅）
   */
  @Post('stripe/portal')
  @UseGuards(JwtAuthGuard)
  async createStripePortalSession(@Request() req) {
    if (!this.stripeService.isConfigured()) {
      throw new BadRequestException('Stripe 支付未配置，请联系管理员');
    }

    // 获取用户的 Stripe Customer ID
    const user = await this.userService.findById(req.user.userId);
    if (!user?.stripeCustomerId) {
      throw new BadRequestException('未找到 Stripe 账户信息');
    }

    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:5173';
    const portalUrl = await this.stripeService.createPortalSession(
      user.stripeCustomerId,
      `${frontendUrl}/pricing`,
    );

    return { url: portalUrl };
  }

  /**
   * 获取 Stripe 配置状态
   */
  @Get('stripe/status')
  @UseGuards(JwtAuthGuard)
  getStripeStatus() {
    return {
      configured: this.stripeService.isConfigured(),
      supportedMethods: ['stripe'],
    };
  }

  /**
   * 取消 Stripe 订阅
   */
  @Post('stripe/cancel-subscription')
  @UseGuards(JwtAuthGuard)
  async cancelStripeSubscription(@Request() req) {
    if (!this.stripeService.isConfigured()) {
      throw new BadRequestException('Stripe 支付未配置，请联系管理员');
    }

    const user = await this.userService.findById(req.user.userId);
    if (!user?.stripeSubscriptionId) {
      throw new BadRequestException('没有正在进行的订阅');
    }

    // 设置为周期结束时取消（保留剩余时间）
    const subscription = await this.stripeService.cancelSubscription(
      user.stripeSubscriptionId,
      false, // 不立即取消
    );

    return {
      success: true,
      cancelAt: new Date(subscription.cancel_at * 1000).toISOString(),
      message: '订阅将在当前计费周期结束时取消',
    };
  }
}

