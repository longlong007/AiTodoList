import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request, Res, StreamableFile } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportService } from './report.service';
import { PdfService } from './pdf.service';
import { StorageService } from './storage.service';
import { CreateReportDto } from './dto/create-report.dto';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportController {
  constructor(
    private reportService: ReportService,
    private pdfService: PdfService,
    private storageService: StorageService,
  ) {}

  @Post()
  async create(@Request() req, @Body() createReportDto: CreateReportDto) {
    const report = await this.reportService.create(req.user.userId, createReportDto);
    return { success: true, data: report };
  }

  @Get()
  async findAll(@Request() req) {
    const reports = await this.reportService.findAll(req.user.userId);
    return { success: true, data: reports };
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    const report = await this.reportService.findOne(id, req.user.userId);
    return { success: true, data: report };
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    await this.reportService.remove(id, req.user.userId);
    return { success: true, message: '报告已删除' };
  }

  @Get(':id/pdf')
  async downloadPdf(
    @Request() req,
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const report = await this.reportService.findOne(id, req.user.userId);
    
    // 如果对象存储中有 PDF，后端代理下载并返回
    if (report.pdfUrl && report.pdfKey) {
      try {
        // 生成带签名的临时访问 URL
        const signedUrl = await this.storageService.getSignedUrl(report.pdfKey, 3600);
        
        // 后端代理下载PDF（避免CORS问题）
        const pdfResponse = await fetch(signedUrl);
        if (!pdfResponse.ok) {
          throw new Error(`Failed to fetch PDF: ${pdfResponse.status} ${pdfResponse.statusText}`);
        }
        
        const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
        
        // 设置响应头
        res.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="report-${report.id}.pdf"`,
          'Content-Length': pdfBuffer.length.toString(),
        });
        
        return new StreamableFile(pdfBuffer);
      } catch (error) {
        // 如果从OSS下载失败，尝试实时生成
        const pdfBuffer = await this.pdfService.generatePdf(report);
        res.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="report-${report.id}.pdf"`,
          'Content-Length': pdfBuffer.length.toString(),
        });
        return new StreamableFile(pdfBuffer);
      }
    }
    
    // PDF 不存在，实时生成
    const pdfBuffer = await this.pdfService.generatePdf(report);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="report-${report.id}.pdf"`,
      'Content-Length': pdfBuffer.length.toString(),
    });

    return new StreamableFile(pdfBuffer);
  }

  @Post(':id/generate-pdf')
  async generatePdf(@Request() req, @Param('id') id: string) {
    const report = await this.reportService.findOne(id, req.user.userId);
    await this.reportService.generateAndUploadPdf(report);
    
    const updatedReport = await this.reportService.findOne(id, req.user.userId);
    return { 
      success: true, 
      message: 'PDF 已生成并上传',
      data: {
        pdfUrl: updatedReport.pdfUrl,
      },
    };
  }
}

