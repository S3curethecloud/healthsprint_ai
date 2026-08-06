package com.securethecloud.healthsprint

import android.Manifest
import android.annotation.SuppressLint
import android.content.pm.PackageManager
import org.json.JSONObject
import java.time.Instant
import kotlinx.coroutines.launch
import androidx.lifecycle.lifecycleScope
import android.content.Intent
import android.os.Bundle
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.securethecloud.healthsprint.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private lateinit var nativeBridge: HealthSprintBridge

    private val healthConnectManager by lazy {
        HealthConnectManager(applicationContext)
    }

    private var pendingHealthConnectRequestId:
        String? = null

    private var pendingWebPermissionRequest:
        PermissionRequest? = null

    private val healthConnectPermissionLauncher =
        registerForActivityResult(
            HealthConnectManager.permissionContract(),
        ) { grantedPermissions ->
            val requestId =
                pendingHealthConnectRequestId
                    ?: return@registerForActivityResult

            pendingHealthConnectRequestId = null

            val allGranted =
                grantedPermissions.containsAll(
                    HealthConnectManager.READ_PERMISSIONS,
                )

            nativeBridge.emitSuccess(
                requestId = requestId,
                data = JSONObject()
                    .put("granted", allGranted)
                    .put(
                        "grantedPermissionCount",
                        grantedPermissions.size,
                    )
                    .put(
                        "requiredPermissionCount",
                        HealthConnectManager
                            .READ_PERMISSIONS
                            .size,
                    ),
            )
        }

    private val healthConnectRationaleLauncher =
        registerForActivityResult(
            ActivityResultContracts.StartActivityForResult(),
        ) { result ->
            val requestId =
                pendingHealthConnectRequestId
                    ?: return@registerForActivityResult

            if (result.resultCode != RESULT_OK) {
                pendingHealthConnectRequestId = null

                nativeBridge.emitSuccess(
                    requestId = requestId,
                    data = JSONObject()
                        .put("granted", false)
                        .put("cancelled", true),
                )

                return@registerForActivityResult
            }

            healthConnectPermissionLauncher.launch(
                HealthConnectManager.READ_PERMISSIONS,
            )
        }

    private val cameraPermissionLauncher =
        registerForActivityResult(
            ActivityResultContracts.RequestPermission(),
        ) { granted ->
            val request = pendingWebPermissionRequest
            pendingWebPermissionRequest = null

            if (granted) {
                request?.grant(
                    arrayOf(
                        PermissionRequest.RESOURCE_VIDEO_CAPTURE,
                    ),
                )
            } else {
                request?.deny()
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        configureWebView(binding.healthsprintWebView)

        binding.retryButton.setOnClickListener {
            loadHealthSprint()
        }

        onBackPressedDispatcher.addCallback(
            this,
            object : OnBackPressedCallback(true) {
                override fun handleOnBackPressed() {
                    if (binding.healthsprintWebView.canGoBack()) {
                        binding.healthsprintWebView.goBack()
                    } else {
                        finish()
                    }
                }
            },
        )

        if (savedInstanceState == null) {
            loadHealthSprint()
        } else {
            binding.healthsprintWebView.restoreState(
                savedInstanceState,
            )
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun configureWebView(webView: WebView) {
        WebView.setWebContentsDebuggingEnabled(
            BuildConfig.DEBUG,
        )

        with(webView.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = false
            allowFileAccess = false
            allowContentAccess = false
            mixedContentMode =
                WebSettings.MIXED_CONTENT_NEVER_ALLOW
            mediaPlaybackRequiresUserGesture = true
            setSupportMultipleWindows(false)
        }

        nativeBridge =
            HealthSprintBridge(
                webView = webView,
                onHealthConnectStatus = {
                    requestId ->
                    handleHealthConnectStatus(
                        requestId,
                    )
                },
                onHealthConnectPermissions = {
                    requestId ->
                    handleHealthConnectPermissions(
                        requestId,
                    )
                },
                onHealthConnectReadSummary = {
                    requestId,
                    payload ->
                    handleHealthConnectReadSummary(
                        requestId,
                        payload,
                    )
                },
            )

        webView.addJavascriptInterface(
            nativeBridge,
            "HealthSprintNative",
        )

        webView.webViewClient =
            object : WebViewClient() {
                override fun onPageFinished(
                    view: WebView,
                    url: String,
                ) {
                    showWebView()
                }

                override fun onReceivedError(
                    view: WebView,
                    request: WebResourceRequest,
                    error: WebResourceError,
                ) {
                    if (request.isForMainFrame) {
                        showError()
                    }
                }
            }

        webView.webChromeClient =
            object : WebChromeClient() {
                override fun onPermissionRequest(
                    request: PermissionRequest,
                ) {
                    val requestsCamera =
                        request.resources.contains(
                            PermissionRequest
                                .RESOURCE_VIDEO_CAPTURE,
                        )

                    if (!requestsCamera) {
                        request.deny()
                        return
                    }

                    val permission =
                        Manifest.permission.CAMERA

                    if (
                        ContextCompat.checkSelfPermission(
                            this@MainActivity,
                            permission,
                        ) == PackageManager.PERMISSION_GRANTED
                    ) {
                        request.grant(
                            arrayOf(
                                PermissionRequest
                                    .RESOURCE_VIDEO_CAPTURE,
                            ),
                        )
                    } else {
                        pendingWebPermissionRequest?.deny()
                        pendingWebPermissionRequest = request

                        cameraPermissionLauncher.launch(
                            permission,
                        )
                    }
                }
            }
    }

    private fun handleHealthConnectStatus(
        requestId: String,
    ) {
        lifecycleScope.launch {
            val status = healthConnectManager.status()

            val permissionsGranted =
                if (
                    status ==
                    HealthConnectStatus.AVAILABLE
                ) {
                    healthConnectManager
                        .hasAllReadPermissions()
                } else {
                    false
                }

            nativeBridge.emitSuccess(
                requestId = requestId,
                data = JSONObject()
                    .put(
                        "status",
                        status.name.lowercase(),
                    )
                    .put(
                        "available",
                        status ==
                            HealthConnectStatus.AVAILABLE,
                    )
                    .put(
                        "providerPackage",
                        HealthConnectManager
                            .PROVIDER_PACKAGE_NAME,
                    )
                    .put(
                        "permissionsGranted",
                        permissionsGranted,
                    ),
            )
        }
    }

    private fun handleHealthConnectPermissions(
        requestId: String,
    ) {
        when (healthConnectManager.status()) {
            HealthConnectStatus.AVAILABLE -> {
                pendingHealthConnectRequestId =
                    requestId

                healthConnectRationaleLauncher.launch(
                    Intent(
                        this,
                        HealthConnectRationaleActivity::class.java,
                    ),
                )
            }

            HealthConnectStatus
                .PROVIDER_UPDATE_REQUIRED ->
                nativeBridge.emitError(
                    requestId = requestId,
                    code =
                        "PROVIDER_UPDATE_REQUIRED",
                    message =
                        "Health Connect must be installed or updated.",
                )

            HealthConnectStatus.UNAVAILABLE ->
                nativeBridge.emitError(
                    requestId = requestId,
                    code = "HEALTH_CONNECT_UNAVAILABLE",
                    message =
                        "Health Connect is unavailable on this device.",
                )
        }
    }

    private fun handleHealthConnectReadSummary(
        requestId: String,
        payload: JSONObject,
    ) {
        lifecycleScope.launch {
            try {
                val startTime =
                    Instant.parse(
                        payload.getString("startTime"),
                    )

                val endTime =
                    Instant.parse(
                        payload.getString("endTime"),
                    )

                val summary =
                    healthConnectManager.readSummary(
                        startTime = startTime,
                        endTime = endTime,
                    )

                val data =
                    JSONObject()
                        .put(
                            "startTime",
                            summary.startTime.toString(),
                        )
                        .put(
                            "endTime",
                            summary.endTime.toString(),
                        )
                        .put("steps", summary.steps)
                        .put(
                            "activeCalories",
                            summary.activeCalories,
                        )
                        .put(
                            "totalCalories",
                            summary.totalCalories,
                        )
                        .put(
                            "exerciseSessionCount",
                            summary.exerciseSessionCount,
                        )
                        .put(
                            "exerciseDurationMinutes",
                            summary.exerciseDurationMinutes,
                        )

                if (
                    summary.latestWeightPounds != null &&
                    summary.latestWeightTime != null
                ) {
                    data.put(
                        "latestWeight",
                        JSONObject()
                            .put(
                                "pounds",
                                summary.latestWeightPounds,
                            )
                            .put(
                                "time",
                                summary.latestWeightTime
                                    .toString(),
                            ),
                    )
                } else {
                    data.put(
                        "latestWeight",
                        JSONObject.NULL,
                    )
                }

                nativeBridge.emitSuccess(
                    requestId = requestId,
                    data = data,
                )
            } catch (_: HealthConnectPermissionException) {
                nativeBridge.emitError(
                    requestId = requestId,
                    code = "PERMISSION_DENIED",
                    message =
                        "Health Connect read permission was not granted.",
                )
            } catch (_: HealthConnectUnavailableException) {
                nativeBridge.emitError(
                    requestId = requestId,
                    code = "HEALTH_CONNECT_UNAVAILABLE",
                    message =
                        "Health Connect is unavailable on this device.",
                )
            } catch (_: IllegalArgumentException) {
                nativeBridge.emitError(
                    requestId = requestId,
                    code = "INVALID_DATE_RANGE",
                    message =
                        "Provide a valid ISO-8601 range no longer than 45 days.",
                )
            } catch (_: Exception) {
                nativeBridge.emitError(
                    requestId = requestId,
                    code = "READ_FAILED",
                    message =
                        "Health Connect could not return the requested summary.",
                )
            }
        }
    }

    private fun loadHealthSprint() {
        showLoading()
        binding.healthsprintWebView.loadUrl(
            BuildConfig.HEALTHSPRINT_BASE_URL,
        )
    }

    private fun showLoading() {
        binding.loadingPanel.visibility =
            android.view.View.VISIBLE
        binding.errorPanel.visibility =
            android.view.View.GONE
        binding.healthsprintWebView.visibility =
            android.view.View.INVISIBLE
    }

    private fun showWebView() {
        binding.loadingPanel.visibility =
            android.view.View.GONE
        binding.errorPanel.visibility =
            android.view.View.GONE
        binding.healthsprintWebView.visibility =
            android.view.View.VISIBLE
    }

    private fun showError() {
        binding.loadingPanel.visibility =
            android.view.View.GONE
        binding.errorPanel.visibility =
            android.view.View.VISIBLE
        binding.healthsprintWebView.visibility =
            android.view.View.INVISIBLE
    }

    override fun onSaveInstanceState(
        outState: Bundle,
    ) {
        binding.healthsprintWebView.saveState(outState)
        super.onSaveInstanceState(outState)
    }

    override fun onDestroy() {
        pendingWebPermissionRequest?.deny()
        pendingWebPermissionRequest = null

        binding.healthsprintWebView.apply {
            removeJavascriptInterface(
                "HealthSprintNative",
            )
            stopLoading()
            loadUrl("about:blank")
            clearHistory()
            removeAllViews()
            destroy()
        }

        super.onDestroy()
    }
}
