package com.climb1600.companion.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import androidx.core.app.NotificationCompat
import com.climb1600.companion.MainActivity

class StudyVpnFilterService : VpnService() {

    private var vpnInterface: ParcelFileDescriptor? = null

    companion object {
        const val CHANNEL_ID = "climb1600_vpn_channel"
        const val NOTIFICATION_ID = 2001

        const val ACTION_CONNECT = "com.climb1600.companion.vpn.CONNECT"
        const val ACTION_DISCONNECT = "com.climb1600.companion.vpn.DISCONNECT"

        @Volatile
        var isVpnConnected = false
            private set
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_CONNECT -> startVpn()
            ACTION_DISCONNECT -> stopVpn()
        }
        return START_NOT_STICKY
    }

    private fun startVpn() {
        if (isVpnConnected) return

        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildNotification())

        try {
            val builder = Builder()
                .setSession("CLIMB 1600 Study Filter")
                .addAddress("10.0.0.2", 24)
                .addDnsServer("1.1.1.1") // Fast DNS
                .addDnsServer("8.8.8.8")
                .setBlocking(false)

            vpnInterface = builder.establish()
            isVpnConnected = true
        } catch (e: Exception) {
            e.printStackTrace()
            stopVpn()
        }
    }

    private fun stopVpn() {
        isVpnConnected = false
        try {
            vpnInterface?.close()
            vpnInterface = null
        } catch (e: Exception) {
            e.printStackTrace()
        }
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun buildNotification(): Notification {
        val openIntent = Intent(this, MainActivity::class.java)
        val pendingOpen = PendingIntent.getActivity(
            this, 0, openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("CLIMB 1600 — Study-Only Web Filter Active")
            .setContentText("Distracting websites are blocked on this device.")
            .setSmallIcon(android.R.drawable.ic_menu_compass)
            .setContentIntent(pendingOpen)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Website Filter Status",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        stopVpn()
    }
}
