package com.climb1600.companion.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.climb1600.companion.data.local.entity.AppUsageEventEntity
import com.climb1600.companion.theme.*

@Composable
fun FocusTimelineScreen() {
    var events by remember {
        mutableStateOf(
            listOf(
                AppUsageEventEntity(
                    id = "e1",
                    packageName = "com.termux",
                    appName = "Termux (C++ Terminal)",
                    category = "competitive_programming",
                    startTime = System.currentTimeMillis() - 35 * 60 * 1000,
                    endTime = System.currentTimeMillis() - 5 * 60 * 1000,
                    durationSeconds = 1800,
                    confidence = 0.98f,
                    detectionSource = "high_confidence_rule",
                    userCorrection = null,
                    isStudyRelevant = true,
                    relevanceExplanation = "Code editing & compiling."
                ),
                AppUsageEventEntity(
                    id = "e2",
                    packageName = "com.google.android.youtube",
                    appName = "YouTube (Tutorial Mode)",
                    category = "educational_content",
                    startTime = System.currentTimeMillis() - 50 * 60 * 1000,
                    endTime = System.currentTimeMillis() - 35 * 60 * 1000,
                    durationSeconds = 900,
                    confidence = 0.85f,
                    detectionSource = "active_context",
                    userCorrection = null,
                    isStudyRelevant = true,
                    relevanceExplanation = "Editorial explanation."
                ),
                AppUsageEventEntity(
                    id = "e3",
                    packageName = "com.instagram.android",
                    appName = "Instagram",
                    category = "social_media",
                    startTime = System.currentTimeMillis() - 60 * 60 * 1000,
                    endTime = System.currentTimeMillis() - 50 * 60 * 1000,
                    durationSeconds = 600,
                    confidence = 0.95f,
                    detectionSource = "high_confidence_rule",
                    userCorrection = null,
                    isStudyRelevant = false,
                    relevanceExplanation = "Foreground social media app."
                )
            )
        )
    }

    var selectedEventForCorrection by remember { mutableStateOf<AppUsageEventEntity?>(null) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(BgDark)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text("Focus Session Timeline", color = TextLight, fontSize = 22.sp, fontWeight = FontWeight.Bold)
            Text(
                "Chronological log of focus blocks and device usage. If an AI classification was inaccurate, tap 'Correct' to update future rules with zero penalty.",
                color = TextMuted,
                fontSize = 13.sp,
                modifier = Modifier.padding(top = 4.dp, bottom = 8.dp)
            )
        }

        items(events) { event ->
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceDark)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(event.appName, color = TextLight, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                        Text(
                            text = "${event.durationSeconds / 60}m ${event.durationSeconds % 60}s",
                            color = AccentCyan,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                        Surface(
                            color = if (event.isStudyRelevant) AccentEmerald.copy(alpha = 0.2f) else AccentRose.copy(alpha = 0.2f),
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Text(
                                text = if (event.isStudyRelevant) "RELEVANT STUDY" else "DISTRACTION",
                                color = if (event.isStudyRelevant) AccentEmerald else AccentRose,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }

                        Text(
                            text = "Confidence: ${(event.confidence * 100).toInt()}% • Source: ${event.detectionSource}",
                            color = TextMuted,
                            fontSize = 11.sp
                        )
                    }

                    Text(event.relevanceExplanation, color = TextMuted, fontSize = 12.sp)

                    Button(
                        onClick = { selectedEventForCorrection = event },
                        colors = ButtonDefaults.buttonColors(containerColor = CardBorder),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.align(Alignment.End)
                    ) {
                        Text("Correct Classification", fontSize = 11.sp, color = TextLight)
                    }
                }
            }
        }
    }

    selectedEventForCorrection?.let { ev ->
        AlertDialog(
            onDismissRequest = { selectedEventForCorrection = null },
            title = { Text("Correct Classification for ${ev.appName}") },
            text = {
                Text(
                    "Was this activity actually relevant to your study, or an essential interruption? Your feedback directly adapts future guardian recommendations.",
                    fontSize = 13.sp,
                    color = TextMuted
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        events = events.map {
                            if (it.id == ev.id) it.copy(isStudyRelevant = true, userCorrection = "educational_content") else it
                        }
                        selectedEventForCorrection = null
                    }
                ) {
                    Text("Mark as Relevant Study")
                }
            },
            dismissButton = {
                OutlinedButton(onClick = { selectedEventForCorrection = null }) {
                    Text("Cancel")
                }
            }
        )
    }
}
