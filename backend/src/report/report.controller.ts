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
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/5f1615aa-14ba-473d-96d5-51334cc6f28c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'report.controller.ts:46',message:'downloadPdf endpoint hit',data:{reportId:id,userId:req.user.userId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,B,C'})}).catch(()=>{});
    // #endregion
    
    const report = await this.reportService.findOne(id, req.user.userId);
    
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/5f1615aa-14ba-473d-96d5-51334cc6f28c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'report.controller.ts:52',message:'Report fetched',data:{reportId:report.id,hasPdfUrl:!!report.pdfUrl,pdfUrl:report.pdfUrl,pdfKey:report.pdfKey},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,C'})}).catch(()=>{});
    // #endregion
    
    // 如果对象存储中有 PDF，返回重定向
    if (report.pdfUrl) {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/5f1615aa-14ba-473d-96d5-51334cc6f28c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'report.controller.ts:61',message:'Redirecting to pdfUrl',data:{pdfUrl:report.pdfUrl},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return res.redirect(report.pdfUrl);
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/5f1615aa-14ba-473d-96d5-51334cc6f28c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'report.controller.ts:68',message:'Generating PDF in real-time',data:{reportId:report.id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B,C'})}).catch(()=>{});
    // #endregion
    
    // 否则实时生成
    const pdfBuffer = await this.pdfService.generatePdf(report);

    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/5f1615aa-14ba-473d-96d5-51334cc6f28c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'report.controller.ts:77',message:'PDF buffer generated',data:{bufferLength:pdfBuffer.length,bufferIsEmpty:pdfBuffer.length===0},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B,C'})}).catch(()=>{});
    // #endregion

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="report-${report.id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/5f1615aa-14ba-473d-96d5-51334cc6f28c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'report.controller.ts:88',message:'Response headers set, returning StreamableFile',data:{contentType:'application/pdf',contentLength:pdfBuffer.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

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

