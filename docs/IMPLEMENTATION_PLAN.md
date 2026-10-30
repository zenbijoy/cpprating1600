# AI Discipline Guardian — Implementation Plan

This implementation plan defines the step-by-step roadmap for building, integrating, and verifying the **AI Discipline Guardian (CLIMB 1600 Companion)** on Android, connected to our local full-stack server and Gemini multimodal reasoning engine.

---

## Mission & Principles

1. **Opt-in & Personal**: Voluntary self-discipline system built strictly for the owner's device. No covert monitoring or hidden tracking.
2. **Android Platform Fidelity**: Strict adherence to Android 10–15 permission boundaries (`MediaProjection`, `UsageStatsManager`, `ForegroundService`). No hidden or private APIs.
3. **Privacy First**: Ephemeral in-memory image buffers, zero raw screenshot disk persistence by default, automatic PII redaction, and strict user consent prompts.
4. **Resilient Policy Engine**: Respects a 60-second justification window for ordinary distractions, provides a strict hard-lock with a 5-minute recheck cycle for verified explicit content, and delivers non-shaming competitive programming coaching toward Codeforces 1600.

---

## Phase Breakdown & Status

| Phase | Milestone | Scope / Deliverables | Status |
|---|---|---|---|
| **Phase 0** | Project Audit & Baseline | Workspace inspection, SDK 35 verification, Gradle 8.14.3 toolchain, and documentation suite (`ARCHITECTURE.md`, `PRIVACY.md`, `ANDROID_LIMITATIONS.md`). | ✅ Completed |
| **Phase 1** | Monitoring Scheduler | Dual scheduling engine: `GuardianForegroundService` + Android `WorkManager` (30m normal cycle, 5m hard-lock recheck, quiet hours, battery/network constraints). | 🔄 In Progress |
| **Phase 2** | MediaProjection Capture Pipeline | In-memory `ScreenCaptureManager` handling virtual display rendering, ephemeral bitmap processing, immediate release, and fallback to `UsageStatsManager`. | 🔄 In Progress |
| **Phase 3** | Dual Activity Classifier | 9-category structured schema, local fast regex/package heuristic engine, Express `/api/guardian/classify-activity` with Gemini multimodal reasoning, and failure resilience. | 🔄 In Progress |
| **Phase 4** | Policy Engine & User Justification | State machine handling: Clear -> Proposed Distraction (60s grace dialog) -> Active Focus / Authorized Exemption OR Hard-Lock (5m lock, no bypass, automatic recheck). | 🔄 In Progress |
| **Phase 5** | App Restriction Abstraction | `AppRestrictionManager` interface orchestrating Fullscreen Overlay (`BlockingOverlayActivity`), `AccessibilityService` window guard, `StudyVpnFilterService` loopback, and `DevicePolicyManager` documentation. | 🔄 In Progress |
| **Phase 6** | Codeforces Coach Integration | Problem recommendation engine, rating tag targeting (800–1600), non-shaming motivational prompts, daily CP problem solve target tracker. | 🔄 In Progress |
| **Phase 7** | Jetpack Compose UI Updates | Reactive UI: `GuardianDashboardScreen`, `BlockingOverlayActivity` (with justification input & hard-lock mode), `PermissionHealthCenterScreen`, and `AppBlockerConfigScreen`. | 🔄 In Progress |
| **Phase 8** | Local Room DB & Transparent Audit | Room database schema with migration: `SessionEntity`, `AppUsageEventEntity`, `RestrictionRuleEntity`, and `GuardianAuditLogEntity` for complete user transparency. | 🔄 In Progress |
| **Phase 9** | Unit & Integration Testing | JUnit tests for `UsageStatsClassifier`, `PolicyEngine`, and Retrofit/Network serialization, plus endpoint verification tests in Node.js. | 🔄 In Progress |
| **Phase 10** | Release Verification & APK Build | Gradle clean build: `testDebugUnitTest` passing, `assembleDebug` creating runnable APK, and comprehensive limitation audit report. | 🔄 In Progress |

---

## Detailed Task Workflows

### Phase 1: Monitoring Scheduler & Service Architecture
- Configure `GuardianForegroundService` with notification channel and foreground type `dataSync` (and `mediaProjection` when active capture session is bound).
- Implement `MonitoringScheduler.kt` utilizing `PeriodicWorkRequestBuilder` with 15-minute minimum constraints and battery/network conditions.
- Implement an explicit AlarmManager / Handler fallback for exact 5-minute hard-lock rechecks during active foreground sessions.
- Provide explicit UI controls to start/pause/stop monitoring at any time.

### Phase 2: Screen Capture Pipeline (`ScreenCaptureManager.kt`)
- Request user consent via `MediaProjectionManager.createScreenCaptureIntent()`.
- Bind `VirtualDisplay` using `ImageReader` in `PixelFormat.RGBA_8888`.
- Extract single-frame bitmap in memory, immediately unbind virtual display.
- Downscale bitmap to max 720p and compress to memory-only JPEG byte stream for inference.
- If user denies permission or system revokes token, smoothly fall back to `UsageStatsManager` and set `screenshot_used: false`.

### Phase 3: Activity Classification Engine
- Standardize 9 categories:
  - `competitive_programming`
  - `programming_learning`
  - `academic_study`
  - `productive_work`
  - `communication`
  - `entertainment`
  - `social_media`
  - `potentially_explicit_content`
  - `unknown`
- Update Express server `/api/guardian/classify-activity` to support structured JSON response with Gemini reasoning.
- Support offline fallback in `UsageStatsClassifier.kt` with package dictionary (IDEs, browsers, social platforms, games).

### Phase 4: Policy Engine & Justification Dialog
- Define Policy States: `IDLE`, `MONITORING`, `DISTRACTION_WARNING`, `EXEMPTION_GRANTED`, `HARD_LOCKED`.
- For ordinary distractions:
  - Post urgent heads-up notification with 60-second response window.
  - Present justification choices: "I am studying", "This is necessary", "Take a short break", "Return to programming".
  - If a valid justification is selected, grant a temporary 15-minute exemption.
  - If rejected or timeout expires, trigger `BlockingOverlayActivity`.
- For explicit content (confidence >= 0.70 & hard-lock enabled):
  - Bypass justification dialog immediately.
  - Activate 5-minute hard-lock overlay with countdown.
  - Automatically re-evaluate activity after 5 minutes.

### Phase 5: Restriction Engine Abstraction
- Abstract into `AppRestrictionManager`:
  1. **Focus Overlay**: Interactive floating window / full-screen activity.
  2. **Accessibility Service**: Intercepts window state changes and brings user back to companion.
  3. **Local Loopback VPN**: Blocks entertainment / explicit domain DNS queries locally.
  4. **Device Owner API**: Documents enterprise-level package suspension (`setPackagesSuspended`).

### Phase 6: Codeforces Coach & Encouragement
- Pull problems from existing Supabase / local Codeforces dataset (rating 800 to 1600).
- Deliver positive nudges: "Consistent practice builds mastery. Ready to tackle an 1100-rated Greedy problem?"
- Track daily solve targets (default: 3 problems/day).

### Phase 7: Jetpack Compose User Interface
- Dashboard: Live monitoring toggle, countdown to next check, Codeforces daily progress card, permission status badges.
- Justification Dialog / Overlay: Dual mode — Gentle distraction pause with justification vs Strict Hard-Lock with 5-minute timer.
- Audit Log Screen: Transparent chronological log of all AI checks, confidence scores, and actions taken, with "Purge All Data" button.

### Phase 8: Data Layer & Persistence
- Update Room database to version 2 (or clean schema) with `guardian_audit_logs`.
- Implement repository layer exposing Kotlin Coroutines `Flow` for real-time Compose UI updates.

### Phase 9 & 10: Testing, Verification & Artifact Generation
- Run unit test suite: `.\gradlew.bat testDebugUnitTest`.
- Build debug APK: `.\gradlew.bat assembleDebug`.
- Verify output artifact in `android/app/build/outputs/apk/debug/app-debug.apk`.
