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
import com.climb1600.companion.data.local.entity.RestrictionRuleEntity
import com.climb1600.companion.theme.*

@Composable
fun AppBlockerConfigScreen() {
    var rules by remember {
        mutableStateOf(
            listOf(
                RestrictionRuleEntity("com.instagram.android", "Instagram", "social_media", true, 15, false, false),
                RestrictionRuleEntity("com.zhiliaoapp.musically", "TikTok", "entertainment", true, 30, false, false),
                RestrictionRuleEntity("com.facebook.katana", "Facebook", "social_media", true, 15, false, false),
                RestrictionRuleEntity("com.twitter.android", "X (Twitter)", "social_media", true, 15, false, false),
                RestrictionRuleEntity("com.netflix.mediaclient", "Netflix", "entertainment", true, 30, false, false),
                RestrictionRuleEntity("com.google.android.dialer", "Phone (Emergency)", "essential_communication", false, 0, true, true),
                RestrictionRuleEntity("com.google.android.apps.authenticator2", "Authenticator (2FA)", "productivity", false, 0, true, true),
                RestrictionRuleEntity("com.instructure.candroid", "Canvas Student (University)", "university_study", false, 0, true, true)
            )
        )
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(BgDark)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text("App Restriction Policies", color = TextLight, fontSize = 22.sp, fontWeight = FontWeight.Bold)
            Text(
                "Configure which apps trigger a gentle breathing delay or block during focus sessions. Emergency functions are permanently unblocked.",
                color = TextMuted,
                fontSize = 13.sp,
                modifier = Modifier.padding(top = 4.dp, bottom = 8.dp)
            )
        }

        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = PrimaryIndigo.copy(alpha = 0.15f))
            ) {
                Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Strict Focus Protection", color = TextLight, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text("Applies restrictions automatically when a study timer begins.", color = TextMuted, fontSize = 12.sp)
                    }
                    Switch(checked = true, onCheckedChange = {})
                }
            }
        }

        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = AccentRose.copy(alpha = 0.12f))
            ) {
                Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Strict Explicit Content Hard-Lock", color = AccentRose, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text("Immediately applies a 5-minute non-negotiable lock upon verified explicit content. Automatically rechecks after 5m.", color = TextMuted, fontSize = 12.sp)
                    }
                    Switch(
                        checked = true,
                        onCheckedChange = {},
                        colors = SwitchDefaults.colors(checkedThumbColor = AccentRose)
                    )
                }
            }
        }

        items(rules) { rule ->
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceDark)
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text(rule.appName, color = TextLight, fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                            if (rule.isEssential) {
                                Text("ESSENTIAL", color = AccentEmerald, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                        Text(
                            text = if (rule.isBlocked) "Blocked with ${rule.delaySeconds}s breathing pause" else "Permitted during study",
                            color = if (rule.isBlocked) AccentRose else AccentEmerald,
                            fontSize = 12.sp
                        )
                    }

                    if (!rule.isEssential) {
                        Switch(
                            checked = rule.isBlocked,
                            onCheckedChange = { checked ->
                                rules = rules.map {
                                    if (it.packageName == rule.packageName) it.copy(isBlocked = checked) else it
                                }
                            }
                        )
                    }
                }
            }
        }
    }
}
