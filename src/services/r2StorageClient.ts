import { supabase } from './supabase';

export interface UploadProgressEvent {
  percent: number;
  loaded: number;
  total: number;
}

export interface UploadResult {
  fileKey: string;
  publicUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileType: 'image' | 'video' | 'pdf' | 'code' | 'document';
}

export class R2StorageClient {
  private activeUploads = new Map<string, XMLHttpRequest>();

  /**
   * Upload a file with progress tracking and abort support
   */
  public async uploadFile(
    file: File,
    folder: 'avatars' | 'covers' | 'posts' | 'blogs' | 'messages' | 'solutions' | 'documents' = 'posts',
    onProgress?: (progress: UploadProgressEvent) => void,
    signal?: AbortSignal
  ): Promise<UploadResult> {
    // 1. Get Supabase session token
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      throw new Error('Authentication required. Please sign in to upload files.');
    }

    // 2. Request presigned upload URL from backend
    const presignRes = await fetch('/api/storage/presign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        folder,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        fileSize: file.size,
      }),
    });

    if (!presignRes.ok) {
      const err = await presignRes.json().catch(() => ({ message: 'Upload authorization failed' }));
      throw new Error(err.message || 'Failed to authorize upload');
    }

    const authData = await presignRes.json();
    const { uploadUrl, fileKey, publicUrl, fileType, headers } = authData;

    // 3. Perform upload via XMLHttpRequest for granular progress
    const uploadId = `${fileKey}-${Date.now()}`;

    return new Promise<UploadResult>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      this.activeUploads.set(uploadId, xhr);

      if (signal) {
        signal.addEventListener('abort', () => {
          xhr.abort();
          this.activeUploads.delete(uploadId);
          reject(new DOMException('Upload aborted by user', 'AbortError'));
        });
      }

      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable && onProgress) {
          const percent = Math.round((evt.loaded / evt.total) * 100);
          onProgress({ percent, loaded: evt.loaded, total: evt.total });
        }
      };

      xhr.onload = () => {
        this.activeUploads.delete(uploadId);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({
            fileKey,
            publicUrl,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type || 'application/octet-stream',
            fileType: fileType as any,
          });
        } else {
          reject(new Error(`Storage server responded with status ${xhr.status}: ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => {
        this.activeUploads.delete(uploadId);
        reject(new Error('Network error occurred during file upload. Check your connection and retry.'));
      };

      xhr.onabort = () => {
        this.activeUploads.delete(uploadId);
        reject(new DOMException('Upload cancelled', 'AbortError'));
      };

      xhr.open('PUT', uploadUrl, true);
      if (headers) {
        for (const [key, value] of Object.entries(headers)) {
          xhr.setRequestHeader(key, value as string);
        }
      }
      xhr.send(file);
    });
  }

  /**
   * Delete an existing file by key
   */
  public async deleteFile(fileKey: string): Promise<boolean> {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return false;

    const res = await fetch('/api/storage/file', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ fileKey }),
    });

    return res.ok;
  }
}

export const r2StorageClient = new R2StorageClient();
