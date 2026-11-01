import test from 'node:test';
import assert from 'node:assert/strict';
import { r2Storage } from './r2StorageServer.ts';

test('Feature: Cloudflare R2 Storage Service Architecture & URLs', async (t) => {
  await t.test('1. Reports correct Cloudflare R2 bucket details and public dev URL', () => {
    const status = r2Storage.getStatus();
    assert.strictEqual(status.bucket, 'programming', 'Bucket must be configured as programming');
    assert.strictEqual(
      status.publicUrl,
      'https://pub-890b05cef4954f13b12d384515ac3f14.r2.dev',
      'Public development URL must match Cloudflare r2.dev domain'
    );
    assert.strictEqual(
      status.s3Endpoint,
      'https://9c90778a0034df1c4ce84b9881b9e6ea.r2.cloudflarestorage.com/programming',
      'S3 endpoint must target the account and programming bucket'
    );
    assert.strictEqual(
      status.catalogUri,
      'https://catalog.cloudflarestorage.com/9c90778a0034df1c4ce84b9881b9e6ea/programming',
      'Catalog URI must point to Cloudflare storage catalog'
    );
  });

  await t.test('2. Generates sanitized folder and key paths for uploads', async () => {
    const testUserId = 'test-user-12345';
    const uploadRes = await r2Storage.getPresignedUploadUrl(
      testUserId,
      'avatars',
      'my_avatar.png',
      'image/png',
      1024 * 100 // 100 KB
    );

    assert.ok(uploadRes.uploadUrl, 'Must generate uploadUrl');
    assert.ok(uploadRes.fileKey.startsWith('avatars/'), 'FileKey must be placed in avatars folder');
    assert.ok(uploadRes.fileKey.endsWith('.png'), 'FileKey must retain proper file extension');
    assert.strictEqual(uploadRes.fileType, 'image');
    assert.strictEqual(uploadRes.mimeType, 'image/png');
  });

  await t.test('3. Enforces MIME constraints across images, videos, documents, and code', async () => {
    const testUserId = 'test-user-12345';

    // C++ source code
    const cppRes = await r2Storage.getPresignedUploadUrl(
      testUserId,
      'solutions',
      'solution.cpp',
      'text/x-c++src',
      5000
    );
    assert.strictEqual(cppRes.fileType, 'code');

    // PDF document
    const pdfRes = await r2Storage.getPresignedUploadUrl(
      testUserId,
      'documents',
      'notes.pdf',
      'application/pdf',
      1024 * 1024
    );
    assert.strictEqual(pdfRes.fileType, 'pdf');

    // Rejection of disallowed executable MIME
    await assert.rejects(
      async () => {
        await r2Storage.getPresignedUploadUrl(
          testUserId,
          'posts',
          'virus.bat',
          'application/x-bat',
          1024
        );
      },
      /Unsupported MIME type/,
      'Must reject unsupported MIME types'
    );
  });

  await t.test('4. Direct buffer upload writes and cleans up files safely', async () => {
    const testUserId = 'test-user-12345';
    const testContent = Buffer.from('console.log("hello r2 storage");', 'utf-8');

    const directRes = await r2Storage.uploadDirect(
      testUserId,
      'code_snippets',
      'snippet.txt',
      'text/plain',
      testContent
    );

    assert.ok(directRes.fileKey.startsWith('code_snippets/'), 'Must store under specified folder');
    assert.ok(directRes.publicUrl.includes(directRes.fileKey), 'Public URL must include fileKey');

    // Clean up
    await r2Storage.deleteFile(directRes.fileKey);
  });
});
