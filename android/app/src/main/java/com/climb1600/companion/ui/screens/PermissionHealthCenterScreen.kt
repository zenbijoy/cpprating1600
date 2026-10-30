package com.climb1600.companion.ui.screens

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.climb1600.companion.MainActivity
import com.climb1600.companion.service.*
import com.climb1600.companion.theme.*

@Composable
fun PermissionHealthCenterScreen() {
    val context = LocalContext.current

    var capabilityReport by remember {
        mutableStateOf(CapabilityEngine.evaluateCapabilities(context))
    }

    // Refresh when screen is displayed
    LaunchedEffect(Unit) {
        capabilityReport = CapabilityEngine.evaluateCapabilities(context)
    }

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
                    Text(
                        text = "Device & Capability Health",
                        color = TextLight,
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Honest, runtime-verified Android platform boundaries.",
                        color = TextMuted,
                        fontSize = 13.sp
                    )
                }

                IconButton(onClick = {
                    capabilityReport = CapabilityEngine.evaluateCapabilities(context)
                    Toast.makeText(context, "Capabilities refreshed", Toast.LENGTH_SHORT).show()
                }) {
                    Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = AccentCyan)
                }
            }
        }

        // 2. Active Operating Mode Card
        item {
            val mode = capabilityReport.activeMode
            val modeColor = when (mode) {
                EnforcementMode.MODE_C_DEVICE_OWNER -> PrimaryIndigo
                EnforcementMode.MODE_B_ENHANCED -> AccentCyan
                EnforcementMode.MODE_A_STANDARD -> AccentEmerald
            }

            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = modeColor.copy(alpha = 0.15f))
            ) {
                Column(
                    modifier = Modifier.padding(18.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "ACTIVE ENFORCEMENT MODE",
                            color = modeColor,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = modeColor.copy(alpha = 0.25f)
                        ) {
                            Text(
                                text = "VERIFIED",
                                color = modeColor,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }

                    Text(
                        text = mode.displayName,
                        color = TextLight,
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold
                    )

                    Text(
                        text = mode.description,
                        color = TextMuted,
                        fontSize = 12.sp
                    )

                    if (mode != EnforcementMode.MODE_C_DEVICE_OWNER) {
                        Text(
                            text = "Note: Standard & Enhanced modes cannot permanently freeze applications or override OS back navigation. For true OS app suspension, provision Mode C below.",
                            color = AccentAmber,
                            fontSize = 11.sp
                        )
                    }
                }
            }
        }

        // 3. Mode C Provisioning Instructions Card
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceDark)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Mode C: Device Owner Provisioning",
                            color = TextLight,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Surface(
                            color = if (capabilityReport.activeMode == EnforcementMode.MODE_C_DEVICE_OWNER)
                                AccentEmerald.copy(alpha = 0.2f) else CardBorder,
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Text(
                                text = if (capabilityReport.activeMode == EnforcementMode.MODE_C_DEVICE_OWNER)
                                    "PROVISIONED" else "UNPROVISIONED",
                                color = if (capabilityReport.activeMode == EnforcementMode.MODE_C_DEVICE_OWNER)
                                    AccentEmerald else TextMuted,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                            )
                        }
                    }

                    Text(
                        text = "To enable true OS-level package suspension on a dedicated development or study phone, run this one-time ADB command (requires no existing device accounts or factory reset):",
                        color = TextMuted,
                        fontSize = 12.sp
                    )

                    val adbCmd = "adb shell dpm set-device-owner com.climb1600.companion/.receiver.GuardianDeviceAdminReceiver"

                    Surface(
                        color = BgDark,
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = adbCmd,
                            color = AccentCyan,
                            fontSize = 11.sp,
                            fontFamily = FontFamily.Monospace,
                            modifier = Modifier.padding(10.dp)
                        )
                    }

                    Button(
                        onClick = {
                            val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                            val clip = ClipData.newPlainText("ADB Command", adbCmd)
                            clipboard.setPrimaryClip(clip)
                            Toast.makeText(context, "ADB command copied to clipboard!", Toast.LENGTH_SHORT).show()
                        },
                        modifier = Modifier.align(Alignment.End),
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryIndigo)
                    ) {
                        Icon(Icons.Default.ContentCopy, contentDescription = null, modifier = Modifier.size(14.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("Copy ADB Command", fontSize = 11.sp)
                    }
                }
            }
        }

        // 4. Detailed Capabilities Table
        item {
            Text(
                text = "Runtime Capabilities & Permissions",
                color = TextLight,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold
            )
        }

        items(capabilityReport.capabilities) { cap ->
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceDark)
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = cap.title,
                            color = TextLight,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.weight(1f)
                        )

                        val (statusText, statusBg, statusFg) = when (cap.status) {
                            CapabilityStatus.AVAILABLE -> Triple("AVAILABLE", AccentEmerald.copy(alpha = 0.15f), AccentEmerald)
                            CapabilityStatus.NEEDS_USER_PERMISSION -> Triple("NEEDS GRANT", AccentAmber.copy(alpha = 0.15f), AccentAmber)
                            CapabilityStatus.NEEDS_DEVICE_PROVISIONING -> Triple("NEEDS PROVISION", PrimaryIndigo.copy(alpha = 0.15f), PrimaryIndigoLight)
                            CapabilityStatus.TEMPORARILY_UNAVAILABLE -> Triple("PAUSED", TextMuted.copy(alpha = 0.15f), TextMuted)
                            CapabilityStatus.UNSUPPORTED -> Triple("UNSUPPORTED", AccentRose.copy(alpha = 0.15f), AccentRose)
                            CapabilityStatus.RESTRICTED_BY_SYSTEM -> Triple("RESTRICTED", AccentRose.copy(alpha = 0.15f), AccentRose)
                            CapabilityStatus.FAILED -> Triple("FAILED", AccentRose.copy(alpha = 0.15f), AccentRose)
                        }

                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = statusBg
                        ) {
                            Text(
                                text = statusText,
                                color = statusFg,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                            )
                        }
                    }

                    Text(
                        text = cap.description,
                        color = TextMuted,
                        fontSize = 12.sp
                    )

                    // Action buttons
                    if (cap.status == CapabilityStatus.NEEDS_USER_PERMISSION) {
                        Button(
                            onClick = {
                                if (cap.type == CapabilityType.MEDIA_PROJECTION) {
                                    MainActivity.requestScreenCaptureConsent()
                                } else if (cap.settingsAction != null) {
                                    try {
                                        val intent = Intent(cap.settingsAction).apply {
                                            if (cap.type == CapabilityType.BATTERY_OPTIMIZATION_EXEMPT ||
                                                cap.type == CapabilityType.SYSTEM_OVERLAY) {
                                                data = Uri.parse("package:${context.packageName}")
                                            }
                                        }
                                        context.startActivity(intent)
                                    } catch (e: Exception) {
                                        context.startActivity(Intent(Settings.ACTION_SETTINGS))
                                    }
                                }
                            },
                            modifier = Modifier.align(Alignment.End),
                            shape = RoundedCornerShape(8.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = PrimaryIndigo)
                        ) {
                            Text("Grant Permission", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        // 5. Diagnostics Metadata Card
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceDark)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("Device Telemetry & Environment", color = AccentCyan, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    Text("• Manufacturer & Model: ${Build.MANUFACTURER} ${Build.MODEL}", color = TextLight, fontSize = 12.sp)
                    Text("• Android Version: ${Build.VERSION.RELEASE} (API ${Build.VERSION.SDK_INT})", color = TextLight, fontSize = 12.sp)
                    Text("• Accessibility Screenshot: ${if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) "Supported (API 30+)" else "Unsupported (pre-Android 11)"}", color = TextLight, fontSize = 12.sp)
                    Text("• Local Server: http://10.0.2.2:3000 (Local-First Sync)", color = AccentEmerald, fontSize = 12.sp)
                    Text("• Last Policy Evaluation: ${PolicyEngine.lastCategory} (${PolicyEngine.lastActionTaken})", color = TextMuted, fontSize = 12.sp)
                }
            }
        }
    }
}
