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
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/5f1615aa-14ba-473d-96d5-51334cc6f28c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'report.controller.ts:46',message:'downloadPdf endpoint hit',data:{reportId:id,userId:req.user.userId},timestamp:Date.now(),sessionId:'debug-session',runId:'proxy-fix',hypothesisId:'CORS'})}).catch(()=>{});
    // #endregion
    
    const report = await this.reportService.findOne(id, req.user.userId);
    
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/5f1615aa-14ba-473d-96d5-51334cc6f28c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'report.controller.ts:54',message:'Report fetched',data:{reportId:report.id,hasPdfUrl:!!report.pdfUrl,pdfKey:report.pdfKey},timestamp:Date.now(),sessionId:'debug-session',runId:'proxy-fix',hypothesisId:'CORS'})}).catch(()=>{});
    // #endregion
    
    // 如果对象存储中有 PDF，后端代理下载并返回
    if (report.pdfUrl && report.pdfKey) {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/5f1615aa-14ba-473d-96d5-51334cc6f28c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'report.controller.ts:63',message:'Generating signed URL and proxying download',data:{pdfKey:report.pdfKey},timestamp:Date.now(),sessionId:'debug-session',runId:'proxy-fix',hypothesisId:'CORS'})}).catch(()=>{});
      // #endregion
      
      try {
        // 生成带签名的临时访问 URL
        const signedUrl = await this.storageService.getSignedUrl(report.pdfKey, 3600);
        
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/5f1615aa-14ba-473d-96d5-51334cc6f28c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'report.controller.ts:72',message:'Signed URL generated, fetching PDF',data:{signedUrlPreview:signedUrl.substring(0,100)+'...'},timestamp:Date.now(),sessionId:'debug-session',runId:'proxy-fix',hypothesisId:'CORS'})}).catch(()=>{});
        // #endregion
        
        // 后端代理下载PDF（避免CORS问题）
        const pdfResponse = await fetch(signedUrl);
        if (!pdfResponse.ok) {
          throw new Error(`Failed to fetch PDF: ${pdfResponse.status} ${pdfResponse.statusText}`);
        }
        
        const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
        
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/5f1615aa-14ba-473d-96d5-51334cc6f28c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'report.controller.ts:85',message:'PDF fetched successfully, returning to client',data:{bufferLength:pdfBuffer.length},timestamp:Date.now(),sessionId:'debug-session',runId:'proxy-fix',hypothesisId:'CORS'})}).catch(()=>{});
        // #endregion
        
        // 设置响应头
        res.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="report-${report.id}.pdf"`,
          'Content-Length': pdfBuffer.length.toString(),
        });
        
        return new StreamableFile(pdfBuffer);
      } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/5f1615aa-14ba-473d-96d5-51334cc6f28c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'report.controller.ts:99',message:'Error fetching PDF from OSS',data:{error:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'proxy-fix',hypothesisId:'CORS'})}).catch(()=>{});
        // #endregion
        
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
    
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/5f1615aa-14ba-473d-96d5-51334cc6f28c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'report.controller.ts:115',message:'No PDF in storage, generating in real-time',data:{reportId:report.id},timestamp:Date.now(),sessionId:'debug-session',runId:'proxy-fix',hypothesisId:'REALTIME'})}).catch(()=>{});
    // #endregion
    
    // PDF 不存在，实时生成
    const pdfBuffer = await this.pdfService.generatePdf(report);

    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/5f1615aa-14ba-473d-96d5-51334cc6f28c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'report.controller.ts:123',message:'PDF buffer generated',data:{bufferLength:pdfBuffer.length},timestamp:Date.now(),sessionId:'debug-session',runId:'proxy-fix',hypothesisId:'REALTIME'})}).catch(()=>{});
    // #endregion

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

