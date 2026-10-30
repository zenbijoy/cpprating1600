package com.climb1600.companion.ui.screens

import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.climb1600.companion.MainActivity
import com.climb1600.companion.data.local.AppDatabase
import com.climb1600.companion.service.*
import com.climb1600.companion.theme.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun GuardianDashboardScreen() {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val db = remember { AppDatabase.getDatabase(context) }

    var isSessionActive by remember { mutableStateOf(GuardianForegroundService.isSessionActive) }
    var isMonitoringActive by remember { mutableStateOf(MonitoringScheduler.isMonitoringEnabled) }
    var isCaptureGranted by remember { mutableStateOf(ScreenCaptureManager.isCaptureAuthorized) }
    val isHardLocked = AppRestrictionManager.isHardLocked

    val auditLogs by db.auditLogDao().getRecentLogs(15).collectAsState(initial = emptyList())

    val timeFormatter = remember { SimpleDateFormat("HH:mm:ss", Locale.getDefault()) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(BgDark)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // 1. Header
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("CLIMB 1600 Guardian", color = TextLight, fontSize = 22.sp, fontWeight = FontWeight.Bold)
                    Text("AI Discipline & Competitive Programming Coach", color = TextMuted, fontSize = 13.sp)
                }

                Surface(
                    color = when {
                        isHardLocked -> AccentRose.copy(alpha = 0.2f)
                        isSessionActive -> AccentEmerald.copy(alpha = 0.2f)
                        else -> CardBorder
                    },
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(
                        text = when {
                            isHardLocked -> "● HARD-LOCKED"
                            isSessionActive -> "● ACTIVE SESSION"
                            else -> "○ STANDBY"
                        },
                        color = when {
                            isHardLocked -> AccentRose
                            isSessionActive -> AccentEmerald
                            else -> TextMuted
                        },
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                    )
                }
            }
        }

        // 2. AI Discipline Monitor Card (Scheduler Controls)
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceDark)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("AI Discipline Monitoring", color = TextLight, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                            Text("Automatic 30m normal / 5m hard-lock cycle", color = TextMuted, fontSize = 12.sp)
                        }
                        Switch(
                            checked = isMonitoringActive,
                            onCheckedChange = { enabled ->
                                isMonitoringActive = enabled
                                if (enabled) {
                                    MonitoringScheduler.startMonitoring(context)
                                    Toast.makeText(context, "Monitoring activated (30m interval)", Toast.LENGTH_SHORT).show()
                                } else {
                                    MonitoringScheduler.stopMonitoring(context)
                                    Toast.makeText(context, "Monitoring paused", Toast.LENGTH_SHORT).show()
                                }
                            },
                            colors = SwitchDefaults.colors(checkedThumbColor = AccentCyan)
                        )
                    }

                    HorizontalDivider(color = CardBorder)

                    // Status rows
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text("Last Check", color = TextMuted, fontSize = 11.sp)
                            val lastTime = MonitoringScheduler.lastSuccessfulCheckTimeMs
                            Text(
                                if (lastTime > 0) timeFormatter.format(Date(lastTime)) else "None yet",
                                color = TextLight,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }

                        Column {
                            Text("Next Check (Est.)", color = TextMuted, fontSize = 11.sp)
                            val nextTime = MonitoringScheduler.nextEstimatedCheckTimeMs
                            Text(
                                if (nextTime > 0) timeFormatter.format(Date(nextTime)) else "Pending",
                                color = AccentCyan,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }

                        Column {
                            Text("Screen Capture", color = TextMuted, fontSize = 11.sp)
                            Text(
                                if (isCaptureGranted) "Authorized" else "UsageStats",
                                color = if (isCaptureGranted) AccentEmerald else AccentAmber,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }

                    // Action buttons
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = {
                                MainActivity.requestScreenCaptureConsent()
                                isCaptureGranted = ScreenCaptureManager.isCaptureAuthorized
                            },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = PrimaryIndigo.copy(alpha = 0.5f))
                        ) {
                            Icon(Icons.Default.CameraAlt, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(6.dp))
                            Text("Screen Auth", fontSize = 11.sp)
                        }

                        Button(
                            onClick = {
                                val checkRequest = androidx.work.OneTimeWorkRequestBuilder<MonitoringWorker>().build()
                                androidx.work.WorkManager.getInstance(context).enqueueUniqueWork(
                                    "MANUAL_GUARDIAN_CHECK",
                                    androidx.work.ExistingWorkPolicy.REPLACE,
                                    checkRequest
                                )
                                Toast.makeText(context, "Running discipline check in background...", Toast.LENGTH_SHORT).show()
                            },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = PrimaryIndigo)
                        ) {
                            Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(6.dp))
                            Text("Check Now", fontSize = 11.sp)
                        }
                    }
                }
            }
        }

        // 3. Daily Codeforces Target Card
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceDark)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Daily Codeforces Target", color = TextLight, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                        Surface(
                            color = AccentCyan.copy(alpha = 0.15f),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Target Rating: 1600", color = AccentCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp))
                        }
                    }

                    Text("Goal: 3 problems solved / day • 60 min deliberate practice", color = TextMuted, fontSize = 12.sp)

                    LinearProgressIndicator(
                        progress = { 0.66f },
                        modifier = Modifier.fillMaxWidth().height(8.dp),
                        color = AccentEmerald,
                        trackColor = CardBorder
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("2 of 3 Solved Today", color = TextLight, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        Text("45 / 60 Min Practiced", color = AccentCyan, fontSize = 12.sp)
                    }

                    Button(
                        onClick = {
                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://codeforces.com/problemset"))
                            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                            context.startActivity(intent)
                        },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryIndigo)
                    ) {
                        Text("Launch Next Practice Problem", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // 4. Focus Session Controls
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceDark)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("Timed Focus Session Control", color = TextLight, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                    Text("Starts foreground monitoring, applies configured app restrictions, and syncs session state with your web dashboard.", color = TextMuted, fontSize = 12.sp)

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                        Button(
                            onClick = {
                                val intent = Intent(context, GuardianForegroundService::class.java).apply {
                                    action = GuardianForegroundService.ACTION_START
                                    putExtra(GuardianForegroundService.EXTRA_PROBLEM_NAME, "1352C K-th Not Divisible")
                                }
                                context.startService(intent)
                                isSessionActive = true
                            },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = PrimaryIndigo)
                        ) {
                            Text("Start 45m Focus", fontSize = 12.sp)
                        }

                        OutlinedButton(
                            onClick = {
                                val intent = Intent(context, GuardianForegroundService::class.java).apply {
                                    action = GuardianForegroundService.ACTION_STOP
                                }
                                context.startService(intent)
                                isSessionActive = false
                            },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("Stop Session", fontSize = 12.sp, color = TextLight)
                        }
                    }
                }
            }
        }

        // 5. Transparent Room Audit Log Section
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Transparent Audit Log", color = TextLight, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                TextButton(
                    onClick = {
                        coroutineScope.launch(Dispatchers.IO) {
                            db.auditLogDao().clearAllLogs()
                        }
                        Toast.makeText(context, "Audit logs purged successfully.", Toast.LENGTH_SHORT).show()
                    }
                ) {
                    Text("Purge Logs", color = AccentRose, fontSize = 12.sp)
                }
            }
        }

        if (auditLogs.isEmpty()) {
            item {
                Surface(
                    color = SurfaceDark,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        "No audit events recorded yet. Periodic checks will record activity, confidence, and policy actions transparently.",
                        color = TextMuted,
                        fontSize = 12.sp,
                        modifier = Modifier.padding(16.dp)
                    )
                }
            }
        } else {
            items(auditLogs) { log ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceDark)
                ) {
                    Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                log.category.replace('_', ' ').uppercase(),
                                color = when (log.actionTaken) {
                                    "HARD_LOCKED" -> AccentRose
                                    "DISTRACTION_WARNED" -> AccentAmber
                                    "EXEMPTION_GRANTED" -> AccentCyan
                                    else -> AccentEmerald
                                },
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(timeFormatter.format(Date(log.timestamp)), color = TextMuted, fontSize = 11.sp)
                        }

                        Text(
                            text = log.reasoning,
                            color = TextLight,
                            fontSize = 12.sp
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                "Action: ${log.actionTaken} • Conf: ${(log.confidence * 100).toInt()}%",
                                color = TextMuted,
                                fontSize = 11.sp
                            )
                            Text(
                                if (log.screenshotUsed) "Visual Inspection" else "UsageStats Signal",
                                color = TextMuted,
                                fontSize = 10.sp
                            )
                        }
                    }
                }
            }
        }
    }
}
