package com.climb1600.companion

import com.climb1600.companion.service.MonitoringScheduler
import org.junit.Assert.*
import org.junit.Test

class MonitoringSchedulerTest {

    @Test
    fun testIntervalClampingRespectsAndroidWorkManagerMinimum() {
        // Android WorkManager periodic jobs enforce a 15-minute floor
        MonitoringScheduler.configure(intervalMinutes = 5L)
        assertEquals(15L, MonitoringScheduler.normalIntervalMinutes)

        MonitoringScheduler.configure(intervalMinutes = 30L)
        assertEquals(30L, MonitoringScheduler.normalIntervalMinutes)

        MonitoringScheduler.configure(intervalMinutes = 60L)
        assertEquals(60L, MonitoringScheduler.normalIntervalMinutes)
    }

    @Test
    fun testWifiAndQuietHoursConfiguration() {
        MonitoringScheduler.configure(
            intervalMinutes = 45L,
            wifiOnly = true,
            quietStart = 22,
            quietEnd = 6
        )

        assertEquals(45L, MonitoringScheduler.normalIntervalMinutes)
        assertTrue(MonitoringScheduler.requiresWifi)
        assertEquals(22, MonitoringScheduler.quietHoursStartHour)
        assertEquals(6, MonitoringScheduler.quietHoursEndHour)
    }

    @Test
    fun testNextEstimatedCheckTimeCalculation() {
        MonitoringScheduler.configure(intervalMinutes = 30L)
        val testTime = 1700000000000L
        MonitoringScheduler.lastSuccessfulCheckTimeMs = testTime

        val expectedNext = testTime + (30L * 60 * 1000L)
        assertEquals(expectedNext, MonitoringScheduler.nextEstimatedCheckTimeMs)
    }
}
