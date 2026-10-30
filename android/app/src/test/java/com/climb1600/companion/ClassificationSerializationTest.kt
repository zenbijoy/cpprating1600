package com.climb1600.companion

import com.climb1600.companion.classifier.ClassificationRequest
import com.climb1600.companion.classifier.ClassificationResponse
import com.climb1600.companion.classifier.ProblemRecommendation
import com.google.gson.Gson
import org.junit.Assert.*
import org.junit.Test

class ClassificationSerializationTest {

    private val gson = Gson()

    @Test
    fun testSerializationOfAllNineCategories() {
        val categories = listOf(
            "competitive_programming",
            "programming_learning",
            "academic_study",
            "productive_work",
            "communication",
            "entertainment",
            "social_media",
            "potentially_explicit_content",
            "unknown"
        )

        for (category in categories) {
            val response = ClassificationResponse(
                primaryCategory = category,
                confidence = 0.95f,
                reasoning = "Test reasoning for $category",
                recommendedAction = if (category == "potentially_explicit_content") "hard_lock" else "allow",
                encouragementMessage = "Keep pushing toward 1600!",
                problemRecommendation = ProblemRecommendation(
                    id = "1352C",
                    name = "K-th Not Divisible by n",
                    rating = 1200,
                    tags = listOf("binary search", "math"),
                    reason = "Standard 1200 practice"
                ),
                screenshotUsed = false,
                rawTextRedacted = true
            )

            val json = gson.toJson(response)
            assertTrue(json.contains(category))
            assertTrue(json.contains("1352C"))

            val deserialized = gson.fromJson(json, ClassificationResponse::class.java)
            assertEquals(category, deserialized.primaryCategory)
            assertEquals(0.95f, deserialized.confidence, 0.001f)
            assertNotNull(deserialized.problemRecommendation)
            assertEquals("1352C", deserialized.problemRecommendation?.id)
            assertFalse(deserialized.screenshotUsed)
            assertTrue(deserialized.rawTextRedacted)
        }
    }

    @Test
    fun testRequestPayloadWithScreenshotBase64() {
        val request = ClassificationRequest(
            packageName = "com.termux",
            appName = "Termux",
            screenTitle = "vim solution.cpp",
            screenshotBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
            isStudySessionActive = true,
            enableCloudAi = true,
            userRating = 1350,
            hardLockEnabled = true
        )

        val json = gson.toJson(request)
        assertTrue(json.contains("com.termux"))
        assertTrue(json.contains("iVBORw0KGgo"))
        assertTrue(json.contains("1350"))

        val deserialized = gson.fromJson(json, ClassificationRequest::class.java)
        assertEquals("com.termux", deserialized.packageName)
        assertEquals(1350, deserialized.userRating)
        assertTrue(deserialized.hardLockEnabled)
        assertTrue(deserialized.isStudySessionActive)
    }
}
