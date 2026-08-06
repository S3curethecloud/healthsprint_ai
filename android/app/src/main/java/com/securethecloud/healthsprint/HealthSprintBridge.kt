package com.securethecloud.healthsprint

import android.webkit.JavascriptInterface
import android.webkit.WebView
import org.json.JSONObject
import java.util.UUID

class HealthSprintBridge(
    private val webView: WebView,
    private val onHealthConnectStatus: (
        requestId: String,
    ) -> Unit,
    private val onHealthConnectPermissions: (
        requestId: String,
    ) -> Unit,
    private val onHealthConnectReadSummary: (
        requestId: String,
        payload: JSONObject,
    ) -> Unit,
) {
    @JavascriptInterface
    fun postMessage(rawMessage: String) {
        try {
            require(rawMessage.length <= MAX_MESSAGE_LENGTH)

            val request = JSONObject(rawMessage)
            val version = request.optString("version")
            val requestId = request.optString("requestId")
            val action = request.optString("action")
            val payload =
                request.optJSONObject("payload")
                    ?: JSONObject()

            require(version == BRIDGE_VERSION)
            require(requestId.isNotBlank())
            require(action.isNotBlank())

            when (action) {
                "app.version" ->
                    emitSuccess(
                        requestId = requestId,
                        data = JSONObject()
                            .put(
                                "bridgeVersion",
                                BRIDGE_VERSION,
                            )
                            .put(
                                "applicationVersion",
                                BuildConfig.VERSION_NAME,
                            )
                            .put(
                                "buildType",
                                BuildConfig.BUILD_TYPE,
                            ),
                    )

                "healthConnect.status" ->
                    onHealthConnectStatus(requestId)

                "healthConnect.permissions" ->
                    onHealthConnectPermissions(requestId)

                "healthConnect.readSummary" ->
                    onHealthConnectReadSummary(
                        requestId,
                        payload,
                    )

                else ->
                    emitError(
                        requestId = requestId,
                        code = "UNKNOWN_ACTION",
                        message =
                            "The requested native bridge action is not supported.",
                    )
            }
        } catch (_: Exception) {
            emitError(
                requestId = null,
                code = "INVALID_REQUEST",
                message =
                    "The native bridge request was invalid.",
            )
        }
    }

    fun emitSuccess(
        requestId: String,
        data: JSONObject,
    ) {
        emitResponse(
            JSONObject()
                .put("version", BRIDGE_VERSION)
                .put("requestId", requestId)
                .put("status", "success")
                .put("data", data),
        )
    }

    fun emitError(
        requestId: String?,
        code: String,
        message: String,
    ) {
        emitResponse(
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
                ),
        )
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

    companion object {
        private const val BRIDGE_VERSION = "1.0"
        private const val MAX_MESSAGE_LENGTH = 16_384
    }
}
