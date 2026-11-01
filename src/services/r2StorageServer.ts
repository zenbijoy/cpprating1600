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
  private accountId: string = '';
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

  public reconfigure() {
    this.initClient();
  }

  private initClient() {
    let accountId = process.env.R2_ACCOUNT_ID?.trim() || '';
    const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim() || '';
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim() || '';
    let bucket = process.env.R2_BUCKET_NAME?.trim() || '';
    let publicUrl = process.env.R2_PUBLIC_URL?.trim() || '';
    const s3ApiUrl = process.env.R2_S3_API_URL?.trim() || '';
    const catalogUri = process.env.R2_CATALOG_URI?.trim() || '';

    // Auto-parse Account ID and Bucket from S3 API URL if provided
    if (s3ApiUrl) {
      const match = s3ApiUrl.match(/https?:\/\/([a-f0-9]{32})\.r2\.cloudflarestorage\.com(?:\/([^\/\s?#]+))?/i);
      if (match) {
        if (!accountId) accountId = match[1];
        if (!bucket && match[2]) bucket = match[2];
      }
    }

    // Auto-parse Account ID and Bucket from Catalog URI if provided
    if (catalogUri) {
      const match = catalogUri.match(/https?:\/\/catalog\.cloudflarestorage\.com\/([a-f0-9]{32})(?:\/([^\/\s?#]+))?/i);
      if (match) {
        if (!accountId) accountId = match[1];
        if (!bucket && match[2]) bucket = match[2];
      }
    }

    this.accountId = accountId || '9c90778a0034df1c4ce84b9881b9e6ea';
    this.bucket = bucket || 'programming';
    this.publicUrl = (publicUrl || 'https://pub-890b05cef4954f13b12d384515ac3f14.r2.dev').replace(/\/$/, '');

    if (this.accountId && accessKeyId && secretAccessKey) {
      try {
        this.s3Client = new S3Client({
          region: 'auto',
          endpoint: `https://${this.accountId}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        });
        this.isConfigured = true;
        console.log(`[R2Storage] Cloudflare R2 S3 Client active for bucket: '${this.bucket}' (Public URL: ${this.publicUrl})`);
      } catch (err) {
        console.error('[R2Storage] Failed to initialize R2 S3 Client:', err);
        this.isConfigured = false;
      }
    } else {
      if (this.accountId && this.bucket) {
        console.warn(`[R2Storage] Cloudflare R2 bucket target identified: '${this.bucket}' (Account: ${this.accountId}). Set R2_ACCESS_KEY_ID & R2_SECRET_ACCESS_KEY to enable live S3 uploads. Operating in secure local storage mode.`);
      } else {
        console.warn('[R2Storage] Cloudflare R2 credentials not detected in environment. Operating in secure local storage mode.');
      }
      this.isConfigured = false;
    }
  }

  public getStatus() {
    return {
      provider: this.isConfigured ? 'cloudflare-r2' : 'local-storage',
      isConfigured: this.isConfigured,
      bucket: this.bucket || 'programming',
      accountId: this.accountId ? `${this.accountId.slice(0, 6)}...${this.accountId.slice(-4)}` : null,
      publicUrl: this.publicUrl || 'https://pub-890b05cef4954f13b12d384515ac3f14.r2.dev',
      s3Endpoint: this.accountId ? `https://${this.accountId}.r2.cloudflarestorage.com/${this.bucket}` : null,
      catalogUri: `https://catalog.cloudflarestorage.com/${this.accountId}/${this.bucket}`,
      hasCredentials: Boolean(process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY),
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
   * Direct server-side upload of a key to R2 or local storage
   */
  public async uploadDirectKey(userId: string, fileKey: string, mimeType: string, buffer: Buffer) {
    if (this.isConfigured && this.s3Client) {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: fileKey,
        Body: buffer,
        ContentType: mimeType,
        Metadata: {
          'uploaded-by': userId,
        },
      });
      await this.s3Client.send(command);
    } else {
      this.saveLocalFile(fileKey, buffer);
    }
  }

  /**
   * Direct server-side upload with file generation
   */
  public async uploadDirect(
    userId: string,
    folder: string,
    fileName: string,
    mimeType: string,
    buffer: Buffer
  ) {
    const typeRule = ALLOWED_MIME_TYPES[mimeType.toLowerCase()];
    if (!typeRule) {
      throw new Error(`Unsupported MIME type '${mimeType}'. Allowed formats: JPEG, PNG, WebP, GIF, SVG, MP4, WebM, PDF, TXT, C++, Python, JSON.`);
    }

    if (buffer.length > typeRule.maxSize) {
      throw new Error(`File size (${(buffer.length / (1024 * 1024)).toFixed(1)} MB) exceeds maximum allowed size (${(typeRule.maxSize / (1024 * 1024)).toFixed(1)} MB) for ${typeRule.category}.`);
    }

    const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '') || 'general';
    const ext = path.extname(fileName) || (typeRule.category === 'image' ? '.png' : '');
    const cleanExt = ext.replace(/[^a-zA-Z0-9.]/g, '');
    const key = `${safeFolder}/${Date.now()}-${crypto.randomUUID()}${cleanExt}`;

    if (this.isConfigured && this.s3Client) {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        Metadata: {
          'uploaded-by': userId,
          'original-name': encodeURIComponent(fileName),
        },
      });
      await this.s3Client.send(command);
      const publicUrl = this.publicUrl ? `${this.publicUrl}/${key}` : `/uploads/${key}`;

      return {
        strategy: 'r2_direct',
        fileKey: key,
        publicUrl,
        fileType: typeRule.category,
        mimeType,
        fileSize: buffer.length,
      };
    } else {
      this.saveLocalFile(key, buffer);
      return {
        strategy: 'local_upload',
        fileKey: key,
        publicUrl: `/uploads/${key}`,
        fileType: typeRule.category,
        mimeType,
        fileSize: buffer.length,
      };
    }
  }

  /**
   * Delete an object from storage
   */
  public async deleteFile(fileKey: string) {
    if (this.isConfigured && this.s3Client) {
      try {
        const command = new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: fileKey,
        });
        await this.s3Client.send(command);
      } catch (err) {
        console.warn(`[R2Storage] Non-fatal R2 deletion notice for key '${fileKey}':`, err);
      }
    }

    const localPath = path.join(this.localUploadDir, fileKey);
    if (fs.existsSync(localPath)) {
      try {
        fs.unlinkSync(localPath);
      } catch (err) {
        console.warn(`[R2Storage] Non-fatal local deletion notice for key '${fileKey}':`, err);
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
export async function getStorageStatusHandler(_req: Request, res: Response) {
  return res.json({ status: 'OK', storage: r2Storage.getStatus() });
}

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

export async function directUploadHandler(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'You must be logged in to upload files.' });
  }

  const fileKey = req.query.key as string;
  const folder = (req.query.folder as string) || (req.headers['x-folder'] as string) || 'attachments';
  const fileName = (req.query.fileName as string) || (req.headers['x-file-name'] as string) || 'upload.bin';
  const mimeType = (req.query.mime as string) || req.headers['content-type'] || 'application/octet-stream';

  const chunks: Buffer[] = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('end', async () => {
    try {
      const buffer = Buffer.concat(chunks);
      if (buffer.length === 0) {
        return res.status(400).json({ error: 'BadRequest', message: 'Empty upload body received.' });
      }

      if (fileKey) {
        await r2Storage.uploadDirectKey(user.id, fileKey, mimeType, buffer);
        const status = r2Storage.getStatus();
        const publicUrl = status.isConfigured ? `${status.publicUrl}/${fileKey}` : `/uploads/${fileKey}`;
        return res.json({ status: 'OK', fileKey, publicUrl });
      }

      const result = await r2Storage.uploadDirect(user.id, folder, fileName, mimeType, buffer);
      return res.json({ status: 'OK', ...result });
    } catch (err: any) {
      return res.status(500).json({ error: 'UploadFailed', message: err.message });
    }
  });
}

// Retain localUploadHandler alias for backwards compatibility
export const localUploadHandler = directUploadHandler;
