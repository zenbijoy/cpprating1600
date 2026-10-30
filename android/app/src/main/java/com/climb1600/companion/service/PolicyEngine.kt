package com.climb1600.companion.service

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.climb1600.companion.classifier.ClassificationResponse
import com.climb1600.companion.data.local.AppDatabase
import com.climb1600.companion.data.local.entity.GuardianAuditLogEntity
import com.climb1600.companion.ui.screens.BlockingOverlayActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.util.UUID

object PolicyEngine {

    const val NOTIFICATION_CHANNEL_ID = "guardian_discipline_alerts"
    const val NOTIFICATION_ID = 2002

    @Volatile
    var activeExemptionUntilMs: Long = 0L
        private set

    @Volatile
    var lastCheckTimestamp: Long = 0L
        private set

    @Volatile
    var lastCategory: String = "unknown"
        private set

    @Volatile
    var lastActionTaken: String = "NONE"
        private set

    private val scope = CoroutineScope(Dispatchers.IO)

    fun evaluateAndEnforce(
        context: Context,
        classification: ClassificationResponse,
        packageName: String?,
        appName: String?,
        hardLockEnabled: Boolean = true
    ) {
        lastCheckTimestamp = System.currentTimeMillis()
        lastCategory = classification.primaryCategory

        val now = System.currentTimeMillis()
        var actionTaken = "ALLOWED"

        // 1. Strict Explicit-Content Hard-Lock Policy
        if (classification.primaryCategory == "potentially_explicit_content" &&
            classification.confidence >= 0.70f &&
            hardLockEnabled
        ) {
            actionTaken = "HARD_LOCKED"
            lastActionTaken = actionTaken
            AppRestrictionManager.applyRestriction(
                context = context,
                appName = appName ?: "Restricted Content",
                packageName = packageName ?: "com.android.chrome",
                hardLock = true,
                durationSeconds = 300 // 5-minute non-negotiable lock
            )
            // Schedule 5-minute automatic recheck
            MonitoringScheduler.scheduleHardLockRecheck(context)
        }
        // 2. Ordinary Distraction Policy (Entertainment / Social Media)
        else if (classification.recommendedAction == "warn_distraction" ||
            classification.primaryCategory == "entertainment" ||
            classification.primaryCategory == "social_media"
        ) {
            if (activeExemptionUntilMs > now) {
                actionTaken = "EXEMPTION_ACTIVE"
                lastActionTaken = actionTaken
            } else {
                actionTaken = "DISTRACTION_WARNED"
                lastActionTaken = actionTaken
                // Present 60-second heads-up warning notification with justification opportunity
                postDistractionNotification(context, appName ?: "Distracting App", packageName ?: "")
                // Also trigger blocking overlay with explanation UI
                AppRestrictionManager.applyRestriction(
                    context = context,
                    appName = appName ?: "Distracting App",
                    packageName = packageName ?: "",
                    hardLock = false,
                    durationSeconds = 60
                )
            }
        }
        // 3. Productive / Neutral / Exemption
        else {
            actionTaken = "ALLOWED"
            lastActionTaken = actionTaken
            if (AppRestrictionManager.isRestricted && !AppRestrictionManager.isHardLocked) {
                AppRestrictionManager.liftRestriction(context, packageName)
            }
        }

        // 4. Record in Transparent Local Room Audit Log
        scope.launch {
            try {
                val db = AppDatabase.getDatabase(context)
                db.auditLogDao().insertLog(
                    GuardianAuditLogEntity(
                        id = UUID.randomUUID().toString(),
                        timestamp = now,
                        packageName = packageName,
                        appName = appName,
                        category = classification.primaryCategory,
                        confidence = classification.confidence,
                        actionTaken = actionTaken,
                        reasoning = classification.reasoning,
                        userJustification = null,
                        screenshotUsed = classification.screenshotUsed
                    )
                )
            } catch (ignored: Exception) {}
        }
    }

    /**
     * Submit user explanation for distraction.
     * Returns true if explanation is accepted and exemption granted; false if hard-locked.
     */
    fun submitJustification(context: Context, justification: String, packageName: String?): Boolean {
        if (AppRestrictionManager.isHardLocked) {
            return false // Cannot explain away a verified hard-lock session
        }

        activeExemptionUntilMs = System.currentTimeMillis() + (15 * 60 * 1000L) // 15-minute grace
        lastActionTaken = "EXEMPTION_GRANTED"

        AppRestrictionManager.liftRestriction(context, packageName)

        scope.launch {
            try {
                val db = AppDatabase.getDatabase(context)
                db.auditLogDao().insertLog(
                    GuardianAuditLogEntity(
                        id = UUID.randomUUID().toString(),
                        timestamp = System.currentTimeMillis(),
                        packageName = packageName,
                        appName = null,
                        category = "exemption_granted",
                        confidence = 1.0f,
                        actionTaken = "EXEMPTION_GRANTED",
                        reasoning = "User provided valid justification for session continuance.",
                        userJustification = justification,
                        screenshotUsed = false
                    )
                )
            } catch (ignored: Exception) {}
        }

        return true
    }

    private fun postDistractionNotification(context: Context, appName: String, packageName: String) {
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            ?: return

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                "Guardian Focus Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Urgent distraction alerts and study return recommendations."
            }
            manager.createNotificationChannel(channel)
        }

        val overlayIntent = Intent(context, BlockingOverlayActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra(BlockingOverlayActivity.EXTRA_APP_NAME, appName)
            putExtra(BlockingOverlayActivity.EXTRA_PACKAGE_NAME, packageName)
            putExtra(BlockingOverlayActivity.EXTRA_IS_HARD_LOCK, false)
        }
        val pendingIntent = PendingIntent.getActivity(
            context, 201, overlayIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(context, NOTIFICATION_CHANNEL_ID)
            .setContentTitle("Focus Check: $appName")
            .setContentText("Distracting activity detected. Tap to justify or return to Codeforces.")
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        manager.notify(NOTIFICATION_ID, notification)
    }
}
