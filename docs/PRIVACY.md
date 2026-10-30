# PRIVACY SPECIFICATION & ETHICAL FRAMEWORK

**System:** CLIMB 1600 AI Discipline Guardian  
**Target:** Voluntary Personal Device Self-Regulation  
**Standard:** Privacy-by-Design & GDPR / Android Security Compliance  
**Location:** `docs/PRIVACY.md`  

---

## 1. Ethical Stance & Transparency Guarantee

The **AI Discipline Guardian** is strictly built as a **voluntary, opt-in personal accountability instrument** for the device owner.
- **No Covert Surveillance:** The app is explicitly visible in the Android app drawer, system settings, and ongoing notification tray.
- **No Third-Party Spyware:** The application cannot be hidden, disguised as a utility app, or installed without the active consent of the device operator.
- **No Workplace / Partner Tracking:** The system contains zero multi-tenant surveillance hooks, external reporting portals, or silent exfiltration channels.

---

## 2. Ephemeral In-Memory Visual Processing

When screen capture analysis is enabled by the user:

1. **In-Memory Bitmaps Only:**
   - Captured frames from `MediaProjection` are held in volatile RAM buffers (`android.graphics.Bitmap`).
   - They are **never serialized to internal or external flash storage** by default (`context.filesDir` or `getExternalFilesDir()`).
2. **Immediate Garbage Collection:**
   - Immediately following feature extraction or classification, bitmaps are explicitly recycled (`bitmap.recycle()`) to free memory and prevent heap lingering.
3. **Optional Opt-In Debug Storage:**
   - If the user explicitly activates "Diagnostic Screenshot Storage" in Settings for bug reporting:
     - Clear retention period is enforced (configurable 24 hours to 7 days, default 24h).
     - Screenshots are encrypted with AES-256 via Android Keystore.
     - A one-click "Purge All Stored Diagnostic Images" button is prominently displayed in Settings.
4. **Zero Raw Images in Application Logs:**
   - Logcat, console logs, and crash reports (`Crashlytics` or local logs) strictly forbid image dumps, base64 strings, or file paths of screenshots.

---

## 3. Sensitive Data & PII Redaction Policy

To protect user confidentiality during study sessions:

1. **Password & Credential Immunity:**
   - Accessibility service logic explicitly ignores inputs originating from password fields (`AccessibilityNodeInfo.isPassword() == true`).
   - Screen capture sessions are immediately halted when secure window flags are detected (`FLAG_SECURE`).
2. **Communication & Financial Isolation:**
   - Banking apps, mobile wallets, two-factor authenticators, and primary communication dialers are hardcoded as **immune** from visual inspection and blocking.
3. **No Keylogging:**
   - The application does not monitor keystrokes, clipboard paste contents, or text messages.

---

## 4. Cloud LLM Analysis Data Flow

When "Cloud AI Classifier" is toggled ON:

| Property | Policy Detail |
|---|---|
| **Cloud Provider** | Google Gemini API via official `@google/genai` SDK |
| **Data Transmitted** | Downsampled, resized in-memory image buffer + metadata (package name, duration) |
| **Transmission Protocol** | TLS 1.3 / HTTPS strictly enforced |
| **API Key Storage** | Stored securely on the backend server (`server.ts`), never bundled inside the Android APK |
| **Retention by Provider** | Transient API evaluation; zero training on enterprise/API requests under Google Cloud terms |
| **Offline Fallback** | If network is unavailable or cloud toggle is disabled, classification seamlessly falls back to the on-device deterministic package rule engine |

---

## 5. Strict Explicit Content Handling Protocol

When the optional strict explicit-content policy is active:
1. **No Retention of Explicit Imagery:**
   - If an image or screen is flagged as containing explicit sexual material with high confidence, the bitmap buffer is **instantly destroyed**.
   - No thumbnail, screenshot, or raw visual evidence is retained on disk or forwarded to external servers.
2. **Transparent Audit Logging:**
   - The audit log records only high-level metadata:
     - Timestamp (ISO 8601)
     - Category: `potentially_explicit_content`
     - Confidence score (e.g. `0.94`)
     - Policy triggered: `HARD_LOCK_ACTIVE`
     - Action taken: `5_MINUTE_RECHECK_SCHEDULED`
3. **No False-Positive Shaming:**
   - Medical illustrations, biological diagrams, classical art, or athletic apparel are explicitly handled via threshold safeguards to prevent unwarranted enforcement.

---

## 6. Immediate Kill-Switch & Data Purge Controls

The user retains 100% continuous sovereignty over the application:
1. **Notification Kill-Switch:** Every foreground notification includes an immediate **"Pause Monitoring"** action button.
2. **Emergency Escape:** The `BlockingOverlayActivity` includes an unmistakable **"Emergency Exit"** button that releases restrictions instantly.
3. **One-Click Data Purge:** The UI and backend provide `POST /api/privacy/purge-data` to erase all local logs, session records, and learned patterns instantly.
