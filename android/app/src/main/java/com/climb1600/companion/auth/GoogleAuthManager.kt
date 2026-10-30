package com.climb1600.companion.auth

import android.content.Context
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialException
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

data class GoogleSignInAccount(
    val idToken: String,
    val email: String,
    val displayName: String?,
    val avatarUrl: String?
)

data class SupabaseSession(
    val accessToken: String,
    val refreshToken: String,
    val userId: String,
    val email: String
)

object GoogleAuthManager {

    private val httpClient = OkHttpClient()
    private val JSON_MEDIA_TYPE = "application/json; charset=utf-8".toMediaType()

    /**
     * Executes native Google Sign-In using Android Credential Manager.
     * Compatible with Android 14+ native credentials and Android 9-13 via Google Play services.
     */
    suspend fun signInWithGoogle(
        context: Context,
        serverClientId: String
    ): Result<GoogleSignInAccount> = withContext(Dispatchers.IO) {
        val credentialManager = CredentialManager.create(context)

        val googleIdOption = GetGoogleIdOption.Builder()
            .setFilterByAuthorizedAccounts(false)
            .setServerClientId(serverClientId)
            .setAutoSelectEnabled(false)
            .build()

        val request = GetCredentialRequest.Builder()
            .addCredentialOption(googleIdOption)
            .build()

        try {
            val response = credentialManager.getCredential(
                context = context,
                request = request
            )

            val credential = response.credential
            val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(credential.data)

            Result.success(
                GoogleSignInAccount(
                    idToken = googleIdTokenCredential.idToken,
                    email = googleIdTokenCredential.id,
                    displayName = googleIdTokenCredential.displayName,
                    avatarUrl = googleIdTokenCredential.profilePictureUri?.toString()
                )
            )
        } catch (e: GetCredentialCancellationException) {
            Result.failure(Exception("Sign in was cancelled by user.", e))
        } catch (e: GetCredentialException) {
            Result.failure(Exception("Credential Manager failed: ${e.message}", e))
        } catch (e: Exception) {
            Result.failure(Exception("Native Google sign-in failed: ${e.message}", e))
        }
    }

    /**
     * Authenticates with Supabase using Google ID Token via Supabase Auth's
     * native id_token grant flow.
     */
    suspend fun authenticateWithSupabase(
        idToken: String,
        supabaseUrl: String,
        supabaseAnonKey: String
    ): Result<SupabaseSession> = withContext(Dispatchers.IO) {
        val endpoint = "${supabaseUrl.trimEnd('/')}/auth/v1/token?grant_type=id_token"

        val jsonBody = JSONObject().apply {
            put("provider", "google")
            put("id_token", idToken)
        }.toString()

        val request = Request.Builder()
            .url(endpoint)
            .header("apikey", supabaseAnonKey)
            .header("Content-Type", "application/json")
            .post(jsonBody.toRequestBody(JSON_MEDIA_TYPE))
            .build()

        try {
            httpClient.newCall(request).execute().use { response ->
                val bodyStr = response.body?.string().orEmpty()
                if (!response.isSuccessful) {
                    val errorMsg = try {
                        JSONObject(bodyStr).optString("error_description", JSONObject(bodyStr).optString("msg", bodyStr))
                    } catch (_: Exception) {
                        bodyStr
                    }
                    return@withContext Result.failure(Exception("Supabase token exchange failed ($response.code): $errorMsg"))
                }

                val json = JSONObject(bodyStr)
                val accessToken = json.getString("access_token")
                val refreshToken = json.optString("refresh_token")
                val userObj = json.getJSONObject("user")
                val userId = userObj.getString("id")
                val email = userObj.optString("email")

                Result.success(
                    SupabaseSession(
                        accessToken = accessToken,
                        refreshToken = refreshToken,
                        userId = userId,
                        email = email
                    )
                )
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error contacting Supabase: ${e.message}", e))
        }
    }
}
