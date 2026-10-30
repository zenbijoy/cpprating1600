package com.climb1600.companion

import android.content.Context
import com.climb1600.companion.service.AppRestrictionManager
import com.climb1600.companion.service.PolicyEngine
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class PolicyEngineTest {

    private val dummyContext = android.content.ContextWrapper(null)

    @Before
    fun setup() {
        AppRestrictionManager.resetForTesting()
    }

    @Test
    fun testHardLockCannotBeBypassedByExplanation() {
        // Enforce hard lock condition
        AppRestrictionManager.applyRestriction(
            context = dummyContext,
            appName = "Explicit Site",
            packageName = "com.android.chrome",
            hardLock = true,
            durationSeconds = 300
        )

        assertTrue(AppRestrictionManager.isHardLocked)
        assertTrue(AppRestrictionManager.isRestricted)

        // Attempt to submit an explanation during hard lock
        val accepted = PolicyEngine.submitJustification(
            context = dummyContext,
            justification = "I am doing research",
            packageName = "com.android.chrome"
        )

        // Hard-lock non-negotiable policy: must reject any bypass attempts
        assertFalse("Explanation must be rejected during active hard-lock", accepted)
        assertTrue(AppRestrictionManager.isHardLocked)
    }

    @Test
    fun testOrdinaryDistractionAllowsExemption() {
        AppRestrictionManager.resetForTesting()

        // Submit justification for an ordinary distraction
        val accepted = PolicyEngine.submitJustification(
            context = dummyContext,
            justification = "I am studying",
            packageName = "com.instagram.android"
        )

        assertTrue("Valid justification must be accepted for ordinary distraction", accepted)
        assertTrue("Exemption window must be active in the future", PolicyEngine.activeExemptionUntilMs > System.currentTimeMillis())
        assertEquals("EXEMPTION_GRANTED", PolicyEngine.lastActionTaken)
    }
}
