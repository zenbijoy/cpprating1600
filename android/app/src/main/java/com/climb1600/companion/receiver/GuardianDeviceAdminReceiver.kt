package com.climb1600.companion.receiver

import android.app.admin.DeviceAdminReceiver
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build

/**
 * GuardianDeviceAdminReceiver powers Mode C (Fully Managed Device Owner).
 *
 * Platform Architecture:
 * - Legacy Device Admin (pre-Android 10): Screen lock, password policy.
 * - Modern Device Owner (Android 7.0+ / API 24+):
 *   Allows genuine OS-level app control via [DevicePolicyManager.setPackagesSuspended]
 *   and [DevicePolicyManager.setLockTaskPackages].
 * - Provisioning: Requires ADB command on an unprovisioned/new device:
 *   adb shell dpm set-device-owner com.climb1600.companion/.receiver.GuardianDeviceAdminReceiver
 */
class GuardianDeviceAdminReceiver : DeviceAdminReceiver() {

    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
    }

    override fun onDisabled(context: Context, intent: Intent) {
        super.onDisabled(context, intent)
    }

    companion object {
        const val COMPONENT_CLASS_NAME = "com.climb1600.companion.receiver.GuardianDeviceAdminReceiver"

        fun getComponentName(context: Context): ComponentName {
            return ComponentName(context, GuardianDeviceAdminReceiver::class.java)
        }

        fun getDevicePolicyManager(context: Context): DevicePolicyManager? {
            return context.getSystemService(Context.DEVICE_POLICY_SERVICE) as? DevicePolicyManager
        }

        fun isDeviceOwner(context: Context): Boolean {
            val dpm = getDevicePolicyManager(context) ?: return false
            return dpm.isDeviceOwnerApp(context.packageName)
        }

        fun isProfileOwner(context: Context): Boolean {
            val dpm = getDevicePolicyManager(context) ?: return false
            return dpm.isProfileOwnerApp(context.packageName)
        }

        fun isDeviceAdmin(context: Context): Boolean {
            val dpm = getDevicePolicyManager(context) ?: return false
            return dpm.isAdminActive(getComponentName(context))
        }

        /**
         * Suspends applications at the OS level (Android 7.0+).
         * Suspended apps are grayed out on launcher and blocked by Android OS.
         * Returns true if successfully applied by Device Owner.
         */
        fun suspendPackages(context: Context, packages: Array<String>): Boolean {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) return false
            val dpm = getDevicePolicyManager(context) ?: return false
            val admin = getComponentName(context)

            if (!dpm.isDeviceOwnerApp(context.packageName)) {
                return false
            }

            return try {
                val failed = dpm.setPackagesSuspended(admin, packages, true)
                failed.isEmpty()
            } catch (e: Exception) {
                false
            }
        }

        /**
         * Unsuspends applications previously suspended by Device Owner.
         */
        fun unsuspendPackages(context: Context, packages: Array<String>): Boolean {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) return false
            val dpm = getDevicePolicyManager(context) ?: return false
            val admin = getComponentName(context)

            if (!dpm.isDeviceOwnerApp(context.packageName)) {
                return false
            }

            return try {
                val failed = dpm.setPackagesSuspended(admin, packages, false)
                failed.isEmpty()
            } catch (e: Exception) {
                false
            }
        }

        /**
         * Sets allowlisted packages for Lock-Task (Kiosk) mode.
         */
        fun setLockTaskPackages(context: Context, packages: Array<String>): Boolean {
            val dpm = getDevicePolicyManager(context) ?: return false
            val admin = getComponentName(context)

            if (!dpm.isDeviceOwnerApp(context.packageName)) {
                return false
            }

            return try {
                dpm.setLockTaskPackages(admin, packages)
                true
            } catch (e: Exception) {
                false
            }
        }
    }
}
