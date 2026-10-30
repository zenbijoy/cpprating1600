package com.climb1600.companion

import android.content.ContextWrapper
import com.climb1600.companion.receiver.GuardianDeviceAdminReceiver
import org.junit.Assert.*
import org.junit.Test

class GuardianDeviceAdminReceiverTest {

    private val dummyContext = ContextWrapper(null)

    @Test
    fun testPackageSuspensionReturnsFalseWhenUnprovisioned() {
        // When unprovisioned, calling suspendPackages must safely return false without throwing an unhandled exception
        val result = GuardianDeviceAdminReceiver.suspendPackages(dummyContext, arrayOf("com.instagram.android"))
        assertFalse("Unprovisioned ordinary app must never falsely claim package suspension succeeded", result)
    }

    @Test
    fun testLockTaskPackagesReturnsFalseWhenUnprovisioned() {
        val result = GuardianDeviceAdminReceiver.setLockTaskPackages(dummyContext, arrayOf("com.climb1600.companion"))
        assertFalse(result)
    }

    @Test
    fun testComponentNameResolution() {
        assertEquals("com.climb1600.companion.receiver.GuardianDeviceAdminReceiver", GuardianDeviceAdminReceiver.COMPONENT_CLASS_NAME)
        assertEquals(GuardianDeviceAdminReceiver::class.java.name, GuardianDeviceAdminReceiver.COMPONENT_CLASS_NAME)
    }
}
