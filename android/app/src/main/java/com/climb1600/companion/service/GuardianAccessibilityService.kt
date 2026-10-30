package com.climb1600.companion.service

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.ColorSpace
import android.hardware.HardwareBuffer
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.view.Display
import android.view.accessibility.AccessibilityEvent
import com.climb1600.companion.data.local.AppDatabase
import com.climb1600.companion.ui.screens.BlockingOverlayActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

/**
 * GuardianAccessibilityService powers Mode B (User-Authorized Enhanced Enforcement).
 *
 * Capabilities:
 * 1. Rapid event-driven distraction detection (TYPE_WINDOW_STATE_CHANGED) with 500ms debouncing.
 * 2. Automated visual screen capture without MediaProjection casting prompts on Android 11–13+
 *    via [AccessibilityService.takeScreenshot] (declared in accessibility_service_config.xml).
 * 3. Never records keystrokes, passwords, or personal messages.
 */
class GuardianAccessibilityService : AccessibilityService() {

    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var lastPackage: String? = null
    private var lastEventTimestamp: Long = 0L

    companion object {
        @Volatile
        var instance: GuardianAccessibilityService? = null
            private set

        fun isRunning(): Boolean = instance != null

        fun canTakeAutomatedScreenshot(): Boolean {
            return instance != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.R
        }

        /**
         * Captures an automated screenshot via AccessibilityService on Android 11–13+ (API 30+).
         * Runs strictly in memory with immediate callback.
         */
        fun takeAutomatedScreenshot(callback: (Bitmap?) -> Unit) {
            val svc = instance
            if (svc == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
                callback(null)
                return
            }

            try {
                svc.takeScreenshot(
                    Display.DEFAULT_DISPLAY,
                    svc.mainExecutor,
                    object : TakeScreenshotCallback {
                        override fun onSuccess(screenshot: ScreenshotResult) {
                            try {
                                val hwBuffer = screenshot.hardwareBuffer
                                val colorSpace = screenshot.colorSpace ?: ColorSpace.get(ColorSpace.Named.SRGB)
                                val bitmap = Bitmap.wrapHardwareBuffer(hwBuffer, colorSpace)
                                hwBuffer.close()
                                // Convert hardware bitmap to software for compression/inference
                                val softwareBitmap = bitmap?.copy(Bitmap.Config.ARGB_8888, false)
                                bitmap?.recycle()
                                callback(softwareBitmap)
                            } catch (e: Exception) {
                                callback(null)
                            }
                        }

                        override fun onFailure(errorCode: Int) {
                            callback(null)
                        }
                    }
                )
            } catch (e: Exception) {
                callback(null)
            }
        }
    }

    // Hardcoded permanent safety allowlist: Emergency, dialers, and essential system UI are NEVER blocked
    private val emergencyPackages = setOf(
        "com.google.android.dialer",
        "com.android.dialer",
        "com.android.phone",
        "com.android.emergency",
        "com.google.android.apps.messaging",
        "com.google.android.apps.authenticator2",
        "com.android.systemui",
        "com.google.android.apps.nexuslauncher",
        "com.android.launcher3"
    )

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null || event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return

        val packageName = event.packageName?.toString() ?: return
        val now = System.currentTimeMillis()

        // Debounce duplicate events within 500ms
        if (packageName == lastPackage && (now - lastEventTimestamp) < 500) {
            return
        }
        lastPackage = packageName
        lastEventTimestamp = now

        // Never restrict self, launchers, or emergency applications
        if (packageName == this.packageName || emergencyPackages.contains(packageName)) {
            return
        }

        // Check if focus session is active
        val sessionActive = FocusSessionStateMachine.sessionState.value.state != FocusSessionState.IDLE
        if (!sessionActive && !GuardianForegroundService.isSessionActive) {
            return
        }

        // Check user exemption
        if (PolicyEngine.activeExemptionUntilMs > now) {
            return
        }

        serviceScope.launch {
            val db = AppDatabase.getDatabase(applicationContext)
            val rule = db.ruleDao().getRuleForPackage(packageName)

            if (rule != null && rule.isBlocked) {
                FocusSessionStateMachine.onDistractionDetected(
                    packageName = packageName,
                    appName = rule.appName,
                    isHardLock = false
                )

                AppRestrictionManager.applyRestriction(
                    context = applicationContext,
                    appName = rule.appName,
                    packageName = packageName,
                    hardLock = false,
                    durationSeconds = rule.delaySeconds
                )
            }
        }
    }

    override fun onInterrupt() {
        // Safe callback when interrupted
    }

    override fun onDestroy() {
        super.onDestroy()
        if (instance == this) {
            instance = null
        }
    }
}
