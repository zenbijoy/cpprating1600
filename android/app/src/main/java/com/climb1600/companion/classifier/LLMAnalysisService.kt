package com.climb1600.companion.classifier

import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.POST
import java.util.concurrent.TimeUnit

interface GuardianApi {
    @POST("/api/guardian/classify-activity")
    suspend fun classifyActivity(
        @Body request: ClassificationRequest
    ): Response<ClassificationResponse>
}

object GuardianApiClient {
    private const val DEFAULT_BASE_URL = "http://10.0.2.2:3000/"

    private val okHttpClient: OkHttpClient by lazy {
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BASIC
        }
        OkHttpClient.Builder()
            .connectTimeout(10, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .writeTimeout(15, TimeUnit.SECONDS)
            .addInterceptor(logging)
            .build()
    }

    private var retrofit: Retrofit = Retrofit.Builder()
        .baseUrl(DEFAULT_BASE_URL)
        .client(okHttpClient)
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    var api: GuardianApi = retrofit.create(GuardianApi::class.java)
        private set

    fun updateBaseUrl(newBaseUrl: String) {
        val url = if (newBaseUrl.endsWith("/")) newBaseUrl else "$newBaseUrl/"
        retrofit = Retrofit.Builder()
            .baseUrl(url)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
        api = retrofit.create(GuardianApi::class.java)
    }

    suspend fun classifySafe(request: ClassificationRequest): ClassificationResponse {
        return try {
            val response = api.classifyActivity(request)
            if (response.isSuccessful && response.body() != null) {
                response.body()!!
            } else {
                fallbackLocalClassification(request)
            }
        } catch (e: Exception) {
            fallbackLocalClassification(request)
        }
    }

    private fun fallbackLocalClassification(req: ClassificationRequest): ClassificationResponse {
        val pkg = req.packageName?.lowercase() ?: ""
        val title = req.screenTitle?.lowercase() ?: ""

        val isCP = pkg.contains("termux") || pkg.contains("codeforces") || pkg.contains("cide") ||
                title.contains("codeforces") || title.contains("leetcode")
        val isSocial = pkg.contains("instagram") || pkg.contains("tiktok") || pkg.contains("facebook") ||
                pkg.contains("twitter") || pkg.contains("reddit")
        val isExplicit = title.contains("pornhub") || title.contains("xvideos") || pkg.contains("adult")

        val category = when {
            isExplicit -> "potentially_explicit_content"
            isCP -> "competitive_programming"
            isSocial -> "social_media"
            else -> "unknown"
        }

        val action = when {
            isExplicit -> if (req.hardLockEnabled) "hard_lock" else "warn_distraction"
            isCP -> "allow"
            isSocial -> "warn_distraction"
            else -> "allow"
        }

        return ClassificationResponse(
            primaryCategory = category,
            confidence = if (category != "unknown") 0.90f else 0.50f,
            reasoning = "Local offline fallback classification.",
            recommendedAction = action,
            encouragementMessage = "Stay focused on your 1600 rating goal! One problem at a time.",
            problemRecommendation = ProblemRecommendation(
                id = "4A",
                name = "Watermelon",
                rating = 800,
                tags = listOf("math", "brute force"),
                reason = "Offline warm-up problem"
            ),
            screenshotUsed = false,
            rawTextRedacted = true
        )
    }
}
