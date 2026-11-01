# Cloudflare R2 Storage & Media Architecture

CLIMB 1600 integrates **Cloudflare R2** (S3-compatible object storage) to provide high-performance, globally edge-distributed, and egress-free media hosting for:
- User profile avatars
- Community icons and cover banners
- Social feed post media (images, diagrams, walkthrough videos)
- Problem solution code snippets, notes, and PDF editorial documents
- Direct messaging attachments

---

## 1. Bucket Specifications & Endpoints

| Parameter | Value | Description |
| :--- | :--- | :--- |
| **Account ID** | `9c90778a0034df1c4ce84b9881b9e6ea` | Cloudflare R2 Account Identifier |
| **Bucket Name** | `programming` | Designated storage bucket |
| **S3 API URL** | `https://9c90778a0034df1c4ce84b9881b9e6ea.r2.cloudflarestorage.com/programming` | S3 API endpoint for AWS SDK v3 |
| **Public Development URL** | `https://pub-890b05cef4954f13b12d384515ac3f14.r2.dev` | Global edge CDN domain serving uploaded assets |
| **Catalog URI** | `https://catalog.cloudflarestorage.com/9c90778a0034df1c4ce84b9881b9e6ea/programming` | Cloudflare Storage Catalog endpoint |

---

## 2. Environment Configuration

Add the following variables to `.env`:

```env
# Cloudflare R2 Storage Configuration
R2_ACCOUNT_ID="9c90778a0034df1c4ce84b9881b9e6ea"
R2_BUCKET_NAME="programming"
R2_PUBLIC_URL="https://pub-890b05cef4954f13b12d384515ac3f14.r2.dev"
R2_S3_API_URL="https://9c90778a0034df1c4ce84b9881b9e6ea.r2.cloudflarestorage.com/programming"
R2_CATALOG_URI="https://catalog.cloudflarestorage.com/9c90778a0034df1c4ce84b9881b9e6ea/programming"

# Cloudflare R2 S3 API Credentials
# Generated via Cloudflare Dashboard -> R2 -> Manage R2 API Tokens
R2_ACCESS_KEY_ID="your-r2-access-key-id"
R2_SECRET_ACCESS_KEY="your-r2-secret-access-key"
```

> **Note:** If `R2_ACCESS_KEY_ID` or `R2_SECRET_ACCESS_KEY` are not yet set, the platform operates in a zero-crash **local storage fallback mode** (`public/uploads`), and seamlessly switches to live Cloudflare R2 the moment credentials are provided.

---

## 3. How to Obtain R2 S3 API Credentials

1. Open the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. In the left-hand navigation, click **R2**.
3. Under the **Account Details** card on the right, click **Manage R2 API Tokens**.
4. Click **Create API Token**.
5. Configure the token:
   - **Token Name**: `climb1600-r2-uploader`
   - **Permissions**: `Object Read & Write`
   - **Apply to**: Select `programming` bucket (or `All buckets`)
   - **TTL**: Select your preferred expiration (or leave default)
6. Click **Create API Token**.
7. Copy the **Access Key ID** and **Secret Access Key**, and paste them into your `.env`:
   - `R2_ACCESS_KEY_ID="..."`
   - `R2_SECRET_ACCESS_KEY="..."`

---

## 4. Configuring CORS on the Bucket (for Direct Browser Uploads)

To allow browsers to upload directly to your Cloudflare R2 bucket with high-speed presigned URLs, configure CORS in the Cloudflare dashboard:

1. Navigate to **R2 > Buckets > programming**.
2. Go to the **Settings** tab.
3. Scroll down to **CORS Policy** and click **Add CORS Policy**.
4. Paste the following JSON policy:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://*.climb1600.com",
      "https://climb1600.com",
      "*"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]
```
5. Click **Save**.

---

## 5. Dual-Path Resilient Upload Architecture

To ensure 100% upload reliability, the system implements a **dual-path upload strategy**:

```
[Browser / Mobile Client]
         │
         ▼
 POST /api/storage/presign
         │
         ├──► 1. Tries direct S3 PUT to R2 Presigned URL
         │       (High speed, edge distributed)
         │
         └──► 2. In case of CORS error or network block:
                 Automatically falls back to POST /api/storage/direct-upload
                 (Server proxy streams file directly to R2 bucket 'programming')
```

Both paths result in the object being stored in bucket `programming` and served directly through `https://pub-890b05cef4954f13b12d384515ac3f14.r2.dev/${fileKey}`.

---

## 6. Storage Constraints & Quotas

| Category | Allowed MIME Types | Max Size | Folder Structure |
| :--- | :--- | :--- | :--- |
| **Images** | `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/svg+xml` | **10 MB** | `avatars/`, `covers/`, `posts/` |
| **Videos** | `video/mp4`, `video/webm`, `video/quicktime` | **100 MB** | `posts/`, `walkthroughs/` |
| **Documents** | `application/pdf`, `application/json`, `application/zip`, `text/markdown` | **25 MB** | `documents/`, `editorials/` |
| **Code** | `text/x-c++src`, `text/x-c`, `text/x-python`, `text/plain` | **10 MB** | `solutions/`, `code_snippets/` |

---

## 7. Storage API Endpoints

- **`GET /api/storage/status`** — Returns current storage health, bucket name, public URL, and configuration status.
- **`POST /api/storage/presign`** — Generates a 15-minute presigned S3 upload URL for authenticated users.
- **`POST /api/storage/direct-upload`** — Server-side direct upload endpoint (proxies to R2 bucket).
- **`DELETE /api/storage/file`** — Deletes an object by key from R2.
- **`GET /uploads/:folder/:fileName`** — Backward-compatibility redirect to `https://pub-890b05cef4954f13b12d384515ac3f14.r2.dev/:folder/:fileName`.
