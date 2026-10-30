package com.climb1600.companion.service

import android.app.*
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.climb1600.companion.MainActivity
import kotlinx.coroutines.*

class GuardianForegroundService : Service() {

    private val serviceScope = CoroutineScope(Dispatchers.IO + Job())
    private var isRunning = false
    private var sessionStartTime = 0L
    private var activeProblemName = "Daily CP Practice"
    private var activeProblemId = "4A"

    companion object {
        const val CHANNEL_ID = "climb1600_guardian_channel"
        const val NOTIFICATION_ID = 1001

        const val ACTION_START = "com.climb1600.companion.action.START"
        const val ACTION_STOP = "com.climb1600.companion.action.STOP"
        const val EXTRA_PROBLEM_NAME = "extra_problem_name"
        const val EXTRA_PROBLEM_ID = "extra_problem_id"

        @Volatile
        var isSessionActive = false
            private set
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                activeProblemName = intent.getStringExtra(EXTRA_PROBLEM_NAME) ?: "Daily CP Practice"
                activeProblemId = intent.getStringExtra(EXTRA_PROBLEM_ID) ?: "4A"
                startFocusSession()
            }
            ACTION_STOP -> {
                stopFocusSession()
            }
            else -> {
                // System restart recovery
                if (intent == null && !isRunning) {
                    serviceScope.launch {
                        val restored = FocusSessionStateMachine.restoreSessionAfterRestart(applicationContext)
                        if (restored) {
                            startFocusSession()
                        } else {
                            stopSelf()
                        }
                    }
                }
            }
        }
        return START_STICKY
    }

    private fun startFocusSession() {
        if (isRunning) return
        isRunning = true
        isSessionActive = true
        sessionStartTime = System.currentTimeMillis()

        FocusSessionStateMachine.startSession(this, activeProblemId, activeProblemName)

        val notification = buildNotification(0)
        startForeground(NOTIFICATION_ID, notification)

        // Ticker coroutine to update notification every 5 seconds
        serviceScope.launch {
            while (isRunning) {
                delay(5000)
                val elapsedMinutes = ((System.currentTimeMillis() - sessionStartTime) / 60000).toInt()
                val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                manager.notify(NOTIFICATION_ID, buildNotification(elapsedMinutes))
            }
        }
    }

    private fun stopFocusSession() {
        isRunning = false
        isSessionActive = false

        FocusSessionStateMachine.completeSession(this)
        AppRestrictionManager.reconcileRestrictions(this)

        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun buildNotification(elapsedMinutes: Int): Notification {
        val openIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingOpen = PendingIntent.getActivity(
            this, 0, openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val stopIntent = Intent(this, GuardianForegroundService::class.java).apply {
            action = ACTION_STOP
        }
        val pendingStop = PendingIntent.getService(
            this, 1, stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val mode = CapabilityEngine.detectOperatingMode(this)

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("CLIMB 1600 — ${mode.displayName.take(15)} Active")
            .setContentText("Focusing on: $activeProblemName (${elapsedMinutes}m elapsed)")
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setOngoing(true)
            .setContentIntent(pendingOpen)
            .addAction(android.R.drawable.ic_media_pause, "End Session", pendingStop)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Study Focus Sessions",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows live focus session progress and controls."
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
        isRunning = false
        isSessionActive = false
        AppRestrictionManager.reconcileRestrictions(this)
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
