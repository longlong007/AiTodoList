import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { Report } from './entities/report.entity';

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

        // 添加标题
        doc
          .fontSize(20)
          .font('Helvetica-Bold')
          .text('AI智能分析报告', { align: 'center' });

        doc.moveDown();

        // 添加报告标题
        doc
          .fontSize(16)
          .font('Helvetica-Bold')
          .text(report.title);

        doc.moveDown();

        // 添加时间信息
        doc
          .fontSize(10)
          .font('Helvetica')
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
          .font('Helvetica')
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
              .font('Helvetica-Bold')
              .text(line.replace('## ', ''));
            doc.moveDown(0.3);
          } else if (line.startsWith('### ')) {
            // 三级标题
            doc.moveDown(0.3);
            doc
              .fontSize(12)
              .font('Helvetica-Bold')
              .text(line.replace('### ', ''));
            doc.moveDown(0.2);
          } else if (line.startsWith('- ')) {
            // 列表项
            doc
              .fontSize(11)
              .font('Helvetica')
              .text(`  • ${line.replace('- ', '')}`, { indent: 20 });
          } else if (line.trim() === '') {
            // 空行
            doc.moveDown(0.5);
          } else {
            // 普通文本
            doc
              .fontSize(11)
              .font('Helvetica')
              .text(line);
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

