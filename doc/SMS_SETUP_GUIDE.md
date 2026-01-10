# 短信验证服务配置指南

## 📋 概述

本项目已集成阿里云短信服务，支持手机号注册和登录时的短信验证码功能。

## 🚀 功能特性

- ✅ 发送短信验证码（注册/登录）
- ✅ 验证码验证
- ✅ 验证码有效期：5分钟
- ✅ 发送频率限制：60秒内只能发送一次
- ✅ 开发模式：未配置短信服务时，会在控制台输出验证码（方便开发测试）

## 📦 已安装的依赖

- `@alicloud/sms-sdk`: 阿里云短信服务SDK

## ⚙️ 配置步骤

### 1. 在阿里云控制台配置

1. **注册并实名认证阿里云账号**
   - 访问 [阿里云官网](https://www.aliyun.com/)
   - 完成实名认证

2. **开通短信服务**
   - 登录阿里云控制台
   - 搜索"短信服务"并开通

3. **申请短信签名**
   - 进入"短信服务" → "国内消息" → "签名管理"
   - 点击"添加签名"
   - 填写签名名称（如：你的应用名称）
   - 等待审核通过

4. **申请短信模板**
   - 进入"短信服务" → "国内消息" → "模板管理"
   - 点击"添加模板"
   - 模板内容示例：`您的验证码是${code}，5分钟内有效，请勿泄露。`
   - 等待审核通过，获取模板CODE（格式：SMS_123456789）

5. **获取AccessKey**
   - 进入"访问控制" → "用户" → 创建RAM用户
   - 为用户分配短信服务权限（AliyunDysmsFullAccess）
   - 创建AccessKey，获取AccessKey ID和AccessKey Secret

### 2. 配置环境变量

在 `backend/.env` 文件中添加以下配置：

```env
# 阿里云短信服务配置
ALIYUN_SMS_ACCESS_KEY_ID=your-access-key-id
ALIYUN_SMS_ACCESS_KEY_SECRET=your-access-key-secret
ALIYUN_SMS_SIGN_NAME=your-sign-name  # 短信签名名称
ALIYUN_SMS_TEMPLATE_CODE=SMS_123456789  # 短信模板CODE
```

### 3. 开发模式（不配置短信服务）

如果不配置短信服务，系统会自动进入模拟模式：
- 验证码会在后端控制台输出
- 格式：`[模拟模式] 手机号 13800138000 的注册验证码: 123456`
- 可以直接使用控制台输出的验证码进行测试

## 📡 API 接口

### 1. 发送短信验证码

**接口**: `POST /api/auth/sms/send`

**请求体**:
```json
{
  "phone": "13800138000",
  "type": "register"  // 或 "login"
}
```

**响应**:
```json
{
  "success": true,
  "message": "验证码已发送"
}
```

### 2. 验证短信验证码

**接口**: `POST /api/auth/sms/verify`

**请求体**:
```json
{
  "phone": "13800138000",
  "code": "123456",
  "type": "register"  // 或 "login"
}
```

**响应**:
```json
{
  "success": true,
  "message": "验证码验证成功"
}
```

### 3. 手机号注册（带验证码）

**接口**: `POST /api/auth/register/phone`

**请求体**:
```json
{
  "identifier": "13800138000",
  "password": "password123",
  "code": "123456"  // 可选，如果提供会验证验证码
}
```

### 4. 手机号登录（支持密码或验证码）

**接口**: `POST /api/auth/login/phone`

**方式一：密码登录**
```json
{
  "identifier": "13800138000",
  "password": "password123"
}
```

**方式二：验证码登录（免密登录）**
```json
{
  "identifier": "13800138000",
  "code": "123456"
}
```

## 💻 前端使用示例

```typescript
import { authApi } from '@/api/auth'

// 发送验证码
async function sendCode() {
  try {
    await authApi.sendSmsCode('13800138000', 'register')
    console.log('验证码已发送')
  } catch (error) {
    console.error('发送失败:', error)
  }
}

// 注册（带验证码）
async function register() {
  try {
    const result = await authApi.registerWithPhone(
      '13800138000',
      'password123',
      '123456'  // 验证码
    )
    console.log('注册成功:', result)
  } catch (error) {
    console.error('注册失败:', error)
  }
}

// 验证码登录（免密登录）
async function loginWithCode() {
  try {
    const result = await authApi.loginWithPhone(
      '13800138000',
      undefined,  // 不传密码
      '123456'    // 使用验证码
    )
    console.log('登录成功:', result)
  } catch (error) {
    console.error('登录失败:', error)
  }
}
```

## 🔒 安全特性

1. **验证码有效期**: 5分钟
2. **发送频率限制**: 60秒内只能发送一次
3. **验证码一次性**: 验证成功后自动删除，防止重复使用
4. **手机号格式验证**: 只接受中国大陆11位手机号

## 🐛 故障排查

### 问题1: 短信发送失败

**可能原因**:
- AccessKey配置错误
- 短信签名或模板未审核通过
- 账户余额不足

**解决方案**:
1. 检查环境变量配置是否正确
2. 登录阿里云控制台检查签名和模板状态
3. 检查账户余额

### 问题2: 验证码收不到

**开发环境**:
- 检查后端控制台输出（模拟模式）
- 确认手机号格式正确

**生产环境**:
- 检查阿里云控制台的发送记录
- 确认手机号未被加入黑名单
- 检查短信模板中的变量名是否正确（必须是 `${code}`）

### 问题3: SDK导入错误

如果遇到SDK导入问题，可以尝试：
```bash
cd backend
npm install @alicloud/sms-sdk --save
```

## 📚 相关文档

- [阿里云短信服务文档](https://help.aliyun.com/product/44282.html)
- [短信签名规范](https://help.aliyun.com/zh/sms/user-guide/signature-specifications-1)
- [短信模板规范](https://help.aliyun.com/zh/sms/user-guide/template-specifications)

## ✅ 测试清单

- [ ] 配置环境变量
- [ ] 发送注册验证码
- [ ] 发送登录验证码
- [ ] 验证验证码
- [ ] 使用验证码注册
- [ ] 使用验证码登录
- [ ] 测试发送频率限制
- [ ] 测试验证码过期

---

**最后更新**: 2026-01-09
