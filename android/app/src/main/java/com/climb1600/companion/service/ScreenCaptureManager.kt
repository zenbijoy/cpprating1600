package com.climb1600.companion.service

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.PixelFormat
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Base64
import android.util.DisplayMetrics
import android.view.WindowManager
import java.io.ByteArrayOutputStream

/**
 * ScreenCaptureManager handles automated & authorized single-frame screen captures.
 *
 * Multi-Tiered Capture Architecture:
 * - Tier 1 (Mode B Automated, Android 11–13+):
 *   Uses [GuardianAccessibilityService.takeAutomatedScreenshot]. Captures frame without
 *   interactive casting prompts on supported Android versions.
 * - Tier 2 (Mode A Prompted):
 *   Uses [MediaProjection] virtual display with user consent intent.
 * - Tier 3 (Safe Fallback):
 *   Returns null, signaling [PolicyEngine] and [LLMAnalysisService] to classify via UsageStats.
 *
 * Privacy Guarantees:
 * - Ephemeral in-memory only (RAM).
 * - Zero raw image persistence to disk.
 * - Bitmaps recycled immediately after compression.
 */
object ScreenCaptureManager {

    private var activeMediaProjection: MediaProjection? = null
    private var lastConsentIntent: Intent? = null
    private var resultCode: Int = 0

    var isCaptureAuthorized: Boolean = false
        get() = field || GuardianAccessibilityService.canTakeAutomatedScreenshot()
        private set

    fun registerConsent(resultCode: Int, data: Intent, context: Context) {
        this.resultCode = resultCode
        this.lastConsentIntent = data
        val projectionManager =
            context.getSystemService(Context.MEDIA_PROJECTION_SERVICE) as? MediaProjectionManager
        activeMediaProjection = projectionManager?.getMediaProjection(resultCode, data)
        isCaptureAuthorized = activeMediaProjection != null
    }

    fun revokeConsent() {
        activeMediaProjection?.stop()
        activeMediaProjection = null
        lastConsentIntent = null
        isCaptureAuthorized = false
    }

    /**
     * Captures a single downscaled frame in memory for AI verification.
     * Invokes callback with Base64 JPEG string or null if unavailable.
     */
    fun captureFrameInMemory(context: Context, onFrameReady: (String?) -> Unit) {
        // Tier 1: Try automated Accessibility takeScreenshot on Android 11-13+ (API 30+)
        if (GuardianAccessibilityService.canTakeAutomatedScreenshot()) {
            GuardianAccessibilityService.takeAutomatedScreenshot { bitmap ->
                if (bitmap != null) {
                    val base64 = processAndCompressBitmap(bitmap)
                    onFrameReady(base64)
                } else {
                    // Fall back to Tier 2 MediaProjection
                    captureViaMediaProjection(context, onFrameReady)
                }
            }
            return
        }

        // Tier 2: Try MediaProjection
        captureViaMediaProjection(context, onFrameReady)
    }

    private fun captureViaMediaProjection(context: Context, onFrameReady: (String?) -> Unit) {
        val projection = activeMediaProjection
        if (projection == null) {
            onFrameReady(null)
            return
        }

        val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as? WindowManager
        val metrics = DisplayMetrics()
        @Suppress("DEPRECATION")
        windowManager?.defaultDisplay?.getRealMetrics(metrics)

        val originalWidth = if (metrics.widthPixels > 0) metrics.widthPixels else 1080
        val originalHeight = if (metrics.heightPixels > 0) metrics.heightPixels else 1920

        val targetWidth = 720
        val targetHeight = (originalHeight * (targetWidth.toFloat() / originalWidth)).toInt()
        val density = metrics.densityDpi

        val imageReader = ImageReader.newInstance(
            targetWidth, targetHeight,
            PixelFormat.RGBA_8888, 2
        )

        var virtualDisplay: VirtualDisplay? = null
        val handler = Handler(Looper.getMainLooper())

        val timeoutRunnable = Runnable {
            try {
                virtualDisplay?.release()
                imageReader.close()
            } catch (ignored: Exception) {}
            onFrameReady(null)
        }
        handler.postDelayed(timeoutRunnable, 4000)

        imageReader.setOnImageAvailableListener({ reader ->
            handler.removeCallbacks(timeoutRunnable)
            var base64Result: String? = null
            try {
                val image = reader.acquireLatestImage()
                if (image != null) {
                    val planes = image.planes
                    val buffer = planes[0].buffer
                    val pixelStride = planes[0].pixelStride
                    val rowStride = planes[0].rowStride
                    val rowPadding = rowStride - pixelStride * targetWidth

                    val bitmap = Bitmap.createBitmap(
                        targetWidth + rowPadding / pixelStride,
                        targetHeight,
                        Bitmap.Config.ARGB_8888
                    )
                    bitmap.copyPixelsFromBuffer(buffer)
                    image.close()

                    val croppedBitmap = if (rowPadding > 0) {
                        Bitmap.createBitmap(bitmap, 0, 0, targetWidth, targetHeight).also {
                            bitmap.recycle()
                        }
                    } else {
                        bitmap
                    }

                    base64Result = processAndCompressBitmap(croppedBitmap)
                }
            } catch (e: Exception) {
                base64Result = null
            } finally {
                try {
                    virtualDisplay?.release()
                    imageReader.close()
                } catch (ignored: Exception) {}
            }
            onFrameReady(base64Result)
        }, handler)

        try {
            virtualDisplay = projection.createVirtualDisplay(
                "GuardianScreenCapture",
                targetWidth, targetHeight, density,
                DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
                imageReader.surface, null, handler
            )
        } catch (e: Exception) {
            handler.removeCallbacks(timeoutRunnable)
            try {
                imageReader.close()
            } catch (ignored: Exception) {}
            onFrameReady(null)
        }
    }

    private fun processAndCompressBitmap(rawBitmap: Bitmap): String? {
        return try {
            val outputStream = ByteArrayOutputStream()
            rawBitmap.compress(Bitmap.CompressFormat.JPEG, 75, outputStream)
            val byteArray = outputStream.toByteArray()
            rawBitmap.recycle()
            Base64.encodeToString(byteArray, Base64.NO_WRAP)
        } catch (e: Exception) {
            null
        }
    }
}
