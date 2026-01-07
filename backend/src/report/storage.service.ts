import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as OSS from 'ali-oss';
import * as COS from 'cos-nodejs-sdk-v5';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

export enum StorageType {
  OSS = 'oss',      // 阿里云 OSS
  COS = 'cos',      // 腾讯云 COS
  S3 = 's3',        // AWS S3 或兼容 S3 的存储
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private storageType: StorageType;
  private ossClient: OSS;
  private cosClient: COS;
  private s3Client: S3Client;

  constructor(private configService: ConfigService) {
    this.storageType = (this.configService.get('STORAGE_TYPE') || 's3').toLowerCase() as StorageType;
    this.initStorageClient();
  }

  private initStorageClient() {
    switch (this.storageType) {
      case StorageType.OSS:
        this.ossClient = new OSS({
          region: this.configService.get('OSS_REGION'),
          accessKeyId: this.configService.get('OSS_ACCESS_KEY_ID'),
          accessKeySecret: this.configService.get('OSS_ACCESS_KEY_SECRET'),
          bucket: this.configService.get('OSS_BUCKET'),
        });
        this.logger.log('✅ 已初始化阿里云 OSS 客户端');
        break;

      case StorageType.COS:
        this.cosClient = new COS({
          SecretId: this.configService.get('COS_SECRET_ID'),
          SecretKey: this.configService.get('COS_SECRET_KEY'),
        });
        this.logger.log('✅ 已初始化腾讯云 COS 客户端');
        break;

      case StorageType.S3:
        const s3Config: any = {
          region: this.configService.get('S3_REGION') || 'us-east-1',
          credentials: {
            accessKeyId: this.configService.get('S3_ACCESS_KEY_ID'),
            secretAccessKey: this.configService.get('S3_SECRET_ACCESS_KEY'),
          },
        };
        
        // 可选的 endpoint 配置（用于兼容 S3 的存储）
        const endpoint = this.configService.get('S3_ENDPOINT');
        if (endpoint) {
          s3Config.endpoint = endpoint;
        }
        
        // 某些兼容 S3 的存储需要强制路径样式
        if (this.configService.get('S3_FORCE_PATH_STYLE') === 'true') {
          s3Config.forcePathStyle = true;
        }
        
        this.s3Client = new S3Client(s3Config);
        this.logger.log('✅ 已初始化 S3 客户端');
        break;

      default:
        this.logger.warn(`⚠️ 未配置对象存储，将使用本地存储模式`);
    }
  }

  /**
   * 上传文件到对象存储
   * @param buffer 文件 Buffer
   * @param key 文件路径/键名
   * @param contentType MIME 类型
   * @returns 文件的访问 URL
   */
  async uploadFile(
    buffer: Buffer,
    key: string,
    contentType: string = 'application/pdf',
  ): Promise<string> {
    try {
      switch (this.storageType) {
        case StorageType.OSS:
          const ossResult = await this.ossClient.put(key, buffer, {
            headers: { 'Content-Type': contentType },
          });
          this.logger.log(`✅ 文件已上传到 OSS: ${key}`);
          return ossResult.url;

        case StorageType.COS:
          const bucket = this.configService.get('COS_BUCKET');
          const region = this.configService.get('COS_REGION');
          
          return new Promise((resolve, reject) => {
            this.cosClient.putObject(
              {
                Bucket: bucket,
                Region: region,
                Key: key,
                Body: buffer,
                ContentType: contentType,
              },
              (err, data) => {
                if (err) {
                  reject(err);
                } else {
                  // 构建访问 URL
                  const baseUrl = this.configService.get('COS_BASE_URL') || 
                    `https://${bucket}.cos.${region}.myqcloud.com`;
                  const url = `${baseUrl}/${key}`;
                  this.logger.log(`✅ 文件已上传到 COS: ${key}`);
                  resolve(url);
                }
              },
            );
          });

        case StorageType.S3:
          const s3Bucket = this.configService.get('S3_BUCKET');
          const command = new PutObjectCommand({
            Bucket: s3Bucket,
            Key: key,
            Body: buffer,
            ContentType: contentType,
          });
          await this.s3Client.send(command);
          
          // 构建访问 URL
          const endpoint = this.configService.get('S3_ENDPOINT');
          const region = this.configService.get('S3_REGION') || 'us-east-1';
          const baseUrl = endpoint 
            ? `${endpoint}/${s3Bucket}`
            : `https://${s3Bucket}.s3.${region}.amazonaws.com`;
          
          const url = `${baseUrl}/${key}`;
          this.logger.log(`✅ 文件已上传到 S3: ${key}`);
          return url;

        default:
          throw new Error(`不支持的存储类型: ${this.storageType}`);
      }
    } catch (error) {
      this.logger.error(`❌ 上传文件失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 删除文件
   */
  async deleteFile(key: string): Promise<void> {
    try {
      switch (this.storageType) {
        case StorageType.OSS:
          await this.ossClient.delete(key);
          this.logger.log(`✅ 已从 OSS 删除文件: ${key}`);
          break;

        case StorageType.COS:
          const bucket = this.configService.get('COS_BUCKET');
          const region = this.configService.get('COS_REGION');
          
          await new Promise((resolve, reject) => {
            this.cosClient.deleteObject(
              {
                Bucket: bucket,
                Region: region,
                Key: key,
              },
              (err) => (err ? reject(err) : resolve(null)),
            );
          });
          this.logger.log(`✅ 已从 COS 删除文件: ${key}`);
          break;

        case StorageType.S3:
          const s3Bucket = this.configService.get('S3_BUCKET');
          const command = new DeleteObjectCommand({
            Bucket: s3Bucket,
            Key: key,
          });
          await this.s3Client.send(command);
          this.logger.log(`✅ 已从 S3 删除文件: ${key}`);
          break;
      }
    } catch (error) {
      this.logger.error(`❌ 删除文件失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 生成文件路径
   * @param reportId 报告 ID
   * @param userId 用户 ID
   * @returns 对象存储中的文件键名
   */
  generateKey(reportId: string, userId: string): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `reports/${year}/${month}/${userId}/${reportId}.pdf`;
  }
}

