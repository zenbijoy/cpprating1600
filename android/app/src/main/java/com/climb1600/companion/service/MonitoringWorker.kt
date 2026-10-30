package com.climb1600.companion.service

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.climb1600.companion.classifier.ClassificationRequest
import com.climb1600.companion.classifier.GuardianApiClient
import com.climb1600.companion.classifier.UsageStatsClassifier
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

class MonitoringWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        if (!MonitoringScheduler.isMonitoringEnabled) {
            return Result.success()
        }

        // Respect quiet hours
        if (MonitoringScheduler.isInQuietHours() && !AppRestrictionManager.isHardLocked) {
            return Result.success()
        }

        val context = applicationContext

        // 1. Attempt in-memory authorized screen capture
        var screenshotBase64: String? = null
        if (ScreenCaptureManager.isCaptureAuthorized) {
            screenshotBase64 = suspendCancellableCoroutine { continuation ->
                ScreenCaptureManager.captureFrameInMemory(context) { base64 ->
                    if (continuation.isActive) {
                        continuation.resume(base64)
                    }
                }
            }
        }

        // 2. Fall back to UsageStats inspection for package & app metadata
        val classifier = UsageStatsClassifier(context)
        val recentEvents = classifier.getRecentForegroundEvents(
            lookbackMs = 60 * 1000,
            userRules = emptyList(),
            isStudySessionActive = GuardianForegroundService.isSessionActive
        )
        val latestEvent = recentEvents.firstOrNull()

        val currentPackage = latestEvent?.packageName ?: "com.climb1600.companion"
        val currentApp = latestEvent?.appName ?: "CLIMB 1600 Companion"

        // 3. Classify activity via structured API / Local fallback
        val request = ClassificationRequest(
            packageName = currentPackage,
            appName = currentApp,
            screenTitle = currentApp,
            screenshotBase64 = screenshotBase64,
            isStudySessionActive = GuardianForegroundService.isSessionActive,
            enableCloudAi = true,
            userRating = 1200,
            hardLockEnabled = true
        )

        val result = GuardianApiClient.classifySafe(request)

        // 4. Enforce Discipline Policy
        PolicyEngine.evaluateAndEnforce(
            context = context,
            classification = result,
            packageName = currentPackage,
            appName = currentApp,
            hardLockEnabled = true
        )

        MonitoringScheduler.lastSuccessfulCheckTimeMs = System.currentTimeMillis()

        return Result.success()
    }
}
