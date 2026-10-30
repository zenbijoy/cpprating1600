package com.climb1600.companion.classifier

import com.google.gson.annotations.SerializedName

data class ClassificationRequest(
    @SerializedName("packageName") val packageName: String? = null,
    @SerializedName("appName") val appName: String? = null,
    @SerializedName("screenTitle") val screenTitle: String? = null,
    @SerializedName("screenshotBase64") val screenshotBase64: String? = null,
    @SerializedName("isStudySessionActive") val isStudySessionActive: Boolean = false,
    @SerializedName("enableCloudAi") val enableCloudAi: Boolean = false,
    @SerializedName("userRating") val userRating: Int = 1200,
    @SerializedName("hardLockEnabled") val hardLockEnabled: Boolean = true
)

data class ProblemRecommendation(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("rating") val rating: Int,
    @SerializedName("tags") val tags: List<String> = emptyList(),
    @SerializedName("reason") val reason: String
)

data class ClassificationResponse(
    @SerializedName("primary_category") val primaryCategory: String,
    @SerializedName("confidence") val confidence: Float,
    @SerializedName("reasoning") val reasoning: String,
    @SerializedName("recommended_action") val recommendedAction: String, // allow, suggest_return, warn_distraction, hard_lock, prompt_user
    @SerializedName("encouragement_message") val encouragementMessage: String? = null,
    @SerializedName("problem_recommendation") val problemRecommendation: ProblemRecommendation? = null,
    @SerializedName("screenshot_used") val screenshotUsed: Boolean = false,
    @SerializedName("raw_text_redacted") val rawTextRedacted: Boolean = true
)
