package com.climb1600.companion.service

import android.accessibilityservice.AccessibilityServiceInfo
import android.app.AppOpsManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.PowerManager
import android.os.Process
import android.provider.Settings
import android.view.accessibility.AccessibilityManager
import com.climb1600.companion.receiver.GuardianDeviceAdminReceiver

enum class EnforcementMode(val displayName: String, val description: String) {
    MODE_A_STANDARD(
        "Mode A — Standard Personal Device",
        "Passive telemetry & gentle focus pauses using standard user permissions."
    ),
    MODE_B_ENHANCED(
        "Mode B — User-Authorized Enhanced Enforcement",
        "Accessibility-driven instant app switching intercept and automated screen checks."
    ),
    MODE_C_DEVICE_OWNER(
        "Mode C — Fully Managed Device Owner",
        "True OS-level app suspension and kiosk lock-task enforcement via DevicePolicyManager."
    )
}

enum class CapabilityStatus {
    AVAILABLE,
    NEEDS_USER_PERMISSION,
    NEEDS_DEVICE_PROVISIONING,
    TEMPORARILY_UNAVAILABLE,
    UNSUPPORTED,
    RESTRICTED_BY_SYSTEM,
    FAILED
}

enum class CapabilityType {
    USAGE_STATS,
    ACCESSIBILITY_INTERCEPT,
    ACCESSIBILITY_SCREENSHOT,
    SYSTEM_OVERLAY,
    NOTIFICATIONS,
    FOREGROUND_SERVICE,
    MEDIA_PROJECTION,
    LOCAL_VPN,
    BATTERY_OPTIMIZATION_EXEMPT,
    DEVICE_OWNER,
    PACKAGE_SUSPENSION,
    LOCK_TASK
}

data class CapabilityDetail(
    val type: CapabilityType,
    val title: String,
    val description: String,
    val status: CapabilityStatus,
    val settingsAction: String? = null,
    val provisioningCommand: String? = null,
    val isAvailable: Boolean = status == CapabilityStatus.AVAILABLE
)

data class CapabilityReport(
    val timestamp: Long,
    val activeMode: EnforcementMode,
    val capabilities: List<CapabilityDetail>
)

object CapabilityEngine {

    fun detectOperatingMode(context: Context): EnforcementMode {
        return when {
            GuardianDeviceAdminReceiver.isDeviceOwner(context) -> EnforcementMode.MODE_C_DEVICE_OWNER
            isAccessibilityEnabled(context) -> EnforcementMode.MODE_B_ENHANCED
            else -> EnforcementMode.MODE_A_STANDARD
        }
    }

    fun isAccessibilityEnabled(context: Context): Boolean {
        val am = context.getSystemService(Context.ACCESSIBILITY_SERVICE) as? AccessibilityManager ?: return false
        val enabledServices = am.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_ALL_MASK)
        val expected = "${context.packageName}/${GuardianAccessibilityService::class.java.canonicalName}"
        val expectedSimple = "${context.packageName}/.service.GuardianAccessibilityService"
        return enabledServices.any {
            it.id.equals(expected, ignoreCase = true) ||
            it.id.equals(expectedSimple, ignoreCase = true) ||
            it.resolveInfo?.serviceInfo?.packageName == context.packageName
        }
    }

    fun hasUsageStatsPermission(context: Context): Boolean {
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as? AppOpsManager ?: return false
        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            appOps.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
        } else {
            @Suppress("DEPRECATION")
            appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
        }
        return mode == AppOpsManager.MODE_ALLOWED
    }

    fun hasOverlayPermission(context: Context): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(context)
        } else true
    }

    fun isBatteryOptimizationIgnored(context: Context): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val pm = context.getSystemService(Context.POWER_SERVICE) as? PowerManager
            pm?.isIgnoringBatteryOptimizations(context.packageName) == true
        } else true
    }

    fun hasNotificationPermission(context: Context): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            context.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
        } else true
    }

    fun evaluateCapabilities(context: Context): CapabilityReport {
        val activeMode = detectOperatingMode(context)
        val list = mutableListOf<CapabilityDetail>()

        // 1. Usage Stats
        val usageGranted = hasUsageStatsPermission(context)
        list.add(
            CapabilityDetail(
                type = CapabilityType.USAGE_STATS,
                title = "App Usage Stats (UsageStatsManager)",
                description = "Monitors app foreground time and active transitions.",
                status = if (usageGranted) CapabilityStatus.AVAILABLE else CapabilityStatus.NEEDS_USER_PERMISSION,
                settingsAction = Settings.ACTION_USAGE_ACCESS_SETTINGS
            )
        )

        // 2. Accessibility Intercept
        val a11yGranted = isAccessibilityEnabled(context)
        list.add(
            CapabilityDetail(
                type = CapabilityType.ACCESSIBILITY_INTERCEPT,
                title = "Accessibility App Intercept",
                description = "Rapid real-time detection when distracting apps are opened.",
                status = if (a11yGranted) CapabilityStatus.AVAILABLE else CapabilityStatus.NEEDS_USER_PERMISSION,
                settingsAction = Settings.ACTION_ACCESSIBILITY_SETTINGS
            )
        )

        // 3. Accessibility Automated Screenshot (API 30+)
        val canA11yScreenshot = Build.VERSION.SDK_INT >= Build.VERSION_CODES.R
        val a11yScreenshotStatus = when {
            !canA11yScreenshot -> CapabilityStatus.UNSUPPORTED
            a11yGranted -> CapabilityStatus.AVAILABLE
            else -> CapabilityStatus.NEEDS_USER_PERMISSION
        }
        list.add(
            CapabilityDetail(
                type = CapabilityType.ACCESSIBILITY_SCREENSHOT,
                title = "Automated Visual Screen Inspection",
                description = "Automated on-device screenshot via AccessibilityService (Android 11-13+ supported).",
                status = a11yScreenshotStatus,
                settingsAction = Settings.ACTION_ACCESSIBILITY_SETTINGS
            )
        )

        // 4. System Overlay
        val overlayGranted = hasOverlayPermission(context)
        list.add(
            CapabilityDetail(
                type = CapabilityType.SYSTEM_OVERLAY,
                title = "Display Over Other Apps (Overlay)",
                description = "Shows focus pause and reflection screens on top of distracting applications.",
                status = if (overlayGranted) CapabilityStatus.AVAILABLE else CapabilityStatus.NEEDS_USER_PERMISSION,
                settingsAction = Settings.ACTION_MANAGE_OVERLAY_PERMISSION
            )
        )

        // 5. Notifications
        val notifGranted = hasNotificationPermission(context)
        list.add(
            CapabilityDetail(
                type = CapabilityType.NOTIFICATIONS,
                title = "Focus Notifications",
                description = "Delivers 60-second distraction grace warnings and session progress.",
                status = if (notifGranted) CapabilityStatus.AVAILABLE else CapabilityStatus.NEEDS_USER_PERMISSION,
                settingsAction = Settings.ACTION_APP_NOTIFICATION_SETTINGS
            )
        )

        // 6. MediaProjection
        val mpAuthorized = ScreenCaptureManager.isCaptureAuthorized
        list.add(
            CapabilityDetail(
                type = CapabilityType.MEDIA_PROJECTION,
                title = "MediaProjection Screen Capture",
                description = "User-prompted capture session for visual AI reasoning.",
                status = if (mpAuthorized) CapabilityStatus.AVAILABLE else CapabilityStatus.NEEDS_USER_PERMISSION
            )
        )

        // 7. Local VPN Filter
        val vpnActive = StudyVpnFilterService.isVpnConnected
        list.add(
            CapabilityDetail(
                type = CapabilityType.LOCAL_VPN,
                title = "Local Loopback DNS Filter",
                description = "Drops DNS queries to distracting and adult domains entirely on-device.",
                status = if (vpnActive) CapabilityStatus.AVAILABLE else CapabilityStatus.TEMPORARILY_UNAVAILABLE
            )
        )

        // 8. Battery Optimization
        val batteryIgnored = isBatteryOptimizationIgnored(context)
        list.add(
            CapabilityDetail(
                type = CapabilityType.BATTERY_OPTIMIZATION_EXEMPT,
                title = "Battery Optimization Exemption",
                description = "Prevents OS aggressive task managers from killing focus timers.",
                status = if (batteryIgnored) CapabilityStatus.AVAILABLE else CapabilityStatus.NEEDS_USER_PERMISSION,
                settingsAction = Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS
            )
        )

        // 9. Device Owner Provisioning
        val isDo = GuardianDeviceAdminReceiver.isDeviceOwner(context)
        val doCommand = "adb shell dpm set-device-owner com.climb1600.companion/.receiver.GuardianDeviceAdminReceiver"
        list.add(
            CapabilityDetail(
                type = CapabilityType.DEVICE_OWNER,
                title = "Device Owner Provisioning (Mode C)",
                description = "Enables enterprise-grade OS app suspension on dedicated study hardware.",
                status = if (isDo) CapabilityStatus.AVAILABLE else CapabilityStatus.NEEDS_DEVICE_PROVISIONING,
                provisioningCommand = doCommand
            )
        )

        // 10. Package Suspension
        val canSuspend = isDo && Build.VERSION.SDK_INT >= Build.VERSION_CODES.N
        list.add(
            CapabilityDetail(
                type = CapabilityType.PACKAGE_SUSPENSION,
                title = "OS-Level Package Suspension",
                description = "True app suspension where OS disables launching of distracting packages.",
                status = if (canSuspend) CapabilityStatus.AVAILABLE else if (isDo) CapabilityStatus.UNSUPPORTED else CapabilityStatus.NEEDS_DEVICE_PROVISIONING
            )
        )

        return CapabilityReport(
            timestamp = System.currentTimeMillis(),
            activeMode = activeMode,
            capabilities = list
        )
    }
}
