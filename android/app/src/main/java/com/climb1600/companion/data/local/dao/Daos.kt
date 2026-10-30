package com.climb1600.companion.data.local.dao

import androidx.room.*
import com.climb1600.companion.data.local.entity.AppUsageEventEntity
import com.climb1600.companion.data.local.entity.DailyTargetEntity
import com.climb1600.companion.data.local.entity.GuardianAuditLogEntity
import com.climb1600.companion.data.local.entity.RestrictionRuleEntity
import com.climb1600.companion.data.local.entity.SessionEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface SessionDao {
    @Query("SELECT * FROM focus_sessions ORDER BY startedAt DESC")
    fun getAllSessions(): Flow<List<SessionEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSession(session: SessionEntity)

    @Query("SELECT * FROM focus_sessions WHERE isCompleted = 0 LIMIT 1")
    suspend fun getActiveSession(): SessionEntity?
}

@Dao
interface EventDao {
    @Query("SELECT * FROM app_usage_events ORDER BY startTime DESC LIMIT 100")
    fun getRecentEvents(): Flow<List<AppUsageEventEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertEvent(event: AppUsageEventEntity)

    @Query("UPDATE app_usage_events SET userCorrection = :correction, isStudyRelevant = :isRelevant WHERE id = :eventId")
    suspend fun updateEventCorrection(eventId: String, correction: String, isRelevant: Boolean)

    @Query("DELETE FROM app_usage_events")
    suspend fun clearAllEvents()
}

@Dao
interface RuleDao {
    @Query("SELECT * FROM restriction_rules")
    fun getAllRules(): Flow<List<RestrictionRuleEntity>>

    @Query("SELECT * FROM restriction_rules WHERE packageName = :pkg LIMIT 1")
    suspend fun getRuleForPackage(pkg: String): RestrictionRuleEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRules(rules: List<RestrictionRuleEntity>)

    @Update
    suspend fun updateRule(rule: RestrictionRuleEntity)
}

@Dao
interface AuditLogDao {
    @Query("SELECT * FROM guardian_audit_logs ORDER BY timestamp DESC LIMIT :limit")
    fun getRecentLogs(limit: Int = 100): Flow<List<GuardianAuditLogEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertLog(log: GuardianAuditLogEntity)

    @Query("DELETE FROM guardian_audit_logs")
    suspend fun clearAllLogs()
}

@Dao
interface DailyTargetDao {
    @Query("SELECT * FROM daily_targets WHERE date = :date LIMIT 1")
    fun getTargetForDate(date: String): Flow<DailyTargetEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdateTarget(target: DailyTargetEntity)
}
