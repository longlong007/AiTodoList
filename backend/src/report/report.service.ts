import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { PdfService } from './pdf.service';
import { StorageService } from './storage.service';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
    private pdfService: PdfService,
    private storageService: StorageService,
  ) {}

  async create(userId: string, createReportDto: CreateReportDto): Promise<Report> {
    const report = this.reportRepository.create({
      ...createReportDto,
      userId,
    });
    
    const savedReport = await this.reportRepository.save(report);
    
    // 异步生成并上传 PDF（不阻塞响应）
    this.generateAndUploadPdf(savedReport).catch((error) => {
      this.logger.error('PDF 生成和上传失败:', error);
    });
    
    return savedReport;
  }

  /**
   * 生成 PDF 并上传到对象存储
   */
  async generateAndUploadPdf(report: Report): Promise<void> {
    try {
      this.logger.log(`开始生成 PDF: ${report.id}`);
      
      // 生成 PDF Buffer
      const pdfBuffer = await this.pdfService.generatePdf(report);
      
      // 生成存储键名
      const key = this.storageService.generateKey(report.id, report.userId);
      
      // 上传到对象存储
      const pdfUrl = await this.storageService.uploadFile(
        pdfBuffer,
        key,
        'application/pdf',
      );
      
      // 更新报告记录
      report.pdfUrl = pdfUrl;
      report.pdfKey = key;
      await this.reportRepository.save(report);
      
      this.logger.log(`✅ PDF 已生成并上传: ${pdfUrl}`);
    } catch (error) {
      this.logger.error(`❌ PDF 生成和上传失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(userId: string): Promise<Report[]> {
    return this.reportRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Report> {
    const report = await this.reportRepository.findOne({
      where: { id, userId },
    });

    if (!report) {
      throw new NotFoundException('报告不存在');
    }

    return report;
  }

  async remove(id: string, userId: string): Promise<void> {
    const report = await this.findOne(id, userId);
    
    // 如果存在 PDF，删除对象存储中的文件
    if (report.pdfKey) {
      try {
        await this.storageService.deleteFile(report.pdfKey);
        this.logger.log(`✅ 已删除对象存储文件: ${report.pdfKey}`);
      } catch (error) {
        this.logger.error('删除对象存储文件失败:', error);
        // 继续删除数据库记录，即使对象存储删除失败
      }
    }
    
    await this.reportRepository.remove(report);
  }
}

