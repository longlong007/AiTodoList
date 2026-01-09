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
  ) {
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/5f1615aa-14ba-473d-96d5-51334cc6f28c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'report.controller.ts:46',message:'downloadPdf endpoint hit',data:{reportId:id,userId:req.user.userId},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'OSS'})}).catch(()=>{});
    // #endregion
    
    const report = await this.reportService.findOne(id, req.user.userId);
    
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/5f1615aa-14ba-473d-96d5-51334cc6f28c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'report.controller.ts:52',message:'Report fetched',data:{reportId:report.id,hasPdfUrl:!!report.pdfUrl,pdfKey:report.pdfKey},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'OSS'})}).catch(()=>{});
    // #endregion
    
    // 如果对象存储中有 PDF，生成签名 URL 并返回
    if (report.pdfUrl && report.pdfKey) {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/5f1615aa-14ba-473d-96d5-51334cc6f28c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'report.controller.ts:60',message:'Generating signed URL for OSS',data:{pdfKey:report.pdfKey},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'OSS'})}).catch(()=>{});
      // #endregion
      
      // 生成带签名的临时访问 URL（1小时有效期）
      const signedUrl = await this.storageService.getSignedUrl(report.pdfKey, 3600);
      
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/5f1615aa-14ba-473d-96d5-51334cc6f28c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'report.controller.ts:69',message:'Signed URL generated, returning to client',data:{signedUrlPreview:signedUrl.substring(0,100)+'...'},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'OSS'})}).catch(()=>{});
      // #endregion
      
      // 返回签名 URL，让前端打开
      return {
        success: true,
        data: {
          url: signedUrl,
          fromStorage: true,
        },
      };
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/5f1615aa-14ba-473d-96d5-51334cc6f28c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'report.controller.ts:84',message:'No PDF in storage, return error - should generate first',data:{reportId:report.id},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'REALTIME'})}).catch(()=>{});
    // #endregion
    
    // PDF 不存在，返回错误提示
    return {
      success: false,
      message: 'PDF 尚未生成，请先点击"生成 PDF"按钮',
    };
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

