package com.climb1600.companion.service

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import com.climb1600.companion.CompanionTab

object DeepLinkParser {
    data class ParsedTarget(
        val tab: CompanionTab,
        val problemId: String? = null,
        val contestId: String? = null,
        val originalUri: String
    )

    fun parse(uriString: String?): ParsedTarget {
        if (uriString.isNullOrBlank()) {
            return ParsedTarget(CompanionTab.WORKSPACE, originalUri = "")
        }

        val trimmed = uriString.trim()
        val withoutScheme = if (trimmed.contains("://")) {
            trimmed.substringAfter("://")
        } else {
            trimmed
        }

        val hostAndPath = withoutScheme.substringBefore("?")
        val query = if (withoutScheme.contains("?")) withoutScheme.substringAfter("?") else ""

        val host = hostAndPath.substringBefore("/").lowercase()
        val path = if (hostAndPath.contains("/")) hostAndPath.substringAfter("/").lowercase() else ""

        fun getQueryParam(paramName: String): String? {
            if (query.isBlank()) return null
            return query.split("&").firstNotNullOfOrNull { pair ->
                val parts = pair.split("=")
                if (parts.size == 2 && parts[0].trim().equals(paramName, ignoreCase = true)) {
                    parts[1].trim()
                } else null
            }
        }

        return when {
            host == "problem" || host == "problems" || path.contains("problem") -> {
                val pId = getQueryParam("id") ?: if (path.isNotBlank()) path.substringAfterLast("/") else null
                ParsedTarget(CompanionTab.WORKSPACE, problemId = pId, originalUri = uriString)
            }
            host == "contests" || host == "contest" || path.contains("contest") -> {
                val cId = getQueryParam("id") ?: if (path.isNotBlank()) path.substringAfterLast("/") else null
                ParsedTarget(CompanionTab.WORKSPACE, contestId = cId, originalUri = uriString)
            }
            host == "guardian" || path.contains("guardian") -> {
                ParsedTarget(CompanionTab.GUARDIAN, originalUri = uriString)
            }
            host == "timeline" || path.contains("timeline") -> {
                ParsedTarget(CompanionTab.TIMELINE, originalUri = uriString)
            }
            host == "health" || path.contains("health") -> {
                ParsedTarget(CompanionTab.HEALTH, originalUri = uriString)
            }
            else -> {
                ParsedTarget(CompanionTab.WORKSPACE, originalUri = uriString)
            }
        }
    }
}

object NotificationChannelHelper {
    const val CHANNEL_REMINDERS = "climb1600_reminders"
    const val CHANNEL_CONTESTS = "climb1600_contests"
    const val CHANNEL_STREAKS = "climb1600_streaks"

    fun createChannels(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
                ?: return

            val reminderChannel = NotificationChannel(
                CHANNEL_REMINDERS,
                "Practice & Goal Reminders",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Daily training schedule, incomplete target reminders, and due revisions."
            }

            val contestChannel = NotificationChannel(
                CHANNEL_CONTESTS,
                "Contest Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Upcoming Codeforces rounds and starting-soon notifications."
            }

            val streakChannel = NotificationChannel(
                CHANNEL_STREAKS,
                "Streak Warnings & Milestones",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "At-risk streak alerts and milestone achievements."
            }

            manager.createNotificationChannels(listOf(reminderChannel, contestChannel, streakChannel))
        }
    }
}

data class DeviceTokenPayload(
    val token: String,
    val platform: String = "android",
    val deviceName: String = "Android Device"
)
