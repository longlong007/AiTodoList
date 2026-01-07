# 中文字体文件

## 📝 说明

PDF 生成功能需要中文字体文件来正确显示中文内容。

## 🚀 快速开始

### 方法一：自动下载（推荐）

在 `backend` 目录下运行：

```bash
npm run download-font
```

这会自动下载思源黑体（Source Han Sans）中文字体。

### 方法二：手动下载

1. 访问 [Adobe Source Han Sans 下载页面](https://github.com/adobe-fonts/source-han-sans/releases)
2. 下载 `SourceHanSansCN-Regular.otf`（简体中文常规体）
3. 将文件保存到 `backend/src/assets/fonts/SourceHanSansCN-Regular.otf`

### 方法三：使用其他中文字体

你也可以使用其他中文字体文件，只需：
1. 将字体文件（.ttf 或 .otf 格式）放到 `backend/src/assets/fonts/` 目录
2. 修改 `backend/src/report/pdf.service.ts` 中的字体文件名

## 📦 支持的字体格式

- `.ttf` (TrueType Font)
- `.otf` (OpenType Font)
- `.ttc` (TrueType Collection)

## ⚠️ 注意事项

- 字体文件会包含在部署包中，增加约 5-10MB 大小
- Railway 部署时会自动包含字体文件
- 如果未找到字体文件，PDF 会使用 Courier 字体（中文可能显示为方框）

## 🔍 验证字体是否加载

查看 Railway 后端日志，应该看到：

```
✅ 成功加载中文字体: /app/src/assets/fonts/SourceHanSansCN-Regular.otf
```

如果看到：

```
⚠️ 未找到中文字体文件，使用 Courier 字体
```

说明字体文件未正确部署，请检查：
1. 字体文件是否在 `src/assets/fonts/` 目录
2. Railway 部署是否包含字体文件
3. 文件路径是否正确

