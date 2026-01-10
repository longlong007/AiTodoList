# 手机短信验证码功能使用指南

## 功能概述

项目已集成手机短信验证码功能，支持注册和登录两种场景。

## 前端功能

### 1. 登录页面 (`/login`)

**手机号登录支持两种方式：**

1. **密码登录（默认）**
   - 输入手机号和密码
   - 与之前一样的登录方式

2. **验证码登录（免密）**
   - 勾选"使用验证码登录"
   - 输入手机号
   - 点击"获取验证码"按钮
   - 输入收到的6位验证码
   - 点击登录

**验证码发送限制：**
- 60秒倒计时，防止频繁发送
- 验证码有效期：5分钟
- 自动显示剩余倒计时秒数

### 2. 注册页面 (`/register`)

**手机号注册：**
- 选择"手机注册"标签
- 输入手机号
- 点击"获取验证码"按钮
- 输入收到的6位验证码（必填）
- 设置密码（至少6位）
- 确认密码
- 点击注册

**注意：** 手机号注册时，验证码为必填项。

## 后端 API

### 1. 发送验证码

```http
POST /api/auth/sms/send
Content-Type: application/json

{
  "phone": "13800138000",
  "type": "register" | "login"
}
```

**响应：**
```json
{
  "success": true,
  "message": "验证码已发送"
}
```

### 2. 验证验证码（可选，注册/登录时会自动验证）

```http
POST /api/auth/sms/verify
Content-Type: application/json

{
  "phone": "13800138000",
  "code": "123456",
  "type": "register" | "login"
}
```

### 3. 手机号注册（带验证码）

```http
POST /api/auth/register/phone
Content-Type: application/json

{
  "identifier": "13800138000",
  "password": "password123",
  "code": "123456"
}
```

### 4. 手机号登录（验证码登录）

```http
POST /api/auth/login/phone
Content-Type: application/json

{
  "identifier": "13800138000",
  "code": "123456"
}
```

**注意：** 使用验证码登录时，不需要提供 `password` 字段。

### 5. 手机号登录（密码登录）

```http
POST /api/auth/login/phone
Content-Type: application/json

{
  "identifier": "13800138000",
  "password": "password123"
}
```

## 配置说明

### 环境变量（后端）

在 `backend/.env` 中配置阿里云短信服务：

```env
# 阿里云短信服务配置
ALIYUN_SMS_ACCESS_KEY_ID=your_access_key_id
ALIYUN_SMS_ACCESS_KEY_SECRET=your_access_key_secret
ALIYUN_SMS_SIGN_NAME=your_sign_name
ALIYUN_SMS_TEMPLATE_CODE=your_template_code
```

### 模拟模式

**未配置短信服务时：**
- 后端自动进入模拟模式
- 验证码会在后端日志中输出
- 适合开发和测试环境

**日志示例：**
```
[模拟模式] 手机号 13800138000 的注册验证码: 123456
```

## 安全特性

1. **频率限制**
   - 60秒内只能发送一次验证码
   - 防止恶意刷验证码

2. **验证码有效期**
   - 5分钟（300秒）后自动过期
   - 需重新获取

3. **一次性使用**
   - 验证成功后立即删除
   - 防止验证码被重复使用

4. **手机号格式验证**
   - 正则：`/^1[3-9]\d{9}$/`
   - 仅支持中国大陆手机号

5. **验证码格式验证**
   - 必须是6位数字
   - 前端和后端双重验证

## 测试流程

### 1. 开发环境测试（模拟模式）

1. 启动后端服务
2. 打开前端注册/登录页面
3. 输入手机号（如：13800138000）
4. 点击"获取验证码"
5. 查看后端控制台日志，找到验证码
6. 在前端输入验证码
7. 完成注册/登录

### 2. 生产环境测试（真实短信）

1. 配置阿里云短信服务环境变量
2. 确保短信模板已审核通过
3. 使用真实手机号测试
4. 验证短信是否成功发送
5. 使用收到的验证码完成流程

## 故障排查

### 验证码发送失败

1. 检查手机号格式是否正确
2. 检查是否在60秒倒计时内
3. 查看后端日志错误信息
4. 验证阿里云配置是否正确
5. 确认阿里云账户余额充足

### 验证码验证失败

1. 验证码是否正确（6位数字）
2. 验证码是否已过期（5分钟）
3. 验证码是否已被使用
4. 手机号是否与发送时一致
5. 类型（register/login）是否匹配

## 前端组件修改

已修改以下文件以支持验证码功能：

- `frontend/src/views/Login.vue` - 添加验证码登录选项
- `frontend/src/views/Register.vue` - 添加验证码输入和发送
- `frontend/src/stores/auth.ts` - 导出 setAuth 方法供验证码登录使用
- `frontend/src/api/auth.ts` - 已有 sendSmsCode 和 verifySmsCode 方法

## UI 特性

- ✅ 60秒倒计时显示
- ✅ 发送按钮禁用状态
- ✅ 错误提示信息
- ✅ 优雅的动画效果
- ✅ 响应式设计
- ✅ 深色主题适配

## 下一步

如需配置真实短信服务，请参考：
- `doc/SMS_SETUP_GUIDE.md` - 阿里云短信服务配置指南
