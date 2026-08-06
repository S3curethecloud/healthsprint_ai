package com.securethecloud.healthsprint

import android.webkit.JavascriptInterface
import android.webkit.WebView
import org.json.JSONObject
import java.util.UUID

class HealthSprintBridge(
    private val webView: WebView,
) {
    @JavascriptInterface
    fun postMessage(rawMessage: String) {
        val response = try {
            handleRequest(rawMessage)
        } catch (_: Exception) {
            errorResponse(
                requestId = null,
                code = "INVALID_REQUEST",
                message = "The native bridge request was invalid.",
            )
        }

        emitResponse(response)
    }

    private fun handleRequest(
        rawMessage: String,
    ): JSONObject {
        require(rawMessage.length <= MAX_MESSAGE_LENGTH)

        val request = JSONObject(rawMessage)
        val version = request.optString("version")
        val requestId = request.optString("requestId")
        val action = request.optString("action")

        require(version == BRIDGE_VERSION)
        require(requestId.isNotBlank())
        require(action.isNotBlank())

        return when (action) {
            "app.version" -> successResponse(
                requestId = requestId,
                data = JSONObject()
                    .put("bridgeVersion", BRIDGE_VERSION)
                    .put("applicationVersion", BuildConfig.VERSION_NAME)
                    .put("buildType", BuildConfig.BUILD_TYPE),
            )

            else -> errorResponse(
                requestId = requestId,
                code = "UNKNOWN_ACTION",
                message = "The requested native bridge action is not supported.",
            )
        }
    }

    private fun emitResponse(response: JSONObject) {
        val encodedResponse =
            JSONObject.quote(response.toString())

        webView.post {
            webView.evaluateJavascript(
                """
                window.dispatchEvent(
                  new CustomEvent(
                    "healthsprint:native-response",
                    { detail: JSON.parse($encodedResponse) }
                  )
                );
                """.trimIndent(),
                null,
            )
        }
    }

    private fun successResponse(
        requestId: String,
        data: JSONObject,
    ): JSONObject =
        JSONObject()
            .put("version", BRIDGE_VERSION)
            .put("requestId", requestId)
            .put("status", "success")
            .put("data", data)

    private fun errorResponse(
        requestId: String?,
        code: String,
        message: String,
    ): JSONObject =
        JSONObject()
            .put("version", BRIDGE_VERSION)
            .put(
                "requestId",
                requestId ?: UUID.randomUUID().toString(),
            )
            .put("status", "error")
            .put(
                "error",
                JSONObject()
                    .put("code", code)
                    .put("message", message),
            )

    companion object {
        private const val BRIDGE_VERSION = "1.0"
        private const val MAX_MESSAGE_LENGTH = 16_384
    }
}
