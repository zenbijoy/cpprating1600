package com.climb1600.companion.service

import android.content.Context
import android.content.Intent
import android.os.Build
import com.climb1600.companion.receiver.GuardianDeviceAdminReceiver
import com.climb1600.companion.ui.screens.BlockingOverlayActivity

enum class RestrictionType {
    NONE,
    FULLSCREEN_OVERLAY,
    ACCESSIBILITY_INTERCEPT,
    LOCAL_VPN_DNS_FILTER,
    DEVICE_OWNER_PACKAGE_SUSPEND
}

/**
 * AppRestrictionManager coordinates Android app restriction strategies across all three modes:
 * - Mode A: Fullscreen Delay/Reflection Overlay (SYSTEM_ALERT_WINDOW)
 * - Mode B: Accessibility Intercept & Redirection
 * - Mode C: OS-Level Package Suspension via Device Owner (DevicePolicyManager)
 */
object AppRestrictionManager {

    @Volatile
    var isRestricted: Boolean = false
        private set

    @Volatile
    var isHardLocked: Boolean = false
        private set

    @Volatile
    var activeRestrictionType: RestrictionType = RestrictionType.NONE
        private set

    @Volatile
    var hardLockEndTimeMs: Long = 0L
        private set

    private val currentlySuspendedPackages = mutableSetOf<String>()

    fun resetForTesting() {
        isRestricted = false
        isHardLocked = false
        hardLockEndTimeMs = 0L
        activeRestrictionType = RestrictionType.NONE
        currentlySuspendedPackages.clear()
    }

    fun applyRestriction(
        context: Context,
        appName: String,
        packageName: String,
        hardLock: Boolean,
        durationSeconds: Int = 300
    ) {
        isRestricted = true
        isHardLocked = hardLock
        if (hardLock) {
            hardLockEndTimeMs = System.currentTimeMillis() + (durationSeconds * 1000L)
        }

        // 1. Mode C: Try Device Owner suspension if provisioned
        if (GuardianDeviceAdminReceiver.isDeviceOwner(context) && Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            val success = GuardianDeviceAdminReceiver.suspendPackages(context, arrayOf(packageName))
            if (success) {
                currentlySuspendedPackages.add(packageName)
                activeRestrictionType = RestrictionType.DEVICE_OWNER_PACKAGE_SUSPEND
                FocusSessionStateMachine.onEnforcementApplied()
                return
            }
        }

        // 2. Mode A/B: Launch Fullscreen Blocking Overlay (SYSTEM_ALERT_WINDOW / Activity)
        activeRestrictionType = RestrictionType.FULLSCREEN_OVERLAY
        try {
            val intent = Intent(context, BlockingOverlayActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
                putExtra(BlockingOverlayActivity.EXTRA_APP_NAME, appName)
                putExtra(BlockingOverlayActivity.EXTRA_PACKAGE_NAME, packageName)
                putExtra(BlockingOverlayActivity.EXTRA_IS_HARD_LOCK, hardLock)
                putExtra(BlockingOverlayActivity.EXTRA_DELAY_SECONDS, durationSeconds)
            }
            context.startActivity(intent)
        } catch (ignored: Exception) {}

        FocusSessionStateMachine.onEnforcementApplied()
    }

    fun liftRestriction(context: Context, packageName: String? = null) {
        if (isHardLocked && System.currentTimeMillis() < hardLockEndTimeMs) {
            // Cannot lift early during active hard-lock
            return
        }

        isRestricted = false
        isHardLocked = false
        hardLockEndTimeMs = 0L
        activeRestrictionType = RestrictionType.NONE

        // Unsuspend packages if Device Owner was used
        if (GuardianDeviceAdminReceiver.isDeviceOwner(context) && Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            val packagesToRestore = if (packageName != null) arrayOf(packageName) else currentlySuspendedPackages.toTypedArray()
            if (packagesToRestore.isNotEmpty()) {
                GuardianDeviceAdminReceiver.unsuspendPackages(context, packagesToRestore)
                if (packageName != null) {
                    currentlySuspendedPackages.remove(packageName)
                } else {
                    currentlySuspendedPackages.clear()
                }
            }
        }

        FocusSessionStateMachine.onClearOrResume()
    }

    /**
     * Reconciles device state on startup or recovery, ensuring no packages stay permanently suspended.
     */
    fun reconcileRestrictions(context: Context) {
        if (GuardianDeviceAdminReceiver.isDeviceOwner(context) && currentlySuspendedPackages.isNotEmpty()) {
            GuardianDeviceAdminReceiver.unsuspendPackages(context, currentlySuspendedPackages.toTypedArray())
            currentlySuspendedPackages.clear()
        }
        isRestricted = false
        isHardLocked = false
        activeRestrictionType = RestrictionType.NONE
    }
}
