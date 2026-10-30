package com.climb1600.companion

import android.content.ContextWrapper
import com.climb1600.companion.service.FocusSessionState
import com.climb1600.companion.service.FocusSessionStateMachine
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class FocusSessionStateMachineTest {

    private val dummyContext = ContextWrapper(null)

    @Before
    fun setup() {
        // Complete any leftover session to reset state
        FocusSessionStateMachine.completeSession(dummyContext)
    }

    @Test
    fun testSessionLifecycleTransitions() {
        // Initially IDLE
        assertEquals(FocusSessionState.IDLE, FocusSessionStateMachine.sessionState.value.state)

        // 1. Start Session -> ACTIVE
        FocusSessionStateMachine.startSession(dummyContext, "4A", "Watermelon")
        val activeState = FocusSessionStateMachine.sessionState.value
        assertEquals(FocusSessionState.ACTIVE, activeState.state)
        assertEquals("4A", activeState.problemId)
        assertTrue(activeState.startedAtMs > 0)

        // 2. Distraction Detected (Ordinary) -> WARNING
        FocusSessionStateMachine.onDistractionDetected("com.instagram.android", "Instagram", isHardLock = false)
        val warningState = FocusSessionStateMachine.sessionState.value
        assertEquals(FocusSessionState.WARNING, warningState.state)
        assertEquals("com.instagram.android", warningState.activePackage)
        assertTrue(warningState.warningExpiresAtMs > System.currentTimeMillis())

        // 3. User submits justification -> REFLECTION
        FocusSessionStateMachine.onJustificationGranted("Studying editorial")
        val reflectionState = FocusSessionStateMachine.sessionState.value
        assertEquals(FocusSessionState.REFLECTION, reflectionState.state)
        assertNull(reflectionState.activePackage)

        // 4. Clear/Resume -> ACTIVE
        FocusSessionStateMachine.onClearOrResume()
        assertEquals(FocusSessionState.ACTIVE, FocusSessionStateMachine.sessionState.value.state)

        // 5. Pause and Resume
        FocusSessionStateMachine.pauseSession()
        assertEquals(FocusSessionState.PAUSED, FocusSessionStateMachine.sessionState.value.state)

        FocusSessionStateMachine.resumeSession()
        assertEquals(FocusSessionState.ACTIVE, FocusSessionStateMachine.sessionState.value.state)

        // 6. Complete Session -> IDLE
        FocusSessionStateMachine.completeSession(dummyContext)
        assertEquals(FocusSessionState.IDLE, FocusSessionStateMachine.sessionState.value.state)
    }

    @Test
    fun testHardLockEnforcementNonNegotiable() {
        FocusSessionStateMachine.startSession(dummyContext, "1352C", "K-th Not Divisible")

        // Trigger Hard Lock
        FocusSessionStateMachine.onDistractionDetected("com.android.chrome", "Browser", isHardLock = true)
        val enforcingState = FocusSessionStateMachine.sessionState.value
        assertEquals(FocusSessionState.ENFORCING, enforcingState.state)
        assertTrue(enforcingState.hardLockExpiresAtMs > System.currentTimeMillis())

        // Attempting to clear before hard-lock timer expires must be blocked
        FocusSessionStateMachine.onClearOrResume()
        assertEquals(FocusSessionState.ENFORCING, FocusSessionStateMachine.sessionState.value.state)
    }
}
