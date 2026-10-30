package com.climb1600.companion.service

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import androidx.work.*
import java.util.Calendar
import java.util.concurrent.TimeUnit

object MonitoringScheduler {

    const val WORK_NAME_PERIODIC = "guardian_periodic_monitoring"
    const val WORK_NAME_HARD_LOCK = "guardian_hard_lock_recheck"

    @Volatile
    var isMonitoringEnabled: Boolean = true
        private set

    @Volatile
    var normalIntervalMinutes: Long = 30L
        private set

    @Volatile
    var requiresWifi: Boolean = false
        private set

    @Volatile
    var quietHoursStartHour: Int = 23 // 11 PM
        private set

    @Volatile
    var quietHoursEndHour: Int = 7   // 7 AM
        private set

    @Volatile
    var lastSuccessfulCheckTimeMs: Long = 0L
        set(value) {
            field = value
            nextEstimatedCheckTimeMs = value + (normalIntervalMinutes * 60 * 1000L)
        }

    @Volatile
    var nextEstimatedCheckTimeMs: Long = 0L
        private set

    fun configure(
        intervalMinutes: Long = 30L,
        wifiOnly: Boolean = false,
        quietStart: Int = 23,
        quietEnd: Int = 7
    ) {
        normalIntervalMinutes = if (intervalMinutes >= 15L) intervalMinutes else 15L
        requiresWifi = wifiOnly
        quietHoursStartHour = quietStart
        quietHoursEndHour = quietEnd
    }

    fun startMonitoring(context: Context) {
        isMonitoringEnabled = true

        val networkType = if (requiresWifi) NetworkType.UNMETERED else NetworkType.CONNECTED
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(networkType)
            .setRequiresBatteryNotLow(true)
            .build()

        val periodicWorkRequest = PeriodicWorkRequestBuilder<MonitoringWorker>(
            normalIntervalMinutes, TimeUnit.MINUTES,
            5, TimeUnit.MINUTES // 5-minute flex window
        )
        .setConstraints(constraints)
        .addTag("GUARDIAN_MONITOR")
        .build()

        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            WORK_NAME_PERIODIC,
            ExistingPeriodicWorkPolicy.UPDATE,
            periodicWorkRequest
        )

        nextEstimatedCheckTimeMs = System.currentTimeMillis() + (normalIntervalMinutes * 60 * 1000L)
    }

    fun stopMonitoring(context: Context) {
        isMonitoringEnabled = false
        WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME_PERIODIC)
        WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME_HARD_LOCK)
        nextEstimatedCheckTimeMs = 0L
    }

    /**
     * Schedules a precise 5-minute recheck when in hard-lock state.
     * Uses OneTimeWorkRequest with 5-minute delay.
     */
    fun scheduleHardLockRecheck(context: Context) {
        val recheckRequest = OneTimeWorkRequestBuilder<MonitoringWorker>()
            .setInitialDelay(5, TimeUnit.MINUTES)
            .addTag("HARD_LOCK_RECHECK")
            .build()

        WorkManager.getInstance(context).enqueueUniqueWork(
            WORK_NAME_HARD_LOCK,
            ExistingWorkPolicy.REPLACE,
            recheckRequest
        )
        nextEstimatedCheckTimeMs = System.currentTimeMillis() + (5 * 60 * 1000L)
    }

    fun isInQuietHours(): Boolean {
        val currentHour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        return if (quietHoursStartHour > quietHoursEndHour) {
            // e.g. 23 to 7
            currentHour >= quietHoursStartHour || currentHour < quietHoursEndHour
        } else {
            currentHour in quietHoursStartHour until quietHoursEndHour
        }
    }
}
