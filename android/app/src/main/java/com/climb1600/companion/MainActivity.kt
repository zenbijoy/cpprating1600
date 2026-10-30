package com.climb1600.companion

import android.app.Activity
import android.content.Context
import android.media.projection.MediaProjectionManager
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import com.climb1600.companion.service.MonitoringScheduler
import com.climb1600.companion.service.ScreenCaptureManager
import com.climb1600.companion.theme.BgDark
import com.climb1600.companion.theme.Climb1600Theme
import com.climb1600.companion.theme.SurfaceDark
import com.climb1600.companion.theme.TextMuted
import com.climb1600.companion.ui.screens.*

class MainActivity : ComponentActivity() {

    private val screenCaptureLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK && result.data != null) {
            ScreenCaptureManager.registerConsent(result.resultCode, result.data!!, this)
        }
    }

    companion object {
        var instance: MainActivity? = null
            private set

        fun requestScreenCaptureConsent() {
            instance?.let { activity ->
                val mgr = activity.getSystemService(Context.MEDIA_PROJECTION_SERVICE) as? MediaProjectionManager
                mgr?.let {
                    activity.screenCaptureLauncher.launch(it.createScreenCaptureIntent())
                }
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        instance = this

        // Initialize notification channels for reminders and contests
        com.climb1600.companion.service.NotificationChannelHelper.createChannels(this)

        // Initialize default periodic monitoring scheduler
        MonitoringScheduler.startMonitoring(this)

        val initialTarget = com.climb1600.companion.service.DeepLinkParser.parse(intent?.dataString)

        setContent {
            Climb1600Theme {
                MainAppScaffold(initialTab = initialTarget.tab)
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        if (instance == this) {
            instance = null
        }
    }
}

enum class CompanionTab(val title: String) {
    WORKSPACE("Workspace"),
    GUARDIAN("Guardian"),
    HEALTH("Health"),
    APPS("Apps"),
    WEB("Filter"),
    TIMELINE("Timeline")
}

@Composable
fun MainAppScaffold(initialTab: CompanionTab = CompanionTab.WORKSPACE) {
    var currentTab by remember { mutableStateOf(initialTab) }

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        containerColor = BgDark,
        bottomBar = {
            NavigationBar(containerColor = SurfaceDark) {
                CompanionTab.values().forEach { tab ->
                    NavigationBarItem(
                        selected = currentTab == tab,
                        onClick = { currentTab = tab },
                        icon = {
                            when (tab) {
                                CompanionTab.WORKSPACE -> Icon(Icons.Default.Code, contentDescription = tab.title)
                                CompanionTab.GUARDIAN -> Icon(Icons.Default.Shield, contentDescription = tab.title)
                                CompanionTab.HEALTH -> Icon(Icons.Default.CheckCircle, contentDescription = tab.title)
                                CompanionTab.APPS -> Icon(Icons.Default.Block, contentDescription = tab.title)
                                CompanionTab.WEB -> Icon(Icons.Default.Language, contentDescription = tab.title)
                                CompanionTab.TIMELINE -> Icon(Icons.Default.Schedule, contentDescription = tab.title)
                            }
                        },
                        label = { Text(tab.title) },
                        colors = NavigationBarItemDefaults.colors(
                            unselectedTextColor = TextMuted,
                            unselectedIconColor = TextMuted
                        )
                    )
                }
            }
        }
    ) { innerPadding ->
        Surface(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding),
            color = BgDark
        ) {
            when (currentTab) {
                CompanionTab.WORKSPACE -> ClimbWebPlatformScreen()
                CompanionTab.GUARDIAN -> GuardianDashboardScreen()
                CompanionTab.HEALTH -> PermissionHealthCenterScreen()
                CompanionTab.APPS -> AppBlockerConfigScreen()
                CompanionTab.WEB -> WebsiteFilterConfigScreen()
                CompanionTab.TIMELINE -> FocusTimelineScreen()
            }
        }
    }
}
