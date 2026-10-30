package com.climb1600.companion.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.climb1600.companion.data.local.dao.*
import com.climb1600.companion.data.local.entity.*

@Database(
    entities = [
        SessionEntity::class,
        AppUsageEventEntity::class,
        RestrictionRuleEntity::class,
        GuardianAuditLogEntity::class,
        DailyTargetEntity::class
    ],
    version = 2,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun sessionDao(): SessionDao
    abstract fun eventDao(): EventDao
    abstract fun ruleDao(): RuleDao
    abstract fun auditLogDao(): AuditLogDao
    abstract fun dailyTargetDao(): DailyTargetDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "climb1600_companion.db"
                )
                .fallbackToDestructiveMigration()
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
