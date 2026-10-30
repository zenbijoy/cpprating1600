import { Request, Response } from 'express';
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { AuthenticatedRequest, getSupabaseAdmin } from './authServer';

// Allowed MIME types and size constraints
const ALLOWED_MIME_TYPES: Record<string, { maxSize: number; category: string }> = {
  // Images (10 MB max)
  'image/jpeg': { maxSize: 10 * 1024 * 1024, category: 'image' },
  'image/png': { maxSize: 10 * 1024 * 1024, category: 'image' },
  'image/webp': { maxSize: 10 * 1024 * 1024, category: 'image' },
  'image/gif': { maxSize: 10 * 1024 * 1024, category: 'image' },
  'image/svg+xml': { maxSize: 5 * 1024 * 1024, category: 'image' },

  // Videos (100 MB max)
  'video/mp4': { maxSize: 100 * 1024 * 1024, category: 'video' },
  'video/webm': { maxSize: 100 * 1024 * 1024, category: 'video' },
  'video/quicktime': { maxSize: 100 * 1024 * 1024, category: 'video' },

  // Documents & Code (25 MB max)
  'application/pdf': { maxSize: 25 * 1024 * 1024, category: 'pdf' },
  'text/plain': { maxSize: 10 * 1024 * 1024, category: 'code' },
  'text/markdown': { maxSize: 10 * 1024 * 1024, category: 'document' },
  'text/x-c++src': { maxSize: 5 * 1024 * 1024, category: 'code' },
  'text/x-c': { maxSize: 5 * 1024 * 1024, category: 'code' },
  'text/x-python': { maxSize: 5 * 1024 * 1024, category: 'code' },
  'application/json': { maxSize: 10 * 1024 * 1024, category: 'document' },
  'application/zip': { maxSize: 25 * 1024 * 1024, category: 'document' },
};

export class R2StorageService {
  private s3Client: S3Client | null = null;
  private bucket: string = '';
  private publicUrl: string = '';
  private isConfigured: boolean = false;
  private localUploadDir: string;

  constructor() {
    this.localUploadDir = path.resolve('public/uploads');
    if (!fs.existsSync(this.localUploadDir)) {
      fs.mkdirSync(this.localUploadDir, { recursive: true });
    }
    this.initClient();
  }

  private initClient() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucket = process.env.R2_BUCKET_NAME || 'climb1600-media';
    const publicUrl = process.env.R2_PUBLIC_URL || '';

    if (accountId && accessKeyId && secretAccessKey) {
      try {
        this.s3Client = new S3Client({
          region: 'auto',
          endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        });
        this.bucket = bucket;
        this.publicUrl = publicUrl.replace(/\/$/, '');
        this.isConfigured = true;
        console.log('[R2Storage] Cloudflare R2 S3 Client successfully initialized for bucket:', bucket);
      } catch (err) {
        console.error('[R2Storage] Failed to initialize R2 S3 Client:', err);
        this.isConfigured = false;
      }
    } else {
      console.warn('[R2Storage] Cloudflare R2 credentials not detected in environment. Operating in secure local storage mode.');
      this.isConfigured = false;
    }
  }

  public getStatus() {
    return {
      provider: this.isConfigured ? 'cloudflare-r2' : 'local-storage',
      isConfigured: this.isConfigured,
      bucket: this.bucket || 'local-uploads',
    };
  }

  /**
   * Generates a short-lived presigned upload URL for authorized clients
   */
  public async getPresignedUploadUrl(
    userId: string,
    folder: string,
    fileName: string,
    mimeType: string,
    fileSize: number
  ) {
    const typeRule = ALLOWED_MIME_TYPES[mimeType.toLowerCase()];
    if (!typeRule) {
      throw new Error(`Unsupported MIME type '${mimeType}'. Allowed formats: JPEG, PNG, WebP, GIF, SVG, MP4, WebM, PDF, TXT, C++, Python, JSON.`);
    }

    if (fileSize > typeRule.maxSize) {
      throw new Error(`File size (${(fileSize / (1024 * 1024)).toFixed(1)} MB) exceeds maximum allowed size (${(typeRule.maxSize / (1024 * 1024)).toFixed(1)} MB) for ${typeRule.category}.`);
    }

    // Sanitize folder
    const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '') || 'general';
    const ext = path.extname(fileName) || (typeRule.category === 'image' ? '.png' : '');
    const cleanExt = ext.replace(/[^a-zA-Z0-9.]/g, '');
    const key = `${safeFolder}/${Date.now()}-${crypto.randomUUID()}${cleanExt}`;

    if (this.isConfigured && this.s3Client) {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: mimeType,
        Metadata: {
          'uploaded-by': userId,
          'original-name': encodeURIComponent(fileName),
        },
      });

      // 15-minute presigned upload window
      const presignedUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 900 });
      const publicUrl = this.publicUrl ? `${this.publicUrl}/${key}` : presignedUrl.split('?')[0];

      return {
        strategy: 'r2_presigned',
        uploadUrl: presignedUrl,
        fileKey: key,
        publicUrl,
        fileType: typeRule.category,
        mimeType,
        maxSize: typeRule.maxSize,
        headers: {
          'Content-Type': mimeType,
        },
      };
    } else {
      // Local development fallback
      const uploadUrl = `/api/storage/local-upload?key=${encodeURIComponent(key)}&mime=${encodeURIComponent(mimeType)}`;
      const publicUrl = `/uploads/${key}`;

      return {
        strategy: 'local_upload',
        uploadUrl,
        fileKey: key,
        publicUrl,
        fileType: typeRule.category,
        mimeType,
        maxSize: typeRule.maxSize,
        headers: {
          'Content-Type': mimeType,
        },
      };
    }
  }

  /**
   * Delete an object from storage
   */
  public async deleteFile(fileKey: string) {
    if (this.isConfigured && this.s3Client) {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: fileKey,
      });
      await this.s3Client.send(command);
    } else {
      const localPath = path.join(this.localUploadDir, fileKey);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    }
  }

  /**
   * Save a local file buffer (for local development mode)
   */
  public saveLocalFile(fileKey: string, buffer: Buffer) {
    const fullPath = path.join(this.localUploadDir, fileKey);
    const parentDir = path.dirname(fullPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(fullPath, buffer);
  }
}

export const r2Storage = new R2StorageService();

// Express Route Handlers
export async function getPresignedUrlHandler(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'You must be logged in to upload files.' });
  }

  const { folder, fileName, mimeType, fileSize } = req.body;
  if (!fileName || !mimeType || typeof fileSize !== 'number') {
    return res.status(400).json({
      error: 'BadRequest',
      message: 'Missing required upload parameters: fileName, mimeType, and fileSize (bytes).',
    });
  }

  try {
    const result = await r2Storage.getPresignedUploadUrl(
      user.id,
      folder || 'attachments',
      fileName,
      mimeType,
      fileSize
    );
    return res.json({ status: 'OK', ...result });
  } catch (err: any) {
    return res.status(400).json({ error: 'UploadAuthorizationError', message: err.message });
  }
}

export async function deleteFileHandler(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { fileKey } = req.body;
  if (!fileKey) {
    return res.status(400).json({ error: 'BadRequest', message: 'fileKey is required.' });
  }

  try {
    await r2Storage.deleteFile(fileKey);
    return res.json({ status: 'OK', message: 'File successfully deleted.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'DeletionError', message: err.message });
  }
}

export async function localUploadHandler(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const fileKey = req.query.key as string;
  if (!fileKey) {
    return res.status(400).json({ error: 'Missing file key' });
  }

  const chunks: Buffer[] = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('end', () => {
    try {
      const buffer = Buffer.concat(chunks);
      r2Storage.saveLocalFile(fileKey, buffer);
      return res.json({ status: 'OK', publicUrl: `/uploads/${fileKey}` });
    } catch (err: any) {
      return res.status(500).json({ error: 'LocalWriteFailed', message: err.message });
    }
  });
}
