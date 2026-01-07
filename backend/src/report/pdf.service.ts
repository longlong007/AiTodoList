import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { Report } from './entities/report.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfService {
  async generatePdf(report: Report): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50,
          },
        });

        const buffers: Buffer[] = [];

        doc.on('data', (buffer) => buffers.push(buffer));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // 尝试加载中文字体，如果失败则使用 Courier（对Unicode支持较好）
        try {
          // 尝试多个可能的中文字体路径
          const possibleFontPaths = [
            // Windows
            'C:/Windows/Fonts/msyh.ttc',  // 微软雅黑
            'C:/Windows/Fonts/simhei.ttf', // 黑体
            'C:/Windows/Fonts/simsun.ttc', // 宋体
            // Linux
            '/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf',
            '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
            '/usr/share/fonts/truetype/wqy/wqy-microhei.ttc',
            // macOS
            '/System/Library/Fonts/PingFang.ttc',
            '/Library/Fonts/Arial Unicode.ttf',
          ];

          let fontLoaded = false;
          for (const fontPath of possibleFontPaths) {
            if (fs.existsSync(fontPath)) {
              doc.registerFont('ChineseFont', fontPath);
              doc.font('ChineseFont');
              fontLoaded = true;
              console.log('✅ 成功加载中文字体:', fontPath);
              break;
            }
          }

          if (!fontLoaded) {
            console.warn('⚠️ 未找到中文字体文件，使用 Courier 字体');
            doc.font('Courier');
          }
        } catch (error) {
          console.warn('⚠️ 加载中文字体失败，使用 Courier 字体:', error.message);
          doc.font('Courier');
        }

        // 添加标题
        doc
          .fontSize(20)
          .text('AI智能分析报告', { align: 'center' });

        doc.moveDown();

        // 添加报告标题
        doc
          .fontSize(16)
          .text(report.title);

        doc.moveDown();

        // 添加时间信息
        doc
          .fontSize(10)
          .fillColor('#666666')
          .text(`生成时间: ${new Date(report.createdAt).toLocaleString('zh-CN')}`, {
            align: 'right',
          });

        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // 添加报告内容
        doc
          .fontSize(11)
          .fillColor('#000000');

        // 解析 Markdown 格式的内容为纯文本
        const content = this.parseMarkdownToPdfText(report.content);
        const lines = content.split('\n');

        lines.forEach((line) => {
          if (line.startsWith('## ')) {
            // 二级标题
            doc.moveDown(0.5);
            doc
              .fontSize(14)
              .text(line.replace('## ', ''));
            doc.moveDown(0.3);
            doc.fontSize(11);
          } else if (line.startsWith('### ')) {
            // 三级标题
            doc.moveDown(0.3);
            doc
              .fontSize(12)
              .text(line.replace('### ', ''));
            doc.moveDown(0.2);
            doc.fontSize(11);
          } else if (line.startsWith('- ')) {
            // 列表项
            doc
              .text(`  • ${line.replace('- ', '')}`, { 
                indent: 20,
                continued: false 
              });
          } else if (line.trim() === '') {
            // 空行
            doc.moveDown(0.5);
          } else {
            // 普通文本
            doc.text(line);
          }
        });

        // 添加页脚
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);
          doc
            .fontSize(9)
            .fillColor('#999999')
            .text(
              `第 ${i + 1} 页，共 ${pages.count} 页`,
              50,
              doc.page.height - 50,
              { align: 'center' },
            );
          doc
            .text(
              'Powered by AI TodoList',
              50,
              doc.page.height - 35,
              { align: 'center' },
            );
        }

        doc.end();
      } catch (error) {
        console.error('PDF 生成错误:', error);
        reject(error);
      }
    });
  }

  private parseMarkdownToPdfText(markdown: string): string {
    return markdown
      .replace(/\*\*(.*?)\*\*/g, '$1') // 移除加粗标记
      .replace(/\*(.*?)\*/g, '$1') // 移除斜体标记
      .replace(/`(.*?)`/g, '$1') // 移除代码标记
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // 移除链接，保留文本
      .replace(/---/g, '─'.repeat(50)) // 替换分隔线
      .trim();
  }
}
