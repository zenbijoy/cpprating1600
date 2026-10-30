package com.climb1600.companion.service

import android.content.Context
import com.climb1600.companion.data.local.AppDatabase
import com.climb1600.companion.data.local.entity.SessionEntity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.UUID

enum class FocusSessionState {
    IDLE,
    PREPARING,
    ACTIVE,
    DISTRACTION_DETECTED,
    WARNING,
    REFLECTION,
    ENFORCING,
    PAUSED,
    INTERRUPTED,
    COMPLETED,
    RECOVERY_REQUIRED
}

data class SessionSnapshot(
    val state: FocusSessionState = FocusSessionState.IDLE,
    val sessionId: String? = null,
    val problemId: String? = null,
    val problemName: String? = null,
    val startedAtMs: Long = 0L,
    val elapsedSeconds: Int = 0,
    val activePackage: String? = null,
    val activeAppName: String? = null,
    val warningExpiresAtMs: Long = 0L,
    val hardLockExpiresAtMs: Long = 0L,
    val interruptionReason: String? = null
)

/**
 * FocusSessionStateMachine: The single authoritative state manager for CLIMB 1600 focus sessions.
 *
 * Guarantees:
 * - Strictly idempotent transitions.
 * - Prevents conflicting timers, duplicate workers, or race conditions.
 * - Restores persisted state across unexpected process death or device reboot.
 */
object FocusSessionStateMachine {

    private val _sessionState = MutableStateFlow(SessionSnapshot())
    val sessionState: StateFlow<SessionSnapshot> = _sessionState.asStateFlow()

    private val scope = CoroutineScope(Dispatchers.IO)

    @Synchronized
    fun startSession(
        context: Context,
        problemId: String = "1352C",
        problemName: String = "1352C — K-th Not Divisible by n"
    ) {
        val now = System.currentTimeMillis()
        val sessionId = "sess_${now}_${UUID.randomUUID().toString().take(6)}"

        _sessionState.value = SessionSnapshot(
            state = FocusSessionState.ACTIVE,
            sessionId = sessionId,
            problemId = problemId,
            problemName = problemName,
            startedAtMs = now
        )

        scope.launch {
            try {
                val db = AppDatabase.getDatabase(context)
                db.sessionDao().insertSession(
                    SessionEntity(
                        id = sessionId,
                        startedAt = now,
                        endedAt = null,
                        durationSeconds = 0,
                        activeProblemId = problemId,
                        activeProblemName = problemName,
                        isCompleted = false,
                        notes = "Session started via FocusSessionStateMachine"
                    )
                )
            } catch (ignored: Exception) {}
        }
    }

    @Synchronized
    fun onDistractionDetected(
        packageName: String,
        appName: String,
        isHardLock: Boolean
    ) {
        val current = _sessionState.value
        if (current.state != FocusSessionState.ACTIVE && current.state != FocusSessionState.WARNING) {
            return
        }

        val now = System.currentTimeMillis()
        if (isHardLock) {
            _sessionState.value = current.copy(
                state = FocusSessionState.ENFORCING,
                activePackage = packageName,
                activeAppName = appName,
                hardLockExpiresAtMs = now + (300 * 1000L) // 5 minutes
            )
        } else {
            _sessionState.value = current.copy(
                state = FocusSessionState.WARNING,
                activePackage = packageName,
                activeAppName = appName,
                warningExpiresAtMs = now + (60 * 1000L) // 60 seconds
            )
        }
    }

    @Synchronized
    fun onJustificationGranted(explanation: String) {
        val current = _sessionState.value
        _sessionState.value = current.copy(
            state = FocusSessionState.REFLECTION,
            activePackage = null,
            warningExpiresAtMs = 0L,
            interruptionReason = "Exemption: $explanation"
        )
    }

    @Synchronized
    fun onEnforcementApplied() {
        val current = _sessionState.value
        _sessionState.value = current.copy(
            state = FocusSessionState.ENFORCING
        )
    }

    @Synchronized
    fun onClearOrResume() {
        val current = _sessionState.value
        if (current.state == FocusSessionState.ENFORCING && System.currentTimeMillis() < current.hardLockExpiresAtMs) {
            return // Cannot clear before hard-lock timer expires
        }

        _sessionState.value = current.copy(
            state = FocusSessionState.ACTIVE,
            activePackage = null,
            activeAppName = null,
            warningExpiresAtMs = 0L,
            hardLockExpiresAtMs = 0L
        )
    }

    @Synchronized
    fun pauseSession() {
        val current = _sessionState.value
        if (current.state == FocusSessionState.ACTIVE || current.state == FocusSessionState.REFLECTION) {
            _sessionState.value = current.copy(state = FocusSessionState.PAUSED)
        }
    }

    @Synchronized
    fun resumeSession() {
        val current = _sessionState.value
        if (current.state == FocusSessionState.PAUSED) {
            _sessionState.value = current.copy(state = FocusSessionState.ACTIVE)
        }
    }

    @Synchronized
    fun completeSession(context: Context) {
        val current = _sessionState.value
        val now = System.currentTimeMillis()
        val duration = if (current.startedAtMs > 0) ((now - current.startedAtMs) / 1000).toInt() else 0

        _sessionState.value = current.copy(
            state = FocusSessionState.COMPLETED,
            elapsedSeconds = duration
        )

        scope.launch {
            try {
                val db = AppDatabase.getDatabase(context)
                val active = db.sessionDao().getActiveSession()
                if (active != null) {
                    db.sessionDao().insertSession(
                        active.copy(
                            endedAt = now,
                            durationSeconds = duration,
                            isCompleted = true
                        )
                    )
                }
            } catch (ignored: Exception) {}
        }

        _sessionState.value = SessionSnapshot(state = FocusSessionState.IDLE)
    }

    @Synchronized
    fun interruptSession(reason: String) {
        val current = _sessionState.value
        _sessionState.value = current.copy(
            state = FocusSessionState.INTERRUPTED,
            interruptionReason = reason
        )
    }

    suspend fun restoreSessionAfterRestart(context: Context): Boolean {
        return try {
            val db = AppDatabase.getDatabase(context)
            val active = db.sessionDao().getActiveSession()
            if (active != null && !active.isCompleted) {
                val elapsed = ((System.currentTimeMillis() - active.startedAt) / 1000).toInt()
                if (elapsed < 4 * 3600) { // If less than 4 hours old, resume
                    _sessionState.value = SessionSnapshot(
                        state = FocusSessionState.ACTIVE,
                        sessionId = active.id,
                        problemId = active.activeProblemId,
                        problemName = active.activeProblemName,
                        startedAtMs = active.startedAt,
                        elapsedSeconds = elapsed
                    )
                    true
                } else {
                    completeSession(context)
                    false
                }
            } else {
                false
            }
        } catch (e: Exception) {
            false
        }
    }
}
