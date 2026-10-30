package com.climb1600.companion.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "focus_sessions")
data class SessionEntity(
    @PrimaryKey val id: String,
    val startedAt: Long,
    val endedAt: Long?,
    val durationSeconds: Int,
    val activeProblemId: String?,
    val activeProblemName: String?,
    val isCompleted: Boolean,
    val notes: String?
)

@Entity(tableName = "app_usage_events")
data class AppUsageEventEntity(
    @PrimaryKey val id: String,
    val packageName: String,
    val appName: String,
    val category: String,
    val startTime: Long,
    val endTime: Long,
    val durationSeconds: Int,
    val confidence: Float,
    val detectionSource: String,
    val userCorrection: String?,
    val isStudyRelevant: Boolean,
    val relevanceExplanation: String
)

@Entity(tableName = "restriction_rules")
data class RestrictionRuleEntity(
    @PrimaryKey val packageName: String,
    val appName: String,
    val category: String,
    val isBlocked: Boolean,
    val delaySeconds: Int,
    val allowInStrictFocus: Boolean,
    val isEssential: Boolean
)

@Entity(tableName = "guardian_audit_logs")
data class GuardianAuditLogEntity(
    @PrimaryKey val id: String,
    val timestamp: Long,
    val packageName: String?,
    val appName: String?,
    val category: String,
    val confidence: Float,
    val actionTaken: String,
    val reasoning: String,
    val userJustification: String?,
    val screenshotUsed: Boolean
)

@Entity(tableName = "daily_targets")
data class DailyTargetEntity(
    @PrimaryKey val date: String,
    val targetSolves: Int = 3,
    val completedSolves: Int = 0,
    val targetMinutes: Int = 60,
    val completedMinutes: Int = 0
)
