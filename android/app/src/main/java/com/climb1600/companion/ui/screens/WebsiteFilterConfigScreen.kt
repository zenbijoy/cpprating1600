package com.climb1600.companion.ui.screens

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.climb1600.companion.service.StudyVpnFilterService
import com.climb1600.companion.theme.*

@Composable
fun WebsiteFilterConfigScreen() {
    val context = LocalContext.current
    var isFilterActive by remember { mutableStateOf(StudyVpnFilterService.isVpnConnected) }

    var selectedProfile by remember { mutableStateOf("Codeforces Practice") }

    val profiles = listOf(
        "Codeforces Practice" to listOf("codeforces.com", "atcoder.jp", "cses.fi", "cppreference.com"),
        "C++ Learning" to listOf("learncpp.com", "en.cppreference.com", "cplusplus.com", "geeksforgeeks.org"),
        "University Study" to listOf("canvas.instructure.com", "blackboard.com", "edx.org", "coursera.org"),
        "Deep Work" to listOf("codeforces.com", "github.com")
    )

    val blockedDefaults = listOf(
        "instagram.com",
        "tiktok.com",
        "reddit.com",
        "twitter.com",
        "x.com",
        "facebook.com",
        "netflix.com"
    )

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(BgDark)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text("Study-Only Web Profiles", color = TextLight, fontSize = 22.sp, fontWeight = FontWeight.Bold)
            Text(
                "Local DNS filter blocks distracting websites during focus sessions without inspecting encrypted traffic.",
                color = TextMuted,
                fontSize = 13.sp,
                modifier = Modifier.padding(top = 4.dp, bottom = 8.dp)
            )
        }

        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = if (isFilterActive) AccentEmerald.copy(alpha = 0.15f) else SurfaceDark)
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = if (isFilterActive) "Web Filter Connected" else "Web Filter Disconnected",
                            color = if (isFilterActive) AccentEmerald else TextLight,
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp
                        )
                        Text(
                            text = "Enforces local DNS blocking for distracting entertainment domains.",
                            color = TextMuted,
                            fontSize = 12.sp
                        )
                    }
                    Switch(
                        checked = isFilterActive,
                        onCheckedChange = { checked ->
                            val intent = Intent(context, StudyVpnFilterService::class.java).apply {
                                action = if (checked) StudyVpnFilterService.ACTION_CONNECT else StudyVpnFilterService.ACTION_DISCONNECT
                            }
                            context.startService(intent)
                            isFilterActive = checked
                        }
                    )
                }
            }
        }

        item {
            Text("Active Study Profile", color = AccentCyan, fontSize = 14.sp, fontWeight = FontWeight.Bold)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(vertical = 4.dp)) {
                profiles.forEach { (name, _) ->
                    FilterChip(
                        selected = selectedProfile == name,
                        onClick = { selectedProfile = name },
                        label = { Text(name, fontSize = 11.sp) }
                    )
                }
            }
        }

        item {
            val currentAllowed = profiles.find { it.first == selectedProfile }?.second ?: emptyList()
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceDark)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Allowed Educational Domains for $selectedProfile:", color = TextLight, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                    currentAllowed.forEach { domain ->
                        Text("✔ $domain", color = AccentEmerald, fontSize = 12.sp)
                    }
                }
            }
        }

        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceDark)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Standard Distracting Domains (Blocked in Focus Mode):", color = TextLight, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                    blockedDefaults.forEach { domain ->
                        Text("⛔ $domain", color = AccentRose, fontSize = 12.sp)
                    }
                }
            }
        }
    }
}
