package com.climb1600.companion.classifier

import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.pm.PackageManager
import com.climb1600.companion.data.local.entity.AppUsageEventEntity
import com.climb1600.companion.data.local.entity.RestrictionRuleEntity
import java.util.UUID

class UsageStatsClassifier(private val context: Context) {

    private val usageStatsManager =
        context.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
    private val packageManager = context.packageManager

    // Built-in high confidence package mappings
    private val defaultRules = mapOf(
        "com.termux" to Triple("Termux", "competitive_programming", true),
        "com.spck.cide" to Triple("CIDE / C++ Editor", "competitive_programming", true),
        "com.codeforces.app" to Triple("Codeforces", "competitive_programming", true),
        "org.khanacademy.android" to Triple("Khan Academy", "educational_content", true),
        "com.instructure.candroid" to Triple("Canvas Student", "university_study", true),
        "com.google.android.apps.classroom" to Triple("Google Classroom", "university_study", true),
        "com.google.android.dialer" to Triple("Phone", "essential_communication", true),
        "com.android.dialer" to Triple("Phone", "essential_communication", true),
        "com.google.android.apps.authenticator2" to Triple("Google Authenticator", "productivity", true),
        "com.instagram.android" to Triple("Instagram", "social_media", false),
        "com.zhiliaoapp.musically" to Triple("TikTok", "entertainment", false),
        "com.facebook.katana" to Triple("Facebook", "social_media", false),
        "com.twitter.android" to Triple("X (Twitter)", "social_media", false),
        "com.netflix.mediaclient" to Triple("Netflix", "entertainment", false),
        "com.google.android.youtube" to Triple("YouTube", "educational_content", true)
    )

    fun hasUsageStatsPermission(): Boolean {
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as? android.app.AppOpsManager
            ?: return false
        val mode = appOps.checkOpNoThrow(
            android.app.AppOpsManager.OPSTR_GET_USAGE_STATS,
            android.os.Process.myUid(),
            context.packageName
        )
        return mode == android.app.AppOpsManager.MODE_ALLOWED
    }

    fun getRecentForegroundEvents(
        lookbackMs: Long = 10 * 60 * 1000,
        userRules: List<RestrictionRuleEntity>,
        isStudySessionActive: Boolean = false
    ): List<AppUsageEventEntity> {
        if (!hasUsageStatsPermission() || usageStatsManager == null) return emptyList()

        val endTime = System.currentTimeMillis()
        val startTime = endTime - lookbackMs
        val usageEvents = usageStatsManager.queryEvents(startTime, endTime)

        val eventList = mutableListOf<AppUsageEventEntity>()
        val event = UsageEvents.Event()

        var currentPackage: String? = null
        var currentStartTime: Long = 0

        while (usageEvents.hasNextEvent()) {
            usageEvents.getNextEvent(event)
            if (event.eventType == UsageEvents.Event.ACTIVITY_RESUMED) {
                if (currentPackage != null && currentStartTime > 0) {
                    val durationSec = ((event.timeStamp - currentStartTime) / 1000).toInt()
                    if (durationSec >= 3) { // Filter sub-3 second flickers
                        eventList.add(
                            classifySingleEvent(
                                currentPackage,
                                currentStartTime,
                                event.timeStamp,
                                durationSec,
                                userRules,
                                isStudySessionActive
                            )
                        )
                    }
                }
                currentPackage = event.packageName
                currentStartTime = event.timeStamp
            } else if (event.eventType == UsageEvents.Event.ACTIVITY_PAUSED && currentPackage == event.packageName) {
                val durationSec = ((event.timeStamp - currentStartTime) / 1000).toInt()
                if (durationSec >= 3) {
                    eventList.add(
                        classifySingleEvent(
                            currentPackage,
                            currentStartTime,
                            event.timeStamp,
                            durationSec,
                            userRules,
                            isStudySessionActive
                        )
                    )
                }
                currentPackage = null
                currentStartTime = 0
            }
        }

        return eventList.reversed()
    }

    private fun classifySingleEvent(
        pkg: String,
        startMs: Long,
        endMs: Long,
        durationSec: Int,
        userRules: List<RestrictionRuleEntity>,
        isStudySessionActive: Boolean
    ): AppUsageEventEntity {
        val userRule = userRules.find { it.packageName == pkg }
        if (userRule != null) {
            return AppUsageEventEntity(
                id = UUID.randomUUID().toString(),
                packageName = pkg,
                appName = userRule.appName,
                category = userRule.category,
                startTime = startMs,
                endTime = endMs,
                durationSeconds = durationSec,
                confidence = 1.0f,
                detectionSource = "user_configured",
                userCorrection = null,
                isStudyRelevant = !userRule.isBlocked,
                relevanceExplanation = "Custom user rule applied: ${userRule.category}."
            )
        }

        val defaultMapping = defaultRules[pkg]
        if (defaultMapping != null) {
            val appName = defaultMapping.first
            var category = defaultMapping.second
            var isRelevant = defaultMapping.third

            if (pkg == "com.google.android.youtube") {
                category = if (isStudySessionActive) "educational_content" else "entertainment"
                isRelevant = isStudySessionActive
            }

            return AppUsageEventEntity(
                id = UUID.randomUUID().toString(),
                packageName = pkg,
                appName = appName,
                category = category,
                startTime = startMs,
                endTime = endMs,
                durationSeconds = durationSec,
                confidence = 0.92f,
                detectionSource = "high_confidence_rule",
                userCorrection = null,
                isStudyRelevant = isRelevant,
                relevanceExplanation = "Recognized package classification: $appName ($category)."
            )
        }

        val resolvedName = try {
            val info = packageManager.getApplicationInfo(pkg, 0)
            packageManager.getApplicationLabel(info).toString()
        } catch (e: Exception) {
            pkg.substringAfterLast('.')
        }

        return AppUsageEventEntity(
            id = UUID.randomUUID().toString(),
            packageName = pkg,
            appName = resolvedName,
            category = "unknown",
            startTime = startMs,
            endTime = endMs,
            durationSeconds = durationSec,
            confidence = 0.35f,
            detectionSource = "high_confidence_rule",
            userCorrection = null,
            isStudyRelevant = false,
            relevanceExplanation = "Unknown application. Verify or add custom rule."
        )
    }
}
