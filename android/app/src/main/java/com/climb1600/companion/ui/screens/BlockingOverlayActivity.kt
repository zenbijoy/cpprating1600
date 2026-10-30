package com.climb1600.companion.ui.screens

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.climb1600.companion.service.AppRestrictionManager
import com.climb1600.companion.service.PolicyEngine
import com.climb1600.companion.theme.*
import kotlinx.coroutines.delay

class BlockingOverlayActivity : ComponentActivity() {

    companion object {
        const val EXTRA_PACKAGE_NAME = "extra_package_name"
        const val EXTRA_APP_NAME = "extra_app_name"
        const val EXTRA_DELAY_SECONDS = "extra_delay_seconds"
        const val EXTRA_IS_HARD_LOCK = "extra_is_hard_lock"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val appName = intent.getStringExtra(EXTRA_APP_NAME) ?: "Restricted App"
        val packageName = intent.getStringExtra(EXTRA_PACKAGE_NAME) ?: ""
        val isHardLock = intent.getBooleanExtra(EXTRA_IS_HARD_LOCK, false)
        val delaySec = intent.getIntExtra(EXTRA_DELAY_SECONDS, if (isHardLock) 300 else 60)

        setContent {
            Climb1600Theme {
                if (isHardLock) {
                    HardLockOverlayContent(
                        appName = appName,
                        initialSeconds = delaySec,
                        onLaunchCodeforces = {
                            val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://codeforces.com/problemset"))
                            browserIntent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                            startActivity(browserIntent)
                        },
                        onTimeoutExpired = {
                            AppRestrictionManager.liftRestriction(this, packageName)
                            finish()
                        }
                    )
                } else {
                    DistractionJustificationContent(
                        appName = appName,
                        packageName = packageName,
                        initialDelaySeconds = delaySec,
                        onSubmitExplanation = { justification ->
                            val accepted = PolicyEngine.submitJustification(this, justification, packageName)
                            if (accepted) {
                                Toast.makeText(this, "Exemption granted for 15 minutes.", Toast.LENGTH_SHORT).show()
                                finish()
                            }
                        },
                        onReturnToProblem = {
                            val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://codeforces.com/problemset"))
                            browserIntent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                            startActivity(browserIntent)
                            finish()
                        },
                        onEmergencyExit = {
                            PolicyEngine.submitJustification(this, "Emergency exit", packageName)
                            finish()
                        }
                    )
                }
            }
        }
    }
}

@Composable
fun HardLockOverlayContent(
    appName: String,
    initialSeconds: Int,
    onLaunchCodeforces: () -> Unit,
    onTimeoutExpired: () -> Unit
) {
    var secondsRemaining by remember { mutableStateOf(initialSeconds) }

    LaunchedEffect(Unit) {
        while (secondsRemaining > 0) {
            delay(1000)
            secondsRemaining -= 1
        }
        onTimeoutExpired()
    }

    val minutes = secondsRemaining / 60
    val secs = secondsRemaining % 60
    val formattedTime = String.format("%02d:%02d", minutes, secs)

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xF00B0F19))
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .wrapContentHeight(),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = SurfaceDark)
        ) {
            Column(
                modifier = Modifier
                    .padding(28.dp)
                    .verticalScroll(rememberScrollState()),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = AccentRose.copy(alpha = 0.15f)
                ) {
                    Text(
                        text = "STRICT FOCUS HARD-LOCK ACTIVE",
                        color = AccentRose,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                    )
                }

                Text(
                    text = "Potentially Explicit or Restricted Content",
                    color = TextLight,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center
                )

                Text(
                    text = "Your preconfigured hard-lock policy is actively protecting your time and goals. A 5-minute cooldown is enforced.",
                    color = TextMuted,
                    fontSize = 13.sp,
                    textAlign = TextAlign.Center
                )

                // 5-minute countdown clock
                Box(
                    modifier = Modifier
                        .size(100.dp)
                        .background(AccentRose.copy(alpha = 0.15f), shape = RoundedCornerShape(50.dp))
                        .border(2.dp, AccentRose, RoundedCornerShape(50.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = formattedTime,
                            color = AccentRose,
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "rechecking",
                            color = TextMuted,
                            fontSize = 10.sp
                        )
                    }
                }

                Text(
                    text = "No explanation override is accepted during hard-lock sessions. An automated recheck will execute when the timer concludes.",
                    color = TextMuted,
                    fontSize = 12.sp,
                    textAlign = TextAlign.Center
                )

                Button(
                    onClick = onLaunchCodeforces,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryIndigo),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Launch Codeforces (Reset Focus)", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun DistractionJustificationContent(
    appName: String,
    packageName: String,
    initialDelaySeconds: Int,
    onSubmitExplanation: (String) -> Unit,
    onReturnToProblem: () -> Unit,
    onEmergencyExit: () -> Unit
) {
    var secondsRemaining by remember { mutableStateOf(initialDelaySeconds) }
    var selectedJustification by remember { mutableStateOf("I am studying") }
    var customNotes by remember { mutableStateOf("") }

    val presetReasons = listOf(
        "I am studying",
        "This is necessary",
        "Take a short break",
        "Return to programming"
    )

    LaunchedEffect(Unit) {
        while (secondsRemaining > 0) {
            delay(1000)
            secondsRemaining -= 1
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xE60B0F19))
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .wrapContentHeight(),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = SurfaceDark)
        ) {
            Column(
                modifier = Modifier
                    .padding(24.dp)
                    .verticalScroll(rememberScrollState()),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = AccentCyan.copy(alpha = 0.15f)
                ) {
                    Text(
                        text = "FOCUS PAUSE & JUSTIFICATION",
                        color = AccentCyan,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                    )
                }

                Text(
                    text = "$appName Opened",
                    color = TextLight,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.SemiBold,
                    textAlign = TextAlign.Center
                )

                Text(
                    text = "Distracting activity detected during study hours. You have one opportunity to provide a reasonable explanation to prevent restriction.",
                    color = TextMuted,
                    fontSize = 13.sp,
                    textAlign = TextAlign.Center
                )

                if (secondsRemaining > 0) {
                    Text(
                        text = "${secondsRemaining}s to respond",
                        color = AccentCyan,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                // Justification Choices
                Text(
                    text = "Select an Explanation:",
                    color = TextLight,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.align(Alignment.Start)
                )

                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    presetReasons.forEach { reason ->
                        val isSelected = selectedJustification == reason
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(
                                    if (isSelected) PrimaryIndigo.copy(alpha = 0.25f) else SurfaceDark,
                                    RoundedCornerShape(10.dp)
                                )
                                .border(
                                    1.dp,
                                    if (isSelected) AccentCyan else Color(0x33FFFFFF),
                                    RoundedCornerShape(10.dp)
                                )
                                .clickable { selectedJustification = reason }
                                .padding(horizontal = 14.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            RadioButton(
                                selected = isSelected,
                                onClick = { selectedJustification = reason },
                                colors = RadioButtonDefaults.colors(selectedColor = AccentCyan)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = reason,
                                color = if (isSelected) TextLight else TextMuted,
                                fontSize = 13.sp,
                                fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal
                            )
                        }
                    }
                }

                // Submit Explanation Button
                Button(
                    onClick = {
                        val fullReason = if (customNotes.isNotBlank()) {
                            "$selectedJustification: $customNotes"
                        } else {
                            selectedJustification
                        }
                        onSubmitExplanation(fullReason)
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = AccentEmerald),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Submit Explanation (15m Exemption)", fontWeight = FontWeight.Bold, color = Color.Black)
                }

                // Return to Problem Button
                Button(
                    onClick = onReturnToProblem,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryIndigo),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Return to Competitive Programming", fontWeight = FontWeight.Bold)
                }

                TextButton(
                    onClick = onEmergencyExit,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Emergency Dismiss", color = AccentRose, fontSize = 12.sp)
                }
            }
        }
    }
}
