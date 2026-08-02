import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PrismaService } from '../prisma/prisma.service';
import { CreateResourceDto, PresignUploadDto } from './dto/storage.dto';
import * as crypto from 'crypto';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private prisma: PrismaService) {
    this.bucketName = process.env.AWS_S3_BUCKET_NAME || 'mathbuddy-dev-bucket';
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'mock-access-key',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'mock-secret-key',
      },
      // Para desarrollo local se podría usar un endpoint a MinIO si estuviera configurado:
      // endpoint: process.env.S3_ENDPOINT,
      // forcePathStyle: true,
    });
  }

  async generatePresignedUploadUrl(uploaderId: string, dto: PresignUploadDto) {
    try {
      const fileExtension = dto.fileName.split('.').pop();
      const uniqueKey = `resources/${uploaderId}/${crypto.randomUUID()}.${fileExtension}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: uniqueKey,
        ContentType: dto.mimeType,
      });

      // La URL firmada expira en 15 minutos (900 segundos)
      const uploadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: 900,
      });

      return {
        uploadUrl,
        fileKey: uniqueKey,
      };
    } catch (error) {
      this.logger.error('Failed to generate presigned upload URL', error);
      throw new InternalServerErrorException('Failed to generate upload URL');
    }
  }

  async generatePresignedDownloadUrl(userId: string, resourceId: string) {
    const resource = await this.prisma.resource.findUnique({
      where: { id: resourceId },
    });

    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    this.logger.log(
      `User ${userId} requested download for resource ${resourceId}`,
    );

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: resource.fileKey,
      });

      // La URL firmada para descarga expira en 1 hora (3600 segundos)
      const downloadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: 3600,
      });

      return {
        downloadUrl,
      };
    } catch (error) {
      this.logger.error('Failed to generate presigned download URL', error);
      throw new InternalServerErrorException('Failed to generate download URL');
    }
  }

  async registerResource(uploaderId: string, dto: CreateResourceDto) {
    return this.prisma.resource.create({
      data: {
        title: dto.title,
        description: dto.description,
        fileKey: dto.fileKey,
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes,
        uploaderId,
        courseId: dto.courseId,
      },
    });
  }

  async getResourcesByCourse(courseId: string) {
    return this.prisma.resource.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
      include: {
        uploader: {
          select: { id: true, email: true },
        },
      },
    });
  }

  async getMyResources(userId: string) {
    return this.prisma.resource.findMany({
      where: { uploaderId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        course: { select: { id: true, name: true } },
      },
    });
  }

  async deleteResource(userId: string, resourceId: string, userRole: string) {
    const resource = await this.prisma.resource.findUnique({
      where: { id: resourceId },
    });

    if (!resource) throw new NotFoundException('Resource not found');

    if (resource.uploaderId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'You do not have permission to delete this resource',
      );
    }

    // Nota: en producción, deberíamos hacer un request `DeleteObjectCommand` a S3 también
    // para liberar espacio.

    return this.prisma.resource.delete({
      where: { id: resourceId },
    });
  }
}
