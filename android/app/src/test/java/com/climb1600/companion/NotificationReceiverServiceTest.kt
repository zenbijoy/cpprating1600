package com.climb1600.companion

import com.climb1600.companion.service.DeepLinkParser
import com.climb1600.companion.service.DeviceTokenPayload
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class NotificationReceiverServiceTest {

    @Test
    fun parseProblemDeepLink_extractsProblemIdAndTarget() {
        val parsed = DeepLinkParser.parse("climb1600://problem?id=4A")
        assertEquals(CompanionTab.WORKSPACE, parsed.tab)
        assertEquals("4A", parsed.problemId)
    }

    @Test
    fun parseContestDeepLink_extractsContestId() {
        val parsed = DeepLinkParser.parse("climb1600://contest?id=1980")
        assertEquals(CompanionTab.WORKSPACE, parsed.tab)
        assertEquals("1980", parsed.contestId)
    }

    @Test
    fun parseGuardianDeepLink_selectsGuardianTab() {
        val parsed = DeepLinkParser.parse("climb1600://guardian")
        assertEquals(CompanionTab.GUARDIAN, parsed.tab)
        assertNull(parsed.problemId)
    }

    @Test
    fun parseTimelineDeepLink_selectsTimelineTab() {
        val parsed = DeepLinkParser.parse("climb1600://timeline")
        assertEquals(CompanionTab.TIMELINE, parsed.tab)
    }

    @Test
    fun parseEmptyDeepLink_defaultsToWorkspaceWithoutCrashing() {
        val parsedNull = DeepLinkParser.parse(null)
        assertEquals(CompanionTab.WORKSPACE, parsedNull.tab)

        val parsedBlank = DeepLinkParser.parse("   ")
        assertEquals(CompanionTab.WORKSPACE, parsedBlank.tab)
    }

    @Test
    fun deviceTokenPayload_defaultsToAndroidPlatform() {
        val payload = DeviceTokenPayload(token = "fcm_test_token_12345")
        assertEquals("fcm_test_token_12345", payload.token)
        assertEquals("android", payload.platform)
    }
}
