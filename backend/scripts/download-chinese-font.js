/**
 * 下载中文字体脚本
 * 用于 PDF 生成支持中文
 * 
 * 使用方法：
 * node scripts/download-chinese-font.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const fontUrl = 'https://github.com/adobe-fonts/source-han-sans/releases/download/2.004R/SourceHanSansCN-Regular.otf';
const fontDir = path.join(__dirname, '../src/assets/fonts');
const fontPath = path.join(fontDir, 'SourceHanSansCN-Regular.otf');

// 创建目录
if (!fs.existsSync(fontDir)) {
  fs.mkdirSync(fontDir, { recursive: true });
}

console.log('正在下载中文字体...');
console.log('URL:', fontUrl);

const file = fs.createWriteStream(fontPath);

https.get(fontUrl, (response) => {
  if (response.statusCode === 302 || response.statusCode === 301) {
    // 处理重定向
    https.get(response.headers.location, (redirectResponse) => {
      redirectResponse.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('✅ 字体下载完成:', fontPath);
        console.log('文件大小:', (fs.statSync(fontPath).size / 1024 / 1024).toFixed(2), 'MB');
      });
    });
  } else {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('✅ 字体下载完成:', fontPath);
      console.log('文件大小:', (fs.statSync(fontPath).size / 1024 / 1024).toFixed(2), 'MB');
    });
  }
}).on('error', (err) => {
  fs.unlink(fontPath, () => {});
  console.error('❌ 下载失败:', err.message);
  console.log('\n请手动下载字体文件：');
  console.log('1. 访问: https://github.com/adobe-fonts/source-han-sans/releases');
  console.log('2. 下载 SourceHanSansCN-Regular.otf');
  console.log('3. 保存到:', fontPath);
});

