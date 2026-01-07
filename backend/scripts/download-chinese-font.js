/**
 * 下载中文字体脚本
 * 用于 PDF 生成支持中文
 * 
 * 使用方法：
 * node scripts/download-chinese-font.js
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const fontDir = path.join(__dirname, '../src/assets/fonts');
const fontPath = path.join(fontDir, 'NotoSansSC-Regular.ttf');

// 多个字体源（按优先级）
const fontSources = [
  {
    name: 'Noto Sans SC (Google Fonts)',
    url: 'https://github.com/google/fonts/raw/main/ofl/notosanssc/NotoSansSC%5Bwdth%2Cwght%5D.ttf',
    filename: 'NotoSansSC-Regular.ttf'
  },
  {
    name: 'Source Han Sans (Adobe)',
    url: 'https://github.com/adobe-fonts/source-han-sans/releases/download/2.004R/SourceHanSansCN-Regular.otf',
    filename: 'SourceHanSansCN-Regular.otf'
  }
];

// 创建目录
if (!fs.existsSync(fontDir)) {
  fs.mkdirSync(fontDir, { recursive: true });
}

function downloadFont(source) {
  return new Promise((resolve, reject) => {
    const fontPath = path.join(fontDir, source.filename);
    console.log(`\n尝试下载: ${source.name}`);
    console.log(`URL: ${source.url}`);
    
    const protocol = source.url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(fontPath);

    const request = protocol.get(source.url, (response) => {
      // 处理重定向
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlinkSync(fontPath);
        return downloadFont({ ...source, url: response.headers.location }).then(resolve).catch(reject);
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(fontPath);
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        const size = (fs.statSync(fontPath).size / 1024 / 1024).toFixed(2);
        console.log(`✅ 字体下载成功: ${fontPath}`);
        console.log(`文件大小: ${size} MB`);
        resolve(fontPath);
      });
    });

    request.on('error', (err) => {
      file.close();
      if (fs.existsSync(fontPath)) {
        fs.unlinkSync(fontPath);
      }
      reject(err);
    });

    request.setTimeout(30000, () => {
      request.destroy();
      file.close();
      if (fs.existsSync(fontPath)) {
        fs.unlinkSync(fontPath);
      }
      reject(new Error('下载超时'));
    });
  });
}

// 尝试下载字体
async function main() {
  console.log('开始下载中文字体...\n');
  
  for (const source of fontSources) {
    try {
      await downloadFont(source);
      console.log('\n✅ 字体下载完成！');
      return;
    } catch (error) {
      console.log(`❌ 下载失败: ${error.message}`);
      continue;
    }
  }

  console.log('\n⚠️ 所有下载源都失败了');
  console.log('\n请手动下载字体文件：');
  console.log('1. 访问: https://fonts.google.com/noto/specimen/Noto+Sans+SC');
  console.log('2. 点击 "Download family" 下载');
  console.log('3. 解压后找到 NotoSansSC-Regular.ttf');
  console.log(`4. 保存到: ${fontDir}/NotoSansSC-Regular.ttf`);
  console.log('\n或者：');
  console.log('1. 访问: https://github.com/adobe-fonts/source-han-sans/releases');
  console.log('2. 下载 SourceHanSansCN-Regular.otf');
  console.log(`3. 保存到: ${fontDir}/SourceHanSansCN-Regular.otf`);
}

main().catch(console.error);
