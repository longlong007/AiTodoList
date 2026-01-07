import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request, Res, StreamableFile } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportService } from './report.service';
import { PdfService } from './pdf.service';
import { CreateReportDto } from './dto/create-report.dto';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportController {
  constructor(
    private reportService: ReportService,
    private pdfService: PdfService,
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
    
    // 如果对象存储中有 PDF，返回重定向
    if (report.pdfUrl) {
      return res.redirect(report.pdfUrl);
    }
    
    // 否则实时生成
    const pdfBuffer = await this.pdfService.generatePdf(report);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="report-${report.id}.pdf"`,
      'Content-Length': pdfBuffer.length,
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

