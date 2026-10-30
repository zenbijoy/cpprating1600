package com.climb1600.companion

import android.content.ContextWrapper
import com.climb1600.companion.service.CapabilityEngine
import com.climb1600.companion.service.CapabilityStatus
import com.climb1600.companion.service.CapabilityType
import com.climb1600.companion.service.EnforcementMode
import org.junit.Assert.*
import org.junit.Test

class CapabilityEngineTest {

    private val dummyContext = ContextWrapper(null)

    @Test
    fun testDefaultUnprovisionedModeIsModeA() {
        val mode = CapabilityEngine.detectOperatingMode(dummyContext)
        // Without active AccessibilityService or Device Owner, must honestly fall back to Mode A
        assertEquals(EnforcementMode.MODE_A_STANDARD, mode)
    }

    @Test
    fun testCapabilityReportContainsAllRequiredTypes() {
        val report = CapabilityEngine.evaluateCapabilities(dummyContext)
        assertNotNull(report)
        assertTrue(report.capabilities.isNotEmpty())

        val types = report.capabilities.map { it.type }
        assertTrue(types.contains(CapabilityType.USAGE_STATS))
        assertTrue(types.contains(CapabilityType.ACCESSIBILITY_INTERCEPT))
        assertTrue(types.contains(CapabilityType.SYSTEM_OVERLAY))
        assertTrue(types.contains(CapabilityType.NOTIFICATIONS))
        assertTrue(types.contains(CapabilityType.MEDIA_PROJECTION))
        assertTrue(types.contains(CapabilityType.LOCAL_VPN))
        assertTrue(types.contains(CapabilityType.DEVICE_OWNER))
        assertTrue(types.contains(CapabilityType.PACKAGE_SUSPENSION))
    }

    @Test
    fun testDeviceOwnerAdbCommandIsDocumentedInReport() {
        val report = CapabilityEngine.evaluateCapabilities(dummyContext)
        val doCapability = report.capabilities.find { it.type == CapabilityType.DEVICE_OWNER }
        assertNotNull(doCapability)
        assertNotNull(doCapability?.provisioningCommand)
        assertTrue(doCapability?.provisioningCommand?.contains("dpm set-device-owner") == true)
    }
}
